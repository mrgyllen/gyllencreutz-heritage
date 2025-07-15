import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

  const httpServer = createServer(app);
  return httpServer;
}
