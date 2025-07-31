import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { SuggestedQuestions } from './SuggestedQuestions';
import { DisambiguationInterface } from './DisambiguationInterface';
import { Chip } from '../ui/Chip';
import { useQuery } from '@tanstack/react-query';
import { ProductOption, ChatResponse } from '@shared/schema';
import particleVideo from '@assets/Particle Swamy Video_1753892044425.mov';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  citations?: string[];
  tryAskingPrompts?: string[];
  showTryAsking?: boolean;
  showFollowUp?: boolean;
  followUpQuestion?: string;
  followUpChips?: string[];
  followUpResponses?: string[];
  isStreaming?: boolean;
  source?: string;
  ragResponseTime?: number;
  ragContentLength?: number;
  processingTime?: number;
  // Phase 3: Disambiguation support
  responseData?: ChatResponse;
  isDisambiguation?: boolean;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  streamingMessageId?: string | null;
  onSettingsClick?: () => void;
  onHowCanIHelpClick?: () => void;
  showTaskSidebar?: boolean;
  // Phase 3: Disambiguation handlers
  onProductSelect?: (option: ProductOption, originalQuery: string) => void;
  onRefineQuery?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isTyping = false,
  streamingMessageId = null,
  onSettingsClick,
  onHowCanIHelpClick,
  showTaskSidebar = false,
  onProductSelect,
  onRefineQuery,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch opening text from API
  const { data: openingTextSetting } = useQuery({
    queryKey: ['/api/settings', 'opening_text'],
    queryFn: () => fetch('/api/settings/opening_text').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch supporting text from API
  const { data: supportingTextSetting } = useQuery({
    queryKey: ['/api/settings', 'supporting_text'],
    queryFn: () => fetch('/api/settings/supporting_text').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch intro questions from API
  const { data: introQuestionsSetting } = useQuery({
    queryKey: ['/api/settings', 'intro_questions'],
    queryFn: () => fetch('/api/settings/intro_questions').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch try asking enabled setting from API
  const { data: tryAskingEnabledSetting } = useQuery({
    queryKey: ['/api/settings', 'try_asking_enabled'],
    queryFn: () => fetch('/api/settings/try_asking_enabled').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Parse intro questions from settings
  const introQuestionsText = introQuestionsSetting?.value || "What is AF27?\nIs AF27 Stearic Acid an oxidizing agent?";
  const suggestedQuestions = introQuestionsText.split('\n').filter((q: string) => q.trim().length > 0);

  const handleSuggestedQuestion = (question: string) => {
    // Auto-send the suggested question
    onSendMessage(question);
  };

  const handleFollowUpClick = (chipIndex: number, message: Message) => {
    // Get the corresponding response for this chip
    const response = message.followUpResponses?.[chipIndex];
    const chipText = message.followUpChips?.[chipIndex];
    
    if (response && chipText) {
      // Create a special follow-up message identifier
      const followUpMessage = `__FOLLOWUP__${chipIndex}__${message.id}__${chipText}`;
      onSendMessage(followUpMessage);
    }
  };

  // Get the opening text or use default
  const openingText = openingTextSetting?.value || "Hello there. I am here to help you discover new knowledge.";
  const supportingText = supportingTextSetting?.value || "Ask me anything about chemical safety, regulations, or product information.";
  const tryAskingEnabled = tryAskingEnabledSetting?.value === 'true';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col bg-white rounded-[24px] border border-gray-200 overflow-hidden">
      <ChatHeader 
        onSettingsClick={onSettingsClick} 
        hasMessages={messages.length > 0}
        onHowCanIHelpClick={onHowCanIHelpClick}
        showTaskSidebar={showTaskSidebar}
      />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center" style={{
                    fontSize: '14px'
                  }}>
        <div className="w-full max-w-[800px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-[760px]">
              {/* Particle Video */}
              <div className="mb-6 flex justify-center">
                <video
                  src={particleVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-[184px] object-contain"
                  style={{ height: '184px' }}
                />
              </div>
              
              <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-4">
                Hi, I'm Swamy!
              </h2>
              <p className="text-gray-800 mb-6 max-w-[600px]" style={{ fontSize: '13px', lineHeight: '22px' }}>
                I can answer product questions, help you learn more about your customers, suggest strategies to help you position and sell your products more effectively, build call plans and more.
              </p>
              
              {/* Introductory Question Chips */}
              {suggestedQuestions.length > 0 && (
                <div className="mb-8 max-w-[600px]">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        style={{ 
                          fontSize: '13px',
                          borderRadius: '20px',
                          padding: '8px 16px'
                        }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble
                  content={message.content}
                  sender={message.sender}
                  timestamp={message.timestamp}
                  citations={message.citations}
                  tryAskingPrompts={tryAskingEnabled ? message.tryAskingPrompts : undefined}
                  onTryAskingClick={onSendMessage}
                  showFollowUp={message.showFollowUp}
                  followUpQuestion={message.followUpQuestion}
                  followUpChips={message.followUpChips}
                  onFollowUpClick={(chipIndex) => handleFollowUpClick(chipIndex, message)}
                  isStreaming={message.isStreaming || false}
                  source={message.source}
                  ragResponseTime={message.ragResponseTime}
                  ragContentLength={message.ragContentLength}
                  processingTime={message.processingTime}
                />
                {/* Phase 3: Show disambiguation interface after AI messages */}
                {message.sender === 'ai' && message.isDisambiguation && message.responseData?.type === 'disambiguation' && onProductSelect && onRefineQuery && (
                  <div className="mt-4">
                    <DisambiguationInterface
                      disambiguationData={(message.responseData as any).disambiguationData}
                      onProductSelect={(option) => onProductSelect(option, (message.responseData as any).disambiguationData?.originalQuery || '')}
                      onRefineQuery={onRefineQuery}
                    />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <MessageBubble
                content=""
                sender="ai"
                timestamp={new Date()}
                isTyping={true}
              />
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      {messages.length === 0 ? (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[760px]">
            <ChatInput 
              onSendMessage={onSendMessage} 
              disabled={isTyping}
              placeholder="Ask me anything"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[800px]">
            <ChatInput onSendMessage={onSendMessage} disabled={isTyping} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};