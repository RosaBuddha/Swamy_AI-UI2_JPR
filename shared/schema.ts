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
