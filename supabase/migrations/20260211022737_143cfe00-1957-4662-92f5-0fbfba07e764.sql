
-- Drop trade-related triggers first
DROP TRIGGER IF EXISTS on_trade_comment_like ON public.trade_comment_likes;
DROP TRIGGER IF EXISTS on_trade_follower ON public.trade_followers;
DROP TRIGGER IF EXISTS on_new_trade ON public.trades;
DROP TRIGGER IF EXISTS on_new_trade_admin ON public.trades;
DROP TRIGGER IF EXISTS on_trade_comment ON public.trade_comments;
DROP TRIGGER IF EXISTS on_trade_comment_like_notify ON public.trade_comment_likes;

-- Drop trade-related functions
DROP FUNCTION IF EXISTS public.update_trade_comment_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_trade_followers_count() CASCADE;
DROP FUNCTION IF EXISTS public.notify_users_new_trade() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_new_trade() CASCADE;
DROP FUNCTION IF EXISTS public.notify_trade_comment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_trade_comment_like() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_trade(trade_visibility) CASCADE;

-- Drop trade tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.trade_comment_likes CASCADE;
DROP TABLE IF EXISTS public.trade_comments CASCADE;
DROP TABLE IF EXISTS public.trade_followers CASCADE;
DROP TABLE IF EXISTS public.trade_shares CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;

-- Drop trade-related enums that are no longer needed
DROP TYPE IF EXISTS public.trade_direction CASCADE;
DROP TYPE IF EXISTS public.trade_status CASCADE;
DROP TYPE IF EXISTS public.entry_type CASCADE;
DROP TYPE IF EXISTS public.trade_visibility CASCADE;
