var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertMockResponseSchema: () => insertMockResponseSchema,
  insertSettingSchema: () => insertSettingSchema,
  insertUserSchema: () => insertUserSchema,
  mockResponses: () => mockResponses,
  settings: () => settings,
  users: () => users
});
import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull()
});
var mockResponses = pgTable("mock_responses", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  response: text("response").notNull(),
  showTryAsking: boolean("show_try_asking").default(false),
  tryAskingPrompts: text("try_asking_prompts").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true
});
var insertMockResponseSchema = createInsertSchema(mockResponses).pick({
  question: true,
  response: true,
  showTryAsking: true,
  tryAskingPrompts: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getSetting(key) {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || void 0;
  }
  async updateSetting(key, value) {
    const existingSetting = await this.getSetting(key);
    if (existingSetting) {
      const [setting] = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return setting;
    } else {
      const [setting] = await db.insert(settings).values({ key, value }).returning();
      return setting;
    }
  }
  async getMockResponses() {
    return await db.select().from(mockResponses);
  }
  async getMockResponse(question) {
    const [mockResponse] = await db.select().from(mockResponses).where(eq(mockResponses.question, question));
    return mockResponse || void 0;
  }
  async createMockResponse(mockResponse) {
    const [response] = await db.insert(mockResponses).values({
      ...mockResponse,
      showTryAsking: mockResponse.showTryAsking ?? false,
      tryAskingPrompts: mockResponse.tryAskingPrompts ?? []
    }).returning();
    return response;
  }
  async updateMockResponse(id, mockResponse) {
    const [response] = await db.update(mockResponses).set({
      ...mockResponse,
      showTryAsking: mockResponse.showTryAsking ?? false,
      tryAskingPrompts: mockResponse.tryAskingPrompts ?? [],
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(mockResponses.id, id)).returning();
    return response;
  }
  async deleteMockResponse(id) {
    await db.delete(mockResponses).where(eq(mockResponses.id, id));
  }
};
var storage = new DatabaseStorage();
var initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: "opening_text",
      value: "Hello there. I am here to help you discover new knowledge."
    },
    {
      key: "supporting_text",
      value: "Ask me anything about chemical safety, regulations, or product information."
    },
    {
      key: "intro_questions",
      value: "What is AF27?\nIs AF27 Stearic Acid an oxidizing agent?"
    }
  ];
  for (const setting of defaultSettings) {
    const existingSetting = await storage.getSetting(setting.key);
    if (!existingSetting) {
      await storage.updateSetting(setting.key, setting.value);
    }
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to get setting" });
    }
  });
  app2.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      if (!value && value !== "") {
        return res.status(400).json({ error: "Value is required" });
      }
      const setting = await storage.updateSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });
  app2.get("/api/mock-responses", async (req, res) => {
    try {
      const mockResponses2 = await storage.getMockResponses();
      res.json(mockResponses2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mock responses" });
    }
  });
  app2.get("/api/mock-responses/:question", async (req, res) => {
    try {
      const { question } = req.params;
      const mockResponse = await storage.getMockResponse(decodeURIComponent(question));
      if (!mockResponse) {
        return res.status(404).json({ error: "Mock response not found" });
      }
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mock response" });
    }
  });
  app2.post("/api/mock-responses", async (req, res) => {
    try {
      const { question, response, showTryAsking = false, tryAskingPrompts = [] } = req.body;
      if (!question || !response) {
        return res.status(400).json({ error: "Question and response are required" });
      }
      const mockResponse = await storage.createMockResponse({
        question,
        response,
        showTryAsking,
        tryAskingPrompts
      });
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mock response" });
    }
  });
  app2.put("/api/mock-responses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { question, response, showTryAsking = false, tryAskingPrompts = [] } = req.body;
      if (!question || !response) {
        return res.status(400).json({ error: "Question and response are required" });
      }
      const mockResponse = await storage.updateMockResponse(parseInt(id), {
        question,
        response,
        showTryAsking,
        tryAskingPrompts
      });
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mock response" });
    }
  });
  app2.delete("/api/mock-responses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMockResponse(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mock response" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await initializeDefaultSettings();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
