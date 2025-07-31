import React from 'react';
import { Button } from '../ui/Button';
import { NavigationHeader } from '../ui/NavigationHeader';
import { ComparisonItem } from '../ui/ComparisonItem';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import AddCircleIcon from '../icons/AddCircleIcon';
import SalesCanvasIcon from '../icons/SalesCanvasIcon';
import ExpandIcon from '../icons/ExpandIcon';
import { useQuery } from '@tanstack/react-query';

interface SidebarProps {
  onNewChat: () => void;
  chatSessions: Array<{
    id: string;
    title: string;
    timestamp: Date;
    isPinned?: boolean;
  }>;
  activeChatId?: string;
  hasActiveEmptyChat?: boolean;
  onSelectChat: (chatId: string) => void;
  onPinChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  isRenaming: string | null;
  onStartRenaming: (chatId: string) => void;
  onStopRenaming: () => void;
  onLogoClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNewChat,
  chatSessions,
  activeChatId,
  hasActiveEmptyChat = false,
  onSelectChat,
  onPinChat,
  onRenameChat,
  onDeleteChat,
  isRenaming,
  onStartRenaming,
  onStopRenaming,
  onLogoClick,
}) => {
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Fetch personalization settings
  const { data: companyNameSetting } = useQuery({
    queryKey: ['/api/settings', 'company_name'],
    queryFn: () => fetch('/api/settings/company_name').then(res => res.json())
  });

  const { data: userNameSetting } = useQuery({
    queryKey: ['/api/settings', 'user_name'],
    queryFn: () => fetch('/api/settings/user_name').then(res => res.json())
  });

  const { data: logoUrlSetting } = useQuery({
    queryKey: ['/api/settings', 'logo_url'],
    queryFn: () => fetch('/api/settings/logo_url').then(res => res.json())
  });

  // Use settings with fallbacks
  const companyName = companyNameSetting?.value || 'Brenntag';
  const userName = userNameSetting?.value || 'John Sanders';
  const logoUrl = logoUrlSetting?.value || 'https://uploadthingy.s3.us-west-1.amazonaws.com/dXCGmabXpAEerMywR1rEtp/Supplier_Logo_-_Square.png';
  
  // Generate user initials
  const userInitials = userName.split(' ').slice(0, 2).map((word: string) => word.charAt(0).toUpperCase()).join('');

  const handleCollapseClick = () => {
    setIsCollapsed(!isCollapsed);
    console.log('Collapse clicked');
  };

  const handleRename = (chatId: string) => {
    const chat = chatSessions.find(s => s.id === chatId);
    if (chat) {
      setRenameValue(chat.title);
      onStartRenaming(chatId);
    }
  };

  const handleRenameSubmit = () => {
    if (isRenaming && renameValue.trim()) {
      onRenameChat(isRenaming, renameValue.trim());
      onStopRenaming();
      setRenameValue('');
    }
  };

  const handleRenameCancel = () => {
    onStopRenaming();
    setRenameValue('');
  };

  const handleDeleteConfirm = (chatId: string) => {
    onDeleteChat(chatId);
    setDeleteConfirmId(null);
  };

  return (
    <>
      <div className={`flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-auto' : 'w-[232px]'}`}>
        {isCollapsed ? (
          // Collapsed view
          <div className="flex flex-col items-center space-y-4 py-2">
            {/* Collapsed Header with just expand button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCollapseClick}
                className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
                aria-label="Toggle navigation"
              >
                <ExpandIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
            
            {/* Collapsed New Chat button */}
            <button
              onClick={hasActiveEmptyChat ? undefined : onNewChat}
              disabled={hasActiveEmptyChat}
              className={`py-2 px-2 rounded-lg transition-all duration-200 ${
                hasActiveEmptyChat 
                  ? 'cursor-not-allowed' 
                  : 'hover:bg-gray-100 cursor-pointer'
              }`}
              title="New Chat"
            >
              <AddCircleIcon 
                className="w-4 h-4" 
                style={{ color: hasActiveEmptyChat ? '#999999' : '#505050' }} 
              />
            </button>
            
            {/* Collapsed Sales Canvas button */}
            <button
              className="py-2 px-2 hover:bg-gray-100 rounded transition-all duration-200"
              title="Sales Canvas"
            >
              <SalesCanvasIcon className="w-4 h-4" style={{ color: '#505050' }} />
            </button>

            {/* Collapsed User Avatar - Bottom */}
            <div className="mt-auto pt-4">
              <div className="flex justify-center">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium" style={{ fontSize: '11px' }} title={userName}>
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Expanded view
          <>
            {/* Header */}
            <div>
              <div className="mb-4">
                <NavigationHeader
                  title={companyName}
                  logoUrl={logoUrl}
                  onCollapseClick={handleCollapseClick}
                  onLogoClick={onLogoClick}
                />
              </div>
              
              <div
                onClick={hasActiveEmptyChat ? undefined : onNewChat}
                className={`flex items-center space-x-2 p-2 rounded transition-all duration-200 ${
                  hasActiveEmptyChat 
                    ? 'cursor-not-allowed text-gray-400' 
                    : 'text-gray-700 hover:text-gray-800 cursor-pointer hover:bg-gray-200'
                }`}
              >
                <AddCircleIcon 
                  className="w-4 h-4" 
                  style={{ color: hasActiveEmptyChat ? '#999999' : '#505050' }} 
                />
                <span 
                  className="text-sm font-semibold" 
                  style={{ color: hasActiveEmptyChat ? '#999999' : '#505050' }}
                >
                  New Chat
                </span>
              </div>
            </div>

            {/* Sales Canvas section */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 cursor-pointer p-2 rounded hover:bg-gray-200">
                <SalesCanvasIcon className="w-4 h-4" style={{ color: '#505050' }} />
                <span className="text-sm font-semibold" style={{ color: '#505050' }}>Sales Canvas</span>
              </div>
            </div>

            {/* Recent section */}
            <div className="mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</h3>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <ComparisonItem
                    key={session.id}
                    text={session.title}
                    isSelected={activeChatId === session.id}
                    isPinned={session.isPinned}
                    onPin={() => onPinChat(session.id)}
                    onRename={() => handleRename(session.id)}
                    onDelete={() => setDeleteConfirmId(session.id)}
                    className="cursor-pointer"
                    onClick={() => onSelectChat(session.id)}
                  />
                ))}
              </div>
            </div>

            {/* User Avatar - Bottom of sidebar */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 p-2">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium" style={{ fontSize: '10px' }}>
                  {userInitials}
                </div>
                <span className="text-sm font-medium text-gray-900">{userName}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenaming !== null}
        onClose={handleRenameCancel}
        title="Rename Chat"
      >
        <div className="space-y-4">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new chat name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              } else if (e.key === 'Escape') {
                handleRenameCancel();
              }
            }}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleRenameCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameSubmit}
              disabled={!renameValue.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Rename
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Chat"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && handleDeleteConfirm(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};