import React from 'react';
import { Settings } from 'lucide-react';
import swamyLogo from '@assets/Export_SwamyAI_Logo_1753898713786.png';
import NewTaskIcon from '../ui/icons/NewTaskIcon';

interface ChatHeaderProps {
  onSettingsClick?: () => void;
  hasMessages?: boolean;
  onHowCanIHelpClick?: () => void;
  showTaskSidebar?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onSettingsClick, hasMessages = false, onHowCanIHelpClick, showTaskSidebar = false }) => {
  return (
    <div className="bg-white py-4 px-3 flex justify-center relative">
      <img
        src={swamyLogo}
        alt="Swamy AI"
        className="h-6"
        style={{ height: '24px' }}
      />
      
      {/* Right side buttons */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {/* Admin Settings Gear Icon */}
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Admin Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        {/* New task button - only show when there are messages and task sidebar is not open */}
        {hasMessages && !showTaskSidebar && (
          <button
            onClick={onHowCanIHelpClick}
            className="py-1.5 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
            style={{ borderRadius: '32px', paddingLeft: '10px', paddingRight: '10px' }}
            aria-label="New task"
          >
            <NewTaskIcon className="w-4 h-4" />
            New task
          </button>
        )}
      </div>
    </div>
  );
};