import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Chip } from '../ui/Chip';

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  citations?: string[];
  tryAskingPrompts?: string[];
  onTryAskingClick?: (prompt: string) => void;
  showFollowUp?: boolean;
  followUpQuestion?: string;
  followUpChips?: string[];
  onFollowUpClick?: (chipIndex: number) => void;
  source?: string;
  ragResponseTime?: number;
  ragContentLength?: number;
  processingTime?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  sender,
  timestamp,
  isTyping = false,
  isStreaming = false,
  citations = [],
  tryAskingPrompts = [],
  onTryAskingClick,
  showFollowUp = false,
  followUpQuestion = "",
  followUpChips = [],
  onFollowUpClick,
  source = 'openai',
  ragResponseTime = 0,
  ragContentLength = 0,
  processingTime = 0,
}) => {
  const isUser = sender === 'user';

  // Fetch performance feedback setting
  const { data: performanceFeedbackSetting } = useQuery({
    queryKey: ['/api/settings', 'performance_feedback_enabled'],
    queryFn: () => fetch('/api/settings/performance_feedback_enabled').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const showPerformanceFeedback = performanceFeedbackSetting?.value === 'true';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[70%]">
          <div className="bg-gray-200 px-4 py-3" style={{ borderRadius: '16px' }}>
            <p className="text-sm" style={{ color: '#222c2e' }}>{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {isTyping ? (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <div className="max-w-none">
          <div className="leading-relaxed" style={{ color: '#222c2e' }}>
            <div 
              className="mb-4 prose prose-sm max-w-none chat-content"
              style={{ 
                display: 'block',
                width: '100%',
                overflow: 'visible'
              }}
              dangerouslySetInnerHTML={{ 
                __html: content?.includes('<') ? content : (content || '').replace(/\n/g, '<br />') 
              }}>
            </div>
            
            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-xs text-gray-400">Generating response...</span>
              </div>
            )}
            
            {/* RAG Metadata Display - Only show if performance feedback is enabled */}
            {showPerformanceFeedback && source && source !== 'openai' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">📊</span>
                  </div>
                  <span className="text-sm font-medium text-blue-800">
                    {source === 'openai-rag' ? 'Enhanced with Product Knowledge' : 
                     source === 'mock' ? 'Configured Response' : 
                     'Response Source'}
                  </span>
                </div>
                <div className="text-xs text-blue-600 space-y-1">
                  {source === 'openai-rag' && (
                    <>
                      <div>Knowledge search: {ragResponseTime}ms</div>
                      <div>Context used: {ragContentLength > 0 ? `${ragContentLength} characters` : 'None'}</div>
                    </>
                  )}
                  {processingTime > 0 && (
                    <div>Total processing: {processingTime}ms</div>
                  )}
                </div>
              </div>
            )}

            {citations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2 font-[Inter]">Citations</h4>
                <div className="space-y-1">
                  {citations.map((citation, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs">📄</span>
                      </div>
                      <span>{citation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {tryAskingPrompts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-black mb-2 font-[Inter]">Try asking</h4>
                <div className="flex flex-wrap gap-2">
                  {tryAskingPrompts.map((prompt, index) => (
                    <Chip
                      key={index}
                      onClick={() => onTryAskingClick?.(prompt)}
                      variant="suggestion"
                    >
                      {prompt}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            
            {showFollowUp && followUpQuestion && followUpChips.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-black mb-2 pt-3 font-[Inter]">{followUpQuestion}</h4>
                <div className="flex flex-wrap gap-2">
                  {followUpChips.map((chip, index) => (
                    <Chip
                      key={index}
                      onClick={() => onFollowUpClick?.(index)}
                      variant="suggestion"
                    >
                      {chip}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};