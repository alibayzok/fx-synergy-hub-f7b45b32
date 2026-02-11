
-- Create FCM tokens table
CREATE TABLE public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own tokens"
ON public.fcm_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can read all tokens (for edge function)
CREATE POLICY "Service can read all tokens"
ON public.fcm_tokens FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON public.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to call edge function on new notification
CREATE OR REPLACE FUNCTION public.notify_push_on_user_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use pg_net to call edge function asynchronously
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'data', COALESCE(NEW.data, '{}'::jsonb),
      'type', NEW.type
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger on user_notifications
CREATE TRIGGER trigger_push_on_notification
AFTER INSERT ON public.user_notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_push_on_user_notification();
