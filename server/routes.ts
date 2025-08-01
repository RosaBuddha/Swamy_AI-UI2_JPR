import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ragService } from "./ragService";
import { apiLogger } from "./logger";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPEN_AI_KEY_JPR || process.env.OPENAI_API_KEY
});

// Helper functions for smart chunking
function isSemanticBoundary(content: string): boolean {
  // Check for sentence endings, paragraph breaks, or list item completions
  const semanticEndings = ['.', '!', '?', '</p>', '</li>', '</h3>', '</h4>', '</strong>', '</em>'];
  return semanticEndings.some(ending => content.trim().endsWith(ending));
}

function isCompleteHTMLElement(content: string): boolean {
  // Check if content ends with a complete HTML element
  const htmlTagPattern = /<\/[a-zA-Z][a-zA-Z0-9]*>$/;
  return htmlTagPattern.test(content.trim());
}

function sanitizeForJSON(content: string): string {
  // Ensure content can be safely serialized to JSON
  try {
    JSON.stringify(content);
    return content;
  } catch {
    // Remove problematic characters
    return content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  }
}

// Helper function to normalize questions for matching
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[?!.,;]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Helper function to check if questions match
function questionsMatch(userQuestion: string, mockQuestion: string): boolean {
  const normalizedUser = normalizeQuestion(userQuestion);
  const normalizedMock = normalizeQuestion(mockQuestion);
  return normalizedUser === normalizedMock;
}

