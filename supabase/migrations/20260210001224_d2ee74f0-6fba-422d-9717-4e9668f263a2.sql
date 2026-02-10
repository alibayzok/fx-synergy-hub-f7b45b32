
-- Add video support to lessons
ALTER TABLE public.learning_lessons 
ADD COLUMN video_url TEXT,
ADD COLUMN content_type TEXT NOT NULL DEFAULT 'text';

-- content_type can be 'text', 'video', or 'both'
