-- Add CHECK constraints for input validation on critical tables

-- Trades: validate text lengths and numeric ranges
ALTER TABLE public.trades
  ADD CONSTRAINT chk_trades_symbol_length CHECK (length(symbol) <= 20),
  ADD CONSTRAINT chk_trades_reason_length CHECK (length(reason) <= 2000),
  ADD CONSTRAINT chk_trades_risk_note_length CHECK (length(risk_note) <= 2000),
  ADD CONSTRAINT chk_trades_alternative_length CHECK (length(alternative_scenario) <= 2000),
  ADD CONSTRAINT chk_trades_update_note_length CHECK (length(last_update_note) <= 2000),
  ADD CONSTRAINT chk_trades_entry_price_positive CHECK (entry_price > 0),
  ADD CONSTRAINT chk_trades_sl_price_positive CHECK (sl_price > 0);

-- Analyses: validate text lengths
ALTER TABLE public.analyses
  ADD CONSTRAINT chk_analyses_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT chk_analyses_content_length CHECK (length(content) <= 10000),
  ADD CONSTRAINT chk_analyses_symbol_length CHECK (length(symbol) <= 20);

-- Profiles: validate text lengths
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_display_name_length CHECK (length(display_name) <= 100),
  ADD CONSTRAINT chk_profiles_username_length CHECK (length(username) <= 50),
  ADD CONSTRAINT chk_profiles_first_name_length CHECK (length(first_name) <= 50),
  ADD CONSTRAINT chk_profiles_last_name_length CHECK (length(last_name) <= 50),
  ADD CONSTRAINT chk_profiles_phone_length CHECK (length(phone) <= 20);

-- User posts: validate content length
ALTER TABLE public.user_posts
  ADD CONSTRAINT chk_posts_content_length CHECK (length(content) <= 5000);

-- Direct messages: validate content length
ALTER TABLE public.direct_messages
  ADD CONSTRAINT chk_messages_content_length CHECK (length(content) <= 5000);

-- Room messages: validate content length
ALTER TABLE public.room_messages
  ADD CONSTRAINT chk_room_messages_content_length CHECK (length(content) <= 5000);

-- Threads: validate text lengths
ALTER TABLE public.threads
  ADD CONSTRAINT chk_threads_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT chk_threads_content_length CHECK (length(content) <= 10000);

-- Replies: validate content length
ALTER TABLE public.replies
  ADD CONSTRAINT chk_replies_content_length CHECK (length(content) <= 5000);

-- Service requests: validate field lengths
ALTER TABLE public.service_requests
  ADD CONSTRAINT chk_service_wallet_length CHECK (length(wallet_address) <= 200),
  ADD CONSTRAINT chk_service_notes_length CHECK (length(notes) <= 2000),
  ADD CONSTRAINT chk_service_amount_positive CHECK (amount IS NULL OR amount > 0);

-- Trade comments: validate content length
ALTER TABLE public.trade_comments
  ADD CONSTRAINT chk_trade_comments_length CHECK (length(content) <= 5000);

-- Post comments: validate content length
ALTER TABLE public.post_comments
  ADD CONSTRAINT chk_post_comments_length CHECK (length(content) <= 5000);