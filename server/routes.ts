import type { Express } from "express";
import { createServer, type Server } from "http";
import { gitHubSync } from "./storage";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
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

    app.get("/api/family-members/search/:query", async (req, res) => {
      try {
        const query = req.params.query.toLowerCase();
        console.log(`🔍 Searching family members for: "${query}"`);
        const members = loadFamilyData();
        
        const filteredMembers = members.filter((member: any) => 
          member.name?.toLowerCase().includes(query) ||
          member.notes?.toLowerCase().includes(query) ||
          member.nobleBranch?.toLowerCase().includes(query)
        );
        
        console.log(`✅ Found ${filteredMembers.length} matching family members`);
        res.json(filteredMembers);
      } catch (error) {
        console.error("❌ Error searching family members:", error);
        res.status(500).json({ error: "Failed to search family members" });
      }
    });

    // Fallback endpoints that serve JSON data
    app.get("/api/cosmos/members", async (req, res) => {
      try {
        console.log("🔍 Fetching family members from JSON fallback...");
        const members = loadFamilyData();
        console.log(`✅ Retrieved ${members.length} family members from JSON`);
        res.json(members);
      } catch (error) {
        console.error("❌ Error serving family members from JSON:", error);
        res.status(500).json({ error: "Failed to load family members" });
      }
    });

    app.get("/api/cosmos/import/status", async (req, res) => {
      try {
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
        res.json(status);
      } catch (error) {
        console.error("Error getting import status:", error);
        res.status(500).json({ error: "Failed to get import status" });
      }
    });
  }

  // Cosmos DB routes (for local development when available)
  if (cosmosClient) {
    // Main family-members endpoints using Cosmos DB
    app.get("/api/family-members", async (req, res) => {
      try {
        console.log("🔍 Fetching family members from Cosmos DB...");
        const members = await cosmosClient.getAllMembers();
        console.log(`✅ Retrieved ${members.length} family members from Cosmos DB`);
        res.json(members);
      } catch (error) {
        console.error("❌ Error fetching Cosmos DB members:", error);
        res.status(500).json({ error: "Failed to fetch Cosmos DB members" });
      }
    });

    app.get("/api/family-members/search/:query", async (req, res) => {
      try {
        const query = req.params.query.toLowerCase();
        console.log(`🔍 Searching family members in Cosmos DB for: "${query}"`);
        const members = await cosmosClient.getAllMembers();
        
        const filteredMembers = members.filter((member: any) => 
          member.name?.toLowerCase().includes(query) ||
          member.notes?.toLowerCase().includes(query) ||
          member.nobleBranch?.toLowerCase().includes(query)
        );
        
        console.log(`✅ Found ${filteredMembers.length} matching family members in Cosmos DB`);
        res.json(filteredMembers);
      } catch (error) {
        console.error("❌ Error searching family members in Cosmos DB:", error);
        res.status(500).json({ error: "Failed to search family members" });
      }
    });

    // Get all Cosmos DB members
    app.get("/api/cosmos/members", async (req, res) => {
      try {
        console.log("🔍 Fetching family members from Cosmos DB...");
        const members = await cosmosClient.getAllMembers();
        console.log(`✅ Retrieved ${members.length} family members from Cosmos DB`);
        res.json(members);
      } catch (error) {
        console.error("❌ Error fetching Cosmos DB members:", error);
        res.status(500).json({ error: "Failed to fetch Cosmos DB members" });
      }
    });

    // Get single Cosmos DB member
    app.get("/api/cosmos/members/:id", async (req, res) => {
      try {
        const member = await cosmosClient.getMember(req.params.id);
        if (!member) {
          return res.status(404).json({ error: "Member not found" });
        }
        res.json(member);
      } catch (error) {
        console.error("Error fetching Cosmos DB member:", error);
        res.status(500).json({ error: "Failed to fetch member" });
      }
    });

    // Create Cosmos DB member
    app.post("/api/cosmos/members", async (req, res) => {
      try {
        const memberData = req.body;
        const newMember = await cosmosClient.createMember(memberData);
        res.status(201).json(newMember);
      } catch (error) {
        console.error("Error creating Cosmos DB member:", error);
        res.status(500).json({ error: "Failed to create member" });
      }
    });

    // Update Cosmos DB member
    app.put("/api/cosmos/members/:id", async (req, res) => {
      try {
        const memberData = req.body;
        const updatedMember = await cosmosClient.updateMember(req.params.id, memberData);
        if (!updatedMember) {
          return res.status(404).json({ error: "Member not found" });
        }
        res.json(updatedMember);
      } catch (error) {
        console.error("Error updating Cosmos DB member:", error);
        res.status(500).json({ error: "Failed to update member" });
      }
    });

    // Delete Cosmos DB member
    app.delete("/api/cosmos/members/:id", async (req, res) => {
      try {
        const deleted = await cosmosClient.deleteMember(req.params.id);
        if (!deleted) {
          return res.status(404).json({ error: "Member not found" });
        }
        res.json({ message: "Member deleted successfully" });
      } catch (error) {
        console.error("Error deleting Cosmos DB member:", error);
        res.status(500).json({ error: "Failed to delete member" });
      }
    });

    // Import status
    app.get("/api/cosmos/import/status", async (req, res) => {
      try {
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

        res.json(status);
      } catch (error) {
        console.error("Error getting import status:", error);
        res.status(500).json({ error: "Failed to get import status" });
      }
    });

    // Import data from JSON to Cosmos DB (deprecated)
    app.post("/api/cosmos/import", async (req, res) => {
      try {
        return res.status(400).json({ 
          error: "JSON import is deprecated",
          message: "Use the restore functionality with backup files instead"
        });
      } catch (error) {
        console.error("Error importing data:", error);
        res.status(500).json({ error: "Failed to import data" });
      }
    });

    // Clear all Cosmos DB data
    app.delete("/api/cosmos/import/clear", async (req, res) => {
      try {
        const result = await cosmosClient.clearAllMembers();
        res.json(result);
      } catch (error) {
        console.error("Error clearing Cosmos DB data:", error);
        res.status(500).json({ error: "Failed to clear data" });
      }
    });

    // Restore Cosmos DB from JSON backup
    app.post("/api/cosmos/import/restore", async (req, res) => {
      try {
        console.log("🔄 Starting restore from JSON backup...");
        
        const jsonData = req.body;
        
        // Validate the JSON structure
        if (!Array.isArray(jsonData)) {
          return res.status(400).json({ 
            error: 'Invalid data format',
            message: 'JSON data must be an array of family members'
          });
        }

        console.log(`📄 Found ${jsonData.length} members in JSON backup`);

        // Step 1: Clear all existing data
        console.log("🗑️ Clearing existing Cosmos DB data...");
        const clearResult = await cosmosClient.clearAllMembers();
        
        // Step 2: Import all data from JSON backup
        console.log("📥 Importing data from JSON backup...");
        const importResult = await cosmosClient.importFromJson(jsonData);

        console.log(`✅ Restore completed`);

        res.json({
          message: 'JSON restore completed successfully',
          summary: {
            cleared: clearResult.deleted || 0,
            clearErrors: 0, // clearAllMembers doesn't return error details
            restored: importResult.summary?.successful || 0,
            restoreErrors: importResult.summary?.failed || 0,
            totalInBackup: jsonData.length
          }
        });
      } catch (error) {
        console.error("Error restoring from JSON backup:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ 
          error: "Failed to restore from JSON backup",
          message: errorMessage 
        });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
