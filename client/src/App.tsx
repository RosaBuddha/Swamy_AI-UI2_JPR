import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TaskSidebar } from './components/layout/TaskSidebar';
import { ChatArea } from './components/chat/ChatArea';
import { AdminPage } from './components/admin/AdminPage';
import { VersionDisplay } from './components/ui/VersionDisplay';
import { useChat } from './hooks/useChat';
import ProductReplacement from './pages/ProductReplacement';
import ReplacementRequestDetails from './pages/ReplacementRequestDetails';
import AlgorithmTest from './pages/AlgorithmTest';

type AppView = 'chat' | 'admin' | 'product-replacement' | 'replacement-details' | 'algorithm-test';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [showTaskSidebar, setShowTaskSidebar] = useState(false);
  const [currentReplacementRequestId, setCurrentReplacementRequestId] = useState<number | null>(null);
  const [isTaskSidebarCollapsed, setIsTaskSidebarCollapsed] = useState(() => {
    // Load from localStorage, default to false (expanded)
    const saved = localStorage.getItem('taskSidebarCollapsed');
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
    setCurrentReplacementRequestId(null);
  };

  const handleLogoClick = () => {
    setCurrentView('chat');
    setCurrentReplacementRequestId(null);
  };

  const handleProductReplacementClick = () => {
    setCurrentView('product-replacement');
  };

  const handleReplacementRequestDetails = (requestId: number) => {
    setCurrentReplacementRequestId(requestId);
    setCurrentView('replacement-details');
  };

  const handleTaskClick = (taskId: string) => {
    if (taskId === 'find-replacement') {
      handleProductReplacementClick();
      return;
    }
    // Handle other task selections - for now, we can create a new chat or send a message
    console.log(`Task selected: ${taskId}`);
    // You could implement specific logic for each task here
  };

  const handleHowCanIHelpClick = () => {
    setShowTaskSidebar(true);
  };

  const handleCloseTaskSidebar = () => {
    setShowTaskSidebar(false);
  };

  const handleToggleTaskSidebar = () => {
    const newCollapsed = !isTaskSidebarCollapsed;
    setIsTaskSidebarCollapsed(newCollapsed);
    // Save to localStorage
    localStorage.setItem('taskSidebarCollapsed', JSON.stringify(newCollapsed));
  };

  if (currentView === 'admin') {
    return (
      <div className="h-screen">
        <AdminPage onBack={handleBackToChat} />
      </div>
    );
  }

  if (currentView === 'product-replacement') {
    return (
      <div className="h-screen overflow-auto">
        <ProductReplacement onBackToChat={handleBackToChat} />
      </div>
    );
  }

  if (currentView === 'replacement-details' && currentReplacementRequestId) {
    return (
      <div className="h-screen overflow-auto">
        <ReplacementRequestDetails />
      </div>
    );
  }

  return (
    <div className="h-screen flex gap-3 py-4 px-3">
      <div className="flex-shrink-0">
        <Sidebar
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
          showTaskSidebar={showTaskSidebar}
          onProductSelect={handleProductSelection}
          onRefineQuery={handleRefineQuery}
        />
      </div>

      {/* Show TaskSidebar when there are no messages OR when explicitly requested */}
      {((!activeChat || activeChat.messages.length === 0) || showTaskSidebar) && (
        <div className={`transition-all duration-300 ${isTaskSidebarCollapsed ? 'w-12' : 'w-80'}`}>
          <TaskSidebar 
            onTaskClick={handleTaskClick} 
            hasMessages={activeChat ? activeChat.messages.length > 0 : false}
            showCloseButton={showTaskSidebar && activeChat && activeChat.messages.length > 0}
            onClose={handleCloseTaskSidebar}
            isCollapsed={isTaskSidebarCollapsed}
            onToggleCollapse={handleToggleTaskSidebar}
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