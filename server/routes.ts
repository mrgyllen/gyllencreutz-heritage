import type { Express } from "express";
import { createServer, type Server } from "http";
import { gitHubSync } from "./storage";
import fs from "fs";
import path from "path";
import { 
  sendSuccessResponse, 
  sendErrorResponse, 
  asyncHandler, 
  HttpStatus, 
  ErrorSeverity, 
  ResponseMessages,
  validateRequiredFields 
} from "./lib/api-response";
import {
  validateMemberId,
  validateCreateFamilyMember,
  validateUpdateFamilyMember,
  validateSearchQuery,
  validateRestore,
  validatePagination,
  BusinessRules,
  validateData,
  CreateFamilyMemberSchema,
  UpdateFamilyMemberSchema
} from "./lib/validation";
import {
  performanceMonitor,
  performanceMiddleware,
  errorTrackingMiddleware,
  PerformanceUtils
} from "./lib/performance-monitor";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add performance monitoring middleware
  app.use(performanceMiddleware);
  
  // Add error tracking middleware (should be last)
  app.use(errorTrackingMiddleware);
  
  // Import Cosmos DB functionality for local development
  let cosmosClient: any = null;
  try {
    // Only import if we're in an environment that should use Cosmos DB
    if (process.env.COSMOS_DB_ENDPOINT && process.env.COSMOS_DB_PRIMARY_KEY) {
      const cosmosModule = await import("./cosmosClient.js");
      cosmosClient = cosmosModule.default;
    }
  } catch (error) {
    console.log("Cosmos DB not available in local development:", error);
  }

  // Performance monitoring endpoints
  app.get("/api/performance/stats", asyncHandler(async (req, res) => {
    const stats = performanceMonitor.getApiStats();
    sendSuccessResponse(res, stats, HttpStatus.OK, 'Performance statistics retrieved successfully');
  }));

  app.get("/api/performance/health", asyncHandler(async (req, res) => {
    const health = performanceMonitor.getSystemHealth();
    const stats = performanceMonitor.getApiStats();
    const issues = PerformanceUtils.detectIssues(stats, health);
    const score = PerformanceUtils.getPerformanceScore(stats);
    
    const healthData = {
      ...health,
      performanceScore: score,
      issues,
      formattedMemory: PerformanceUtils.formatMemoryUsage(health.memoryUsage),
      formattedUptime: PerformanceUtils.formatUptime(health.uptime)
    };
    
    sendSuccessResponse(res, healthData, HttpStatus.OK, 'System health retrieved successfully');
  }));

  app.get("/api/performance/analytics", asyncHandler(async (req, res) => {
    const analytics = performanceMonitor.getUserAnalytics();
    sendSuccessResponse(res, analytics, HttpStatus.OK, 'User analytics retrieved successfully');
  }));

  app.post("/api/performance/clear", asyncHandler(async (req, res) => {
    const { olderThanHours = 24 } = req.body;
    const clearedCount = performanceMonitor.clearOldMetrics(olderThanHours);
    sendSuccessResponse(res, { clearedCount }, HttpStatus.OK, `Cleared ${clearedCount} old metrics`);
  }));

  app.get("/api/performance/metrics/:endpoint", validateMemberId, asyncHandler(async (req, res) => {
    const { id: endpoint } = req.params;
    const { method = 'GET' } = req.query;
    
    const metrics = performanceMonitor.getMetricsForEndpoint(method as string, `/${endpoint}`);
    sendSuccessResponse(res, metrics, HttpStatus.OK, `Retrieved ${metrics.length} metrics for ${method} /${endpoint}`);
  }));

  // GitHub sync status and control endpoints
  app.get("/api/github/status", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.json({
          available: false,
          message: "GitHub sync not configured - missing environment variables"
        });
      }

      const status = gitHubSync.getStatus();
      const connectionTest = await gitHubSync.testConnection();
      
      res.json({
        available: true,
        connected: connectionTest.connected,
        lastSync: status.lastSync,
        pendingOperations: status.pendingOperations,
        failedRetries: status.failedRetries,
        isRetrying: status.isRetrying,
        error: status.error,
        connectionError: connectionTest.error
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to get GitHub sync status",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/github/test", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.status(400).json({
          success: false,
          message: "GitHub sync not configured"
        });
      }

      const result = await gitHubSync.testConnection();
      
      if (result.connected) {
        res.json({
          success: true,
          message: "✅ GitHub connection successful"
        });
      } else {
        res.status(400).json({
          success: false,
          message: `❌ GitHub connection failed: ${result.error}`,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to test GitHub connection",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/github/retry", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.status(400).json({
          success: false,
          message: "GitHub sync not configured"
        });
      }

      const result = await gitHubSync.manualRetry();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retry GitHub sync",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/github/logs", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.json([]);
      }

      const logs = gitHubSync.getSyncLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to get GitHub sync logs",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Backup Management API Routes
  app.get("/api/backups", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.status(503).json({ error: "GitHub sync not available" });
      }

      const backups = await gitHubSync.listBackups();
      
      const backupsWithCount = backups.map(backup => ({
        ...backup,
        memberCount: backup.memberCount || 0 // Use 0 as fallback since JSON storage is deprecated
      }));

      res.json(backupsWithCount);
    } catch (error) {
      res.status(500).json({
        error: "Failed to list backups",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/backups/create", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.status(503).json({ error: "GitHub sync not available" });
      }

      const { trigger = 'manual' } = req.body;
      
      if (!['manual', 'auto-bulk', 'pre-restore'].includes(trigger)) {
        return res.status(400).json({ error: "Invalid trigger type" });
      }

      // Note: Backup creation now requires Cosmos DB data since JSON storage is deprecated
      const backup = await gitHubSync.createBackup([], trigger);

      res.json({
        success: true,
        backup,
        message: `Created ${trigger} backup with ${backup.memberCount} members`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create backup",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/backups/restore", async (req, res) => {
    try {
      if (!gitHubSync) {
        return res.status(503).json({ error: "GitHub sync not available" });
      }

      const { filename } = req.body;
      
      if (!filename) {
        return res.status(400).json({ error: "Backup filename required" });
      }

      // Note: JSON-based backup restore is deprecated - use Cosmos DB restore instead
      return res.status(400).json({ 
        error: "JSON-based backup restore is deprecated",
        message: "Please use the Cosmos DB restore functionality instead"
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to restore backup",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Family member API endpoints
  // If Cosmos DB is available, use it. Otherwise, fall back to JSON data
  if (cosmosClient) {
    console.log("📊 Using Cosmos DB for family member data");
  } else {
    console.log("📄 Using JSON fallback for family member data");
    
    // Helper function to load JSON data
    const loadFamilyData = () => {
      try {
        const jsonPath = path.join(process.cwd(), 'attached_assets', 'Gyllencreutz_Ancestry_Flat_CLEAN_Final_1752612544769.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const familyData = JSON.parse(rawData);
        
        // Transform JSON format to match CosmosDbFamilyMember format
        return familyData.map((member: any) => ({
          id: member.ID,
          externalId: member.ID,
          name: member.Name,
          born: member.Born,
          died: member.Died,
          biologicalSex: member.BiologicalSex || 'Unknown',
          notes: member.Notes,
          father: member.Father,
          ageAtDeath: member.AgeAtDeath,
          diedYoung: member.DiedYoung || false,
          isSuccessionSon: member.IsSuccessionSon || false,
          hasMaleChildren: member.HasMaleChildren || false,
          nobleBranch: member.NobleBranch,
          monarchDuringLife: member.MonarchDuringLife || [],
          importedAt: new Date().toISOString(),
          importSource: 'json_fallback'
        }));
      } catch (error) {
        console.error('Error loading family JSON data:', error);
        return [];
      }
    };

    // Main family-members endpoints (matching Azure Functions API)
    app.get("/api/family-members", async (req, res) => {
      try {
        console.log("🔍 Fetching all family members from JSON fallback...");
        const members = loadFamilyData();
        console.log(`✅ Retrieved ${members.length} family members from JSON`);
        res.json(members);
      } catch (error) {
        console.error("❌ Error serving family members from JSON:", error);
        res.status(500).json({ error: "Failed to load family members" });
      }
    });

    app.get("/api/family-members/search/:query", validateSearchQuery, asyncHandler(async (req, res) => {
      const { query } = req.params;
      const lowerQuery = query.toLowerCase();
      console.log(`🔍 Searching family members for: "${query}"`);
      const members = loadFamilyData();
      
      const filteredMembers = members.filter((member: any) => 
        member.name?.toLowerCase().includes(lowerQuery) ||
        member.notes?.toLowerCase().includes(lowerQuery) ||
        member.nobleBranch?.toLowerCase().includes(lowerQuery)
      );
      
      console.log(`✅ Found ${filteredMembers.length} matching family members`);
      sendSuccessResponse(res, filteredMembers, HttpStatus.OK, `Found ${filteredMembers.length} matching family members`);
    }));

    // Fallback endpoints that serve JSON data with standardized responses
    app.get("/api/cosmos/members", asyncHandler(async (req, res) => {
      console.log("🔍 Fetching family members from JSON fallback...");
      const members = loadFamilyData();
      console.log(`✅ Retrieved ${members.length} family members from JSON`);
      sendSuccessResponse(res, members, HttpStatus.OK, `Retrieved ${members.length} family members`);
    }));

    app.get("/api/cosmos/import/status", asyncHandler(async (req, res) => {
      const members = loadFamilyData();
      const status = {
        jsonFile: {
          count: members.length,
          available: true
        },
        cosmosDb: {
          count: 0,
          available: false
        },
        needsImport: false,
        inSync: true
      };
      sendSuccessResponse(res, status, HttpStatus.OK, 'Import status retrieved successfully');
    }));
  }

  // Cosmos DB routes (for local development when available)
  if (cosmosClient) {
    // Main family-members endpoints using Cosmos DB
    app.get("/api/family-members", asyncHandler(async (req, res) => {
      console.log("🔍 Fetching family members from Cosmos DB...");
      const members = await cosmosClient.getAllMembers();
      console.log(`✅ Retrieved ${members.length} family members from Cosmos DB`);
      sendSuccessResponse(res, members, HttpStatus.OK, `Retrieved ${members.length} family members from Cosmos DB`);
    }));

    app.get("/api/family-members/search/:query", validateSearchQuery, asyncHandler(async (req, res) => {
      const { query } = req.params;
      const lowerQuery = query.toLowerCase();
      console.log(`🔍 Searching family members in Cosmos DB for: "${query}"`);
      const members = await cosmosClient.getAllMembers();
      
      const filteredMembers = members.filter((member: any) => 
        member.name?.toLowerCase().includes(lowerQuery) ||
        member.notes?.toLowerCase().includes(lowerQuery) ||
        member.nobleBranch?.toLowerCase().includes(lowerQuery)
      );
      
      console.log(`✅ Found ${filteredMembers.length} matching family members in Cosmos DB`);
      sendSuccessResponse(res, filteredMembers, HttpStatus.OK, `Found ${filteredMembers.length} matching family members`);
    }));

    // Get all Cosmos DB members
    app.get("/api/cosmos/members", asyncHandler(async (req, res) => {
      console.log("🔍 Fetching family members from Cosmos DB...");
      const members = await cosmosClient.getAllMembers();
      console.log(`✅ Retrieved ${members.length} family members from Cosmos DB`);
      sendSuccessResponse(res, members, HttpStatus.OK, `Retrieved ${members.length} family members from Cosmos DB`);
    }));

    // Get single Cosmos DB member
    app.get("/api/cosmos/members/:id", validateMemberId, asyncHandler(async (req, res) => {
      const { id } = req.params;
      const member = await cosmosClient.getMember(id);
      if (!member) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, member, HttpStatus.OK, ResponseMessages.RETRIEVED);
    }));

    // Create Cosmos DB member
    app.post("/api/cosmos/members", validateCreateFamilyMember, asyncHandler(async (req, res) => {
      const memberData = req.body;
      
      // Apply business rules validation
      const existingMembers = await cosmosClient.getAllMembers();
      
      // Validate external ID format
      const externalIdErrors = BusinessRules.validateExternalIdFormat(memberData.externalId);
      if (externalIdErrors.length > 0) {
        return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, externalIdErrors, ErrorSeverity.LOW);
      }
      
      // Validate father exists
      const fatherErrors = BusinessRules.validateFatherExists(memberData, existingMembers);
      if (fatherErrors.length > 0) {
        return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, fatherErrors, ErrorSeverity.LOW);
      }
      
      // Validate age at death consistency
      const ageErrors = BusinessRules.validateAgeAtDeath(memberData);
      if (ageErrors.length > 0) {
        return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, ageErrors, ErrorSeverity.LOW);
      }
      
      const newMember = await cosmosClient.createMember(memberData);
      sendSuccessResponse(res, newMember, HttpStatus.CREATED, ResponseMessages.CREATED);
    }));

    // Update Cosmos DB member
    app.put("/api/cosmos/members/:id", validateMemberId, validateUpdateFamilyMember, asyncHandler(async (req, res) => {
      const { id } = req.params;
      const memberData = req.body;
      
      // Apply business rules validation for updates
      const existingMembers = await cosmosClient.getAllMembers();
      
      // If external ID is being updated, validate format
      if (memberData.externalId) {
        const externalIdErrors = BusinessRules.validateExternalIdFormat(memberData.externalId);
        if (externalIdErrors.length > 0) {
          return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, externalIdErrors, ErrorSeverity.LOW);
        }
      }
      
      // If father is being updated, validate father exists
      if (memberData.father !== undefined) {
        const fatherErrors = BusinessRules.validateFatherExists(memberData, existingMembers);
        if (fatherErrors.length > 0) {
          return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, fatherErrors, ErrorSeverity.LOW);
        }
      }
      
      // Validate age at death consistency if relevant fields are being updated
      if (memberData.born !== undefined || memberData.died !== undefined || memberData.ageAtDeath !== undefined) {
        // Get current member data to check consistency
        const currentMember = await cosmosClient.getMember(id);
        if (currentMember) {
          const updatedMemberData = { ...currentMember, ...memberData };
          const ageErrors = BusinessRules.validateAgeAtDeath(updatedMemberData);
          if (ageErrors.length > 0) {
            return sendErrorResponse(res, ResponseMessages.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, ageErrors, ErrorSeverity.LOW);
          }
        }
      }
      
      const updatedMember = await cosmosClient.updateMember(id, memberData);
      if (!updatedMember) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, updatedMember, HttpStatus.OK, ResponseMessages.UPDATED);
    }));

    // Delete Cosmos DB member
    app.delete("/api/cosmos/members/:id", validateMemberId, asyncHandler(async (req, res) => {
      const { id } = req.params;
      const deleted = await cosmosClient.deleteMember(id);
      if (!deleted) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, { id }, HttpStatus.OK, ResponseMessages.DELETED);
    }));

    // Import status
    app.get("/api/cosmos/import/status", asyncHandler(async (req, res) => {
      // JSON storage is deprecated - return 0 count
      const jsonCount = 0;

      // Get Cosmos DB count
      const cosmosMembers = await cosmosClient.getAllMembers();
      const cosmosCount = cosmosMembers.length;

      const status = {
        jsonFile: {
          count: jsonCount,
          available: false // JSON storage is deprecated
        },
        cosmosDb: {
          count: cosmosCount,
          available: true
        },
        needsImport: false, // No import needed since JSON is deprecated
        inSync: true // Always in sync since JSON is not used
      };

      sendSuccessResponse(res, status, HttpStatus.OK, 'Import status retrieved successfully');
    }));

    // Import data from JSON to Cosmos DB (deprecated)
    app.post("/api/cosmos/import", asyncHandler(async (req, res) => {
      sendErrorResponse(
        res, 
        "JSON import is deprecated. Use the restore functionality with backup files instead.", 
        HttpStatus.BAD_REQUEST, 
        undefined, 
        ErrorSeverity.LOW
      );
    }));

    // Clear all Cosmos DB data
    app.delete("/api/cosmos/import/clear", asyncHandler(async (req, res) => {
      const result = await cosmosClient.clearAllMembers();
      sendSuccessResponse(res, result, HttpStatus.OK, 'All Cosmos DB data cleared successfully');
    }));

    // Restore Cosmos DB from JSON backup
    app.post("/api/cosmos/import/restore", validateRestore, asyncHandler(async (req, res) => {
      console.log("🔄 Starting restore from JSON backup...");
      
      const jsonData = req.body; // Already validated by validateRestore middleware

      console.log(`📄 Found ${jsonData.length} members in JSON backup`);

      // Additional business rules validation for the entire dataset
      const validationErrors = [];
      for (const member of jsonData) {
        // Validate external ID format for each member
        const externalIdErrors = BusinessRules.validateExternalIdFormat(member.externalId);
        validationErrors.push(...externalIdErrors);
        
        // Validate age at death consistency
        const ageErrors = BusinessRules.validateAgeAtDeath(member);
        validationErrors.push(...ageErrors);
      }
      
      // Check for father references within the dataset
      for (const member of jsonData) {
        if (member.father) {
          const fatherErrors = BusinessRules.validateFatherExists(member, jsonData);
          validationErrors.push(...fatherErrors);
        }
      }
      
      if (validationErrors.length > 0) {
        return sendErrorResponse(
          res, 
          'Backup data validation failed', 
          HttpStatus.BAD_REQUEST, 
          validationErrors.slice(0, 10), // Limit to first 10 errors to avoid overwhelming response
          ErrorSeverity.MEDIUM
        );
      }

      // Step 1: Clear all existing data
      console.log("🗑️ Clearing existing Cosmos DB data...");
      const clearResult = await cosmosClient.clearAllMembers();
      
      // Step 2: Import all data from JSON backup
      console.log("📥 Importing data from JSON backup...");
      const importResult = await cosmosClient.importFromJson(jsonData);

      console.log(`✅ Restore completed`);

      const summary = {
        cleared: clearResult.deleted || 0,
        clearErrors: 0, // clearAllMembers doesn't return error details
        restored: importResult.summary?.successful || 0,
        restoreErrors: importResult.summary?.failed || 0,
        totalInBackup: jsonData.length
      };

      sendSuccessResponse(res, summary, HttpStatus.OK, 'JSON restore completed successfully');
    }));

    // Monarch endpoints
    app.get("/api/cosmos/monarchs", asyncHandler(async (req, res) => {
      console.log("🔍 Fetching all monarchs from Cosmos DB...");
      const monarchs = await cosmosClient.getAllMonarchs();
      console.log(`✅ Retrieved ${monarchs.length} monarchs from Cosmos DB`);
      sendSuccessResponse(res, monarchs, HttpStatus.OK, `Retrieved ${monarchs.length} monarchs from Cosmos DB`);
    }));

    app.get("/api/cosmos/monarchs/:id", asyncHandler(async (req, res) => {
      const { id } = req.params;
      const monarch = await cosmosClient.getMonarch(id);
      if (!monarch) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, monarch, HttpStatus.OK, ResponseMessages.RETRIEVED);
    }));

    app.post("/api/cosmos/monarchs", asyncHandler(async (req, res) => {
      const monarchData = req.body;
      
      // Validate required fields
      if (!monarchData.id) {
        return sendErrorResponse(res, 'Monarch ID is required', HttpStatus.BAD_REQUEST, undefined, ErrorSeverity.LOW);
      }

      if (!monarchData.name) {
        return sendErrorResponse(res, 'Monarch name is required', HttpStatus.BAD_REQUEST, undefined, ErrorSeverity.LOW);
      }

      try {
        const newMonarch = await cosmosClient.createMonarch(monarchData);
        sendSuccessResponse(res, newMonarch, HttpStatus.CREATED, ResponseMessages.CREATED);
      } catch (error) {
        return sendErrorResponse(res, 'Failed to create monarch', HttpStatus.INTERNAL_SERVER_ERROR, undefined, ErrorSeverity.HIGH);
      }
    }));

    app.put("/api/cosmos/monarchs/:id", asyncHandler(async (req, res) => {
      const { id } = req.params;
      const monarchData = req.body;
      
      const updatedMonarch = await cosmosClient.updateMonarch(id, monarchData);
      if (!updatedMonarch) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, updatedMonarch, HttpStatus.OK, ResponseMessages.UPDATED);
    }));

    app.delete("/api/cosmos/monarchs/:id", asyncHandler(async (req, res) => {
      const { id } = req.params;
      const deleted = await cosmosClient.deleteMonarch(id);
      if (!deleted) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }
      sendSuccessResponse(res, { id }, HttpStatus.OK, ResponseMessages.DELETED);
    }));

    // Monarch import endpoint
    app.post("/api/cosmos/monarchs/import", asyncHandler(async (req, res) => {
      const { monarchs } = req.body;
      
      if (!monarchs || !Array.isArray(monarchs)) {
        return sendErrorResponse(res, 'Invalid data format. Expected { monarchs: [...] }', HttpStatus.BAD_REQUEST, undefined, ErrorSeverity.LOW);
      }

      try {
        const importResult = await cosmosClient.importMonarchsFromJson(monarchs);
        sendSuccessResponse(res, importResult, HttpStatus.OK, 'Monarchs imported successfully');
      } catch (error) {
        return sendErrorResponse(res, 'Failed to import monarchs', HttpStatus.INTERNAL_SERVER_ERROR, undefined, ErrorSeverity.HIGH);
      }
    }));

    // Get monarchs during a family member's lifetime
    app.get("/api/cosmos/members/:id/monarchs", asyncHandler(async (req, res) => {
      const { id } = req.params;
      
      // First get the family member
      const member = await cosmosClient.getMember(id);
      if (!member) {
        return sendErrorResponse(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND, undefined, ErrorSeverity.LOW);
      }

      // Validate that member has born date
      if (member.born === null || member.born === undefined) {
        return sendErrorResponse(res, 'Family member must have a birth year', HttpStatus.BAD_REQUEST, undefined, ErrorSeverity.LOW);
      }

      // Get monarchs during the member's lifetime
      const monarchs = await cosmosClient.getMonarchsDuringLifetime(member.born, member.died || 9999);
      sendSuccessResponse(res, monarchs, HttpStatus.OK, `Found ${monarchs.length} monarchs during ${member.name}'s lifetime`);
    }));

    // Bulk update family members with monarch IDs
    app.post("/api/cosmos/members/bulk-update-monarchs", asyncHandler(async (req, res) => {
      try {
        // Check for dryRun query parameter
        const dryRun = req.query.dryRun === 'true';
        
        const result = await cosmosClient.bulkUpdateMembersWithMonarchIds({ dryRun });
        sendSuccessResponse(res, result, HttpStatus.OK, result.message);
      } catch (error) {
        return sendErrorResponse(res, 'Failed to bulk update members with monarch IDs', HttpStatus.INTERNAL_SERVER_ERROR, undefined, ErrorSeverity.HIGH);
      }
    }));

    // Bulk update family members with monarch IDs (dry run only)
    app.post("/api/cosmos/members/bulk-update-monarchs-dry-run", asyncHandler(async (req, res) => {
      try {
        const result = await cosmosClient.bulkUpdateMembersWithMonarchIds({ dryRun: true });
        sendSuccessResponse(res, result, HttpStatus.OK, result.message);
      } catch (error) {
        return sendErrorResponse(res, 'Failed to perform dry run of bulk update members with monarch IDs', HttpStatus.INTERNAL_SERVER_ERROR, undefined, ErrorSeverity.HIGH);
      }
    }));
  }

  const httpServer = createServer(app);
  return httpServer;
}
