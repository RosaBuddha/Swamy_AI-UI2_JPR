import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  className?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  className = "" 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          flex items-center justify-center
          w-8 h-8 rounded-lg
          bg-gray-100 hover:bg-gray-200
          text-gray-600 hover:text-gray-800
          transition-colors duration-200
          border border-gray-200
          ${className}
        `}
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      <FeedbackModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};