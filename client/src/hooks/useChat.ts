import { useState, useCallback } from 'react';
import { ProductOption, ChatResponse } from '@shared/schema';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  citations?: string[];
  tryAskingPrompts?: string[];
  showTryAsking?: boolean; // Track if this message should show any try asking suggestions
  showFollowUp?: boolean;
  followUpQuestion?: string;
  followUpChips?: string[];
  followUpResponses?: string[];
  followUpResponsesData?: any[]; // Full response data for linked responses
  isStreaming?: boolean; // Track if this message is being streamed
  source?: string; // Track response source: 'mock', 'openai', 'openai-rag', 'fallback'
  ragResponseTime?: number; // RAG search response time
  ragContentLength?: number; // Length of RAG content used
  processingTime?: number; // Total processing time
  // Phase 3: Disambiguation support
  responseData?: ChatResponse;
  isDisambiguation?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
}

// Mock AI responses with citations for chemical industry
const mockAIResponses = [
  {
    content: `No, AF27 Stearic Acid is not an oxidizing agent. According to its Safety Data Sheet, it has no reported oxidizing properties.`,
    citations: ['AF27 Stearic Acid SDS US en.txt'],
    tryAskingPrompts: ['What are the safety properties of AF27?', 'What is AF27 used for?', 'How should AF27 be stored?']
  },
  {
    content: `An oxidizer (or oxidizing agent) is a substance that can cause or promote combustion by providing oxygen or another oxidizing element. Oxidizers facilitate the burning of fuels and can react with other materials, sometimes violently, even without an external ignition source.

Common examples of oxidizers include:

Oxygen (O₂)
Hydrogen peroxide (H₂O₂)
Nitric acid (HNO₃)
Chlorates (e.g., sodium chlorate)
Perchlorates (e.g., ammonium perchlorate)
Nitrates (e.g., potassium nitrate)

Oxidizers are often used in industrial processes, explosives, rocket propellants, and disinfectants. Because they can intensify fires or create hazardous reactions, they must be handled carefully.

Would you like more details on a specific oxidizer?`,
    citations: ['AF24 Oleic Acid Distillation Botto...', 'NPD-01 Oleic Acid 1_ Blend SDS...', 'Amarnakote RS SDS US en.txt'],
    tryAskingPrompts: ['What are common safety precautions for oxidizers?', 'How do oxidizers work in chemical reactions?', 'What industries use oxidizers?']
  },
  {
    content: `Based on the available data, here are the key physical properties of Amarnakote:

• **Appearance**: Typically a solid or semi-solid material
• **Color**: Usually white to off-white
• **Melting Point**: Varies depending on specific formulation
• **Solubility**: Limited water solubility, soluble in organic solvents
• **Density**: Specific gravity typically ranges from 0.8-1.2 g/cm³

For more detailed specifications, please refer to the technical data sheet or contact your supplier for the specific grade you're working with.`,
    citations: ['Amarnakote RS SDS US en.txt'],
    tryAskingPrompts: ['What are the applications of Amarnakote?', 'How is Amarnakote manufactured?', 'What are the storage requirements for Amarnakote?']
  }
];

