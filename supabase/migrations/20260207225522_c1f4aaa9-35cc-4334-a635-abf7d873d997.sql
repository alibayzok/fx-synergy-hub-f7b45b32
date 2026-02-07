-- Create USDT listing type enum
CREATE TYPE public.usdt_listing_type AS ENUM ('buy', 'sell');

-- Create USDT listings table
CREATE TABLE public.usdt_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL,
    listing_type usdt_listing_type NOT NULL,
    price NUMERIC NOT NULL,
    commission NUMERIC NOT NULL DEFAULT 0,
    min_amount NUMERIC,
    max_amount NUMERIC,
    payment_methods TEXT[] NOT NULL DEFAULT '{}',
    contact_info TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usdt_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage listings
CREATE POLICY "Only admins can insert USDT listings"
ON public.usdt_listings
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update USDT listings"
ON public.usdt_listings
FOR UPDATE
USING (is_admin());

CREATE POLICY "Only admins can delete USDT listings"
ON public.usdt_listings
FOR DELETE
USING (is_admin());

-- All authenticated users can view active listings
CREATE POLICY "Authenticated users can view active USDT listings"
ON public.usdt_listings
FOR SELECT
USING (auth.uid() IS NOT NULL AND (is_active = true OR is_admin()));

-- Trigger for updated_at
CREATE TRIGGER update_usdt_listings_updated_at
BEFORE UPDATE ON public.usdt_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();