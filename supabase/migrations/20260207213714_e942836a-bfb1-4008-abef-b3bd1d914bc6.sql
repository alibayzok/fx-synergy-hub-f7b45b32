-- Update the handle_new_user function to save additional user data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, first_name, last_name, country, phone)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'country',
        NEW.raw_user_meta_data->>'phone'
    );
    
    -- Assign default 'free' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free');
    
    RETURN NEW;
END;
$function$;