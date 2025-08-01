import { 
  users, settings, mockResponses, feedback, conversationSnapshots,
  products, productSources, productProperties, replacementReasons, 
  replacementRequests, productReplacements, externalProductCache,
  type User, type InsertUser, type Setting, type InsertSetting, 
  type MockResponse, type InsertMockResponse, type Feedback, type InsertFeedback, 
  type ConversationSnapshot, type InsertConversationSnapshot,
  type Product, type InsertProduct, type ProductSource, type InsertProductSource,
  type ProductProperty, type InsertProductProperty, type ReplacementReason, type InsertReplacementReason,
  type ReplacementRequest, type InsertReplacementRequest, type ProductReplacement, type InsertProductReplacement,
  type ExternalProductCache, type InsertExternalProductCache
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, or, gte } from "drizzle-orm";

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

  // Product Replacement System Methods

  // Product methods
  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            like(products.name, searchPattern),
            like(products.manufacturer, searchPattern),
            like(products.chemicalName, searchPattern),
            like(products.casNumber, searchPattern),
            like(products.productNumber, searchPattern)
          )
        )
      )
      .limit(limit);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(productData)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Product source methods
  async getProductSources(): Promise<ProductSource[]> {
    return await db
      .select()
      .from(productSources)
      .where(eq(productSources.isActive, true))
      .orderBy(desc(productSources.priority));
  }

  async createProductSource(sourceData: InsertProductSource): Promise<ProductSource> {
    const [newSource] = await db
      .insert(productSources)
      .values(sourceData)
      .returning();
    return newSource;
  }

  // Product property methods
  async getProductProperties(productId: number): Promise<ProductProperty[]> {
    return await db
      .select()
      .from(productProperties)
      .where(eq(productProperties.productId, productId))
      .orderBy(desc(productProperties.confidenceScore));
  }

  async createProductProperty(propertyData: InsertProductProperty): Promise<ProductProperty> {
    const [newProperty] = await db
      .insert(productProperties)
      .values(propertyData)
      .returning();
    return newProperty;
  }

  // Replacement reason methods
  async getReplacementReasons(): Promise<ReplacementReason[]> {
    return await db
      .select()
      .from(replacementReasons)
      .where(eq(replacementReasons.isActive, true))
      .orderBy(replacementReasons.sortOrder);
  }

  async createReplacementReason(reasonData: InsertReplacementReason): Promise<ReplacementReason> {
    const [newReason] = await db
      .insert(replacementReasons)
      .values(reasonData)
      .returning();
    return newReason;
  }

  // Replacement request methods
  async createReplacementRequest(requestData: InsertReplacementRequest): Promise<ReplacementRequest> {
    const [newRequest] = await db
      .insert(replacementRequests)
      .values(requestData)
      .returning();
    return newRequest;
  }

  async getReplacementRequest(id: number): Promise<ReplacementRequest | undefined> {
    const [request] = await db.select().from(replacementRequests).where(eq(replacementRequests.id, id));
    return request || undefined;
  }

  async updateReplacementRequest(id: number, updates: Partial<InsertReplacementRequest>): Promise<ReplacementRequest> {
    const [updatedRequest] = await db
      .update(replacementRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(replacementRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Product replacement methods
  async createProductReplacement(replacementData: InsertProductReplacement): Promise<ProductReplacement> {
    const [newReplacement] = await db
      .insert(productReplacements)
      .values(replacementData)
      .returning();
    return newReplacement;
  }

  async getProductReplacements(requestId: number): Promise<ProductReplacement[]> {
    return await db
      .select()
      .from(productReplacements)
      .where(eq(productReplacements.requestId, requestId))
      .orderBy(desc(productReplacements.matchScore));
  }

  // External product cache methods
  async getCachedProductData(searchTerm: string, sourceId: number): Promise<ExternalProductCache | undefined> {
    const [cached] = await db
      .select()
      .from(externalProductCache)
      .where(
        and(
          eq(externalProductCache.searchTerm, searchTerm),
          eq(externalProductCache.sourceId, sourceId),
          gte(externalProductCache.expiresAt, new Date())
        )
      );
    return cached || undefined;
  }

  async setCachedProductData(cacheData: InsertExternalProductCache): Promise<ExternalProductCache> {
    const [newCache] = await db
      .insert(externalProductCache)
      .values(cacheData)
      .returning();
    return newCache;
  }

  async clearExpiredCache(): Promise<void> {
    await db
      .delete(externalProductCache)
      .where(gte(new Date(), externalProductCache.expiresAt));
  }

  // Additional methods for external data service
  async cacheExternalData(searchTerm: string, sourceId: number, productData: string, expiresAt: Date): Promise<ExternalProductCache> {
    const [cache] = await db
      .insert(externalProductCache)
      .values({
        searchTerm,
        sourceId,
        productData,
        expiresAt,
        createdAt: new Date()
      })
      .onConflictDoUpdate({
        target: [externalProductCache.searchTerm, externalProductCache.sourceId],
        set: {
          productData,
          expiresAt,
          createdAt: new Date()
        }
      })
      .returning();
    return cache;
  }

  async getCachedExternalData(searchTerm: string): Promise<ExternalProductCache | null> {
    const [cache] = await db
      .select()
      .from(externalProductCache)
      .where(
        and(
          eq(externalProductCache.searchTerm, searchTerm),
          gt(externalProductCache.expiresAt, new Date())
        )
      )
      .limit(1);
    return cache || null;
  }

  async getProductSourceByName(name: string): Promise<ProductSource | null> {
    const [source] = await db
      .select()
      .from(productSources)
      .where(eq(productSources.name, name))
      .limit(1);
    return source || null;
  }

  // Advanced replacement methods for Phase 2
  async findSimilarProducts(originalProduct: Product, limit: number = 20): Promise<Product[]> {
    const conditions = [];
    
    if (originalProduct.category) {
      conditions.push(eq(products.category, originalProduct.category));
    }
    
    if (originalProduct.casNumber) {
      const casPrefix = originalProduct.casNumber.split('-')[0];
      conditions.push(like(products.casNumber, `${casPrefix}%`));
    }

    if (conditions.length === 0) {
      conditions.push(
        or(
          like(products.name, `%${originalProduct.name.split(' ')[0]}%`),
          like(products.chemicalName, `%${originalProduct.name.split(' ')[0]}%`)
        )
      );
    }

    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          ne(products.id, originalProduct.id),
          or(...conditions)
        )
      )
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

// Initialize default settings and replacement reasons
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

  // Initialize default replacement reasons
  const defaultReasons = [
    {
      code: 'DISCONTINUED',
      label: 'Product Discontinued',
      description: 'The original product has been discontinued by the manufacturer',
      sortOrder: 10
    },
    {
      code: 'REGULATORY',
      label: 'Regulatory Compliance',
      description: 'Changes in regulatory requirements make a replacement necessary',
      sortOrder: 20
    },
    {
      code: 'COST_REDUCTION',
      label: 'Cost Reduction',
      description: 'Looking for a more cost-effective alternative',
      sortOrder: 30
    },
    {
      code: 'SUPPLY_CHAIN',
      label: 'Supply Chain Issues',
      description: 'Supply chain disruptions require alternative sourcing',
      sortOrder: 40
    },
    {
      code: 'SUSTAINABILITY',
      label: 'Sustainability Goals',
      description: 'Seeking more environmentally friendly alternatives',
      sortOrder: 50
    },
    {
      code: 'PERFORMANCE',
      label: 'Performance Improvement',
      description: 'Looking for a product with better performance characteristics',
      sortOrder: 60
    },
    {
      code: 'COMPATIBILITY',
      label: 'Process Compatibility',
      description: 'Need a product more compatible with existing processes',
      sortOrder: 70
    },
    {
      code: 'SAFETY',
      label: 'Safety Concerns',
      description: 'Safety considerations require a different product',
      sortOrder: 80
    }
  ];

  for (const reason of defaultReasons) {
    const existingReasons = await storage.getReplacementReasons();
    const exists = existingReasons.some(r => r.code === reason.code);
    if (!exists) {
      await storage.createReplacementReason(reason);
    }
  }

  // Initialize default product sources
  const defaultSources = [
    {
      name: 'palmer_holland',
      baseUrl: 'https://api.knowde.com',
      priority: 90,
      isActive: true
    },
    {
      name: 'chemspider',
      baseUrl: 'https://www.chemspider.com/api',
      priority: 70,
      isActive: false // Will be activated when API key is provided
    },
    {
      name: 'pubchem',
      baseUrl: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug',
      priority: 60,
      isActive: true
    },
    {
      name: 'user_contributed',
      priority: 50,
      isActive: true
    }
  ];

  for (const source of defaultSources) {
    const existingSources = await storage.getProductSources();
    const exists = existingSources.some(s => s.name === source.name);
    if (!exists) {
      await storage.createProductSource(source);
    }
  }
};
