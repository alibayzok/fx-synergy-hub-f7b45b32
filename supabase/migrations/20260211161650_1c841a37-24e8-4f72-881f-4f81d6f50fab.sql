
-- Add card_fund to service_type enum
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'card_fund';