export const useChat = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
    };

    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeChatId) return;

    // Check if this is a follow-up message
    const isFollowUpMessage = content.startsWith('__FOLLOWUP__');
    let displayContent = content;
    let followUpResponse = null;
    
    if (isFollowUpMessage) {
      // Parse the follow-up message: __FOLLOWUP__chipIndex__messageId__chipText
      const parts = content.split('__');
      if (parts.length >= 5) {
        const chipIndex = parseInt(parts[2]);
        const messageId = parts[3];
        const chipText = parts.slice(4).join('__'); // In case chipText contains __
        
        displayContent = chipText;
        
        // Find the original message to get the follow-up response
        const currentSession = chatSessions.find(session => session.id === activeChatId);
        const originalMessage = currentSession?.messages.find(msg => msg.id === messageId);
        
        if (originalMessage && originalMessage.followUpResponses && originalMessage.followUpResponses[chipIndex]) {
          followUpResponse = {
            content: originalMessage.followUpResponses[chipIndex],
            // Include linked response data if available
            ...(originalMessage as any).followUpResponsesData?.[chipIndex]
          };
        }
      }
    }

    const userMessage: Message = {
      id: generateId(),
      content: displayContent,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message
    setChatSessions(prev => prev.map(session => {
      if (session.id === activeChatId) {
        const updatedMessages = [...session.messages, userMessage];
        return {
          ...session,
          messages: updatedMessages,
          title: session.title === 'New Chat' ? displayContent.slice(0, 50) : session.title,
          updatedAt: new Date(),
        };
      }
      return session;
    }));

    // Simulate AI typing
    setIsTyping(true);

    // If this is a follow-up message, provide the configured response
    if (followUpResponse) {
      setTimeout(() => {
        const aiResponse: Message = {
          id: generateId(),
          content: typeof followUpResponse === 'string' ? followUpResponse : followUpResponse.content,
          sender: 'ai',
          timestamp: new Date(),
          citations: [],
          tryAskingPrompts: typeof followUpResponse === 'object' ? followUpResponse.tryAskingPrompts || [] : [],
          showTryAsking: typeof followUpResponse === 'object' ? followUpResponse.showTryAsking || false : false,
          showFollowUp: typeof followUpResponse === 'object' ? followUpResponse.showFollowUp || false : false,
          followUpQuestion: typeof followUpResponse === 'object' ? followUpResponse.followUpQuestion || "" : "",
          followUpChips: typeof followUpResponse === 'object' ? followUpResponse.followUpChips || [] : [],
          followUpResponses: typeof followUpResponse === 'object' ? followUpResponse.followUpResponses || [] : [],
          followUpResponsesData: typeof followUpResponse === 'object' ? followUpResponse.followUpResponsesData || [] : [],
        };

        setChatSessions(prev => prev.map(session => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, aiResponse],
              updatedAt: new Date(),
            };
          }
          return session;
        }));

        setIsTyping(false);
      }, 1000);
      return;
    }

    // Call the chat endpoint with streaming support
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: displayContent.trim() }),
      });

      // Check if this is a streaming response
      const contentType = response.headers.get('Content-Type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('No reader available');
        }

        const aiMessageId = generateId();
        let fullContent = '';
        let isStreamingComplete = false;
        let dataBuffer = ''; // Buffer for incomplete JSON fragments
        
        // Create initial AI message
        const initialAiMessage: Message = {
          id: aiMessageId,
          content: '',
          sender: 'ai',
          timestamp: new Date(),
          citations: [],
          tryAskingPrompts: [],
          showTryAsking: false,
          showFollowUp: false,
          followUpQuestion: '',
          followUpChips: [],
          followUpResponses: [],
          followUpResponsesData: [],
          isStreaming: true,
          source: 'openai', // Default, will be updated when we get the actual source
          ragResponseTime: 0,
          ragContentLength: 0,
          processingTime: 0,
        };

        // Add initial AI message to show typing
        setChatSessions(prev => prev.map(session => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, initialAiMessage],
              updatedAt: new Date(),
            };
          }
          return session;
        }));
        
        // Set streaming message ID
        setStreamingMessageId(aiMessageId);

        // Process streaming data
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonData = line.substring(6).trim();
                  
                  // Skip empty lines or malformed data
                  if (!jsonData || jsonData === '') {
                    continue;
                  }
                  
                  // Add to buffer for robust parsing
                  dataBuffer += jsonData;
                  
                  try {
                    // Try to parse the buffered data
                    const data = JSON.parse(dataBuffer);
                    
                    // Successful parse, clear buffer
                    dataBuffer = '';
                    
                    if (data.type === 'start') {
                      // Stream started, update source and RAG metadata
                      setIsTyping(false);
                      
                      setChatSessions(prev => prev.map(session => {
                        if (session.id === activeChatId) {
                          return {
                            ...session,
                            messages: session.messages.map(msg => 
                              msg.id === aiMessageId 
                                ? { 
                                    ...msg, 
                                    source: data.source || 'openai',
                                    ragResponseTime: data.ragResponseTime || 0,
                                    ragContentLength: data.ragContentLength || 0,
                                  }
                                : msg
                            ),
                            updatedAt: new Date(),
                          };
                        }
                        return session;
                      }));
                    } else if (data.type === 'content') {
                      // Update content incrementally
                      fullContent = data.fullContent || fullContent + data.content;
                      
                      setChatSessions(prev => prev.map(session => {
                        if (session.id === activeChatId) {
                          return {
                            ...session,
                            messages: session.messages.map(msg => 
                              msg.id === aiMessageId 
                                ? { ...msg, content: fullContent }
                                : msg
                            ),
                            updatedAt: new Date(),
                          };
                        }
                        return session;
                      }));
                    } else if (data.type === 'complete') {
                      // Stream completed
                      isStreamingComplete = true;
                      
                      setChatSessions(prev => prev.map(session => {
                        if (session.id === activeChatId) {
                          return {
                            ...session,
                            messages: session.messages.map(msg => 
                              msg.id === aiMessageId 
                                ? { 
                                    ...msg, 
                                    content: data.content,
                                    tryAskingPrompts: data.tryAskingPrompts || [],
                                    showTryAsking: data.showTryAsking || false,
                                    showFollowUp: data.showFollowUp || false,
                                    followUpQuestion: data.followUpQuestion || '',
                                    followUpChips: data.followUpChips || [],
                                    followUpResponses: data.followUpResponses || [],
                                    followUpResponsesData: data.followUpResponsesData || [],
                                    isStreaming: false,
                                    source: data.source || 'openai',
                                    ragResponseTime: data.ragResponseTime || 0,
                                    ragContentLength: data.ragContentLength || 0,
                                    processingTime: data.processingTime || 0,
                                  }
                                : msg
                            ),
                            updatedAt: new Date(),
                          };
                        }
                        return session;
                      }));
                      
                      // Clear streaming message ID
                      setStreamingMessageId(null);
                      break;
                    }
                  } catch (parseError) {
                    // JSON parsing failed, try to recover
                    try {
                      // Check if buffer has multiple concatenated JSON objects
                      const jsonObjects = dataBuffer.split('}{');
                      if (jsonObjects.length > 1) {
                        // Try to parse the first complete object
                        const firstObject = jsonObjects[0] + '}';
                        const data = JSON.parse(firstObject);
                        
                        // Process the successful parse using the same logic above
                        if (data.type === 'start') {
                          setIsTyping(false);
                          setChatSessions(prev => prev.map(session => {
                            if (session.id === activeChatId) {
                              return {
                                ...session,
                                messages: session.messages.map(msg => 
                                  msg.id === aiMessageId 
                                    ? { 
                                        ...msg, 
                                        source: data.source || 'openai',
                                        ragResponseTime: data.ragResponseTime || 0,
                                        ragContentLength: data.ragContentLength || 0,
                                      }
                                    : msg
                                ),
                                updatedAt: new Date(),
                              };
                            }
                            return session;
                          }));
                        } else if (data.type === 'content') {
                          fullContent = data.fullContent || fullContent + data.content;
                          setChatSessions(prev => prev.map(session => {
                            if (session.id === activeChatId) {
                              return {
                                ...session,
                                messages: session.messages.map(msg => 
                                  msg.id === aiMessageId 
                                    ? { ...msg, content: fullContent }
                                    : msg
                                ),
                                updatedAt: new Date(),
                              };
                            }
                            return session;
                          }));
                        } else if (data.type === 'complete') {
                          isStreamingComplete = true;
                          setChatSessions(prev => prev.map(session => {
                            if (session.id === activeChatId) {
                              return {
                                ...session,
                                messages: session.messages.map(msg => 
                                  msg.id === aiMessageId 
                                    ? { 
                                        ...msg, 
                                        content: data.content,
                                        tryAskingPrompts: data.tryAskingPrompts || [],
                                        showTryAsking: data.showTryAsking || false,
                                        showFollowUp: data.showFollowUp || false,
                                        followUpQuestion: data.followUpQuestion || '',
                                        followUpChips: data.followUpChips || [],
                                        followUpResponses: data.followUpResponses || [],
                                        followUpResponsesData: data.followUpResponsesData || [],
                                        isStreaming: false,
                                        source: data.source || 'openai',
                                        ragResponseTime: data.ragResponseTime || 0,
                                        ragContentLength: data.ragContentLength || 0,
                                        processingTime: data.processingTime || 0,
                                      }
                                    : msg
                                ),
                                updatedAt: new Date(),
                              };
                            }
                            return session;
                          }));
                          setStreamingMessageId(null);
                        }
                        
                        // Keep remaining data in buffer
                        dataBuffer = '{' + jsonObjects.slice(1).join('}{');
                      } else {
                        // Check if buffer is getting too large (potential memory issue)
                        if (dataBuffer.length > 10000) {
                          console.warn('JSON buffer too large, clearing:', dataBuffer.substring(0, 100) + '...');
                          dataBuffer = '';
                        }
                        // Keep incomplete JSON in buffer for next iteration
                      }
                    } catch (recoveryError) {
                      console.error('Error in JSON recovery, clearing buffer:', recoveryError);
                      dataBuffer = '';
                    }
                  }
                }
              }
            }
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            // Fallback to error message if streaming fails
            setChatSessions(prev => prev.map(session => {
              if (session.id === activeChatId) {
                return {
                  ...session,
                  messages: session.messages.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: 'I apologize, but there was an error processing your request. Please try again.', isStreaming: false }
                      : msg
                  ),
                  updatedAt: new Date(),
                };
              }
              return session;
            }));
            
            // Clear streaming message ID
            setStreamingMessageId(null);
          }
        };

        await processStream();
        return;
      }
      
      // Handle non-streaming response (fallback)
      if (response.ok) {
        const chatResponse = await response.json();
        
        // Phase 3: Check if this is a disambiguation response
        if (chatResponse.type === 'disambiguation' && chatResponse.disambiguationData) {
          const aiResponse: Message = {
            id: generateId(),
            content: '', // No content for disambiguation responses
            sender: 'ai',
            timestamp: new Date(),
            citations: [],
            tryAskingPrompts: [],
            showTryAsking: false,
            showFollowUp: false,
            followUpQuestion: '',
            followUpChips: [],
            followUpResponses: [],
            followUpResponsesData: [],
            // Phase 3: Add disambiguation fields
            responseData: chatResponse,
            isDisambiguation: true,
            source: chatResponse.source,
            ragResponseTime: chatResponse.ragResponseTime,
            processingTime: chatResponse.processingTime,
          };

          setChatSessions(prev => prev.map(session => {
            if (session.id === activeChatId) {
              return {
                ...session,
                messages: [...session.messages, aiResponse],
                updatedAt: new Date(),
              };
            }
            return session;
          }));

          setIsTyping(false);
          return;
        }
        
        // Handle normal responses
        // Check if global "Try asking" is enabled for OpenAI responses
        let tryAskingPrompts: string[] = chatResponse.tryAskingPrompts || [];
        let showTryAsking = chatResponse.showTryAsking || false;
        
        // For OpenAI responses, only use try asking prompts if they're explicitly provided
        // (No default suggestions for OpenAI responses)
        
        const aiResponse: Message = {
          id: generateId(),
          content: chatResponse.content,
          sender: 'ai',
          timestamp: new Date(),
          citations: [], // OpenAI responses don't have citations for now
          tryAskingPrompts,
          showTryAsking,
          showFollowUp: chatResponse.showFollowUp,
          followUpQuestion: chatResponse.followUpQuestion,
          followUpChips: chatResponse.followUpChips,
          followUpResponses: chatResponse.followUpResponses,
          followUpResponsesData: chatResponse.followUpResponsesData,
          source: chatResponse.source,
          ragResponseTime: chatResponse.ragResponseTime,
          ragContentLength: chatResponse.ragContentLength,
          processingTime: chatResponse.processingTime,
        };

        setChatSessions(prev => prev.map(session => {
          if (session.id === activeChatId) {
            return {
              ...session,
              messages: [...session.messages, aiResponse],
              updatedAt: new Date(),
            };
          }
          return session;
        }));

        setIsTyping(false);
        return;
      }
    } catch (error) {
      console.error('Chat API error:', error);
    }

    // Fallback response if API fails
    setTimeout(() => {
      const aiResponse: Message = {
        id: generateId(),
        content: "I apologize, but I'm currently unable to process your question. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
        citations: [],
        tryAskingPrompts: [],
        showTryAsking: false,
        showFollowUp: false,
        followUpQuestion: "",
        followUpChips: [],
        followUpResponses: [],
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === activeChatId) {
          return {
            ...session,
            messages: [...session.messages, aiResponse],
            updatedAt: new Date(),
          };
        }
        return session;
      }));

      setIsTyping(false);
    }, 1000);
  }, [activeChatId, chatSessions]);

  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  const pinChat = useCallback((chatId: string) => {
    setChatSessions(prev => prev.map(session => {
      if (session.id === chatId) {
        return { ...session, isPinned: !session.isPinned };
      }
      return session;
    }));
  }, []);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChatSessions(prev => prev.map(session => {
      if (session.id === chatId) {
        return { ...session, title: newTitle };
      }
      return session;
    }));
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(session => session.id !== chatId);
      
      // If we're deleting the active chat, select another one
      if (activeChatId === chatId) {
        const nextChat = filtered[0];
        setActiveChatId(nextChat?.id || null);
      }
      
      return filtered;
    });
  }, [activeChatId]);

  const startRenaming = useCallback((chatId: string) => {
    setIsRenaming(chatId);
  }, []);

  const stopRenaming = useCallback(() => {
    setIsRenaming(null);
  }, []);

  const activeChat = chatSessions.find(session => session.id === activeChatId);
  
  // Sort chats: pinned first, then by update time
  const sortedChatSessions = [...chatSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  // Phase 3: Add disambiguation handlers
  const handleProductSelection = useCallback(async (productOption: ProductOption, originalQuery: string) => {
    try {
      // Create follow-up query with selected product
      const followUpQuery = `Tell me about ${productOption.name}${productOption.company ? ` by ${productOption.company}` : ''}`;
      
      // Send the follow-up query to get specific product information
      sendMessage(followUpQuery);
    } catch (error) {
      console.error('Error handling product selection:', error);
    }
  }, [sendMessage]);

  const handleRefineQuery = useCallback(() => {
    // Simple implementation - could be enhanced with a modal or input field
    const newQuery = window.prompt('Please refine your search query:');
    if (newQuery && newQuery.trim()) {
      sendMessage(newQuery.trim());
    }
  }, [sendMessage]);

  return {
    chatSessions: sortedChatSessions,
    activeChatId,
    activeChat,
    isTyping,
    isRenaming,
    streamingMessageId,
    createNewChat,
    sendMessage,
    selectChat,
    pinChat,
    renameChat,
    deleteChat,
    startRenaming,
    stopRenaming,
    // Phase 3: Export disambiguation handlers
    handleProductSelection,
    handleRefineQuery,
  };
};