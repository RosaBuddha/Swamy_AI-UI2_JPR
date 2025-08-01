import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '../ui/textarea';
import { Modal } from '../ui/Modal';
import { useToast } from '@/hooks/use-toast';
// import { format } from 'date-fns';
import { MessageSquare, Clock, User, Mail, Globe, Monitor, ExternalLink } from 'lucide-react';
import type { Feedback, ConversationSnapshot } from '@shared/schema';

interface FeedbackWithSnapshot extends Feedback {
  conversationSnapshot?: ConversationSnapshot;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  'in-review': 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const typeColors = {
  bug: 'bg-red-100 text-red-800',
  feature: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const FeedbackManager: React.FC = () => {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithSnapshot | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedbackList = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ['/api/feedback'],
    queryFn: () => apiRequest('/api/feedback'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, adminResponse }: { id: number; status: string; adminResponse?: string }) =>
      apiRequest(`/api/feedback/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminResponse }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Feedback status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      setSelectedFeedback(null);
      setAdminResponse('');
      setNewStatus('');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update feedback status.",
        variant: "destructive",
      });
    },
  });

  const loadConversationSnapshot = async (snapshotId: number) => {
    try {
      const snapshot = await apiRequest(`/api/conversation-snapshot/${snapshotId}`);
      setConversationData(snapshot);
    } catch (error) {
      console.error('Failed to load conversation snapshot:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load conversation history.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (feedback: Feedback) => {
    setSelectedFeedback(feedback as FeedbackWithSnapshot);
    setNewStatus(feedback.status || 'new');
    setAdminResponse(feedback.adminResponse || '');
    
    if (feedback.conversationSnapshotId) {
      await loadConversationSnapshot(feedback.conversationSnapshotId);
    } else {
      setConversationData(null);
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedFeedback) return;

    updateStatusMutation.mutate({
      id: selectedFeedback.id,
      status: newStatus,
      adminResponse: adminResponse.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Feedback Management</h3>
        <p className="text-sm text-gray-600 mt-1">
          Review and manage user feedback, bug reports, and feature requests.
        </p>
      </div>

      {feedbackList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h4>
            <p className="text-gray-600">
              User feedback will appear here when submitted through the feedback button.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((feedback) => (
            <Card key={feedback.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={typeColors[feedback.type as keyof typeof typeColors]}>
                        {feedback.type}
                      </Badge>
                      <Badge className={statusColors[feedback.status as keyof typeof statusColors]}>
                        {feedback.status}
                      </Badge>
                      {feedback.priority && feedback.type === 'bug' && (
                        <Badge className={priorityColors[feedback.priority as keyof typeof priorityColors]}>
                          {feedback.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{feedback.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {feedback.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                      {feedback.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {feedback.userEmail}
                        </span>
                      )}
                      {feedback.conversationSnapshotId && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Conversation attached
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(feedback)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <Modal isOpen={true} onClose={() => setSelectedFeedback(null)} title="Feedback Details">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedFeedback.title}
                      <Badge className={typeColors[selectedFeedback.type as keyof typeof typeColors]}>
                        {selectedFeedback.type}
                      </Badge>
                      {selectedFeedback.priority && selectedFeedback.type === 'bug' && (
                        <Badge className={priorityColors[selectedFeedback.priority as keyof typeof priorityColors]}>
                          {selectedFeedback.priority}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Submitted on {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleString() : 'Unknown date'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedFeedback.description}
                    </p>
                  </div>
                </div>

                {/* Contact & Technical Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedFeedback.userEmail && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Contact</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${selectedFeedback.userEmail}`} className="hover:text-blue-600">
                          {selectedFeedback.userEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Technical Info</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {selectedFeedback.appVersion && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          App Version: {selectedFeedback.appVersion}
                        </div>
                      )}
                      {selectedFeedback.currentRoute && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3 h-3" />
                          Page: {selectedFeedback.currentRoute}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conversation Snapshot */}
                {conversationData && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Conversation History ({conversationData.messages?.length || 0} messages)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                        {conversationData.messages?.map((msg: any, index: number) => (
                          <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={msg.sender === 'user' ? 'default' : 'secondary'}>
                                {msg.sender}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 pl-2">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Update Status</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="flex gap-2">
                        {['new', 'in-review', 'resolved', 'closed'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setNewStatus(status)}
                            className={`
                              px-3 py-1 text-xs font-medium rounded border transition-colors
                              ${newStatus === status
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }
                            `}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Response (optional)
                      </label>
                      <Textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Add a response or note about this feedback..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFeedback(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Modal>
      )}
    </div>
  );
};