import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const quickActions = [
  { label: "Today's Arrivals", message: "Show me today's arrivals" },
  { label: "Room Status", message: "What's the current room status?" },
  { label: "Dashboard Stats", message: "Show me the dashboard statistics" },
  { label: "Pending Tasks", message: "Show pending housekeeping tasks" },
];

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (actionMessage: string) => {
    if (!isLoading && !disabled) {
      onSend(actionMessage);
    }
  };

  return (
    <div className="border-t bg-background p-3 space-y-3">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => handleQuickAction(action.message)}
            disabled={isLoading || disabled}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Shift+Enter for new line)"
          className="min-h-[44px] max-h-[120px] resize-none flex-1"
          disabled={isLoading || disabled}
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          size="icon"
          className="h-[44px] w-[44px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
