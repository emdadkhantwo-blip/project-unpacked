import { useState, useCallback, useEffect } from 'react';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: Array<{ name: string; args: any }>;
  toolResults?: Array<{ success: boolean; data?: any; error?: string }>;
}

const SESSION_KEY = 'beechat_session';
const MESSAGES_KEY = 'beechat_messages';

export function useAdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const { tenant, properties, currentProperty } = useTenant();
  const { session } = useAuth();

  // Initialize or load session
  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, newSession);
      setSessionId(newSession);
    }
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    if (!sessionId || isHistoryLoaded) return;

    try {
      const stored = localStorage.getItem(`${MESSAGES_KEY}_${sessionId}`);
      if (stored) {
        const loadedMessages = JSON.parse(stored) as ChatMessage[];
        // Convert timestamp strings back to Date objects
        const messagesWithDates = loadedMessages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(messagesWithDates);
      }
      setIsHistoryLoaded(true);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setIsHistoryLoaded(true);
    }
  }, [sessionId, isHistoryLoaded]);

  // Save messages to localStorage
  const saveMessages = useCallback((msgs: ChatMessage[]) => {
    if (!sessionId) return;
    try {
      // Filter out loading messages before saving
      const messagesWithoutLoading = msgs.filter(m => !m.isLoading);
      localStorage.setItem(`${MESSAGES_KEY}_${sessionId}`, JSON.stringify(messagesWithoutLoading));
    } catch (err) {
      console.error('Failed to save messages:', err);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      // Prepare messages for API (include last 20 messages for context)
      const recentMessages = [...messages.slice(-20), userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const propertyId = currentProperty?.id || properties?.[0]?.id || '';

      // Retry logic with exponential backoff
      const maxRetries = 3;
      let response: Response | null = null;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
              },
              body: JSON.stringify({
                messages: recentMessages,
                tenantId: tenant?.id || '',
                propertyId
              })
            }
          );

          // If not rate limited, break out of retry loop
          if (response.status !== 429) {
            break;
          }

          // Rate limited - wait with exponential backoff
          const delay = 1000 * Math.pow(2, attempt);
          console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } catch (err: any) {
          lastError = err;
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!response) {
        throw lastError || new Error('Failed to connect to chat service');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error('সার্ভার এখন ব্যস্ত। অনুগ্রহ করে ১০ সেকেন্ড পরে আবার চেষ্টা করুন। (Rate limit exceeded)');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please contact your administrator.');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: data.message || 'I completed the request.',
        timestamp: new Date(),
        isLoading: false,
        toolCalls: data.toolCalls,
        toolResults: data.toolResults
      };

      // Replace loading message with actual response
      setMessages(prev => {
        const updated = prev.map(m => m.id === loadingId ? assistantMessage : m);
        saveMessages(updated);
        return updated;
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: `দুঃখিত, একটি সমস্যা হয়েছে: ${error.message}`,
        timestamp: new Date(),
        isLoading: false
      };

      // Replace loading message with error
      setMessages(prev => {
        const updated = prev.map(m => m.id === loadingId ? errorMessage : m);
        saveMessages(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, tenant, properties, currentProperty, session, saveMessages]);

  const clearHistory = useCallback(() => {
    // Clear local storage
    if (sessionId) {
      localStorage.removeItem(`${MESSAGES_KEY}_${sessionId}`);
    }

    // Clear local state
    setMessages([]);
    
    // Generate new session
    const newSession = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newSession);
    setSessionId(newSession);
    setIsHistoryLoaded(false);
  }, [sessionId]);

  const startNewSession = useCallback(() => {
    // Generate new session without clearing old messages
    const newSession = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newSession);
    setSessionId(newSession);
    setMessages([]);
    setIsHistoryLoaded(false);
  }, []);

  const addWelcomeMessage = useCallback(() => {
    if (messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello Sir! 👋 আমি **BeeChat**, আপনার হোটেল ম্যানেজমেন্ট সহকারী।

আমি আপনার হোটেলের সব তথ্য জানি - রুম, গেস্ট, স্টাফ, রিজার্ভেশন সব!

আমি আপনাকে সাহায্য করতে পারি:
- 📅 **রিজার্ভেশন** তৈরি ও পরিচালনা
- 🛎️ **চেক-ইন/আউট** প্রক্রিয়াকরণ
- 🛏️ **রুম ম্যানেজমেন্ট** ও হাউসকিপিং
- 👥 **গেস্ট প্রোফাইল** তৈরি
- 💳 **ফোলিও ও পেমেন্ট** পরিচালনা
- 📊 **রিপোর্ট ও পরিসংখ্যান** দেখা

**আজ আপনাকে কীভাবে সাহায্য করতে পারি?**`,
        timestamp: new Date()
      }]);
    }
  }, [messages.length]);

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearHistory,
    startNewSession,
    addWelcomeMessage
  };
}