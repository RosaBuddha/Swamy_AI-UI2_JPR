import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/Chip';
import { Trash2, RefreshCw, Eye, EyeOff, MessageSquare, Brain, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiLogEntry {
  id: string;
  timestamp: number;
  userQuestion: string;
  systemPrompt: string;
  ragContent?: string;
  openaiMessages: any[];
  response: string;
  source: 'mock' | 'openai' | 'openai-rag';
  processingTime: number;
  ragResponseTime?: number;
  ragContentLength?: number;
  disambiguationDetected?: boolean;
  disambiguationContent?: string;
}

export default function ApiLogs() {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [formattedLogs, setFormattedLogs] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch API logs
  const { data: logs = [], isLoading, refetch } = useQuery<ApiLogEntry[]>({
    queryKey: ['/api/logs'],
    queryFn: () => fetch('/api/logs').then(res => res.json()),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
    },
  });

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const toggleFormatted = (logId: string) => {
    const newFormatted = new Set(formattedLogs);
    if (newFormatted.has(logId)) {
      newFormatted.delete(logId);
    } else {
      newFormatted.add(logId);
    }
    setFormattedLogs(newFormatted);
  };

  const renderMessages = (messages: any[], logId: string) => {
    return messages.map((message, index) => {
      const messageKey = `${logId}-message-${index}`;
      const isExpanded = expandedLogs.has(messageKey);
      const isLong = message.content.length > 500;
      
      return (
        <div key={index} className="border-l-4 border-gray-200 pl-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Chip variant={message.role === 'system' ? 'default' : 'suggestion'}>
              {message.role}
            </Chip>
            <span className="text-xs text-gray-500">
              {message.content.length} characters
            </span>
            {isLong && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleExpanded(messageKey)}
                className="text-xs h-6 px-2"
              >
                {isExpanded ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {isLong && !isExpanded 
                ? `${message.content.substring(0, 500)}...` 
                : message.content
              }
            </pre>
          </div>
        </div>
      );
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'mock': return <Database className="h-4 w-4" />;
      case 'openai-rag': return <Brain className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'mock': return 'bg-blue-100 text-blue-800';
      case 'openai-rag': return 'bg-purple-100 text-purple-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Request Logs</h2>
          <p className="text-muted-foreground">Monitor OpenAI API requests and system prompts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {logs.filter(log => log.source === 'openai-rag').length}
            </div>
            <div className="text-sm text-gray-600">RAG Enhanced</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {logs.filter(log => log.source === 'mock').length}
            </div>
            <div className="text-sm text-gray-600">Mock Responses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {logs.filter(log => log.disambiguationDetected).length}
            </div>
            <div className="text-sm text-gray-600">Disambiguation Cases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + log.processingTime, 0) / logs.length) : 0}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Loading logs...</div>
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">No API logs yet. Start a conversation to see logs here.</div>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            return (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getSourceColor(log.source)}`}>
                        {getSourceIcon(log.source)}
                        {log.source}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.processingTime}ms
                      </div>
                      {log.ragResponseTime && (
                        <div className="text-sm text-purple-600">
                          RAG: {log.ragResponseTime}ms
                        </div>
                      )}
                      {log.disambiguationDetected && (
                        <div className="text-sm text-orange-600 font-medium">
                          🔍 Disambiguation Detected
                          {log.disambiguationParsed && ` (${log.disambiguationParsed.optionsCount} options)`}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => toggleExpanded(log.id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{log.userQuestion}</CardTitle>
                    <CardDescription className="mt-2">
                      {log.response.substring(0, 200)}
                      {log.response.length > 200 && '...'}
                    </CardDescription>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t">
                    <div className="space-y-6">
                      {/* Full Prompt - What actually gets sent to OpenAI */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Full Prompt Sent to OpenAI
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(`${log.id}-fullprompt`)}
                            className="text-xs h-6 px-2"
                          >
                            {expandedLogs.has(`${log.id}-fullprompt`) ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                            {expandedLogs.has(`${log.id}-fullprompt`) ? 'Collapse' : 'Expand'}
                          </Button>
                          {expandedLogs.has(`${log.id}-fullprompt`) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFormatted(`${log.id}-fullprompt`)}
                              className="text-xs h-6 px-2"
                            >
                              {formattedLogs.has(`${log.id}-fullprompt`) ? 'Raw' : 'Formatted'}
                            </Button>
                          )}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                          <div className="text-sm text-gray-700">
                            <div className="font-semibold text-blue-800 mb-2">
                              📤 Complete OpenAI API Request ({log.openaiMessages.length} messages)
                            </div>
                            {expandedLogs.has(`${log.id}-fullprompt`) ? (
                              <div className="bg-white border rounded-md">
                                <div className="p-4 border-b bg-gray-50">
                                  <div className="text-sm font-medium text-gray-700">
                                    Complete OpenAI API Request - Messages Array
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formattedLogs.has(`${log.id}-fullprompt`) 
                                      ? 'Human-readable format showing the message flow and content'
                                      : 'This is exactly what gets sent to OpenAI as the messages parameter'
                                    }
                                  </div>
                                </div>
                                <div className="p-4">
                                  {formattedLogs.has(`${log.id}-fullprompt`) ? (
                                    <div className="space-y-4">
                                      {log.openaiMessages.map((message, index) => (
                                        <div key={index} className="border-l-4 border-blue-300 pl-4">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                              message.role === 'system' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                              {message.role.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              Message {index + 1} • {message.content.length} characters
                                            </span>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded text-sm">
                                            <pre className="whitespace-pre-wrap font-mono">
                                              {message.content}
                                            </pre>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <pre className="whitespace-pre-wrap text-xs font-mono text-gray-800 bg-gray-50 p-4 rounded border overflow-x-auto">
                                      {JSON.stringify(log.openaiMessages, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm">
                                <div className="mb-2">Click "Expand" to see the complete prompt structure sent to OpenAI</div>
                                <div className="text-xs text-gray-600">
                                  Preview: {log.openaiMessages.map(m => m.role.toUpperCase()).join(' → ')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Individual Message Analysis */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Message Analysis ({log.openaiMessages.length} parts)
                        </h4>
                        <div className="space-y-4">
                          {renderMessages(log.openaiMessages, log.id)}
                        </div>
                      </div>

                      {/* Disambiguation Detection - Phase 1 Implementation */}
                      {log.disambiguationDetected && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="text-orange-600">🔍</span>
                            Disambiguation Detected - Phase {log.disambiguationParsed ? '2' : '1'} {log.disambiguationParsed ? 'Parsing' : 'Logging'}
                          </h4>
                          <div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
                            <div className="text-sm text-orange-800 mb-2">
                              <strong>Status:</strong> Multiple product matches found in RAG response
                            </div>
                            <div className="text-sm text-orange-700 mb-3">
                              This query triggered the disambiguation signal "There are several product matches for your query."
                              {log.disambiguationParsed ? ' Phase 2 - Structured data parsing implemented.' : ' Currently in Phase 1 - detection and logging only.'}
                            </div>
                            
                            {/* Phase 2: Show parsed product options */}
                            {log.disambiguationParsed && log.disambiguationParsed.options.length > 0 && (
                              <div className="mb-4">
                                <div className="text-xs text-orange-600 font-medium mb-2">
                                  Parsed Product Options ({log.disambiguationParsed.optionsCount}):
                                </div>
                                <div className="bg-white border rounded p-3 max-h-48 overflow-y-auto">
                                  {log.disambiguationParsed.options.map((option, idx) => (
                                    <div key={idx} className="border-b border-gray-100 last:border-b-0 py-2">
                                      <div className="font-medium text-sm text-gray-900">{option.name}</div>
                                      {option.company && (
                                        <div className="text-xs text-gray-600">Company: {option.company}</div>
                                      )}
                                      {option.description && (
                                        <div className="text-xs text-gray-700 mt-1">{option.description}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {log.disambiguationParsed.instructions && (
                                  <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
                                    <strong>Instructions:</strong> {log.disambiguationParsed.instructions}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Raw response preview */}
                            {log.disambiguationContent && (
                              <div>
                                <div className="text-xs text-orange-600 font-medium mb-2">Raw Response Preview:</div>
                                <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                                  {log.disambiguationContent.substring(0, 500)}
                                  {log.disambiguationContent.length > 500 && '...'}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* RAG Content */}
                      {log.ragContent && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              RAG Context ({log.ragContentLength} characters)
                            </h4>
                            {log.ragContent.length > 1000 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExpanded(`${log.id}-rag`)}
                                className="text-xs h-6 px-2"
                              >
                                {expandedLogs.has(`${log.id}-rag`) ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                                {expandedLogs.has(`${log.id}-rag`) ? 'Collapse' : 'Expand'}
                              </Button>
                            )}
                          </div>
                          <div className="bg-purple-50 p-4 rounded-md">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                              {log.ragContent.length > 1000 && !expandedLogs.has(`${log.id}-rag`)
                                ? `${log.ragContent.substring(0, 1000)}...` 
                                : log.ragContent
                              }
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Full Response */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold">Full Response ({log.response.length} characters)</h4>
                          {log.response.length > 1000 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExpanded(`${log.id}-response`)}
                              className="text-xs h-6 px-2"
                            >
                              {expandedLogs.has(`${log.id}-response`) ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              {expandedLogs.has(`${log.id}-response`) ? 'Collapse' : 'Expand'}
                            </Button>
                          )}
                        </div>
                        <div className="bg-green-50 p-4 rounded-md">
                          <div 
                            className="text-sm text-gray-700"
                            dangerouslySetInnerHTML={{ 
                              __html: log.response.length > 1000 && !expandedLogs.has(`${log.id}-response`)
                                ? `${log.response.substring(0, 1000)}...` 
                                : log.response 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}