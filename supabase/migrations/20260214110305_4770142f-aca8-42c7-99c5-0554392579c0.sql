-- Create the analysis-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('analysis-attachments', 'analysis-attachments', true)
ON CONFLICT (id) DO NOTHING;