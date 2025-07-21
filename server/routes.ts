import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, gitHubSync } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
        ...status,
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

  const httpServer = createServer(app);
  return httpServer;
}
