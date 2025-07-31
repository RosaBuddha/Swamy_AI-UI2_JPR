import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { RichTextEditor } from '../ui/rich-text-editor';
import { X } from 'lucide-react';

interface FollowUpChipFormProps {
  // Current state
  followUpChips: string[];
  followUpResponses: string[];
  followUpResponseTypes: string[];
  followUpLinkedResponseIds: number[];
  
  // New chip state
  newFollowUpChip: string;
  newFollowUpResponse: string;
  newFollowUpResponseType: 'custom' | 'existing';
  newFollowUpLinkedResponseId: number | null;
  
  // Available mock responses for linking
  mockResponses: any[];
  
  // Event handlers
  onChipChange: (value: string) => void;
  onResponseChange: (value: string) => void;
  onResponseTypeChange: (value: 'custom' | 'existing') => void;
  onLinkedResponseChange: (id: number | null) => void;
  onAddChip: () => void;
  onRemoveChip: (index: number) => void;
}

export const FollowUpChipForm: React.FC<FollowUpChipFormProps> = ({
  followUpChips,
  followUpResponses,
  followUpResponseTypes,
  followUpLinkedResponseIds,
  newFollowUpChip,
  newFollowUpResponse,
  newFollowUpResponseType,
  newFollowUpLinkedResponseId,
  mockResponses,
  onChipChange,
  onResponseChange,
  onResponseTypeChange,
  onLinkedResponseChange,
  onAddChip,
  onRemoveChip,
}) => {
  const getDisplayResponse = (index: number) => {
    const responseType = followUpResponseTypes[index] || 'custom';
    if (responseType === 'existing') {
      const linkedId = followUpLinkedResponseIds[index];
      const linkedResponse = mockResponses.find(r => r.id === linkedId);
      if (linkedResponse) {
        return `<span class="text-blue-600 font-medium">Linked to: ${linkedResponse.question}</span>`;
      }
      return '<span class="text-gray-500">Linked response not found</span>';
    }
    return followUpResponses[index];
  };

  return (
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
          onChange={(e) => onChipChange(e.target.value)}
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
                onChange={(e) => onResponseTypeChange(e.target.value as 'custom' | 'existing')}
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
                onChange={(e) => onResponseTypeChange(e.target.value as 'custom' | 'existing')}
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
            onChange={onResponseChange}
            placeholder="Enter the response when this chip is clicked..."
            className="w-full"
          />
        ) : (
          <div>
            <select
              value={newFollowUpLinkedResponseId || ''}
              onChange={(e) => onLinkedResponseChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an existing response...</option>
              {mockResponses.map((response: any) => (
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
                    const linkedResponse = mockResponses.find((r: any) => r.id === newFollowUpLinkedResponseId);
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
        onClick={onAddChip}
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
                  <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: getDisplayResponse(index) }} />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveChip(index)}
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
  );
};