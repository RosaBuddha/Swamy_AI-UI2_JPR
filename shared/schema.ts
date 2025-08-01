import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const mockResponses = pgTable("mock_responses", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  showTryAsking: boolean("show_try_asking").default(false),
  tryAskingPrompts: text("try_asking_prompts").array().default([]),
  showFollowUp: boolean("show_follow_up").default(false),
  followUpQuestion: text("follow_up_question").default(""),
  followUpChips: text("follow_up_chips").array().default([]),
  followUpResponses: text("follow_up_responses").array().default([]),
  followUpResponseTypes: text("follow_up_response_types").array().default([]), // 'custom' or 'existing'
  followUpLinkedResponseIds: integer("follow_up_linked_response_ids").array().default([]), // IDs of linked responses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'bug', 'feature', 'general'
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'critical'
  status: text("status").default("new"), // 'new', 'in-review', 'resolved', 'closed'
  userEmail: text("user_email"),
  browserInfo: text("browser_info"),
  currentRoute: text("current_route"),
  appVersion: text("app_version"),
  conversationSnapshotId: integer("conversation_snapshot_id"),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationSnapshots = pgTable("conversation_snapshots", {
  id: serial("id").primaryKey(),
  messages: text("messages").notNull(), // JSON string of conversation history
  sessionInfo: text("session_info"), // Additional session metadata as JSON
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Replacement System Tables
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  casNumber: text("cas_number"),
  chemicalName: text("chemical_name"),
  productNumber: text("product_number"),
  category: text("category"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productSources = pgTable("product_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'palmer_holland', 'chemspider', 'pubchem', 'manufacturer', 'user_contributed'
  baseUrl: text("base_url"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(50), // Higher number = higher priority
  createdAt: timestamp("created_at").defaultNow(),
});

export const productProperties = pgTable("product_properties", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  sourceId: integer("source_id").references(() => productSources.id).notNull(),
  propertyName: text("property_name").notNull(), // 'molecular_weight', 'boiling_point', 'density', etc.
  propertyValue: text("property_value").notNull(),
  unit: text("unit"),
  confidenceScore: integer("confidence_score").default(50), // 0-100, higher = more reliable
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const replacementReasons = pgTable("replacement_reasons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 'DISCONTINUED', 'REGULATORY', etc.
  label: text("label").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const replacementRequests = pgTable("replacement_requests", {
  id: serial("id").primaryKey(),
  originalProductName: text("original_product_name").notNull(),
  originalProductId: integer("original_product_id").references(() => products.id),
  reasonCodes: text("reason_codes").array().default([]), // Array of replacement reason codes
  additionalNotes: text("additional_notes"),
  userEmail: text("user_email"),
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  discoveryAttempted: boolean("discovery_attempted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productReplacements = pgTable("product_replacements", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => replacementRequests.id).notNull(),
  originalProductId: integer("original_product_id").references(() => products.id),
  replacementProductId: integer("replacement_product_id").references(() => products.id).notNull(),
  matchScore: integer("match_score").default(0), // 0-100 compatibility score
  reasonAlignment: text("reason_alignment"), // JSON of how well it matches each reason
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const externalProductCache = pgTable("external_product_cache", {
  id: serial("id").primaryKey(),
  searchTerm: text("search_term").notNull(),
  sourceId: integer("source_id").references(() => productSources.id).notNull(),
  productData: text("product_data").notNull(), // JSON string of discovered product information
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export const insertMockResponseSchema = createInsertSchema(mockResponses).pick({
  question: true,
  response: true,
  showTryAsking: true,
  tryAskingPrompts: true,
  showFollowUp: true,
  followUpQuestion: true,
  followUpChips: true,
  followUpResponses: true,
  followUpResponseTypes: true,
  followUpLinkedResponseIds: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  type: true,
  title: true,
  description: true,
  priority: true,
  userEmail: true,
  browserInfo: true,
  currentRoute: true,
  appVersion: true,
  conversationSnapshotId: true,
});

export const insertConversationSnapshotSchema = createInsertSchema(conversationSnapshots).pick({
  messages: true,
  sessionInfo: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  manufacturer: true,
  casNumber: true,
  chemicalName: true,
  productNumber: true,
  category: true,
  description: true,
  isActive: true,
});

export const insertProductSourceSchema = createInsertSchema(productSources).pick({
  name: true,
  baseUrl: true,
  apiKey: true,
  isActive: true,
  priority: true,
});

export const insertProductPropertySchema = createInsertSchema(productProperties).pick({
  productId: true,
  sourceId: true,
  propertyName: true,
  propertyValue: true,
  unit: true,
  confidenceScore: true,
  verifiedAt: true,
});

export const insertReplacementReasonSchema = createInsertSchema(replacementReasons).pick({
  code: true,
  label: true,
  description: true,
  isActive: true,
  sortOrder: true,
});

export const insertReplacementRequestSchema = createInsertSchema(replacementRequests).pick({
  originalProductName: true,
  originalProductId: true,
  reasonCodes: true,
  additionalNotes: true,
  userEmail: true,
  status: true,
  discoveryAttempted: true,
});

export const insertProductReplacementSchema = createInsertSchema(productReplacements).pick({
  requestId: true,
  originalProductId: true,
  replacementProductId: true,
  matchScore: true,
  reasonAlignment: true,
  notes: true,
});

export const insertExternalProductCacheSchema = createInsertSchema(externalProductCache).pick({
  searchTerm: true,
  sourceId: true,
  productData: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertMockResponse = z.infer<typeof insertMockResponseSchema>;
export type MockResponse = typeof mockResponses.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertConversationSnapshot = z.infer<typeof insertConversationSnapshotSchema>;
export type ConversationSnapshot = typeof conversationSnapshots.$inferSelect;

// Product Replacement Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductSource = typeof productSources.$inferSelect;
export type InsertProductSource = z.infer<typeof insertProductSourceSchema>;
export type ProductProperty = typeof productProperties.$inferSelect;
export type InsertProductProperty = z.infer<typeof insertProductPropertySchema>;
export type ReplacementReason = typeof replacementReasons.$inferSelect;
export type InsertReplacementReason = z.infer<typeof insertReplacementReasonSchema>;
export type ReplacementRequest = typeof replacementRequests.$inferSelect;
export type InsertReplacementRequest = z.infer<typeof insertReplacementRequestSchema>;
export type ProductReplacement = typeof productReplacements.$inferSelect;
export type InsertProductReplacement = z.infer<typeof insertProductReplacementSchema>;
export type ExternalProductCache = typeof externalProductCache.$inferSelect;
export type InsertExternalProductCache = z.infer<typeof insertExternalProductCacheSchema>;

// Chat response types for Phase 2 disambiguation implementation
export interface ProductOption {
  name: string;
  company?: string;
  description?: string;
  id?: string;
  // Phase 4: Enhanced product metadata
  category?: string;
  relevanceScore?: number;
  attributes?: Record<string, string>;
  applications?: string[];
  technicalSpecs?: Record<string, string>;
}

export interface DisambiguationData {
  detected: boolean;
  options: ProductOption[];
  originalQuery: string;
  instructions?: string;
  // Phase 4: Enhanced disambiguation analytics
  searchMetadata?: {
    totalMatches: number;
    queryComplexity: 'simple' | 'moderate' | 'complex';
    searchTime: number;
    categories: string[];
    confidence: number;
  };
  queryRefinements?: {
    suggestedFilters: string[];
    relatedTerms: string[];
    categoryBreakdown: Record<string, number>;
  };
}

export interface BaseChatResponse {
  processingTime: number;
}

export interface NormalChatResponse extends BaseChatResponse {
  type: 'normal';
  source: 'mock' | 'openai' | 'openai-rag';
  content: string;
  ragResponseTime?: number;
  ragContentLength?: number;
  tryAskingPrompts?: string[];
  showTryAsking?: boolean;
  showFollowUp?: boolean;
  followUpQuestion?: string;
  followUpChips?: string[];
  followUpResponses?: string[];
  followUpResponsesData?: any[];
}

export interface DisambiguationChatResponse extends BaseChatResponse {
  type: 'disambiguation';
  source: 'rag-disambiguation';
  disambiguationData: DisambiguationData;
  ragResponseTime?: number;
}

export type ChatResponse = NormalChatResponse | DisambiguationChatResponse;
