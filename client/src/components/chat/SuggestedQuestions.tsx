import React from 'react';
import { Chip } from '../ui/Chip';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onQuestionClick,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {questions.map((question, index) => (
        <Chip
          key={index}
          onClick={() => onQuestionClick(question)}
          variant="suggestion"
        >
          {question}
        </Chip>
      ))}
    </div>
  );
};