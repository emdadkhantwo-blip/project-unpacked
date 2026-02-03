import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

interface DbChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  content: string;
  tool_calls: any;
  tool_results: any;
  created_at: string;
}

const SESSION_KEY = 'beechat_session';

export function useAdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const { tenant, properties, currentProperty } = useTenant();
  const { session, user } = useAuth();

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

  // Load chat history when session is ready
  useEffect(() => {
    if (!sessionId || !user?.id || isHistoryLoaded) return;

    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading chat history:', error);
          return;
        }

        if (data && data.length > 0) {
          const loadedMessages: ChatMessage[] = (data as DbChatMessage[]).map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            toolCalls: msg.tool_calls,
            toolResults: msg.tool_results
          }));
          setMessages(loadedMessages);
        }
        setIsHistoryLoaded(true);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setIsHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [sessionId, user?.id, isHistoryLoaded]);

  // Save message to database
  const saveMessage = useCallback(async (
    message: ChatMessage,
    toolCalls?: any[],
    toolResults?: any[]
  ) => {
    if (!user?.id || !tenant?.id || !sessionId) return;

    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        tenant_id: tenant.id,
        role: message.role,
        content: message.content,
        tool_calls: toolCalls || null,
        tool_results: toolResults || null
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, [user?.id, tenant?.id, sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message
    saveMessage(userMessage);

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
          const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
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
      setMessages(prev => prev.map(m => 
        m.id === loadingId ? assistantMessage : m
      ));

      // Save assistant message
      saveMessage(assistantMessage, data.toolCalls, data.toolResults);

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
      setMessages(prev => prev.map(m => 
        m.id === loadingId ? errorMessage : m
      ));

      // Save error message
      saveMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, tenant, properties, session, saveMessage]);

  const clearHistory = useCallback(async () => {
    if (!sessionId) return;

    try {
      // Delete messages from database
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);
    } catch (err) {
      console.error('Failed to clear history from database:', err);
    }

    // Clear local state
    setMessages([]);
    
    // Generate new session
    const newSession = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newSession);
    setSessionId(newSession);
    setIsHistoryLoaded(false);
  }, [sessionId]);

  const startNewSession = useCallback(async () => {
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
