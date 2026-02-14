-- Fix push notification function to handle null URL gracefully
CREATE OR REPLACE FUNCTION public.notify_push_on_user_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  -- Get secrets safely
  SELECT decrypted_secret INTO edge_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- Only call if both secrets are configured
  IF edge_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := edge_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.message,
        'data', COALESCE(NEW.data, '{}'::jsonb),
        'type', NEW.type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;