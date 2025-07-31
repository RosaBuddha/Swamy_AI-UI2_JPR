import { users, settings, mockResponses, feedback, conversationSnapshots, type User, type InsertUser, type Setting, type InsertSetting, type MockResponse, type InsertMockResponse, type Feedback, type InsertFeedback, type ConversationSnapshot, type InsertConversationSnapshot } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting>;
  getMockResponses(): Promise<MockResponse[]>;
  getMockResponse(question: string): Promise<MockResponse | undefined>;
  getMockResponseById(id: number): Promise<MockResponse | undefined>;
  createMockResponse(mockResponse: InsertMockResponse): Promise<MockResponse>;
  updateMockResponse(id: number, mockResponse: InsertMockResponse): Promise<MockResponse>;
  deleteMockResponse(id: number): Promise<void>;
  
  // Feedback methods
  getFeedback(): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string, adminResponse?: string): Promise<Feedback>;
  
  // Conversation snapshot methods
  createConversationSnapshot(snapshot: InsertConversationSnapshot): Promise<ConversationSnapshot>;
  getConversationSnapshot(id: number): Promise<ConversationSnapshot | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      const [setting] = await db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return setting;
    }
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    return this.setSetting(key, value);
  }

  async getMockResponses(): Promise<MockResponse[]> {
    return await db.select().from(mockResponses).orderBy(desc(mockResponses.updatedAt));
  }

  async getMockResponse(question: string): Promise<MockResponse | undefined> {
    const [mockResponse] = await db.select().from(mockResponses).where(eq(mockResponses.question, question));
    return mockResponse || undefined;
  }

  async getMockResponseById(id: number): Promise<MockResponse | undefined> {
    const [mockResponse] = await db.select().from(mockResponses).where(eq(mockResponses.id, id));
    return mockResponse || undefined;
  }

  async createMockResponse(mockResponse: InsertMockResponse): Promise<MockResponse> {
    const [response] = await db
      .insert(mockResponses)
      .values({
        ...mockResponse,
        showTryAsking: mockResponse.showTryAsking ?? false,
        tryAskingPrompts: mockResponse.tryAskingPrompts ?? [],
        showFollowUp: mockResponse.showFollowUp ?? false,
        followUpQuestion: mockResponse.followUpQuestion ?? "",
        followUpChips: mockResponse.followUpChips ?? [],
        followUpResponses: mockResponse.followUpResponses ?? [],
        followUpResponseTypes: mockResponse.followUpResponseTypes ?? [],
        followUpLinkedResponseIds: mockResponse.followUpLinkedResponseIds ?? []
      })
      .returning();
    return response;
  }

  async updateMockResponse(id: number, mockResponse: InsertMockResponse): Promise<MockResponse> {
    const [response] = await db
      .update(mockResponses)
      .set({
        ...mockResponse,
        showTryAsking: mockResponse.showTryAsking ?? false,
        tryAskingPrompts: mockResponse.tryAskingPrompts ?? [],
        showFollowUp: mockResponse.showFollowUp ?? false,
        followUpQuestion: mockResponse.followUpQuestion ?? "",
        followUpChips: mockResponse.followUpChips ?? [],
        followUpResponses: mockResponse.followUpResponses ?? [],
        followUpResponseTypes: mockResponse.followUpResponseTypes ?? [],
        followUpLinkedResponseIds: mockResponse.followUpLinkedResponseIds ?? [],
        updatedAt: new Date()
      })
      .where(eq(mockResponses.id, id))
      .returning();
    return response;
  }

  async deleteMockResponse(id: number): Promise<void> {
    await db.delete(mockResponses).where(eq(mockResponses.id, id));
  }

  // Feedback methods
  async getFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem || undefined;
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  async updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<Feedback> {
    const [updatedFeedback] = await db
      .update(feedback)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }

  async updateFeedbackStatus(id: number, status: string, adminResponse?: string): Promise<Feedback> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
    }
    
    const [updatedFeedback] = await db
      .update(feedback)
      .set(updateData)
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback;
  }

  // Conversation snapshot methods
  async createConversationSnapshot(snapshot: InsertConversationSnapshot): Promise<ConversationSnapshot> {
    const [newSnapshot] = await db
      .insert(conversationSnapshots)
      .values(snapshot)
      .returning();
    return newSnapshot;
  }

  async getConversationSnapshot(id: number): Promise<ConversationSnapshot | undefined> {
    const [snapshot] = await db.select().from(conversationSnapshots).where(eq(conversationSnapshots.id, id));
    return snapshot || undefined;
  }
}

export const storage = new DatabaseStorage();

// Initialize default settings
export const initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'opening_text',
      value: 'Hello there. I am here to help you discover new knowledge.'
    },
    {
      key: 'supporting_text',
      value: 'Ask me anything about chemical safety, regulations, or product information.'
    },
    {
      key: 'intro_questions',
      value: 'What is AF27?\nIs AF27 Stearic Acid an oxidizing agent?'
    },
    {
      key: 'try_asking_enabled',
      value: 'true'
    },
    {
      key: 'system_prompt',
      value: 'You are a highly knowledgeable AI assistant specializing in chemistry and the chemical industry. Always respond with clear, accurate, and helpful information suitable for professionals in R&D, sales, and procurement roles.\n\nIMPORTANT: You MUST output your response in valid HTML format only. Do NOT use Markdown syntax. Do NOT use ** for bold, use <strong>. Do NOT use ### for headings, use <h3>. Do NOT use - for lists, use <ul><li>.\n\nUse these HTML elements for formatting:\n- Headings: <h2>, <h3>, <h4>\n- Bold text: <strong>text</strong>\n- Italic text: <em>text</em>\n- Lists: <ul><li>item</li></ul> or <ol><li>item</li></ol>\n- Paragraphs: <p>content</p>\n- Tables: <table><thead><tr><th>header</th></tr></thead><tbody><tr><td>data</td></tr></tbody></table>\n- Chemical formulas: H<sub>2</sub>SO<sub>4</sub> or CO<sub>2</sub>\n- Line breaks: <br>\n\nYour response must be valid HTML that can be directly inserted into a web page. Never use markdown syntax like **, ###, or -.'
    }
  ];

  for (const setting of defaultSettings) {
    const existingSetting = await storage.getSetting(setting.key);
    if (!existingSetting) {
      await storage.updateSetting(setting.key, setting.value);
    }
  }
};
