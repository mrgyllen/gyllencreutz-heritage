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
