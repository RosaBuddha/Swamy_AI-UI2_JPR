import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, X, Copy, CheckCircle, Upload } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Modal } from '../ui/Modal';
import { RichTextEditor } from '../ui/RichTextEditor';
import { RagTest } from './RagTest';
import ApiLogs from './ApiLogs';
import type { MockResponse } from '@shared/schema';
import { FollowUpChipForm } from './FollowUpChipForm';
import { ObjectUploader } from '../ObjectUploader';
import { VersionDisplay } from '../ui/VersionDisplay';
import { FeedbackManager } from './FeedbackManager';
import type { UploadResult } from '@uppy/core';

interface AdminPageProps {
  onBack: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'responses' | 'system' | 'rag' | 'logs' | 'personalize' | 'version' | 'feedback'>('home');
  const [openingText, setOpeningText] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [introQuestions, setIntroQuestions] = useState('');
  const [isAddingMockResponse, setIsAddingMockResponse] = useState(false);
  const [editingMockResponse, setEditingMockResponse] = useState<MockResponse | null>(null);
  const [newMockQuestion, setNewMockQuestion] = useState('');
  const [newMockResponse, setNewMockResponse] = useState('');
  const [showTryAsking, setShowTryAsking] = useState(false);
  const [tryAskingPrompts, setTryAskingPrompts] = useState<string[]>([]);
  const [newTryAskingPrompt, setNewTryAskingPrompt] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const [followUpResponses, setFollowUpResponses] = useState<string[]>([]);
  const [followUpResponseTypes, setFollowUpResponseTypes] = useState<string[]>([]);
  const [followUpLinkedResponseIds, setFollowUpLinkedResponseIds] = useState<number[]>([]);
  const [newFollowUpChip, setNewFollowUpChip] = useState('');
  const [newFollowUpResponse, setNewFollowUpResponse] = useState('');
  const [newFollowUpResponseType, setNewFollowUpResponseType] = useState<'custom' | 'existing'>('custom');
  const [newFollowUpLinkedResponseId, setNewFollowUpLinkedResponseId] = useState<number | null>(null);
  const [useRichTextForIntro, setUseRichTextForIntro] = useState(false);
  const [useRichTextForSupporting, setUseRichTextForSupporting] = useState(false);
  const [useRichTextForQuestions, setUseRichTextForQuestions] = useState(false);
  const [tryAskingEnabled, setTryAskingEnabled] = useState(true);
  const [performanceFeedbackEnabled, setPerformanceFeedbackEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Personalization settings
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Mock responses pagination and search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Copy state tracking
  const [copiedQuestions, setCopiedQuestions] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current opening text
  const { data: openingTextSetting, isLoading: isLoadingOpening } = useQuery({
    queryKey: ['/api/settings', 'opening_text'],
    queryFn: () => fetch('/api/settings/opening_text').then(res => res.json())
  });

  // Fetch current supporting text
  const { data: supportingTextSetting, isLoading: isLoadingSupporting } = useQuery({
    queryKey: ['/api/settings', 'supporting_text'],
    queryFn: () => fetch('/api/settings/supporting_text').then(res => res.json())
  });

  // Fetch current intro questions
  const { data: introQuestionsSetting, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/settings', 'intro_questions'],
    queryFn: () => fetch('/api/settings/intro_questions').then(res => res.json())
  });

  // Fetch try asking enabled setting
  const { data: tryAskingEnabledSetting, isLoading: isLoadingTryAskingEnabled } = useQuery({
    queryKey: ['/api/settings', 'try_asking_enabled'],
    queryFn: () => fetch('/api/settings/try_asking_enabled').then(res => res.json())
  });

  // Fetch performance feedback enabled setting
  const { data: performanceFeedbackEnabledSetting, isLoading: isLoadingPerformanceFeedbackEnabled } = useQuery({
    queryKey: ['/api/settings', 'performance_feedback_enabled'],
    queryFn: () => fetch('/api/settings/performance_feedback_enabled').then(res => res.json())
  });

  // Fetch system prompt setting
  const { data: systemPromptSetting, isLoading: isLoadingSystemPrompt } = useQuery({
    queryKey: ['/api/settings', 'system_prompt'],
    queryFn: () => fetch('/api/settings/system_prompt').then(res => res.json())
  });

  // Fetch mock responses
  const { data: mockResponses, isLoading: isLoadingMockResponses } = useQuery({
    queryKey: ['/api/mock-responses'],
    queryFn: () => fetch('/api/mock-responses').then(res => res.json())
  });

  // Fetch personalization settings
  const { data: companyNameSetting, isLoading: isLoadingCompanyName } = useQuery({
    queryKey: ['/api/settings', 'company_name'],
    queryFn: () => fetch('/api/settings/company_name').then(res => res.json())
  });

  const { data: userNameSetting, isLoading: isLoadingUserName } = useQuery({
    queryKey: ['/api/settings', 'user_name'],
    queryFn: () => fetch('/api/settings/user_name').then(res => res.json())
  });

  const { data: logoUrlSetting, isLoading: isLoadingLogoUrl } = useQuery({
    queryKey: ['/api/settings', 'logo_url'],
    queryFn: () => fetch('/api/settings/logo_url').then(res => res.json())
  });

