import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  name: text("name").notNull(),
  born: integer("born"),
  died: integer("died"),
  biologicalSex: text("biological_sex").notNull(),
  notes: text("notes"),
  father: text("father"),
  ageAtDeath: integer("age_at_death"),
  diedYoung: boolean("died_young").default(false),
  isSuccessionSon: boolean("is_succession_son").default(false),
  hasMaleChildren: boolean("has_male_children").default(false),
  nobleBranch: text("noble_branch"),
  monarchDuringLife: text("monarch_during_life").array(), // Legacy field - being phased out
  monarchIds: text("monarch_ids").array(), // Monarch relationship IDs (e.g., ["gustav-i-vasa", "erik-xiv"])
  generation: integer("generation"),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
});

export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Monarchs table for Swedish monarchs
export const monarchs = pgTable("monarchs", {
  id: text("id").primaryKey(), // Unique identifier (e.g., "gustav-i-vasa")
  name: text("name").notNull(), // Full name (e.g., "Gustav I Vasa")
  born: text("born").notNull(), // ISO date format (e.g., "1496-05-12")
  died: text("died").notNull(), // ISO date format (e.g., "1560-09-29")
  reignFrom: text("reign_from").notNull(), // ISO date format (e.g., "1523-06-06")
  reignTo: text("reign_to").notNull(), // ISO date format (e.g., "1560-09-29")
  quote: text("quote"), // Famous quote
  about: text("about"), // Description/biography
  portraitFileName: text("portrait_file_name"), // Image filename for portrait
});

export const insertMonarchSchema = createInsertSchema(monarchs).omit({
  id: true,
});

export type InsertMonarch = z.infer<typeof insertMonarchSchema>;
export type Monarch = typeof monarchs.$inferSelect;
