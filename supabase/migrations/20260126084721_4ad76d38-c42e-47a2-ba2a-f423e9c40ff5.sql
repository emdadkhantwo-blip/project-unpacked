-- Create chat_messages table for persistent chat history
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tool_calls jsonb,
  tool_results jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own chat messages"
  ON public.chat_messages FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all chat messages"
  ON public.chat_messages FOR ALL
  USING (is_superadmin(auth.uid()));

-- Indexes for efficient queries
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_tenant ON public.chat_messages(tenant_id);