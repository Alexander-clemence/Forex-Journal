-- Create feedback table for user feedback submissions
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'general')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true); -- Anyone can submit feedback

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE feedback IS 'Stores user feedback submissions including ratings, categories, and messages';

-- Add comments to columns
COMMENT ON COLUMN feedback.rating IS 'User rating from 1 to 5 stars';
COMMENT ON COLUMN feedback.category IS 'Feedback category: bug, feature, improvement, or general';
COMMENT ON COLUMN feedback.message IS 'Feedback message content';
COMMENT ON COLUMN feedback.user_email IS 'Email of user who submitted feedback';