  // Update opening text mutation
  const updateOpeningTextMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/opening_text', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'opening_text'] });
      toast({
        title: "Success",
        description: "Opening text updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update opening text",
        variant: "destructive",
      });
    },
  });

  // Update supporting text mutation
  const updateSupportingTextMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/supporting_text', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'supporting_text'] });
      toast({
        title: "Success",
        description: "Supporting text updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update supporting text",
        variant: "destructive",
      });
    },
  });

  // Update intro questions mutation
  const updateIntroQuestionsMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/intro_questions', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'intro_questions'] });
      toast({
        title: "Success",
        description: "Intro questions updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update intro questions",
        variant: "destructive",
      });
    },
  });

  // Update try asking enabled mutation
  const updateTryAskingEnabledMutation = useMutation({
    mutationFn: (value: boolean) => 
      apiRequest('/api/settings/try_asking_enabled', {
        method: 'PUT',
        body: JSON.stringify({ value: value.toString() }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'try_asking_enabled'] });
      toast({
        title: "Success",
        description: "Try asking suggestions setting updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update try asking suggestions setting",
        variant: "destructive",
      });
    },
  });

  // Update performance feedback enabled mutation
  const updatePerformanceFeedbackEnabledMutation = useMutation({
    mutationFn: (value: boolean) => 
      apiRequest('/api/settings/performance_feedback_enabled', {
        method: 'PUT',
        body: JSON.stringify({ value: value.toString() }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'performance_feedback_enabled'] });
      toast({
        title: "Success",
        description: "Performance feedback setting updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update performance feedback setting",
        variant: "destructive",
      });
    },
  });

  // Update system prompt mutation
  const updateSystemPromptMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/system_prompt', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'system_prompt'] });
      toast({
        title: "Success",
        description: "System prompt updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update system prompt",
        variant: "destructive",
      });
    },
  });

  // Update company name mutation
  const updateCompanyNameMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/company_name', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'company_name'] });
      toast({
        title: "Success",
        description: "Company name updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company name",
        variant: "destructive",
      });
    },
  });

  // Update user name mutation
  const updateUserNameMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/user_name', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'user_name'] });
      toast({
        title: "Success",
        description: "User name updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user name",
        variant: "destructive",
      });
    },
  });

  // Update logo URL mutation
  const updateLogoUrlMutation = useMutation({
    mutationFn: (value: string) => 
      apiRequest('/api/settings/logo_url', {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', 'logo_url'] });
      toast({
        title: "Success",
        description: "Logo URL updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update logo URL",
        variant: "destructive",
      });
    },
  });

  // Create mock response mutation
  const createMockResponseMutation = useMutation({
    mutationFn: (data: { question: string; response: string; showTryAsking?: boolean; tryAskingPrompts?: string[]; showFollowUp?: boolean; followUpQuestion?: string; followUpChips?: string[]; followUpResponses?: string[]; followUpResponseTypes?: string[]; followUpLinkedResponseIds?: number[] }) => 
      apiRequest('/api/mock-responses', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mock-responses'] });
      setIsAddingMockResponse(false);
      setNewMockQuestion('');
      setNewMockResponse('');
      setShowTryAsking(false);
      setTryAskingPrompts([]);
      setShowFollowUp(false);
      setFollowUpQuestion('');
      setFollowUpChips([]);
      setFollowUpResponses([]);
      setFollowUpResponseTypes([]);
      setFollowUpLinkedResponseIds([]);
      setNewFollowUpChip('');
      setNewFollowUpResponse('');
      setNewFollowUpResponseType('custom');
      setNewFollowUpLinkedResponseId(null);
      toast({
        title: "Success",
        description: "Mock response created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mock response",
        variant: "destructive",
      });
    },
  });

  // Update mock response mutation
  const updateMockResponseMutation = useMutation({
    mutationFn: (data: { id: number; question: string; response: string; showTryAsking?: boolean; tryAskingPrompts?: string[]; showFollowUp?: boolean; followUpQuestion?: string; followUpChips?: string[]; followUpResponses?: string[]; followUpResponseTypes?: string[]; followUpLinkedResponseIds?: number[] }) => 
      apiRequest(`/api/mock-responses/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          question: data.question, 
          response: data.response, 
          showTryAsking: data.showTryAsking,
          tryAskingPrompts: data.tryAskingPrompts,
          showFollowUp: data.showFollowUp,
          followUpQuestion: data.followUpQuestion,
          followUpChips: data.followUpChips,
          followUpResponses: data.followUpResponses,
          followUpResponseTypes: data.followUpResponseTypes,
          followUpLinkedResponseIds: data.followUpLinkedResponseIds
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mock-responses'] });
      setEditingMockResponse(null);
      setNewMockQuestion('');
      setNewMockResponse('');
      setShowTryAsking(false);
      setTryAskingPrompts([]);
      setShowFollowUp(false);
      setFollowUpQuestion('');
      setFollowUpChips([]);
      setFollowUpResponses([]);
      setFollowUpResponseTypes([]);
      setFollowUpLinkedResponseIds([]);
      setNewFollowUpChip('');
      setNewFollowUpResponse('');
      setNewFollowUpResponseType('custom');
      setNewFollowUpLinkedResponseId(null);
      toast({
        title: "Success",
        description: "Mock response updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update mock response",
        variant: "destructive",
      });
    },
  });

  // Delete mock response mutation
  const deleteMockResponseMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/mock-responses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mock-responses'] });
      toast({
        title: "Success",
        description: "Mock response deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete mock response",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (openingTextSetting?.value) {
      setOpeningText(openingTextSetting.value);
    }
  }, [openingTextSetting]);

  useEffect(() => {
    if (supportingTextSetting?.value) {
      setSupportingText(supportingTextSetting.value);
    }
  }, [supportingTextSetting]);

  useEffect(() => {
    if (introQuestionsSetting?.value) {
      setIntroQuestions(introQuestionsSetting.value);
    }
  }, [introQuestionsSetting]);

  useEffect(() => {
    if (tryAskingEnabledSetting?.value) {
      setTryAskingEnabled(tryAskingEnabledSetting.value === 'true');
    }
  }, [tryAskingEnabledSetting]);

  useEffect(() => {
    if (performanceFeedbackEnabledSetting?.value) {
      setPerformanceFeedbackEnabled(performanceFeedbackEnabledSetting.value === 'true');
    }
  }, [performanceFeedbackEnabledSetting]);

  useEffect(() => {
    if (systemPromptSetting?.value) {
      setSystemPrompt(systemPromptSetting.value);
    }
  }, [systemPromptSetting]);

  useEffect(() => {
    if (companyNameSetting?.value) {
      setCompanyName(companyNameSetting.value);
    }
  }, [companyNameSetting]);

  useEffect(() => {
    if (userNameSetting?.value) {
      setUserName(userNameSetting.value);
    }
  }, [userNameSetting]);

  useEffect(() => {
    if (logoUrlSetting?.value) {
      setLogoUrl(logoUrlSetting.value);
    }
  }, [logoUrlSetting]);

  useEffect(() => {
    if (editingMockResponse) {
      setNewMockQuestion(editingMockResponse.question);
      setNewMockResponse(editingMockResponse.response);
    }
  }, [editingMockResponse]);

  const handleSaveOpening = () => {
    updateOpeningTextMutation.mutate(openingText);
  };

  const handleSaveSupporting = () => {
    updateSupportingTextMutation.mutate(supportingText);
  };

  const handleSaveQuestions = () => {
    updateIntroQuestionsMutation.mutate(introQuestions);
  };

  const handleSaveTryAskingEnabled = () => {
    updateTryAskingEnabledMutation.mutate(tryAskingEnabled);
  };

  const handleSavePerformanceFeedbackEnabled = () => {
    updatePerformanceFeedbackEnabledMutation.mutate(performanceFeedbackEnabled);
  };

  const handleSaveSystemPrompt = () => {
    updateSystemPromptMutation.mutate(systemPrompt);
  };

  const handleSaveCompanyName = () => {
    updateCompanyNameMutation.mutate(companyName);
  };

  const handleSaveUserName = () => {
    updateUserNameMutation.mutate(userName);
  };

  const handleSaveLogoUrl = () => {
    updateLogoUrlMutation.mutate(logoUrl);
  };

  // Logo upload handlers
  const handleGetLogoUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      toast({
        title: "Upload Error",
        description: "Failed to prepare file upload. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogoUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const uploadURL = uploadedFile.uploadURL;
        
        // Update the logo setting with the uploaded file URL
        const response = await fetch('/api/logo-upload', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logoImageURL: uploadURL,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save logo');
        }

        const data = await response.json();
        
        // Update local state and refresh queries
        setLogoUrl(data.objectPath);
        queryClient.invalidateQueries({ queryKey: ['/api/settings', 'logo_url'] });
        
        toast({
          title: "Logo Updated",
          description: "Your company logo has been uploaded and saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error completing logo upload:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error saving your logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateMockResponse = () => {
    const trimmedQuestion = newMockQuestion.trim();
    const trimmedResponse = newMockResponse.trim();

    if (trimmedQuestion && trimmedResponse && trimmedResponse !== '<p></p>') {
      createMockResponseMutation.mutate({
        question: trimmedQuestion,
        response: trimmedResponse,
        showTryAsking,
        tryAskingPrompts: showTryAsking ? tryAskingPrompts : [],
        showFollowUp,
        followUpQuestion: showFollowUp ? followUpQuestion.trim() : '',
        followUpChips: showFollowUp ? followUpChips : [],
        followUpResponses: showFollowUp ? followUpResponses : [],
        followUpResponseTypes: showFollowUp ? followUpResponseTypes : [],
        followUpLinkedResponseIds: showFollowUp ? followUpLinkedResponseIds : [],
      });
    }
  };

  const handleUpdateMockResponse = () => {
    const trimmedQuestion = newMockQuestion.trim();
    const trimmedResponse = newMockResponse.trim();

    if (editingMockResponse && trimmedQuestion && trimmedResponse && trimmedResponse !== '<p></p>') {
      updateMockResponseMutation.mutate({
        id: editingMockResponse.id,
        question: trimmedQuestion,
        response: trimmedResponse,
        showTryAsking,
        tryAskingPrompts: showTryAsking ? tryAskingPrompts : [],
        showFollowUp,
        followUpQuestion: showFollowUp ? followUpQuestion.trim() : '',
        followUpChips: showFollowUp ? followUpChips : [],
        followUpResponses: showFollowUp ? followUpResponses : [],
        followUpResponseTypes: showFollowUp ? followUpResponseTypes : [],
        followUpLinkedResponseIds: showFollowUp ? followUpLinkedResponseIds : [],
      });
    }
  };

  const handleDeleteMockResponse = (id: number) => {
    deleteMockResponseMutation.mutate(id);
  };

  const handleEditMockResponse = (mockResponse: MockResponse) => {
    setEditingMockResponse(mockResponse);
    setNewMockQuestion(mockResponse.question);
    setNewMockResponse(mockResponse.response);
    setShowTryAsking(mockResponse.showTryAsking || false);
    setTryAskingPrompts(mockResponse.tryAskingPrompts || []);
    setShowFollowUp(mockResponse.showFollowUp || false);
    setFollowUpQuestion(mockResponse.followUpQuestion || '');
    setFollowUpChips(mockResponse.followUpChips || []);
    setFollowUpResponses(mockResponse.followUpResponses || []);
    setFollowUpResponseTypes(mockResponse.followUpResponseTypes || []);
    setFollowUpLinkedResponseIds(mockResponse.followUpLinkedResponseIds || []);
  };

  const handleCancelEdit = () => {
    setEditingMockResponse(null);
    setNewMockQuestion('');
    setNewMockResponse('');
    setShowTryAsking(false);
    setTryAskingPrompts([]);
    setShowFollowUp(false);
    setFollowUpQuestion('');
    setFollowUpChips([]);
    setFollowUpResponses([]);
    setFollowUpResponseTypes([]);
    setFollowUpLinkedResponseIds([]);
    setNewFollowUpChip('');
    setNewFollowUpResponse('');
    setNewFollowUpResponseType('custom');
    setNewFollowUpLinkedResponseId(null);
  };

  const handleAddTryAskingPrompt = () => {
    const trimmedPrompt = newTryAskingPrompt.trim();
    if (trimmedPrompt && tryAskingPrompts.length < 5 && !tryAskingPrompts.includes(trimmedPrompt)) {
      setTryAskingPrompts([...tryAskingPrompts, trimmedPrompt]);
      setNewTryAskingPrompt('');
    }
  };

  const handleRemoveTryAskingPrompt = (index: number) => {
    const newPrompts = tryAskingPrompts.filter((_, i) => i !== index);
    setTryAskingPrompts(newPrompts);
  };

  const handleAddFollowUpChip = () => {
    const trimmedChip = newFollowUpChip.trim();
    
    // Validate based on response type
    let isValid = false;
    if (newFollowUpResponseType === 'custom') {
      const trimmedResponse = newFollowUpResponse.trim();
      isValid = Boolean(trimmedChip && trimmedResponse && trimmedResponse !== '<p></p>');
    } else if (newFollowUpResponseType === 'existing') {
      isValid = Boolean(trimmedChip && newFollowUpLinkedResponseId !== null);
    }

    if (isValid && followUpChips.length < 5 && !followUpChips.includes(trimmedChip)) {
      setFollowUpChips([...followUpChips, trimmedChip]);
      setFollowUpResponseTypes([...followUpResponseTypes, newFollowUpResponseType]);
      
      if (newFollowUpResponseType === 'custom') {
        setFollowUpResponses([...followUpResponses, newFollowUpResponse.trim()]);
        setFollowUpLinkedResponseIds([...followUpLinkedResponseIds, 0]); // 0 for custom responses
      } else {
        setFollowUpResponses([...followUpResponses, '']); // Empty for existing responses
        setFollowUpLinkedResponseIds([...followUpLinkedResponseIds, newFollowUpLinkedResponseId!]);
      }
      
      setNewFollowUpChip('');
      setNewFollowUpResponse('');
      setNewFollowUpResponseType('custom');
      setNewFollowUpLinkedResponseId(null);
    }
  };

  const handleRemoveFollowUpChip = (index: number) => {
    const newChips = followUpChips.filter((_, i) => i !== index);
    const newResponses = followUpResponses.filter((_, i) => i !== index);
    const newResponseTypes = followUpResponseTypes.filter((_, i) => i !== index);
    const newLinkedResponseIds = followUpLinkedResponseIds.filter((_, i) => i !== index);
    
    setFollowUpChips(newChips);
    setFollowUpResponses(newResponses);
    setFollowUpResponseTypes(newResponseTypes);
    setFollowUpLinkedResponseIds(newLinkedResponseIds);
  };

  const handleCancelAdd = () => {
    setIsAddingMockResponse(false);
    setNewMockQuestion('');
    setNewMockResponse('');
    setShowTryAsking(false);
    setTryAskingPrompts([]);
    setShowFollowUp(false);
    setFollowUpQuestion('');
    setFollowUpChips([]);
    setFollowUpResponses([]);
    setFollowUpResponseTypes([]);
    setFollowUpLinkedResponseIds([]);
    setNewFollowUpChip('');
    setNewFollowUpResponse('');
    setNewFollowUpResponseType('custom');
    setNewFollowUpLinkedResponseId(null);
  };

  // Copy question to clipboard
  const handleCopyQuestion = async (question: string, mockResponseId: number) => {
    try {
      await navigator.clipboard.writeText(question);

      // Add visual feedback
      setCopiedQuestions(prev => new Set(prev).add(mockResponseId));

      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(mockResponseId);
          return newSet;
        });
      }, 2000);

      toast({
        title: "Copied!",
        description: "Question copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = question;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');

        // Add visual feedback for fallback too
        setCopiedQuestions(prev => new Set(prev).add(mockResponseId));

        // Reset after 2 seconds
        setTimeout(() => {
          setCopiedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(mockResponseId);
            return newSet;
          });
        }, 2000);

        toast({
          title: "Copied!",
          description: "Question copied to clipboard",
        });
      } catch (fallbackErr) {
        toast({
          title: "Error",
          description: "Failed to copy question to clipboard",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  // Filter and paginate mock responses
  const filteredMockResponses = mockResponses?.filter((mockResponse: MockResponse) =>
    mockResponse.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mockResponse.response.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredMockResponses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMockResponses = filteredMockResponses.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoadingOpening || isLoadingSupporting || isLoadingQuestions || isLoadingMockResponses) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Function to truncate response text
  const truncateResponse = (text: string, maxLength: number = 100) => {
    // Strip HTML tags for display
    const stripped = text.replace(/<[^>]*>/g, '');
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>
        <h1 className="text-2xl font-bold" style={{ color: '#222c2e' }}>Admin Settings</h1>

        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'home'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Home Screen
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mock Responses
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Prompt
            </button>
            <button
              onClick={() => setActiveTab('rag')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rag'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              RAG Test
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Logs
            </button>
            <button
              onClick={() => setActiveTab('personalize')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personalize'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Personalize
            </button>
            <button
              onClick={() => setActiveTab('version')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'version'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Version
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Feedback
            </button>
          </nav>
        </div>
      </div>
      {/* Home Screen Tab */}
      {activeTab === 'home' && (
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Intro Text</CardTitle>
            <CardDescription>
              This text appears as the main headline when users start a new chat. You can use this to set the tone and provide initial guidance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={openingText}
              onChange={(e) => setOpeningText(e.target.value)}
              placeholder="Enter the opening text that users will see..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveOpening}
                disabled={updateOpeningTextMutation.isPending}
              >
                {updateOpeningTextMutation.isPending ? 'Saving...' : 'Save Intro Text'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supporting Text</CardTitle>
            <CardDescription>
              This text appears below the opening text to provide additional context or instructions for users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={supportingText}
              onChange={(e) => setSupportingText(e.target.value)}
              placeholder="Enter the supporting text that appears below the opening text..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSupporting}
                disabled={updateSupportingTextMutation.isPending}
              >
                {updateSupportingTextMutation.isPending ? 'Saving...' : 'Save Supporting Text'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Introductory Questions</CardTitle>
            <CardDescription>
              These are the suggested questions that appear as buttons when users start a new chat. Enter each question on a separate line.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={introQuestions}
              onChange={(e) => setIntroQuestions(e.target.value)}
              placeholder="Enter each question on a separate line..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveQuestions}
                disabled={updateIntroQuestionsMutation.isPending}
              >
                {updateIntroQuestionsMutation.isPending ? 'Saving...' : 'Save Questions'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Try Asking Suggestions</CardTitle>
            <CardDescription>
              Controls whether "Try asking" suggestions appear in the chat interface. When enabled, users see suggested questions after AI responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Show Try Asking Suggestions
                </label>
                <p className="text-xs text-gray-500">
                  Enable or disable "Try asking" suggestions globally
                </p>
              </div>
              <Switch
                checked={tryAskingEnabled}
                onCheckedChange={setTryAskingEnabled}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveTryAskingEnabled}
                disabled={updateTryAskingEnabledMutation.isPending}
              >
                {updateTryAskingEnabledMutation.isPending ? 'Saving...' : 'Save Setting'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Feedback</CardTitle>
            <CardDescription>
              Controls whether performance feedback banners appear below chat responses. These blue banners show information like response source, processing time, and knowledge search details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">
                  Show Performance Feedback
                </label>
                <p className="text-xs text-gray-500">
                  Enable or disable performance feedback banners in chat responses
                </p>
              </div>
              <Switch
                checked={performanceFeedbackEnabled}
                onCheckedChange={setPerformanceFeedbackEnabled}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSavePerformanceFeedbackEnabled}
                disabled={updatePerformanceFeedbackEnabledMutation.isPending}
              >
                {updatePerformanceFeedbackEnabledMutation.isPending ? 'Saving...' : 'Save Setting'}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
      {/* Mock Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mock Responses</h2>
              <p className="text-sm text-gray-600">Configure automatic responses for specific questions.</p>
            </div>
            <Button
              onClick={() => setIsAddingMockResponse(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Mock Response
            </Button>
          </div>

          {/* Search and Stats */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions or responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredMockResponses.length} of {mockResponses?.length || 0} responses
            </div>
          </div>

          {/* Mock Responses Table */}
          {paginatedMockResponses && paginatedMockResponses.length > 0 ? (
            <div className="bg-white border rounded-lg overflow-hidden p-0" style={{ overflow: 'hidden' }}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMockResponses.map((mockResponse: MockResponse) => (
                    <tr key={mockResponse.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div 
                          className={`text-sm font-medium max-w-xs cursor-pointer transition-all duration-200 rounded px-2 py-1 -mx-2 -my-1 relative group line-clamp-2 ${
                            copiedQuestions.has(mockResponse.id)
                              ? 'text-green-700 bg-green-100' 
                              : 'text-gray-900 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          onClick={() => handleCopyQuestion(mockResponse.question, mockResponse.id)}
                          title={copiedQuestions.has(mockResponse.id) ? "Copied!" : "Click to copy question"}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {mockResponse.question}
                          {copiedQuestions.has(mockResponse.id) ? (
                            <CheckCircle className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-green-600 animate-in zoom-in duration-200" />
                          ) : (
                            <Copy className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-lg">
                          {truncateResponse(mockResponse.response, 150)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {mockResponse.updatedAt 
                            ? new Date(mockResponse.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMockResponse(mockResponse)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMockResponse(mockResponse.id)}
                            disabled={deleteMockResponseMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : mockResponses && mockResponses.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              No mock responses match your search. Try different keywords or clear the search.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No mock responses configured yet. Click "Add Mock Response" to create your first one.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMockResponses.length)} of {filteredMockResponses.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Add Mock Response Modal */}
      <Modal
        isOpen={isAddingMockResponse}
        onClose={handleCancelAdd}
        title="Add Mock Response"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <Input
              value={newMockQuestion}
              onChange={(e) => setNewMockQuestion(e.target.value)}
              placeholder="Enter the exact question users will ask..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response
            </label>
            <RichTextEditor
              value={newMockResponse}
              onChange={setNewMockResponse}
              placeholder="Enter the response the chatbot should give..."
              className="w-full"
            />
          </div>

          {/* Try Asking Prompts Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Try Asking Suggestions
              </label>
              <Switch
                checked={showTryAsking}                onCheckedChange={setShowTryAsking}
              />
            </div>

            {showTryAsking && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Add up to 5 custom prompts that will appear as "Try asking" suggestions with this response.
                </p>

                {/* Input for new prompt */}
                <div className="flex gap-2">
                  <Input
                    value={newTryAskingPrompt}
                    onChange={(e) => setNewTryAskingPrompt(e.target.value)}
                    placeholder="Enter a suggestion..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTryAskingPrompt();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTryAskingPrompt}
                    disabled={!newTryAskingPrompt.trim() || tryAskingPrompts.length >= 5}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {/* Display current prompts */}
                {tryAskingPrompts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      Current suggestions ({tryAskingPrompts.length}/5):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tryAskingPrompts.map((prompt, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
                        >
                          <span>{prompt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTryAskingPrompt(index)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-up Question Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Follow up question
              </label>
              <Switch
                checked={showFollowUp}
                onCheckedChange={setShowFollowUp}
              />
            </div>

            {showFollowUp && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Configure a follow-up question with custom chips and responses for each chip.
                </p>

                {/* Follow-up question input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <Input
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="Would you like more details on a specified oxidizer?"
                    className="w-full"
                  />
                </div>

                {/* Add chip and response */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Add chip and response
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chip text
                    </label>
                    <Input
                      value={newFollowUpChip}
                      onChange={(e) => setNewFollowUpChip(e.target.value)}
                      placeholder="Chip text (e.g., 'Yes')"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response for this chip
                    </label>
                    {/* Response type selection */}
                    <div className="mb-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responseType"
                            value="custom"
                            checked={newFollowUpResponseType === 'custom'}
                            onChange={(e) => setNewFollowUpResponseType(e.target.value as 'custom' | 'existing')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Custom Response</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responseType"
                            value="existing"
                            checked={newFollowUpResponseType === 'existing'}
                            onChange={(e) => setNewFollowUpResponseType(e.target.value as 'custom' | 'existing')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Existing Response</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Response content based on type */}
                    {newFollowUpResponseType === 'custom' ? (
                      <RichTextEditor
                        value={newFollowUpResponse}
                        onChange={setNewFollowUpResponse}
                        placeholder="Enter the response when this chip is clicked..."
                        className="w-full"
                      />
                    ) : (
                      <div>
                        <select
                          value={newFollowUpLinkedResponseId || ''}
                          onChange={(e) => setNewFollowUpLinkedResponseId(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an existing response...</option>
                          {mockResponses?.map((response: any) => (
                            <option key={response.id} value={response.id}>
                              {response.question.length > 50 ? response.question.substring(0, 50) + '...' : response.question}
                            </option>
                          ))}
                        </select>
                        {newFollowUpLinkedResponseId && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border">
                            <div className="text-xs text-gray-600">Preview:</div>
                            <div className="text-sm mt-1">
                              {(() => {
                                const linkedResponse = mockResponses?.find((r: any) => r.id === newFollowUpLinkedResponseId);
                                if (linkedResponse) {
                                  const preview = linkedResponse.response.replace(/<[^>]*>/g, '');
                                  return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
                                }
                                return 'Response not found';
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddFollowUpChip}
                    disabled={
                      !newFollowUpChip.trim() || 
                      (newFollowUpResponseType === 'custom' && (!newFollowUpResponse.trim() || newFollowUpResponse.trim() === '<p></p>')) ||
                      (newFollowUpResponseType === 'existing' && !newFollowUpLinkedResponseId) ||
                      followUpChips.length >= 5
                    }
                    size="sm"
                  >
                    Add Chip
                  </Button>
                </div>

                {/* Display current chips */}
                {followUpChips.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      Current chips ({followUpChips.length}/5):
                    </div>
                    <div className="space-y-2">
                      {followUpChips.map((chip, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{chip}</div>
                            <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ 
                              __html: followUpResponseTypes[index] === 'existing' 
                                ? `<span class="text-blue-600 font-medium">Linked to: ${mockResponses?.find((r: MockResponse) => r.id === followUpLinkedResponseIds[index])?.question || 'Response not found'}</span>`
                                : followUpResponses[index] 
                            }} />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFollowUpChip(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancelAdd}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMockResponse}
              disabled={createMockResponseMutation.isPending || !newMockQuestion.trim() || !newMockResponse.trim() || newMockResponse.trim() === '<p></p>'}
            >
              {createMockResponseMutation.isPending ? 'Creating...' : 'Create Mock Response'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Edit Mock Response Modal */}
      <Modal
        isOpen={!!editingMockResponse}
        onClose={handleCancelEdit}
        title="Edit Mock Response"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <Input
              value={newMockQuestion}
              onChange={(e) => setNewMockQuestion(e.target.value)}
              placeholder="Enter the exact question users will ask..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response
            </label>
            <RichTextEditor
              value={newMockResponse}
              onChange={setNewMockResponse}
              placeholder="Enter the response the chatbot should give..."
              className="w-full"
            />
          </div>

          {/* Try Asking Prompts Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Try Asking Suggestions
              </label>
              <Switch
                checked={showTryAsking}
                onCheckedChange={setShowTryAsking}
              />
            </div>

            {showTryAsking && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Add up to 5 custom prompts that will appear as "Try asking" suggestions with this response.
                </p>

                {/* Input for new prompt */}
                <div className="flex gap-2">
                  <Input
                    value={newTryAskingPrompt}
                    onChange={(e) => setNewTryAskingPrompt(e.target.value)}
                    placeholder="Enter a suggestion..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTryAskingPrompt();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTryAskingPrompt}
                    disabled={!newTryAskingPrompt.trim() || tryAskingPrompts.length >= 5}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {/* Display current prompts */}
                {tryAskingPrompts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      Current suggestions ({tryAskingPrompts.length}/5):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tryAskingPrompts.map((prompt, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
                        >
                          <span>{prompt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTryAskingPrompt(index)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-up Question Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Follow up question
              </label>
              <Switch
                checked={showFollowUp}
                onCheckedChange={setShowFollowUp}
              />
            </div>

            {showFollowUp && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Configure a follow-up question with custom chips and responses for each chip.
                </p>

                {/* Follow-up question input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <Input
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder="Would you like more details on a specified oxidizer?"
                    className="w-full"
                  />
                </div>

                {/* Add chip and response */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Add chip and response
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chip text
                    </label>
                    <Input
                      value={newFollowUpChip}
                      onChange={(e) => setNewFollowUpChip(e.target.value)}
                      placeholder="Chip text (e.g., 'Yes')"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response for this chip
                    </label>
                    {/* Response type selection */}
                    <div className="mb-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responseTypeEdit"
                            value="custom"
                            checked={newFollowUpResponseType === 'custom'}
                            onChange={(e) => setNewFollowUpResponseType(e.target.value as 'custom' | 'existing')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Custom Response</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responseTypeEdit"
                            value="existing"
                            checked={newFollowUpResponseType === 'existing'}
                            onChange={(e) => setNewFollowUpResponseType(e.target.value as 'custom' | 'existing')}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Existing Response</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Response content based on type */}
                    {newFollowUpResponseType === 'custom' ? (
                      <RichTextEditor
                        value={newFollowUpResponse}
                        onChange={setNewFollowUpResponse}
                        placeholder="Enter the response when this chip is clicked..."
                        className="w-full"
                      />
                    ) : (
                      <div>
                        <select
                          value={newFollowUpLinkedResponseId || ''}
                          onChange={(e) => setNewFollowUpLinkedResponseId(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select an existing response...</option>
                          {mockResponses?.map((response: any) => (
                            <option key={response.id} value={response.id}>
                              {response.question.length > 50 ? response.question.substring(0, 50) + '...' : response.question}
                            </option>
                          ))}
                        </select>
                        {newFollowUpLinkedResponseId && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border">
                            <div className="text-xs text-gray-600">Preview:</div>
                            <div className="text-sm mt-1">
                              {(() => {
                                const linkedResponse = mockResponses?.find((r: any) => r.id === newFollowUpLinkedResponseId);
                                if (linkedResponse) {
                                  const preview = linkedResponse.response.replace(/<[^>]*>/g, '');
                                  return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
                                }
                                return 'Response not found';
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddFollowUpChip}
                    disabled={
                      !newFollowUpChip.trim() || 
                      (newFollowUpResponseType === 'custom' && (!newFollowUpResponse.trim() || newFollowUpResponse.trim() === '<p></p>')) ||
                      (newFollowUpResponseType === 'existing' && !newFollowUpLinkedResponseId) ||
                      followUpChips.length >= 5
                    }
                    size="sm"
                  >
                    Add Chip
                  </Button>
                </div>

                {/* Display current chips */}
                {followUpChips.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      Current chips ({followUpChips.length}/5):
                    </div>
                    <div className="space-y-2">
                      {followUpChips.map((chip, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{chip}</div>
                            <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ 
                              __html: followUpResponseTypes[index] === 'existing' 
                                ? `<span class="text-blue-600 font-medium">Linked to: ${mockResponses?.find((r: MockResponse) => r.id === followUpLinkedResponseIds[index])?.question || 'Response not found'}</span>`
                                : followUpResponses[index] 
                            }} />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFollowUpChip(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMockResponse}
              disabled={updateMockResponseMutation.isPending || !newMockQuestion.trim() || !newMockResponse.trim() || newMockResponse.trim() === '<p></p>'}
            >
              {updateMockResponseMutation.isPending ? 'Updating...' : 'Update Mock Response'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* System Prompt Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI System Prompt</CardTitle>
              <CardDescription>
                This is the system prompt that will be sent to OpenAI when generating responses. It defines the AI's behavior, tone, and output format. Changes take effect immediately for new conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter the system prompt for OpenAI..."
                className="min-h-[350px] font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSystemPrompt}
                  disabled={updateSystemPromptMutation.isPending}
                >
                  {updateSystemPromptMutation.isPending ? 'Saving...' : 'Save System Prompt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* RAG Test Tab */}
      {activeTab === 'rag' && (
        <div className="space-y-6">
          <RagTest />
        </div>
      )}
      
      {/* API Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <ApiLogs />
        </div>
      )}
      
      {/* Personalize Tab */}
      {activeTab === 'personalize' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>
                Upload an image file or provide a URL for your company logo that will appear in the top-left navigation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Upload Image File</h4>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB limit for logo images
                    onGetUploadParameters={handleGetLogoUploadParameters}
                    onComplete={handleLogoUploadComplete}
                    buttonClassName="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </ObjectUploader>
                </div>
                
                <div className="text-center text-gray-500 text-sm">— or —</div>
                
                <div className="space-y-2">
                  <label htmlFor="logo-url" className="block text-sm font-medium text-gray-700">
                    Logo URL
                  </label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Enter logo URL (e.g., https://example.com/logo.png)"
                  />
                </div>
              </div>
              
              {logoUrl && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Preview:</div>
                  <img
                    src={logoUrl.startsWith('/objects/') ? logoUrl : logoUrl}
                    alt="Logo preview"
                    className="h-12 w-12 rounded-lg border border-gray-300 dark:border-gray-600 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {logoUrl.startsWith('/objects/') ? 'Uploaded file' : logoUrl}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveLogoUrl}
                  disabled={updateLogoUrlMutation.isPending || !logoUrl}
                >
                  {updateLogoUrlMutation.isPending ? 'Saving...' : 'Save Logo'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Name</CardTitle>
              <CardDescription>
                The company name that appears in the navigation header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name (e.g., Brenntag)"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCompanyName}
                  disabled={updateCompanyNameMutation.isPending}
                >
                  {updateCompanyNameMutation.isPending ? 'Saving...' : 'Save Company Name'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Name</CardTitle>
              <CardDescription>
                The user name that appears at the bottom of the sidebar. The initials will be automatically generated from the first letter of each word.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter user name (e.g., John Sanders)"
              />
              {userName && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                      {userName.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{userName}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveUserName}
                  disabled={updateUserNameMutation.isPending}
                >
                  {updateUserNameMutation.isPending ? 'Saving...' : 'Save User Name'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Version Tab */}
      {activeTab === 'version' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Version</CardTitle>
              <CardDescription>
                Current version information and deployment details. The version automatically increments during deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <VersionDisplay showDetails={true} className="text-base" />
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Version System</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Version numbers increment automatically during deployment</div>
                  <div>• Format: v.00001, v.00002, etc.</div>
                  <div>• Visible to users in bottom-right corner of the application</div>
                  <div>• Deployment scripts are available in the scripts/ directory</div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Deployment Commands</h4>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <div className="text-gray-700 mb-2"># Manual version increment:</div>
                  <div className="text-blue-600">node scripts/increment-version.js</div>
                  <div className="text-gray-700 mb-2 mt-4"># Full deployment with version bump:</div>
                  <div className="text-blue-600">bash scripts/deploy.sh</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <FeedbackManager />
        </div>
      )}
    </div>
  );
};