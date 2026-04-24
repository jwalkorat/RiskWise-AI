/**
 * SQL Schema for Chatbot Database
 * 
 * Run this on your Supabase project to set up the chat_history table
 */

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_history_student_id 
  ON chat_history(student_id);

CREATE INDEX IF NOT EXISTS idx_chat_history_created_at 
  ON chat_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_history_student_created 
  ON chat_history(student_id, created_at DESC);

-- Create a view to get recent conversations
CREATE OR REPLACE VIEW v_recent_chats AS
SELECT 
  student_id,
  COUNT(*) as total_messages,
  MAX(created_at) as last_chat,
  STRING_AGG(CASE WHEN role = 'user' THEN message END, ' | ' ORDER BY created_at DESC) as last_user_message
FROM chat_history
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY student_id;

-- Enable Row Level Security (for Supabase)
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Students can view their own chat history"
  ON chat_history
  FOR SELECT
  USING (student_id = auth.uid()::text OR current_setting('role') = 'authenticated');

CREATE POLICY "Students can insert their own chat messages"
  ON chat_history
  FOR INSERT
  WITH CHECK (student_id = auth.uid()::text);

-- Grant permissions
GRANT SELECT, INSERT ON chat_history TO authenticated;
GRANT SELECT ON v_recent_chats TO authenticated;
