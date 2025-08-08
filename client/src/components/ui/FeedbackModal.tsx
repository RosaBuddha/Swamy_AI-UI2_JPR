import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from './button';
import { Input } from './Input';
import { Textarea } from './textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/useChat';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userEmail: string;
  conversationHistory: any[];
  sessionInfo: any;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [userEmail, setUserEmail] = useState('');
  const [includeConversation, setIncludeConversation] = useState(true);

  const { toast } = useToast();
  const { activeChat } = useChat();
  const messages = activeChat?.messages || [];

  const submitFeedback = useMutation({
    mutationFn: (data: FeedbackData) => 
      apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it shortly.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error?.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    const conversationHistory = includeConversation ? messages : [];
    const sessionInfo = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };

    submitFeedback.mutate({
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      userEmail: userEmail.trim(),
      conversationHistory,
      sessionInfo,
    });
  };

  const handleClose = () => {
    setType('general');
    setTitle('');
    setDescription('');
    setPriority('medium');
    setUserEmail('');
    setIncludeConversation(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Send Feedback</CardTitle>
              <CardDescription>
                Help us improve by sharing your thoughts, reporting bugs, or suggesting features.
              </CardDescription>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bug', label: 'Bug Report' },
                  { value: 'feature', label: 'Feature Request' },
                  { value: 'general', label: 'General' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value as any)}
                    className={`
                      px-3 py-2 text-xs font-medium rounded-lg border transition-colors
                      ${type === option.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of your feedback..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide details about your feedback..."
                className="min-h-[100px]"
                required
              />
            </div>

            {/* Priority (for bugs) */}
            {type === 'bug' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value as any)}
                      className={`
                        px-2 py-1 text-xs font-medium rounded border transition-colors
                        ${priority === option.value
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com (for follow-up)"
              />
            </div>

            {/* Include Conversation */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeConversation"
                checked={includeConversation}
                onChange={(e) => setIncludeConversation(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includeConversation" className="text-sm text-gray-700">
                Include current conversation ({messages.length} messages)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitFeedback.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitFeedback.isPending || !title.trim() || !description.trim()}
                className="flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitFeedback.isPending ? 'Sending...' : 'Send Feedback'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};