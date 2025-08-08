import React, { useState } from 'react';
import { DollarSign, HelpCircle, RotateCcw, ClipboardList, FileText, Search, Eye, ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ExpandIcon from '../icons/ExpandIcon';

interface TaskbarProps {
  onTaskClick?: (taskId: string) => void;
  hasMessages?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeMode?: string | null;
  onModeClose?: () => void;
}

const tasks = [
  {
    id: 'find-replacement',
    title: 'Find a product replacement',
    icon: RotateCcw,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'help-sell',
    title: 'Build a sales plan',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'answer-question',
    title: 'Answer a product question',
    icon: HelpCircle,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'respond-questionnaire',
    title: 'Respond to a questionnaire',
    icon: ClipboardList,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'generate-call-plan',
    title: 'Generate a call plan',
    icon: FileText,
    color: 'bg-gray-50 text-gray-600',
  },
  {
    id: 'identify-opportunities',
    title: 'Identify sales opportunities',
    icon: Search,
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    id: 'show-white-spaces',
    title: 'Show me white spaces',
    icon: Eye,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 'consolidate-manufacturers',
    title: 'Help consolidate manufacturers',
    icon: ArrowRight,
    color: 'bg-teal-50 text-teal-600',
  },
];

// Mode panel component for Find Product Replacement
const FindReplacementPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [productName, setProductName] = useState('');

  return (
    <div className="w-80 bg-white rounded-[24px] border border-gray-200 p-6 h-full overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 font-inter text-[16px]">Find a product replacement</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
          aria-label="Close"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-2">
            Product name to replace
          </label>
          <input
            id="product-name"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter the product name you wish to replace"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export const Taskbar: React.FC<TaskbarProps> = ({ 
  onTaskClick, 
  hasMessages = false, 
  showCloseButton = false, 
  onClose, 
  isCollapsed = false, 
  onToggleCollapse,
  activeMode = null,
  onModeClose
}) => {
  const handleTaskClick = (taskId: string, title: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
    // You could also trigger the task by sending a message
    // For now, we'll just log it
    console.log(`Task clicked: ${taskId} - ${title}`);
  };

  const handleModeClose = () => {
    if (onModeClose) {
      onModeClose();
    }
  };

  // Show mode panel if there's an active mode
  if (activeMode) {
    if (activeMode === 'find-replacement') {
      return <FindReplacementPanel onClose={handleModeClose} />;
    }
    // Add other modes here as they are implemented
    // For now, fallback to task list if mode not recognized
  }

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white rounded-[24px] border border-gray-200 h-full flex flex-col items-center py-4">
        {/* Collapsed header with toggle button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
            aria-label="Expand taskbar"
            title="How can I help?"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
        </div>
        
        {/* Collapsed task icons */}
        <div className="space-y-2 flex flex-col items-center">
          {tasks.slice(0, 6).map((task) => {
            const IconComponent = task.icon;
            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id, task.title)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                title={task.title}
              >
                <div className={`w-6 h-6 rounded ${task.color} flex items-center justify-center`}>
                  <IconComponent className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-[24px] border border-gray-200 p-6 h-full overflow-y-auto pl-[16px] pr-[16px] pt-[16px] pb-[16px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 font-inter text-[16px]">How can I help?</h2>
        <div className="flex items-center space-x-1">
          {/* Collapse button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
              aria-label="Collapse taskbar"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          )}
          {/* Close button */}
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
              aria-label="Close"
            >
              <ExpandIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => {
          const IconComponent = task.icon;
          return (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task.id, task.title)}
              className="w-full text-left p-3 border hover:border-gray-200 hover:bg-gray-50 transition-colors group"
              style={{ borderColor: '#ECECEC', borderRadius: '12px' }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg ${task.color} flex items-center justify-center`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span 
                  className="text-sm font-medium flex-1" 
                  style={{ color: 'var(--grey-900)' }}
                >
                  {task.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};