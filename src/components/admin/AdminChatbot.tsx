import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Trash2, Plus, History } from 'lucide-react';
import beechatLogo from '@/assets/beechat-logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAdminChat } from '@/hooks/useAdminChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AdminChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { 
    messages, 
    isLoading, 
    sessionId,
    sendMessage, 
    clearHistory, 
    startNewSession,
    addWelcomeMessage 
  } = useAdminChat();
  const { roles } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user has admin role
  const isAdmin = roles.some(r => 
    ['superadmin', 'owner', 'manager', 'front_desk', 'accountant', 'night_auditor'].includes(r)
  );

  // Add welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addWelcomeMessage();
    }
  }, [isOpen, messages.length, addWelcomeMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Don't render for non-admin users
  if (!isAdmin) {
    return null;
  }

  const shortSessionId = sessionId ? sessionId.slice(0, 8) : '';

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-0 overflow-hidden"
            >
              <img src={beechatLogo} alt="BeeChat" className="w-10 h-10 object-contain" />
            </Button>
            
            {/* Notification dot when has unread */}
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-background" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : 'calc(100vh - 120px)'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-48px)]",
              "bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
              isMinimized ? "h-auto" : "max-h-[calc(100vh-120px)]"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                    <img src={beechatLogo} alt="BeeChat" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold">BeeChat</h3>
                    <p className="text-xs text-white/80">Hotel Management Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                          onClick={startNewSession}
                          title="New chat session"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>New session</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                          onClick={clearHistory}
                          title="Clear chat history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear history</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMinimized(!isMinimized)}
                    title={isMinimized ? "Expand" : "Minimize"}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Session indicator */}
              {!isMinimized && (
                <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                  <History className="h-3 w-3" />
                  <span>Session: {shortSessionId}...</span>
                  {messages.length > 1 && (
                    <span className="ml-auto">{messages.length} messages</span>
                  )}
                </div>
              )}
            </div>

            {/* Messages Area */}
            {!isMinimized && (
              <>
                <ScrollArea 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto"
                >
                  <div className="min-h-full">
                    {messages.map((message, index) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message}
                        showDate={
                          index === 0 || 
                          new Date(message.timestamp).toDateString() !== 
                          new Date(messages[index - 1].timestamp).toDateString()
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <ChatInput 
                  onSend={sendMessage} 
                  isLoading={isLoading} 
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
