-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'vip', 'free');

-- Create trade_status enum
CREATE TYPE public.trade_status AS ENUM ('pending', 'running', 'tp_hit', 'sl_hit', 'cancelled', 'closed_manual');

-- Create trade_visibility enum
CREATE TYPE public.trade_visibility AS ENUM ('free', 'vip');

-- Create asset_type enum
CREATE TYPE public.asset_type AS ENUM ('forex', 'metals', 'crypto');

-- Create trade_direction enum
CREATE TYPE public.trade_direction AS ENUM ('buy', 'sell');

-- Create entry_type enum
CREATE TYPE public.entry_type AS ENUM ('market', 'limit', 'stop');

-- Create timeframe enum
CREATE TYPE public.timeframe AS ENUM ('M5', 'M15', 'H1', 'H4', 'D1');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create trades table
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    direction trade_direction NOT NULL,
    entry_type entry_type NOT NULL DEFAULT 'market',
    entry_price DECIMAL(20, 8) NOT NULL,
    sl_price DECIMAL(20, 8) NOT NULL,
    tp_prices DECIMAL(20, 8)[] NOT NULL DEFAULT '{}',
    timeframe timeframe NOT NULL DEFAULT 'H1',
    risk_note TEXT,
    reason TEXT NOT NULL,
    alternative_scenario TEXT,
    status trade_status NOT NULL DEFAULT 'pending',
    visibility trade_visibility NOT NULL DEFAULT 'free',
    attachments TEXT[],
    last_update_note TEXT,
    followers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Helper function to check if current user is VIP
CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'vip')
$$;

-- Helper function to check if user can access a trade
CREATE OR REPLACE FUNCTION public.can_access_trade(trade_visibility trade_visibility)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE 
            WHEN public.is_admin() THEN true
            WHEN trade_visibility = 'free' THEN true
            WHEN trade_visibility = 'vip' AND public.is_vip() THEN true
            ELSE false
        END
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- User Roles RLS Policies
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin() AND user_id != auth.uid());

-- Trades RLS Policies
CREATE POLICY "Users can view trades based on visibility"
ON public.trades FOR SELECT
TO authenticated
USING (public.can_access_trade(visibility));

CREATE POLICY "Only admins can insert trades"
ON public.trades FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update trades"
ON public.trades FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can delete trades"
ON public.trades FOR DELETE
TO authenticated
USING (public.is_admin());

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    
    -- Assign default 'free' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();