import { User, CheckCircle, XCircle, Loader2, Copy, Check, Wrench, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import beechatLogo from '@/assets/beechat-logo.png';
import { ChatMessage as ChatMessageType } from '@/hooks/useAdminChat';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatMessageProps {
  message: ChatMessageType;
  showDate?: boolean;
}

// Format error messages for users
function formatErrorMessage(error: string): string {
  if (error.includes("Could not find a relationship")) {
    return "Unable to fetch related data. Please try again.";
  }
  if (error.includes("violates row-level security")) {
    return "You don't have permission to perform this action.";
  }
  if (error.includes("duplicate key")) {
    return "This item already exists.";
  }
  if (error.includes("not found")) {
    return "The requested item was not found.";
  }
  return error.length > 100 ? error.substring(0, 100) + '...' : error;
}

export function ChatMessage({ message, showDate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Extract confirmation numbers and IDs for easy copying
  const extractCopyableItems = (content: string): Array<{ text: string; label: string }> => {
    const items: Array<{ text: string; label: string }> = [];
    
    // Match confirmation numbers (e.g., MAIN-260126-1234)
    const confirmationMatch = content.match(/[A-Z]+-\d{6}-\d{4}/g);
    if (confirmationMatch) {
      confirmationMatch.forEach(m => items.push({ text: m, label: 'Confirmation' }));
    }
    
    // Match folio numbers (e.g., F-MAIN-260126-1234)
    const folioMatch = content.match(/F-[A-Z]+-\d{6}-\d{4}/g);
    if (folioMatch) {
      folioMatch.forEach(m => items.push({ text: m, label: 'Folio' }));
    }
    
    return items;
  };

  const copyableItems = !isUser && !isLoading ? extractCopyableItems(message.content) : [];

  return (
    <div className="px-4">
      {/* Date separator */}
      {showDate && (
        <div className="flex items-center justify-center my-4">
          <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
            {message.timestamp.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              year: message.timestamp.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </div>
        </div>
      )}

      <div className={cn(
        "flex gap-3 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-gradient-to-br from-blue-400 to-blue-600"
        )}>
          {isUser ? <User className="h-4 w-4" /> : (
            <img src={beechatLogo} alt="BeeChat" className="w-6 h-6 object-contain" />
          )}
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex-1 max-w-[85%]",
          isUser ? "text-right" : "text-left"
        )}>
          <div className={cn(
            "inline-block rounded-2xl px-4 py-2.5",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-muted rounded-tl-sm"
          )}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">চিন্তা করছি...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => (
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                    ),
                    h1: ({ children }) => <h3 className="text-base font-bold mt-3 mb-2">{children}</h3>,
                    h2: ({ children }) => <h4 className="text-sm font-bold mt-3 mb-2">{children}</h4>,
                    h3: ({ children }) => <h5 className="text-sm font-semibold mt-2 mb-1">{children}</h5>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Copyable items */}
          {copyableItems.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {copyableItems.map((item, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs bg-muted/50 hover:bg-muted"
                  onClick={() => copyToClipboard(item.text, `${message.id}-${idx}`)}
                >
                  {copied === `${message.id}-${idx}` ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {item.text}
                </Button>
              ))}
            </div>
          )}

          {/* Tool Execution Indicator */}
          {!isUser && !isLoading && message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                <Wrench className="h-2.5 w-2.5 mr-1" />
                {message.toolCalls.length} action{message.toolCalls.length > 1 ? 's' : ''} executed
              </Badge>
              {message.toolCalls.map((tc, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0.5">
                  {tc.name?.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* No tools executed for assistant message (informational) */}
          {!isUser && !isLoading && (!message.toolCalls || message.toolCalls.length === 0) && message.content.length > 50 && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 opacity-60">
                ℹ️ Informational response
              </Badge>
            </div>
          )}

          {/* Tool Results with success/failure */}
          {message.toolResults && message.toolResults.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {message.toolResults.map((result, index) => (
                <div 
                  key={index}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg",
                    result.success 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-medium">
                        {result.success ? 'Success' : 'Error occurred'}
                      </span>
                      {!result.success && result.error && (
                        <p className="mt-1 text-[11px] opacity-80">
                          {formatErrorMessage(result.error)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-[10px] text-muted-foreground mt-1",
            isUser ? "text-right" : "text-left"
          )}>
            {message.timestamp.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
