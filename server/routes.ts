import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, gitHubSync } from "./storage";
import { z } from "zod";

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
  // Family members routes
  app.get("/api/family-members", async (req, res) => {
    try {
      const members = await storage.getAllFamilyMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family members" });
    }
  });

  app.get("/api/family-members/:id", async (req, res) => {
    try {
      const member = await storage.getFamilyMember(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Family member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family member" });
    }
  });

  app.get("/api/family-members/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      const members = await storage.searchFamilyMembers(query);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to search family members" });
    }
  });

  // Admin CRUD operations
  app.post("/api/family-members", async (req, res) => {
    try {
      const memberData = req.body;
      
      // Validate required fields
      if (!memberData.externalId || !memberData.name || !memberData.biologicalSex) {
        return res.status(400).json({ error: "Missing required fields: externalId, name, biologicalSex" });
      }
      
      // Check if member already exists
      const existingMember = await storage.getFamilyMember(memberData.externalId);
      if (existingMember) {
        return res.status(409).json({ error: "Family member with this external ID already exists" });
      }
      
      const newMember = await storage.createFamilyMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error creating family member:", error);
      res.status(500).json({ error: "Failed to create family member" });
    }
  });

  app.put("/api/family-members/:id", async (req, res) => {
    try {
      const externalId = req.params.id;
      const updateData = req.body;
      
      // Validate that member exists
      const existingMember = await storage.getFamilyMember(externalId);
      if (!existingMember) {
        return res.status(404).json({ error: "Family member not found" });
      }
      
      const updatedMember = await storage.updateFamilyMember(externalId, updateData);
      if (!updatedMember) {
        return res.status(500).json({ error: "Failed to update family member" });
      }
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating family member:", error);
      res.status(500).json({ error: "Failed to update family member" });
    }
  });

  app.delete("/api/family-members/:id", async (req, res) => {
    try {
      const externalId = req.params.id;
      
      const deletedMember = await storage.deleteFamilyMember(externalId);
      if (!deletedMember) {
        return res.status(404).json({ error: "Family member not found" });
      }
      
      res.json({ message: "Family member deleted successfully", member: deletedMember });
    } catch (error) {
      console.error("Error deleting family member:", error);
      res.status(500).json({ error: "Failed to delete family member" });
    }
  });

  app.post("/api/family-members/bulk-update", async (req, res) => {
    try {
      const members = req.body;
      
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: "Request body must be an array of family members" });
      }
      
      const result = await storage.bulkUpdateFamilyMembers(members);
      res.json({ 
        message: "Bulk update completed", 
        updated: result.updated, 
        created: result.created 
      });
    } catch (error) {
      console.error("Error in bulk update:", error);
      res.status(500).json({ error: "Failed to perform bulk update" });
    }
  });

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
      
      // Get member count for each backup (from current data as approximation)
      const familyMembers = await storage.getAllFamilyMembers();
      const currentCount = familyMembers.length;
      
      const backupsWithCount = backups.map(backup => ({
        ...backup,
        memberCount: backup.memberCount || currentCount // Use current count as fallback
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

      const familyMembers = await storage.getAllFamilyMembers();
      const backup = await gitHubSync.createBackup(familyMembers, trigger);

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

      // Create pre-restore backup first
      const currentFamilyMembers = await storage.getAllFamilyMembers();
      await gitHubSync.createBackup(currentFamilyMembers, 'pre-restore');

      // Get backup content
      const backupData = await gitHubSync.getBackupContent(filename);
      
      // Restore data using bulk update
      const result = await storage.bulkUpdateFamilyMembers(backupData);

      res.json({
        success: true,
        message: `Restored ${backupData.length} family members from backup`,
        result: {
          restored: backupData.length,
          updated: result.updated,
          created: result.created
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to restore backup",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cosmos DB routes (for local development)
  if (cosmosClient) {
    // Get all Cosmos DB members
    app.get("/api/cosmos/members", async (req, res) => {
      try {
        const members = await cosmosClient.getAllMembers();
        res.json(members);
      } catch (error) {
        console.error("Error fetching Cosmos DB members:", error);
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
        // Get JSON file count
        const jsonMembers = await storage.getAllFamilyMembers();
        const jsonCount = jsonMembers.length;

        // Get Cosmos DB count
        const cosmosMembers = await cosmosClient.getAllMembers();
        const cosmosCount = cosmosMembers.length;

        const status = {
          jsonFile: {
            count: jsonCount,
            available: true
          },
          cosmosDb: {
            count: cosmosCount,
            available: true
          },
          needsImport: cosmosCount === 0 && jsonCount > 0,
          inSync: cosmosCount === jsonCount
        };

        res.json(status);
      } catch (error) {
        console.error("Error getting import status:", error);
        res.status(500).json({ error: "Failed to get import status" });
      }
    });

    // Import data from JSON to Cosmos DB
    app.post("/api/cosmos/import", async (req, res) => {
      try {
        const jsonMembers = await storage.getAllFamilyMembers();
        
        if (jsonMembers.length === 0) {
          return res.status(400).json({ error: "No data to import from JSON file" });
        }

        const results = await cosmosClient.importFromJson(jsonMembers);
        res.json(results);
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
        res.status(500).json({ 
          error: "Failed to restore from JSON backup",
          message: error.message 
        });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