// Helper function to resolve follow-up responses with linked responses
async function resolveFollowUpResponses(mockResponse: any): Promise<{
  followUpChips: string[];
  followUpResponses: string[];
  followUpResponsesData: any[];
}> {
  const resolvedChips: string[] = [];
  const resolvedResponses: string[] = [];
  const resolvedResponsesData: any[] = [];
  
  if (!mockResponse.followUpChips || mockResponse.followUpChips.length === 0) {
    return { followUpChips: [], followUpResponses: [], followUpResponsesData: [] };
  }
  
  for (let i = 0; i < mockResponse.followUpChips.length; i++) {
    const chip = mockResponse.followUpChips[i];
    const responseType = mockResponse.followUpResponseTypes?.[i] || 'custom';
    
    resolvedChips.push(chip);
    
    if (responseType === 'existing') {
      const linkedResponseId = mockResponse.followUpLinkedResponseIds?.[i];
      if (linkedResponseId) {
        const linkedResponse = await storage.getMockResponseById(linkedResponseId);
        if (linkedResponse) {
          resolvedResponses.push(linkedResponse.response);
          // Include the full linked response data with its own follow-up questions and try asking prompts
          resolvedResponsesData.push({
            content: linkedResponse.response,
            tryAskingPrompts: linkedResponse.tryAskingPrompts || [],
            showTryAsking: linkedResponse.showTryAsking || false,
            showFollowUp: linkedResponse.showFollowUp || false,
            followUpQuestion: linkedResponse.followUpQuestion || '',
            followUpChips: linkedResponse.followUpChips || [],
            followUpResponses: linkedResponse.followUpResponses || [],
            followUpResponseTypes: linkedResponse.followUpResponseTypes || [],
            followUpLinkedResponseIds: linkedResponse.followUpLinkedResponseIds || []
          });
        } else {
          // Fallback to custom response if linked response not found
          resolvedResponses.push(mockResponse.followUpResponses?.[i] || '');
          resolvedResponsesData.push({
            content: mockResponse.followUpResponses?.[i] || '',
            tryAskingPrompts: [],
            showTryAsking: false,
            showFollowUp: false,
            followUpQuestion: '',
            followUpChips: [],
            followUpResponses: [],
            followUpResponseTypes: [],
            followUpLinkedResponseIds: []
          });
        }
      } else {
        // Fallback to custom response if no linked ID
        resolvedResponses.push(mockResponse.followUpResponses?.[i] || '');
        resolvedResponsesData.push({
          content: mockResponse.followUpResponses?.[i] || '',
          tryAskingPrompts: [],
          showTryAsking: false,
          showFollowUp: false,
          followUpQuestion: '',
          followUpChips: [],
          followUpResponses: [],
          followUpResponseTypes: [],
          followUpLinkedResponseIds: []
        });
      }
    } else {
      // Custom response type
      resolvedResponses.push(mockResponse.followUpResponses?.[i] || '');
      resolvedResponsesData.push({
        content: mockResponse.followUpResponses?.[i] || '',
        tryAskingPrompts: [],
        showTryAsking: false,
        showFollowUp: false,
        followUpQuestion: '',
        followUpChips: [],
        followUpResponses: [],
        followUpResponseTypes: [],
        followUpLinkedResponseIds: []
      });
    }
  }
  
  return { followUpChips: resolvedChips, followUpResponses: resolvedResponses, followUpResponsesData: resolvedResponsesData };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Settings routes
  app.get("/api/settings/:key", async (req, res) => {
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

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value && value !== "") {
        return res.status(400).json({ error: "Value is required" });
      }
      
      const setting = await storage.updateSetting(key, value);
      
      // Invalidate system prompt cache when it's updated
      if (key === 'system_prompt') {
        systemPromptCache = null;
        console.log('System prompt cache invalidated after admin update');
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Mock responses routes
  app.get("/api/mock-responses", async (req, res) => {
    try {
      const mockResponses = await storage.getMockResponses();
      res.json(mockResponses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mock responses" });
    }
  });

  app.get("/api/mock-responses/:question", async (req, res) => {
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

  app.post("/api/mock-responses", async (req, res) => {
    try {
      const { 
        question, 
        response, 
        showTryAsking = false, 
        tryAskingPrompts = [],
        showFollowUp = false,
        followUpQuestion = "",
        followUpChips = [],
        followUpResponses = [],
        followUpResponseTypes = [],
        followUpLinkedResponseIds = []
      } = req.body;
      
      if (!question || !response) {
        return res.status(400).json({ error: "Question and response are required" });
      }
      
      const mockResponse = await storage.createMockResponse({ 
        question, 
        response, 
        showTryAsking, 
        tryAskingPrompts,
        showFollowUp,
        followUpQuestion,
        followUpChips,
        followUpResponses,
        followUpResponseTypes,
        followUpLinkedResponseIds
      });
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to create mock response" });
    }
  });

  app.put("/api/mock-responses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        question, 
        response, 
        showTryAsking = false, 
        tryAskingPrompts = [],
        showFollowUp = false,
        followUpQuestion = "",
        followUpChips = [],
        followUpResponses = [],
        followUpResponseTypes = [],
        followUpLinkedResponseIds = []
      } = req.body;
      
      if (!question || !response) {
        return res.status(400).json({ error: "Question and response are required" });
      }
      
      const mockResponse = await storage.updateMockResponse(parseInt(id), { 
        question, 
        response, 
        showTryAsking, 
        tryAskingPrompts,
        showFollowUp,
        followUpQuestion,
        followUpChips,
        followUpResponses,
        followUpResponseTypes,
        followUpLinkedResponseIds
      });
      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Failed to update mock response" });
    }
  });

  app.delete("/api/mock-responses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMockResponse(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete mock response" });
    }
  });

  // Cache for system prompt to avoid repeated database calls
  let systemPromptCache: { value: string; timestamp: number } | null = null;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper function to get cached system prompt
  async function getSystemPrompt(): Promise<string> {
    const now = Date.now();
    
    // Check if we have a valid cached prompt
    if (systemPromptCache && (now - systemPromptCache.timestamp) < CACHE_DURATION) {
      return systemPromptCache.value;
    }
    
    // Fetch from database
    const systemPromptSetting = await storage.getSetting('system_prompt');
    const defaultSystemPrompt = "You are a highly knowledgeable AI assistant specializing in chemistry and the chemical industry. Always respond with clear, accurate, and helpful information suitable for professionals in R&D, sales, and procurement roles.\n\nIMPORTANT: You MUST output your response in valid HTML format only. Do NOT use Markdown syntax. Do NOT use ** for bold, use <strong>. Do NOT use ### for headings, use <h3>. Do NOT use - for lists, use <ul><li>.\n\nUse these HTML elements for formatting:\n- Headings: <h2>, <h3>, <h4>\n- Bold text: <strong>text</strong>\n- Italic text: <em>text</em>\n- Lists: <ul><li>item</li></ul> or <ol><li>item</li></ol>\n- Paragraphs: <p>content</p>\n- Tables: <table><thead><tr><th>header</th></tr></thead><tbody><tr><td>data</td></tr></tbody></table>\n- Chemical formulas: H<sub>2</sub>SO<sub>4</sub> or CO<sub>2</sub>\n- Line breaks: <br>\n\nYour response must be valid HTML that can be directly inserted into a web page. Never use markdown syntax like **, ###, or -.";
    const systemPrompt = systemPromptSetting?.value || defaultSystemPrompt;
    
    // Update cache
    systemPromptCache = {
      value: systemPrompt,
      timestamp: now
    };
    
    return systemPrompt;
  }

  // Chat endpoint with OpenAI integration and streaming
  app.post("/api/chat", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const startTime = Date.now();

      // Optimize Step 1 & 2: Check for mock responses in parallel
      const [exactMatch, allMockResponses] = await Promise.all([
        storage.getMockResponse(question),
        storage.getMockResponses()
      ]);

      let mockResponse = exactMatch;
      
      // Step 2: If no exact match, try normalized matching
      if (!mockResponse) {
        mockResponse = allMockResponses.find(mock => 
          questionsMatch(question, mock.question)
        );
      }

      // Step 3: If mock response found, use it
      if (mockResponse) {
        // Resolve follow-up responses to handle linked responses
        const resolvedFollowUps = await resolveFollowUpResponses(mockResponse);
        
        const response = {
          source: 'mock',
          content: mockResponse.response,
          processingTime: Date.now() - startTime,
          tryAskingPrompts: mockResponse.tryAskingPrompts || [],
          showTryAsking: mockResponse.showTryAsking || false,
          showFollowUp: mockResponse.showFollowUp || false,
          followUpQuestion: mockResponse.followUpQuestion || '',
          followUpChips: resolvedFollowUps.followUpChips,
          followUpResponses: resolvedFollowUps.followUpResponses,
          followUpResponsesData: resolvedFollowUps.followUpResponsesData
        };
        
        return res.json(response);
      } 
      
      // Step 4: No mock response found, try RAG search
      let ragContent = '';
      let ragResponseTime = 0;
      let disambiguationDetected = false;
      let disambiguationContent = '';
      
      if (ragService.isConfigured()) {
        try {
          console.log('RAG Search: Attempting to find relevant content for:', question);
          const ragResult = await ragService.searchWithProcessing({ message: question });
          
          // Phase 1 & 2: Check for disambiguation signal and parse data
          if (ragResult.success && ragResult.disambiguationDetected) {
            disambiguationDetected = true;
            disambiguationContent = ragResult.rawResponse || '';
            console.log('RAG Search: DISAMBIGUATION DETECTED - Multiple product matches found');
            console.log('RAG Search: This query requires user clarification before full product data can be returned');
            
            // Phase 2 & 3: Check if we have parsed disambiguation data
            if (ragResult.disambiguationData && ragResult.disambiguationData.options.length > 0) {
              console.log('RAG Search: Phase 3 - Returning disambiguation response with', ragResult.disambiguationData.options.length, 'options');
              
              // Phase 3: Return disambiguation response immediately instead of continuing to OpenAI
              const disambiguationResponse = {
                type: 'disambiguation',
                source: 'rag-disambiguation',
                disambiguationData: ragResult.disambiguationData,
                processingTime: Date.now() - startTime,
                ragResponseTime: ragResult.responseTime || 0
              };

              // Log the disambiguation response
              apiLogger.log({
                userQuestion: question,
                systemPrompt: await getSystemPrompt(),
                ragContent: ragContent || undefined,
                openaiMessages: [], // No OpenAI messages for disambiguation
                response: `Disambiguation response with ${ragResult.disambiguationData.options.length} options`,
                source: 'rag-disambiguation' as any,
                processingTime: Date.now() - startTime,
                ragResponseTime: ragResult.responseTime || 0,
                ragContentLength: ragContent ? ragContent.length : undefined,
                disambiguationDetected: true,
                disambiguationContent: ragResult.rawResponse,
                disambiguationParsed: {
                  optionsCount: ragResult.disambiguationData.options.length,
                  options: ragResult.disambiguationData.options.map(opt => ({
                    name: opt.name,
                    company: opt.company,
                    description: opt.description
                  })),
                  instructions: ragResult.disambiguationData.instructions
                }
              });

              res.json(disambiguationResponse);
              return;
            }
          }
          
          if (ragResult.success && ragResult.processedContent && ragResult.processedContent.length > 100) {
            ragContent = ragResult.processedContent;
            ragResponseTime = ragResult.responseTime || 0;
            
            console.log('RAG Search: Found relevant content, length:', ragContent.length);
            console.log('RAG Search: Sources:', ragResult.sources?.length || 0);
            console.log('RAG Search: Average score:', ragResult.averageScore?.toFixed(2) || 'N/A');
            console.log('RAG Search: Using RAG content as context for OpenAI');
          } else {
            console.log('RAG Search: No relevant content found or content too short');
          }
        } catch (ragError: any) {
          console.error('RAG Search: Error during search:', ragError.message);
          // Continue to OpenAI if RAG fails
        }
      }
      
      // Step 5: Use OpenAI with streaming (potentially with RAG context)
      if (!process.env.OPEN_AI_KEY_JPR) {
        return res.status(500).json({ 
          error: "OpenAI API key not configured" 
        });
      }

      try {
        // Get system prompt from cache
        const systemPrompt = await getSystemPrompt();

        // Prepare messages with potential RAG context
        const messages: { role: "system" | "user"; content: string }[] = [
          {
            role: "system",
            content: systemPrompt
          }
        ];
        
        // Add RAG context if available - positioned immediately after system prompt for priority
        if (ragContent.length > 100) {
          messages.push({
            role: "system",
            content: `RAG DATA SOURCE - Context block from the provided RAG data source:\n\n${ragContent}\n\nThis is the primary data source referenced in your instructions. You MUST base your response primarily on this specific product information. Integrate these exact products, companies, and technical specifications as the foundation of your answer.`
          });
        }
        
        messages.push({
          role: "user",
          content: question
        });

        // Use streaming for faster perceived response time
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        });

        // Set up Server-Sent Events for streaming
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        let fullContent = '';
        
        // Send initial metadata
        res.write(`data: ${JSON.stringify({ 
          type: 'start', 
          source: ragContent.length > 100 ? 'openai-rag' : 'openai', 
          startTime: Date.now(),
          ragResponseTime: ragResponseTime,
          ragContentLength: ragContent.length
        })}\n\n`);

        // Enhanced streaming with smart chunking
        let contentBuffer = '';
        let chunkCounter = 0;
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            contentBuffer += content;
            chunkCounter++;
            
            // Smart chunking: send when we have complete semantic units or buffer is large
            const shouldSendChunk = 
              chunkCounter >= 5 || // Send every 5 tokens
              contentBuffer.length >= 50 || // Send when buffer reaches 50 characters
              isSemanticBoundary(contentBuffer) || // Send at semantic boundaries
              isCompleteHTMLElement(contentBuffer); // Send when HTML element is complete
            
            if (shouldSendChunk) {
              try {
                // Sanitize content before sending
                const sanitizedContent = sanitizeForJSON(contentBuffer);
                const chunkData = {
                  type: 'content',
                  content: sanitizedContent,
                  fullContent: sanitizeForJSON(fullContent)
                };
                
                const jsonString = JSON.stringify(chunkData);
                res.write(`data: ${jsonString}\n\n`);
                
                contentBuffer = '';
                chunkCounter = 0;
              } catch (jsonError) {
                // If JSON serialization fails, skip this chunk and continue
                console.warn('JSON serialization error, skipping chunk:', jsonError);
                contentBuffer = '';
                chunkCounter = 0;
              }
            }
          }
        }
        
        // Send any remaining content in buffer
        if (contentBuffer.length > 0) {
          try {
            const finalChunkData = {
              type: 'content',
              content: contentBuffer,
              fullContent: fullContent
            };
            res.write(`data: ${JSON.stringify(finalChunkData)}\n\n`);
          } catch (jsonError) {
            console.warn('Final chunk JSON error:', jsonError);
          }
        }

        // Send completion metadata with error handling
        try {
          const completionData = {
            type: 'complete',
            source: ragContent.length > 100 ? 'openai-rag' : 'openai',
            content: fullContent,
            processingTime: Date.now() - startTime,
            ragResponseTime: ragResponseTime,
            ragContentLength: ragContent.length,
            tryAskingPrompts: [],
            showTryAsking: false,
            showFollowUp: false,
            followUpQuestion: '',
            followUpChips: [],
            followUpResponses: []
          };
          
          res.write(`data: ${JSON.stringify(completionData)}\n\n`);
        } catch (completionError) {
          console.error('Completion data serialization error:', completionError);
          // Send minimal completion message
          res.write(`data: ${JSON.stringify({ type: 'complete', content: fullContent })}\n\n`);
        }

        // Phase 2: Capture structured disambiguation data for logging
        let disambiguationParsed;
        if (disambiguationDetected) {
          // Try to extract parsed data from the RAG result if available
          try {
            const ragResult = await ragService.searchWithProcessing({ message: question });
            if (ragResult.disambiguationData) {
              disambiguationParsed = {
                optionsCount: ragResult.disambiguationData.options.length,
                options: ragResult.disambiguationData.options.map(opt => ({
                  name: opt.name,
                  company: opt.company,
                  description: opt.description
                })),
                instructions: ragResult.disambiguationData.instructions
              };
            }
          } catch (e) {
            console.warn('Could not re-parse disambiguation data for logging:', e);
          }
        }

        // Log the API request details for streaming endpoint with disambiguation info
        apiLogger.log({
          userQuestion: question,
          systemPrompt: await getSystemPrompt(),
          ragContent: ragContent || undefined,
          openaiMessages: messages,
          response: fullContent,
          source: (ragContent.length > 100 ? 'openai-rag' : 'openai') as 'mock' | 'openai' | 'openai-rag',
          processingTime: Date.now() - startTime,
          ragResponseTime: ragResponseTime,
          ragContentLength: ragContent ? ragContent.length : undefined,
          disambiguationDetected,
          disambiguationContent: disambiguationDetected ? disambiguationContent : undefined,
          disambiguationParsed
        });

        res.end();

      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError);
        
        // Provide a graceful fallback response
        const response = {
          source: 'fallback',
          content: "I apologize, but I'm currently unable to process your question due to a technical issue. Please try again later or contact support if the problem persists.",
          processingTime: Date.now() - startTime,
          tryAskingPrompts: [],
          showTryAsking: false,
          showFollowUp: false,
          followUpQuestion: '',
          followUpChips: [],
          followUpResponses: [],
          error: openaiError.message
        };
        
        return res.json(response);
      }
      
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ 
        error: "Failed to process chat request",
        details: error.message 
      });
    }
  });

  // Non-streaming chat endpoint for backward compatibility
  app.post("/api/chat-simple", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      const startTime = Date.now();
      let ragContent = '';
      let ragResponseTime = 0;
      let messages: any[] = [];
      let response: any = {
        source: 'openai',
        content: '',
        processingTime: 0,
        tryAskingPrompts: [],
        showTryAsking: false,
        showFollowUp: false,
        followUpQuestion: '',
        followUpChips: [],
        followUpResponses: []
      };

      // Optimize: Check for mock responses in parallel
      const [exactMatch, allMockResponses] = await Promise.all([
        storage.getMockResponse(question),
        storage.getMockResponses()
      ]);

      let mockResponse = exactMatch;
      
      // If no exact match, try normalized matching
      if (!mockResponse) {
        mockResponse = allMockResponses.find(mock => 
          questionsMatch(question, mock.question)
        );
      }

      // If mock response found, use it
      if (mockResponse) {
        // Resolve follow-up responses to handle linked responses
        const resolvedFollowUps = await resolveFollowUpResponses(mockResponse);
        
        response = {
          source: 'mock',
          content: mockResponse.response,
          processingTime: Date.now() - startTime,
          tryAskingPrompts: mockResponse.tryAskingPrompts || [],
          showTryAsking: mockResponse.showTryAsking || false,
          showFollowUp: mockResponse.showFollowUp || false,
          followUpQuestion: mockResponse.followUpQuestion || '',
          followUpChips: resolvedFollowUps.followUpChips,
          followUpResponses: resolvedFollowUps.followUpResponses,
          followUpResponsesData: resolvedFollowUps.followUpResponsesData
        };
      } 
      // No mock response found, try RAG first
      else {
        
        let disambiguationDetected = false;
        let disambiguationContent = '';
        
        if (ragService.isConfigured()) {
          try {
            console.log('RAG Search (Simple): Attempting to find relevant content for:', question);
            const ragResult = await ragService.searchWithProcessing({ message: question });
            
            // Phase 1 & 2: Check for disambiguation signal and parse data in non-streaming endpoint
            if (ragResult.success && ragResult.disambiguationDetected) {
              disambiguationDetected = true;
              disambiguationContent = ragResult.rawResponse || '';
              console.log('RAG Search (Simple): DISAMBIGUATION DETECTED - Multiple product matches found');
              
              // Phase 2 & 3: Check if we have parsed disambiguation data  
              if (ragResult.disambiguationData && ragResult.disambiguationData.options.length > 0) {
                console.log('RAG Search (Simple): Phase 3 - Returning disambiguation response with', ragResult.disambiguationData.options.length, 'options');
                
                // Phase 3: Return disambiguation response immediately instead of continuing to OpenAI
                const disambiguationResponse = {
                  type: 'disambiguation',
                  source: 'rag-disambiguation',
                  disambiguationData: ragResult.disambiguationData,
                  processingTime: Date.now() - startTime,
                  ragResponseTime: ragResponseTime
                };

                // Log the disambiguation response for non-streaming
                apiLogger.log({
                  userQuestion: question,
                  systemPrompt: await getSystemPrompt(),
                  ragContent: ragContent || undefined,
                  openaiMessages: [], // No OpenAI messages for disambiguation
                  response: `Disambiguation response with ${ragResult.disambiguationData.options.length} options`,
                  source: 'rag-disambiguation' as any,
                  processingTime: Date.now() - startTime,
                  ragResponseTime: ragResponseTime,
                  ragContentLength: ragContent ? ragContent.length : undefined,
                  disambiguationDetected: true,
                  disambiguationContent: ragResult.rawResponse,
                  disambiguationParsed: {
                    optionsCount: ragResult.disambiguationData.options.length,
                    options: ragResult.disambiguationData.options.map(opt => ({
                      name: opt.name,
                      company: opt.company,
                      description: opt.description
                    })),
                    instructions: ragResult.disambiguationData.instructions
                  }
                });

                return disambiguationResponse;
              }
            }
            
            if (ragResult.success && ragResult.processedContent && ragResult.processedContent.length > 100) {
              ragContent = ragResult.processedContent;
              ragResponseTime = ragResult.responseTime || 0;
              
              console.log('RAG Search (Simple): Found relevant content, length:', ragContent.length);
              console.log('RAG Search (Simple): Sources:', ragResult.sources?.length || 0);
              console.log('RAG Search (Simple): Average score:', ragResult.averageScore?.toFixed(2) || 'N/A');
            } else {
              console.log('RAG Search (Simple): No relevant content found or content too short');
            }
          } catch (ragError: any) {
            console.error('RAG Search (Simple): Error during search:', ragError.message);
            // Continue to OpenAI if RAG fails
          }
        }
        if (!process.env.OPEN_AI_KEY_JPR) {
          return res.status(500).json({ 
            error: "OpenAI API key not configured" 
          });
        }

        try {
          // Get system prompt from cache
          const systemPrompt = await getSystemPrompt();

          // Prepare messages with potential RAG context
          messages = [
            {
              role: "system",
              content: systemPrompt
            }
          ];
          
          // Add RAG context if available - positioned immediately after system prompt for priority
          if (ragContent.length > 100) {
            messages.push({
              role: "system",
              content: `RAG DATA SOURCE - Context block from the provided RAG data source:\n\n${ragContent}\n\nThis is the primary data source referenced in your instructions. You MUST base your response primarily on this specific product information. Integrate these exact products, companies, and technical specifications as the foundation of your answer.`
            });
          }
          
          messages.push({
            role: "user",
            content: question
          });

          // Use regular completion for simple endpoint
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages as any,
            max_tokens: 1000,
            temperature: 0.7,
          });

          const aiContent = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";
          
          response = {
            source: ragContent.length > 100 ? 'openai-rag' : 'openai',
            content: aiContent,
            processingTime: Date.now() - startTime,
            ragResponseTime: ragResponseTime,
            ragContentLength: ragContent.length,
            tryAskingPrompts: [],
            showTryAsking: false,
            showFollowUp: false,
            followUpQuestion: '',
            followUpChips: [],
            followUpResponses: []
          };

        } catch (openaiError: any) {
          console.error('OpenAI API error:', openaiError);
          
          // Provide a graceful fallback response
          response = {
            source: 'fallback',
            content: "I apologize, but I'm currently unable to process your question due to a technical issue. Please try again later or contact support if the problem persists.",
            processingTime: Date.now() - startTime,
            tryAskingPrompts: [],
            showTryAsking: false,
            showFollowUp: false,
            followUpQuestion: '',
            followUpChips: [],
            followUpResponses: [],
            error: openaiError.message
          };
        }
      }

      // Log the API request details
      const systemPromptText = response.source !== 'mock' ? await getSystemPrompt() : '';
      const openaiMessages = response.source !== 'mock' && typeof messages !== 'undefined' ? messages : [];
      const ragContentText = typeof ragContent !== 'undefined' ? ragContent : '';
      
      // Get disambiguation data from response scope if available - declare with fallback
      let logDisambiguationDetected = false;
      let logDisambiguationContent: string | undefined = undefined;
      
      // Phase 2: Capture structured disambiguation data for non-streaming endpoint
      let disambiguationParsed;
      if (logDisambiguationDetected) {
        try {
          const ragResult = await ragService.searchWithProcessing({ message: question });
          if (ragResult.disambiguationData) {
            disambiguationParsed = {
              optionsCount: ragResult.disambiguationData.options.length,
              options: ragResult.disambiguationData.options.map(opt => ({
                name: opt.name,
                company: opt.company,
                description: opt.description
              })),
              instructions: ragResult.disambiguationData.instructions
            };
          }
        } catch (e) {
          console.warn('Could not re-parse disambiguation data for non-streaming logging:', e);
        }
      }

      apiLogger.log({
        userQuestion: question,
        systemPrompt: systemPromptText,
        ragContent: ragContentText || undefined,
        openaiMessages: openaiMessages,
        response: response.content,
        source: response.source as 'mock' | 'openai' | 'openai-rag',
        processingTime: response.processingTime,
        ragResponseTime: response.ragResponseTime,
        ragContentLength: ragContentText ? ragContentText.length : undefined,
        disambiguationDetected: logDisambiguationDetected,
        disambiguationContent: logDisambiguationContent,
        disambiguationParsed
      });

      res.json(response);
      
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ 
        error: "Failed to process chat request",
        details: error.message 
      });
    }
  });

  // RAG API test endpoint
  app.get("/api/rag/test", async (req, res) => {
    try {
      console.log('RAG Test: Starting connection test');
      const result = await ragService.testConnection();
      
      res.json({
        success: result.success,
        configured: ragService.isConfigured(),
        responseTime: result.responseTime,
        error: result.error,
        hasData: !!result.data,
        dataPreview: result.data ? JSON.stringify(result.data).substring(0, 200) + '...' : null
      });
    } catch (error: any) {
      console.error('RAG Test: Endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        configured: ragService.isConfigured()
      });
    }
  });

  // RAG search endpoint with enhanced processing
  app.post("/api/rag/search", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await ragService.searchWithProcessing({ message });
      
      res.json({
        success: result.success,
        data: result.data,
        processedContent: result.processedContent,
        sources: result.sources,
        averageScore: result.averageScore,
        productCount: result.productCount,
        responseTime: result.responseTime,
        source: result.source,
        error: result.error
      });
    } catch (error: any) {
      console.error('RAG Search: Endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Enhanced RAG search endpoint with structured product data
  app.post("/api/rag/search-enhanced", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await ragService.searchWithProcessing({ message });
      
      res.json({
        success: result.success,
        data: result.data,
        processedContent: result.processedContent,
        processedProductData: result.processedProductData,
        sources: result.sources,
        averageScore: result.averageScore,
        productCount: result.productCount,
        responseTime: result.responseTime,
        source: result.source,
        error: result.error
      });
    } catch (error: any) {
      console.error('RAG Search Enhanced: Endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // RAG cache management endpoints
  app.post("/api/rag/cache/clear", async (req, res) => {
    try {
      ragService.clearCache();
      res.json({ success: true, message: "Cache cleared successfully" });
    } catch (error: any) {
      console.error('RAG Cache clear error:', error);
      res.status(500).json({ 
        error: "Failed to clear cache",
        details: error.message 
      });
    }
  });

  app.get("/api/rag/cache/stats", async (req, res) => {
    try {
      const stats = ragService.getCacheStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error('RAG Cache stats error:', error);
      res.status(500).json({ 
        error: "Failed to get cache stats",
        details: error.message 
      });
    }
  });

  // API Logs endpoints
  app.get("/api/logs", async (req, res) => {
    try {
      const logs = apiLogger.getLogs();
      res.json(logs);
    } catch (error: any) {
      console.error('API Logs: Get logs error:', error);
      res.status(500).json({ 
        error: "Failed to get API logs",
        details: error.message 
      });
    }
  });

  app.post("/api/logs/clear", async (req, res) => {
    try {
      apiLogger.clearLogs();
      res.json({ success: true, message: "API logs cleared successfully" });
    } catch (error: any) {
      console.error('API Logs: Clear logs error:', error);
      res.status(500).json({ 
        error: "Failed to clear API logs",
        details: error.message 
      });
    }
  });

  // Object Storage endpoints for public file serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object Storage endpoints for private file serving (with public access for logo images)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Object Storage upload URL endpoint
  app.post("/api/objects/upload", async (req, res) => {
    const { ObjectStorageService } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Logo image upload completion endpoint
  app.put("/api/logo-upload", async (req, res) => {
    if (!req.body.logoImageURL) {
      return res.status(400).json({ error: "logoImageURL is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.logoImageURL,
      );

      // Update the logo_url setting with the new object path
      await storage.setSetting("logo_url", objectPath);

      res.status(200).json({
        success: true,
        objectPath: objectPath,
        message: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error("Error setting logo image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Version endpoint
  app.get("/api/version", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Read version info from JSON file
      const versionInfoPath = path.join(process.cwd(), 'version-info.json');
      const versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
      
      res.json(versionInfo);
    } catch (error) {
      console.error('Error reading version info:', error);
      // Fallback to VERSION file
      try {
        const fs = await import('fs');
        const path = await import('path');
        const versionPath = path.join(process.cwd(), 'VERSION');
        const version = fs.readFileSync(versionPath, 'utf8').trim();
        
        res.json({
          version,
          timestamp: new Date().toISOString(),
          buildDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        });
      } catch (fallbackError) {
        console.error('Error reading VERSION file:', fallbackError);
        res.json({
          version: "00001",
          timestamp: new Date().toISOString(),
          buildDate: "Unknown"
        });
      }
    }
  });

  const httpServer = createServer(app);

  // Feedback endpoints
  
  // Get all feedback (admin only)
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedbackList = await storage.getFeedback();
      res.json(feedbackList);
    } catch (error: any) {
      console.error('Get feedback error:', error);
      res.status(500).json({ error: "Failed to retrieve feedback" });
    }
  });

  // Create feedback with conversation snapshot
  app.post("/api/feedback", async (req, res) => {
    try {
      const { 
        type, 
        title, 
        description, 
        priority, 
        userEmail, 
        conversationHistory, 
        sessionInfo 
      } = req.body;

      // Validate required fields
      if (!type || !title || !description) {
        return res.status(400).json({ error: "Type, title, and description are required" });
      }

      // Create conversation snapshot if provided
      let conversationSnapshotId = null;
      if (conversationHistory && conversationHistory.length > 0) {
        const snapshot = await storage.createConversationSnapshot({
          messages: JSON.stringify(conversationHistory),
          sessionInfo: sessionInfo ? JSON.stringify(sessionInfo) : null
        });
        conversationSnapshotId = snapshot.id;
      }

      // Get browser and app info
      const userAgent = req.headers['user-agent'] || '';
      const currentRoute = req.headers['referer'] || '';
      
      // Read current version
      let appVersion = 'unknown';
      try {
        const versionResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/version`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          appVersion = versionData.version;
        }
      } catch (e) {
        console.warn('Could not retrieve app version for feedback');
      }

      const feedback = await storage.createFeedback({
        type,
        title,
        description,
        priority: priority || 'medium',
        userEmail: userEmail || null,
        browserInfo: userAgent,
        currentRoute,
        appVersion,
        conversationSnapshotId
      });

      res.json({ 
        success: true, 
        feedbackId: feedback.id,
        message: "Thank you for your feedback! We'll review it shortly." 
      });
    } catch (error: any) {
      console.error('Create feedback error:', error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Update feedback status (admin only)
  app.put("/api/feedback/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedFeedback = await storage.updateFeedbackStatus(
        parseInt(id), 
        status, 
        adminResponse
      );

      res.json(updatedFeedback);
    } catch (error: any) {
      console.error('Update feedback status error:', error);
      res.status(500).json({ error: "Failed to update feedback status" });
    }
  });

  // Get conversation snapshot
  app.get("/api/conversation-snapshot/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const snapshot = await storage.getConversationSnapshot(parseInt(id));
      
      if (!snapshot) {
        return res.status(404).json({ error: "Conversation snapshot not found" });
      }

      res.json({
        id: snapshot.id,
        messages: JSON.parse(snapshot.messages),
        sessionInfo: snapshot.sessionInfo ? JSON.parse(snapshot.sessionInfo) : null,
        createdAt: snapshot.createdAt
      });
    } catch (error: any) {
      console.error('Get conversation snapshot error:', error);
      res.status(500).json({ error: "Failed to retrieve conversation snapshot" });
    }
  });

  // Product Replacement System Routes

  // Enhanced search products with ChemSpider integration
  app.get("/api/products/search", async (req, res) => {
    try {
      const { 
        q: query, 
        limit = 20,
        includeExternal = 'true',
        minResults = 3
      } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const searchLimit = Math.min(Number(limit), 50);
      const minResultThreshold = Number(minResults);

      // Step 1: Search internal products first (fast response)
      const internalProducts = await storage.searchProducts(query, searchLimit);
      let results = internalProducts.map(p => ({ ...p, source: 'internal' }));

      // Step 2: If insufficient results and external search enabled, query ChemSpider
      if (includeExternal === 'true' && results.length < minResultThreshold && query.length > 2) {
        try {
          console.log(`Internal search returned ${results.length} results, fetching external data...`);
          
          const { externalDataService } = await import('./externalDataService');
          const externalResults = await externalDataService.searchExternalProducts(query, searchLimit - results.length);
          
          // Convert external results to product format
          const externalProducts = externalResults.map((ext, index) => ({
            id: index + 10000, // Use high numeric IDs for external products
            name: ext.name,
            manufacturer: ext.manufacturer || 'Unknown',
            casNumber: ext.casNumber || null,
            chemicalName: ext.chemicalName || null,
            productNumber: null,
            category: ext.properties?.category || 'External',
            description: `External product from ${ext.source} - ${ext.chemicalName || ext.name}`,
            isActive: true,
            source: 'external',
            externalSource: ext.source,
            sourceId: ext.sourceId,
            confidence: ext.confidence,
            molecularFormula: ext.molecularFormula,
            molecularWeight: ext.molecularWeight,
            synonyms: ext.synonyms,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          // Merge results, prioritizing internal products
          results = [...results, ...externalProducts];
          
          console.log(`Enhanced search completed: ${internalProducts.length} internal + ${externalProducts.length} external = ${results.length} total results`);
        } catch (error) {
          console.warn('External search failed, returning internal results only:', error);
          // Continue with internal results only
        }
      }

      // Step 3: Sort results (internal first, then by confidence/name)
      results.sort((a, b) => {
        if (a.source === 'internal' && b.source !== 'internal') return -1;
        if (b.source === 'internal' && a.source !== 'internal') return 1;
        if ((a as any).confidence && (b as any).confidence) return (b as any).confidence - (a as any).confidence;
        return (a.name || '').localeCompare(b.name || '');
      });

      // Return results with metadata
      const response = {
        results: results.slice(0, searchLimit),
        totalResults: results.length,
        internalResults: internalProducts.length,
        externalResults: results.length - internalProducts.length,
        searchTerm: query,
        sources: ['internal', ...(results.some(r => r.source === 'external') ? ['chemspider', 'pubchem'] : [])]
      };

      res.json(response);
    } catch (error) {
      console.error("Enhanced product search error:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // Get replacement reasons
  app.get("/api/replacement-reasons", async (req, res) => {
    try {
      const reasons = await storage.getReplacementReasons();
      res.json(reasons);
    } catch (error) {
      console.error("Get replacement reasons error:", error);
      res.status(500).json({ error: "Failed to get replacement reasons" });
    }
  });

  // Create replacement request
  app.post("/api/replacement-requests", async (req, res) => {
    try {
      const {
        originalProductName,
        originalProductId,
        reasonCodes = [],
        additionalNotes,
        userEmail
      } = req.body;

      if (!originalProductName) {
        return res.status(400).json({ error: "Original product name is required" });
      }

      const requestData = {
        originalProductName,
        originalProductId: originalProductId || null,
        reasonCodes,
        additionalNotes: additionalNotes || null,
        userEmail: userEmail || null,
        status: "pending" as const,
        discoveryAttempted: false
      };

      const request = await storage.createReplacementRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Create replacement request error:", error);
      res.status(500).json({ error: "Failed to create replacement request" });
    }
  });

  // Get replacement request
  app.get("/api/replacement-requests/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      const request = await storage.getReplacementRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Replacement request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Get replacement request error:", error);
      res.status(500).json({ error: "Failed to get replacement request" });
    }
  });

  // Get product replacements for a request
  app.get("/api/replacement-requests/:id/replacements", async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      const replacements = await storage.getProductReplacements(requestId);
      res.json(replacements);
    } catch (error) {
      console.error("Get product replacements error:", error);
      res.status(500).json({ error: "Failed to get product replacements" });
    }
  });

  // Admin route: Create product source
  app.post("/api/admin/product-sources", async (req, res) => {
    try {
      const { name, baseUrl, apiKey, isActive = true, priority = 50 } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Source name is required" });
      }

      const sourceData = {
        name,
        baseUrl: baseUrl || null,
        apiKey: apiKey || null,
        isActive,
        priority
      };

      const source = await storage.createProductSource(sourceData);
      res.status(201).json(source);
    } catch (error) {
      console.error("Create product source error:", error);
      res.status(500).json({ error: "Failed to create product source" });
    }
  });

  // Admin route: Create replacement reason
  app.post("/api/admin/replacement-reasons", async (req, res) => {
    try {
      const { code, label, description, isActive = true, sortOrder = 0 } = req.body;
      
      if (!code || !label) {
        return res.status(400).json({ error: "Code and label are required" });
      }

      const reasonData = {
        code,
        label,
        description: description || null,
        isActive,
        sortOrder
      };

      const reason = await storage.createReplacementReason(reasonData);
      res.status(201).json(reason);
    } catch (error) {
      console.error("Create replacement reason error:", error);
      res.status(500).json({ error: "Failed to create replacement reason" });
    }
  });

  // Phase 2: Advanced replacement discovery with external APIs
  app.post("/api/replacement-requests/:id/discover", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      const request = await storage.getReplacementRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Replacement request not found" });
      }

      // Import external data service dynamically to avoid circular dependencies
      const { externalDataService } = await import('./externalDataService');
      
      let originalProduct: any = null;
      if (request.originalProductId) {
        originalProduct = await storage.getProduct(request.originalProductId);
      }

      // Build search criteria from request
      const criteria = {
        chemicalClass: originalProduct?.category,
        excludedSubstances: [], // Could be derived from reason codes
        safetyProfile: request.reasonCodes?.includes('SAFETY') ? 'improved' : undefined,
        regulatoryStatus: request.reasonCodes?.includes('REGULATORY') ? ['compliant'] : undefined
      };

      // Search for external replacements
      const externalResults = originalProduct 
        ? await externalDataService.findReplacements(originalProduct, criteria, 20)
        : await externalDataService.searchExternalProducts(request.originalProductName, 20);

      // Phase 3: Use advanced algorithms to score and rank external results
      const { ReplacementAlgorithmEngine } = await import('./replacementAlgorithms');
      const algorithmEngine = new ReplacementAlgorithmEngine();
      
      // Convert external results to Product format for algorithm processing
      const externalProducts = externalResults.map((result, index) => ({
        id: index + 10000,
        name: result.name,
        manufacturer: result.manufacturer || 'Unknown',
        casNumber: result.casNumber,
        chemicalName: result.chemicalName,
        productNumber: null,
        category: result.properties?.category || originalProduct?.category || 'Unknown',
        description: `External product from ${result.source}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Generate advanced replacement candidates with comprehensive scoring
      const replacementCandidates = await algorithmEngine.generateReplacementCandidates(
        originalProduct || {
          id: 0,
          name: request.originalProductName,
          manufacturer: null,
          casNumber: null,
          chemicalName: null,
          productNumber: null,
          category: 'Unknown',
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        externalProducts,
        criteria,
        request
      );

      // Store top-ranked candidates as replacements
      const replacements = [];
      for (const candidate of replacementCandidates.slice(0, 5)) { // Top 5 candidates
        const replacement = await storage.createProductReplacement({
          requestId,
          replacementProductId: undefined,
          externalProductData: {
            ...candidate.product,
            algorithmScore: candidate.score,
            metadata: candidate.metadata
          },
          matchScore: candidate.score.overall,
          reasonAlignment: JSON.stringify({
            ...criteria,
            algorithmDetails: {
              matchType: candidate.metadata.matchType,
              confidence: candidate.score.confidence,
              breakdown: candidate.score.breakdown
            }
          }),
          notes: `${candidate.product.name} - ${candidate.score.reasoning.join('. ')} (Algorithm Score: ${candidate.score.overall}%)`
        });
        replacements.push(replacement);
      }

      // Mark request as discovery attempted
      await storage.updateReplacementRequest(requestId, { 
        discoveryAttempted: true,
        status: replacements.length > 0 ? 'in_progress' : 'no_matches_found'
      });

      res.json({
        message: `Discovered ${replacements.length} potential replacements`,
        count: replacements.length,
        replacements: replacements.slice(0, 10) // Return first 10 for preview
      });
    } catch (error) {
      console.error("Error discovering replacements:", error);
      res.status(500).json({ error: "Failed to discover replacements" });
    }
  });

  // Phase 2: Get external product details
  app.get("/api/external-products/:source/:id", async (req, res) => {
    try {
      const { source, id } = req.params;
      
      const { externalDataService } = await import('./externalDataService');
      const details = await externalDataService.getProductDetails(id, source);
      
      if (!details) {
        return res.status(404).json({ error: "Product details not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Error getting external product details:", error);
      res.status(500).json({ error: "Failed to get product details" });
    }
  });

  // Phase 2: Advanced product search with external integration
  app.get("/api/products/advanced-search", async (req, res) => {
    try {
      const { 
        q: query = '', 
        casNumber, 
        category, 
        manufacturer,
        includeExternal = 'false',
        limit = '20' 
      } = req.query as Record<string, string>;

      // Search internal products first
      const internalProducts = await storage.searchProducts(query, Math.min(Number(limit), 50));
      
      let results = internalProducts.map(p => ({ ...p, source: 'internal' }));

      // Include external results if requested
      if (includeExternal === 'true' && query.length > 2) {
        try {
          const { externalDataService } = await import('./externalDataService');
          const externalResults = await externalDataService.searchExternalProducts(query, 10);
          
          const externalProducts = externalResults.map((ext, index) => ({
            id: index + 10000, // Use numeric IDs for external products
            name: ext.name,
            manufacturer: ext.manufacturer || 'Unknown',
            casNumber: ext.casNumber || null,
            chemicalName: ext.chemicalName || null,
            productNumber: null,
            category: ext.properties?.category || 'Unknown',
            description: `External product from ${ext.source}`,
            isActive: true,
            source: 'external',
            externalSource: ext.source,
            confidence: ext.confidence,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          results = [...results, ...externalProducts];
        } catch (error) {
          console.warn('External search failed:', error);
        }
      }

      // Apply additional filters
      if (casNumber) {
        results = results.filter(p => p.casNumber?.includes(casNumber));
      }
      if (category) {
        results = results.filter(p => p.category?.toLowerCase().includes(category.toLowerCase()));
      }
      if (manufacturer) {
        results = results.filter(p => p.manufacturer?.toLowerCase().includes(manufacturer.toLowerCase()));
      }

      // Sort by relevance (internal first, then by confidence/name)
      results.sort((a, b) => {
        if (a.source === 'internal' && b.source !== 'internal') return -1;
        if (b.source === 'internal' && a.source !== 'internal') return 1;
        if ((a as any).confidence && (b as any).confidence) return (b as any).confidence - (a as any).confidence;
        return (a.name || '').localeCompare(b.name || '');
      });

      res.json(results.slice(0, Number(limit)));
    } catch (error) {
      console.error("Error in advanced search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  return httpServer;
}
