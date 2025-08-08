import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Taskbar } from './components/layout/Taskbar';
import { ChatArea } from './components/chat/ChatArea';
import { AdminPage } from './components/admin/AdminPage';
import { VersionDisplay } from './components/ui/VersionDisplay';
import { useChat } from './hooks/useChat';

type AppView = 'chat' | 'admin';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [showTaskbar, setShowTaskbar] = useState(false);
  const [isTaskbarCollapsed, setIsTaskbarCollapsed] = useState(() => {
    // Load from localStorage, default to false (expanded)
    const saved = localStorage.getItem('taskbarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const hasInitialized = useRef(false);
  
  const {
    chatSessions,
    activeChatId,
    activeChat,
    isTyping,
    isRenaming,
    streamingMessageId,
    createNewChat,
    sendMessage,
    selectChat,
    pinChat,
    renameChat,
    deleteChat,
    startRenaming,
    stopRenaming,
    handleProductSelection,
    handleRefineQuery,
  } = useChat();

  // Create initial chat on mount - only once
  useEffect(() => {
    if (chatSessions.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      createNewChat();
    }
  }, [chatSessions.length, createNewChat]);

  const handleNewChat = () => {
    createNewChat();
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleSettingsClick = () => {
    setCurrentView('admin');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  const handleLogoClick = () => {
    // Refresh the page to reset to initial state
    window.location.reload();
  };

  const handleTaskClick = (taskId: string) => {
    // Handle task selection - for now, we can create a new chat or send a message
    console.log(`Task selected: ${taskId}`);
    // You could implement specific logic for each task here
  };

  const handleHowCanIHelpClick = () => {
    setShowTaskbar(true);
  };

  const handleCloseTaskbar = () => {
    setShowTaskbar(false);
  };

  const handleToggleTaskbar = () => {
    const newCollapsed = !isTaskbarCollapsed;
    setIsTaskbarCollapsed(newCollapsed);
    // Save to localStorage
    localStorage.setItem('taskbarCollapsed', JSON.stringify(newCollapsed));
  };

  if (currentView === 'admin') {
    return (
      <div className="h-screen">
        <AdminPage onBack={handleBackToChat} />
      </div>
    );
  }

  return (
    <div className="h-screen flex gap-3 py-4 px-3">
      <div className="flex-shrink-0">
        <Navbar
          onNewChat={handleNewChat}
          chatSessions={chatSessions.map(session => ({
            id: session.id,
            title: session.title,
            timestamp: session.updatedAt,
            isPinned: session.isPinned,
          }))}
          activeChatId={activeChatId || undefined}
          hasActiveEmptyChat={activeChat ? activeChat.messages.length === 0 : false}
          onSelectChat={handleSelectChat}
          onPinChat={pinChat}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
          isRenaming={isRenaming}
          onStartRenaming={startRenaming}
          onStopRenaming={stopRenaming}
          onLogoClick={handleLogoClick}
        />
      </div>
      
      <div className="flex-1">
        <ChatArea
          messages={activeChat?.messages || []}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          streamingMessageId={streamingMessageId}
          onSettingsClick={handleSettingsClick}
          onHowCanIHelpClick={handleHowCanIHelpClick}
          showTaskSidebar={showTaskbar}
          onProductSelect={handleProductSelection}
          onRefineQuery={handleRefineQuery}
        />
      </div>

      {/* Show Taskbar when there are no messages OR when explicitly requested */}
      {((!activeChat || activeChat.messages.length === 0) || showTaskbar) && (
        <div className={`transition-all duration-300 ${isTaskbarCollapsed ? 'w-12' : 'w-80'}`}>
          <Taskbar 
            onTaskClick={handleTaskClick} 
            hasMessages={activeChat ? activeChat.messages.length > 0 : false}
            showCloseButton={showTaskbar && activeChat && activeChat.messages.length > 0}
            onClose={handleCloseTaskbar}
            isCollapsed={isTaskbarCollapsed}
            onToggleCollapse={handleToggleTaskbar}
          />
        </div>
      )}
      
      {/* Version display in bottom-right corner */}
      <div className="fixed bottom-4 right-4 z-10">
        <VersionDisplay showFeedbackButton={true} />
      </div>
    </div>
  );
}

export default App;