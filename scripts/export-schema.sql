-- ============================================================
-- ASSASSIN FX - Database Schema Export (Complete)
-- ============================================================
-- 
-- هذا الملف يحتوي على كامل هيكل قاعدة البيانات
-- نفّذه في Supabase SQL Editor لإنشاء جميع الجداول والسياسات
--
-- ترتيب التنفيذ:
-- 1. Enums (أنواع البيانات المخصصة)
-- 2. Tables (الجداول)
-- 3. Views (العروض)
-- 4. Functions (الدوال)
-- 5. Triggers (المشغّلات)
-- 6. RLS Policies (سياسات الأمان)
-- 7. Indexes (الفهارس)
-- 8. Realtime (البث المباشر)
-- 9. Storage (التخزين)
--
-- ============================================================


-- ============================================================
-- 1. ENUMS (أنواع البيانات المخصصة)
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'vip', 'free');
CREATE TYPE public.asset_type AS ENUM ('forex', 'metals', 'crypto');
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.entry_type AS ENUM ('market', 'limit', 'stop');
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.post_visibility AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');
CREATE TYPE public.privacy_setting AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');
CREATE TYPE public.room_membership_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
CREATE TYPE public.room_role AS ENUM ('member', 'moderator', 'owner');
CREATE TYPE public.service_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'completed');
CREATE TYPE public.service_type AS ENUM ('broker_deposit', 'broker_withdraw', 'usdt_buy', 'usdt_sell', 'broker_account');
CREATE TYPE public.timeframe AS ENUM ('M5', 'M15', 'H1', 'H4', 'D1');
CREATE TYPE public.trade_direction AS ENUM ('buy', 'sell');
CREATE TYPE public.trade_status AS ENUM ('pending', 'running', 'tp_hit', 'sl_hit', 'cancelled', 'closed_manual');
CREATE TYPE public.trade_visibility AS ENUM ('free', 'vip');
CREATE TYPE public.usdt_listing_type AS ENUM ('buy', 'sell');


-- ============================================================
-- 2. TABLES (الجداول)
-- ============================================================

-- جدول الملفات الشخصية
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    username TEXT,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    country TEXT,
    phone TEXT,
    language TEXT DEFAULT 'ar',
    onboarding_completed BOOLEAN DEFAULT false,
    trading_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- جدول الصفقات
CREATE TABLE public.trades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID,
    symbol TEXT NOT NULL,
    asset_type public.asset_type NOT NULL,
    direction public.trade_direction NOT NULL,
    entry_type public.entry_type NOT NULL DEFAULT 'market',
    entry_price NUMERIC NOT NULL,
    sl_price NUMERIC NOT NULL,
    tp_prices NUMERIC[] NOT NULL DEFAULT '{}',
    timeframe public.timeframe NOT NULL DEFAULT 'H1',
    reason TEXT NOT NULL,
    risk_note TEXT,
    alternative_scenario TEXT,
    attachments TEXT[],
    status public.trade_status NOT NULL DEFAULT 'pending',
    visibility public.trade_visibility NOT NULL DEFAULT 'free',
    last_update_note TEXT,
    followers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تعليقات الصفقات
CREATE TABLE public.trade_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.trade_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعجابات تعليقات الصفقات
CREATE TABLE public.trade_comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.trade_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- جدول متابعي الصفقات
CREATE TABLE public.trade_followers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trade_id, user_id)
);

-- جدول مشاركات الصفقات
CREATE TABLE public.trade_shares (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    share_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التحليلات
CREATE TABLE public.analyses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe DEFAULT 'H4',
    visibility public.trade_visibility NOT NULL DEFAULT 'free',
    attachments TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعجابات التحليلات
CREATE TABLE public.analysis_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(analysis_id, user_id)
);

-- جدول منشورات المستخدمين
CREATE TABLE public.user_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe,
    visibility public.post_visibility NOT NULL DEFAULT 'everyone',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    moderation_status TEXT DEFAULT 'approved',
    moderation_reason TEXT,
    moderated_by UUID,
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعجابات المنشورات
CREATE TABLE public.post_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- جدول تعليقات المنشورات
CREATE TABLE public.post_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول غرف المجتمع
CREATE TABLE public.community_rooms (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    icon TEXT DEFAULT 'MessageSquare',
    color TEXT DEFAULT 'blue',
    is_private BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول أعضاء الغرف
CREATE TABLE public.room_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role public.room_role DEFAULT 'member',
    status public.room_membership_status DEFAULT 'pending',
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- جدول طلبات الانضمام للغرف
CREATE TABLE public.room_join_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT,
    status public.room_membership_status DEFAULT 'pending',
    review_note TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول رسائل الغرف
CREATE TABLE public.room_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول المواضيع
CREATE TABLE public.threads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    room_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT NOT NULL,
    replies_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    has_best_answer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول الردود
CREATE TABLE public.replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول إعجابات الردود
CREATE TABLE public.reply_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_id UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- جدول فئات التعلم
CREATE TABLE public.learning_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    color TEXT NOT NULL DEFAULT 'blue',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول كورسات التعلم
CREATE TABLE public.learning_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.learning_categories(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    level public.course_level NOT NULL DEFAULT 'beginner',
    is_vip BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول دروس التعلم
CREATE TABLE public.learning_lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL DEFAULT '',
    content_en TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT 'text',
    video_url TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المحادثات
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL,
    name TEXT,
    type public.conversation_type NOT NULL DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المشاركين في المحادثات
CREATE TABLE public.conversation_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(conversation_id, user_id)
);

-- جدول الرسائل المباشرة
CREATE TABLE public.direct_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المتابعات
CREATE TABLE public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- جدول طلبات الصداقة
CREATE TABLE public.friend_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status public.friend_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(sender_id, receiver_id)
);

-- جدول إعدادات الخصوصية
CREATE TABLE public.user_privacy_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    messaging_privacy public.privacy_setting NOT NULL DEFAULT 'everyone',
    friends_visibility public.privacy_setting NOT NULL DEFAULT 'everyone',
    show_online_status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول طلبات الخدمات
CREATE TABLE public.service_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type public.service_type NOT NULL,
    amount NUMERIC,
    network TEXT,
    wallet_address TEXT,
    payment_method TEXT,
    notes TEXT,
    admin_notes TEXT,
    status public.service_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعلانات USDT
CREATE TABLE public.usdt_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL,
    listing_type public.usdt_listing_type NOT NULL,
    price NUMERIC NOT NULL,
    min_amount NUMERIC,
    max_amount NUMERIC,
    commission NUMERIC NOT NULL DEFAULT 0,
    payment_methods TEXT[] NOT NULL DEFAULT '{}',
    contact_info TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المحتوى المخالف
CREATE TABLE public.flagged_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    user_id UUID NOT NULL,
    flag_reason TEXT NOT NULL,
    flagged_url TEXT,
    confidence NUMERIC,
    predictions JSONB,
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إشعارات المستخدمين
CREATE TABLE public.user_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول إشعارات الأدمن
CREATE TABLE public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات التطبيق
CREATE TABLE public.app_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT NOT NULL DEFAULT 'text',
    label_ar TEXT NOT NULL,
    label_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by UUID
);

-- جدول تذاكر الدعم الفني
CREATE TABLE public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    assigned_to UUID,
    escalated_to UUID,
    escalated_by UUID,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل الدعم الفني
CREATE TABLE public.support_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول وكلاء الدعم الفني
CREATE TABLE public.support_agents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. VIEWS (العروض)
-- ============================================================

-- عرض الملفات الشخصية العامة (بدون بيانات حساسة)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
    id, user_id, username, display_name, first_name, last_name,
    avatar_url, country, language, created_at, updated_at
FROM public.profiles;

-- عرض الملفات الشخصية للأدمن (مع إخفاء أرقام الهاتف)
CREATE OR REPLACE VIEW public.profiles_admin_view AS
SELECT 
    id, user_id, username, display_name, first_name, last_name,
    avatar_url, country, public.mask_phone_number(phone) as phone,
    language, onboarding_completed, trading_preferences,
    created_at, updated_at
FROM public.profiles;


-- ============================================================
-- 4. FUNCTIONS (الدوال)
-- ============================================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- دالة التحقق من الدور
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- دالة التحقق من الأدمن
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

-- دالة التحقق من VIP
CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'vip') $$;

-- دالة إخفاء رقم الهاتف
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
    SELECT CASE
        WHEN phone IS NULL THEN NULL
        WHEN length(phone) <= 4 THEN '****'
        ELSE concat(repeat('*', length(phone) - 4), right(phone, 4))
    END
$$;

-- دالة التحقق من الوصول للصفقة
CREATE OR REPLACE FUNCTION public.can_access_trade(trade_visibility trade_visibility)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT CASE 
        WHEN public.is_admin() THEN true
        WHEN trade_visibility = 'free' AND auth.uid() IS NOT NULL THEN true
        WHEN trade_visibility = 'vip' AND public.is_vip() THEN true
        ELSE false
    END
$$;

-- دالة التحقق من الصداقة
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.friend_requests
        WHERE status = 'accepted'
        AND ((sender_id = user1_id AND receiver_id = user2_id)
             OR (sender_id = user2_id AND receiver_id = user1_id))
    )
$$;

-- دالة التحقق من إمكانية عرض المنشور
CREATE OR REPLACE FUNCTION public.can_view_post(post_user_id uuid, post_visibility post_visibility)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF auth.uid() = post_user_id THEN RETURN TRUE; END IF;
    IF public.is_admin() THEN RETURN TRUE; END IF;
    CASE post_visibility
        WHEN 'everyone' THEN RETURN TRUE;
        WHEN 'nobody' THEN RETURN FALSE;
        WHEN 'friends_only' THEN RETURN public.are_friends(auth.uid(), post_user_id);
        WHEN 'followers_only' THEN
            RETURN EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = post_user_id);
        ELSE RETURN FALSE;
    END CASE;
END;
$$;

-- دالة التحقق من إمكانية إرسال رسالة
CREATE OR REPLACE FUNCTION public.can_message_user(target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    priv public.privacy_setting;
BEGIN
    SELECT messaging_privacy INTO priv FROM public.user_privacy_settings WHERE user_id = target_user_id;
    IF priv IS NULL THEN RETURN true; END IF;
    CASE priv
        WHEN 'everyone' THEN RETURN true;
        WHEN 'nobody' THEN RETURN false;
        WHEN 'friends_only' THEN RETURN public.are_friends(auth.uid(), target_user_id);
        WHEN 'followers_only' THEN
            RETURN EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = target_user_id);
        ELSE RETURN true;
    END CASE;
END;
$$;

-- دوال المحادثات
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = conv_id AND user_id = check_user_id) $$;

CREATE OR REPLACE FUNCTION public.is_conversation_admin(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = conv_id AND user_id = check_user_id AND is_admin = true) $$;

CREATE OR REPLACE FUNCTION public.is_conversation_creator(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.conversations WHERE id = conv_id AND created_by = check_user_id) $$;

-- دوال الغرف
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id text, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id AND status = 'approved') $$;

CREATE OR REPLACE FUNCTION public.is_room_moderator(p_room_id text, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = p_room_id AND user_id = p_user_id AND role IN ('moderator', 'owner') AND status = 'approved'
    ) OR public.is_admin()
$$;

CREATE OR REPLACE FUNCTION public.can_access_room(p_room_id text, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_admin() OR
        EXISTS (SELECT 1 FROM public.community_rooms WHERE id = p_room_id AND is_private = false) OR
        public.is_room_member(p_room_id, p_user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_thread_room_id(p_thread_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT room_id FROM public.threads WHERE id = p_thread_id $$;

-- دالة إنشاء ملف شخصي للمستخدم الجديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'free');
    RETURN NEW;
END;
$$;

-- دوال تحديث العدادات
CREATE OR REPLACE FUNCTION public.update_thread_replies_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.threads SET replies_count = replies_count + 1 WHERE id = NEW.thread_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.threads SET replies_count = replies_count - 1 WHERE id = OLD.thread_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_reply_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.replies SET likes_count = likes_count - 1 WHERE id = OLD.reply_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_trade_comment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.trade_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.trade_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_trade_followers_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.trades SET followers_count = followers_count + 1 WHERE id = NEW.trade_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.trades SET followers_count = followers_count - 1 WHERE id = OLD.trade_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_analysis_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.analyses SET likes_count = likes_count + 1 WHERE id = NEW.analysis_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.analyses SET likes_count = likes_count - 1 WHERE id = OLD.analysis_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.user_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.user_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id; RETURN OLD;
    END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN UPDATE public.user_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN UPDATE public.user_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id; RETURN OLD;
    END IF;
END; $$;

-- دوال الإشعارات
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES ('new_user', 'مستخدم جديد', 'انضم ' || COALESCE(NEW.display_name, 'مستخدم جديد') || ' إلى المنصة',
        jsonb_build_object('user_id', NEW.user_id, 'display_name', NEW.display_name, 'country', NEW.country));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_trade()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES ('trade_created', 'صفقة جديدة', 'تم إنشاء صفقة ' || NEW.direction || ' على ' || NEW.symbol,
        jsonb_build_object('trade_id', NEW.id, 'symbol', NEW.symbol, 'direction', NEW.direction, 'visibility', NEW.visibility));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_users_new_trade()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    user_record RECORD;
    trade_type TEXT;
BEGIN
    trade_type := CASE WHEN NEW.direction = 'buy' THEN 'شراء' ELSE 'بيع' END;
    FOR user_record IN 
        SELECT DISTINCT ur.user_id FROM public.user_roles ur
        WHERE (NEW.visibility = 'free') OR (NEW.visibility = 'vip' AND ur.role IN ('vip', 'admin'))
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (user_record.user_id, 'new_trade', 'صفقة جديدة 🔔',
            'صفقة ' || trade_type || ' على ' || NEW.symbol || ' - ' || NEW.timeframe,
            jsonb_build_object('trade_id', NEW.id, 'symbol', NEW.symbol, 'direction', NEW.direction, 'visibility', NEW.visibility, 'entry_price', NEW.entry_price));
    END LOOP;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_service_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    user_display_name TEXT; request_title TEXT; request_message TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    CASE NEW.type
        WHEN 'broker_account' THEN request_title := 'طلب فتح حساب تداول'; request_message := user_display_name || ' يطلب فتح حساب تداول جديد';
        WHEN 'broker_deposit' THEN request_title := 'طلب إيداع للوسيط'; request_message := user_display_name || ' يطلب إيداع بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'broker_withdraw' THEN request_title := 'طلب سحب من الوسيط'; request_message := user_display_name || ' يطلب سحب بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_buy' THEN request_title := 'طلب شراء USDT'; request_message := user_display_name || ' يطلب شراء USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_sell' THEN request_title := 'طلب بيع USDT'; request_message := user_display_name || ' يطلب بيع USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
    END CASE;
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES ('service_request', request_title, request_message,
        jsonb_build_object('request_id', NEW.id, 'user_id', NEW.user_id, 'type', NEW.type, 'amount', NEW.amount, 'network', NEW.network));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_thread_owner_on_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE thread_owner_id UUID; thread_title TEXT; replier_name TEXT;
BEGIN
    SELECT user_id, title INTO thread_owner_id, thread_title FROM public.threads WHERE id = NEW.thread_id;
    IF thread_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO replier_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (thread_owner_id, 'reply', 'رد جديد', replier_name || ' رد على موضوعك: ' || LEFT(thread_title, 50),
        jsonb_build_object('thread_id', NEW.thread_id, 'reply_id', NEW.id, 'replier_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT; recipient RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
    FOR recipient IN SELECT user_id FROM public.conversation_participants WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (recipient.user_id, 'message', 'رسالة جديدة', sender_name || ': ' || LEFT(NEW.content, 50),
            jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id));
    END LOOP;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (NEW.receiver_id, 'friend_request', 'طلب صداقة جديد', sender_name || ' أرسل لك طلب صداقة',
            jsonb_build_object('request_id', NEW.id, 'sender_id', NEW.sender_id));
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.receiver_id;
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (NEW.sender_id, 'friend_accepted', 'تم قبول طلب الصداقة', sender_name || ' قبل طلب صداقتك',
            jsonb_build_object('request_id', NEW.id, 'friend_id', NEW.receiver_id));
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner_id UUID; liker_name TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.user_posts WHERE id = NEW.post_id;
    IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (post_owner_id, 'post_like', 'إعجاب جديد ❤️', liker_name || ' أعجب بمنشورك',
        jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner_id UUID; commenter_name TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.user_posts WHERE id = NEW.post_id;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
    IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (post_owner_id, 'post_comment', 'تعليق جديد 💬', commenter_name || ' علق على منشورك: ' || LEFT(NEW.content, 30),
        jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_room_join_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requester_name TEXT; room_name TEXT; moderator RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO requester_name FROM public.profiles WHERE user_id = NEW.user_id;
    SELECT name_ar INTO room_name FROM public.community_rooms WHERE id = NEW.room_id;
    FOR moderator IN SELECT user_id FROM public.room_members WHERE room_id = NEW.room_id AND role IN ('moderator', 'owner') AND status = 'approved'
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (moderator.user_id, 'room_join_request', 'طلب انضمام جديد', requester_name || ' يطلب الانضمام إلى غرفة ' || room_name,
            jsonb_build_object('request_id', NEW.id, 'room_id', NEW.room_id, 'user_id', NEW.user_id));
    END LOOP;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_room_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE room_name TEXT; status_text TEXT; title_text TEXT;
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        SELECT name_ar INTO room_name FROM public.community_rooms WHERE id = NEW.room_id;
        IF NEW.status = 'approved' THEN
            status_text := 'تم قبول طلب انضمامك إلى غرفة ' || room_name; title_text := 'تم قبول طلبك ✅';
            INSERT INTO public.room_members (room_id, user_id, role, status, approved_by, approved_at)
            VALUES (NEW.room_id, NEW.user_id, 'member', 'approved', NEW.reviewed_by, now())
            ON CONFLICT (room_id, user_id) DO UPDATE SET status = 'approved', approved_by = NEW.reviewed_by, approved_at = now();
        ELSE
            status_text := 'تم رفض طلب انضمامك إلى غرفة ' || room_name; title_text := 'تم رفض طلبك ❌';
        END IF;
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (NEW.user_id, 'room_request_status', title_text, status_text,
            jsonb_build_object('request_id', NEW.id, 'room_id', NEW.room_id, 'status', NEW.status));
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_flagged_content()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; content_type_ar TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    content_type_ar := CASE NEW.content_type WHEN 'post' THEN 'منشور' WHEN 'room_message' THEN 'رسالة' WHEN 'thread' THEN 'موضوع' WHEN 'reply' THEN 'رد' ELSE NEW.content_type END;
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES ('flagged_content', '🚨 محتوى مخالف', 'تم اكتشاف ' || content_type_ar || ' يحتوي على محتوى غير لائق من ' || user_display_name,
        jsonb_build_object('flagged_id', NEW.id, 'content_type', NEW.content_type, 'content_id', NEW.content_id, 'user_id', NEW.user_id, 'reason', NEW.flag_reason));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_analysis_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE analysis_owner_id UUID; liker_name TEXT; analysis_title TEXT;
BEGIN
    SELECT created_by, title INTO analysis_owner_id, analysis_title FROM public.analyses WHERE id = NEW.analysis_id;
    IF analysis_owner_id IS NULL OR analysis_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (analysis_owner_id, 'analysis_like', 'إعجاب بتحليلك 📊', liker_name || ' أعجب بتحليلك: ' || LEFT(analysis_title, 30),
        jsonb_build_object('analysis_id', NEW.analysis_id, 'liker_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_trade_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE follower_record RECORD; commenter_name TEXT; trade_symbol TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
    SELECT symbol INTO trade_symbol FROM public.trades WHERE id = NEW.trade_id;
    FOR follower_record IN SELECT user_id FROM public.trade_followers WHERE trade_id = NEW.trade_id AND user_id != NEW.user_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (follower_record.user_id, 'trade_comment', 'تعليق جديد على صفقة 💬', commenter_name || ' علق على صفقة ' || trade_symbol,
            jsonb_build_object('trade_id', NEW.trade_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id));
    END LOOP;
    RETURN NEW;
END; $$;

-- دوال الدعم الفني
CREATE OR REPLACE FUNCTION public.is_support_agent(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.support_agents WHERE user_id = p_user_id AND is_active = true) OR public.is_admin() $$;

CREATE OR REPLACE FUNCTION public.close_stale_support_tickets()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE closed_count integer;
BEGIN
    UPDATE public.support_tickets SET status = 'closed', updated_at = now() WHERE status = 'open' AND updated_at < now() - interval '4 hours';
    GET DIAGNOSTICS closed_count = ROW_COUNT;
    RETURN closed_count;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_support_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; agent RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    FOR agent IN SELECT user_id FROM public.support_agents WHERE is_active = true
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (agent.user_id, 'support_ticket', 'تذكرة دعم جديدة 🎫', user_display_name || ': ' || LEFT(NEW.subject, 50),
            jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id));
    END LOOP;
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES ('support_ticket', 'تذكرة دعم جديدة 🎫', user_display_name || ' أرسل تذكرة دعم: ' || LEFT(NEW.subject, 50),
        jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_ticket_transfer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT; target_user_id UUID; action_text TEXT;
BEGIN
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) OR
       (OLD.escalated_to IS DISTINCT FROM NEW.escalated_to AND NEW.escalated_to IS NOT NULL) THEN
        SELECT COALESCE(display_name, username, 'موظف دعم') INTO sender_name FROM public.profiles WHERE user_id = COALESCE(NEW.escalated_by, auth.uid());
        IF OLD.escalated_to IS DISTINCT FROM NEW.escalated_to AND NEW.escalated_to IS NOT NULL THEN
            target_user_id := NEW.escalated_to; action_text := 'تم تصعيد تذكرة إليك';
        ELSE
            target_user_id := NEW.assigned_to; action_text := 'تم تحويل تذكرة إليك';
        END IF;
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (target_user_id, 'support_ticket', action_text || ' 🎫', sender_name || ': ' || LEFT(NEW.subject, 50),
            jsonb_build_object('ticket_id', NEW.id, 'transferred_by', COALESCE(NEW.escalated_by, auth.uid()), 'reason', NEW.escalation_reason));
    END IF;
    RETURN NEW;
END; $$;


-- ============================================================
-- 5. TRIGGERS (المشغّلات)
-- ============================================================

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers تحديث updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON public.user_privacy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_usdt_listings_updated_at BEFORE UPDATE ON public.usdt_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_replies_updated_at BEFORE UPDATE ON public.replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_comments_updated_at BEFORE UPDATE ON public.trade_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_posts_updated_at BEFORE UPDATE ON public.user_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_categories_updated_at BEFORE UPDATE ON public.learning_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_courses_updated_at BEFORE UPDATE ON public.learning_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learning_lessons_updated_at BEFORE UPDATE ON public.learning_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers الإشعارات
CREATE TRIGGER on_new_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();
CREATE TRIGGER on_new_trade AFTER INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_trade();
CREATE TRIGGER on_new_trade_notify_users AFTER INSERT ON public.trades FOR EACH ROW EXECUTE FUNCTION public.notify_users_new_trade();
CREATE TRIGGER on_new_service_request AFTER INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_service_request();
CREATE TRIGGER on_new_reply AFTER INSERT ON public.replies FOR EACH ROW EXECUTE FUNCTION public.notify_thread_owner_on_reply();
CREATE TRIGGER on_new_direct_message AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
CREATE TRIGGER on_friend_request_change AFTER INSERT OR UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();
CREATE TRIGGER on_flagged_content AFTER INSERT ON public.flagged_content FOR EACH ROW EXECUTE FUNCTION public.notify_admin_flagged_content();
CREATE TRIGGER on_new_support_ticket AFTER INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_support_ticket();
CREATE TRIGGER on_support_ticket_transfer AFTER UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_transfer();
CREATE TRIGGER on_room_join_request AFTER INSERT ON public.room_join_requests FOR EACH ROW EXECUTE FUNCTION public.notify_room_join_request();
CREATE TRIGGER on_room_request_status_change AFTER UPDATE ON public.room_join_requests FOR EACH ROW EXECUTE FUNCTION public.notify_room_request_status();

-- Triggers تحديث updated_at للجداول الجديدة
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 6. ROW LEVEL SECURITY (سياسات الأمان)
-- ============================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view all profiles via view" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- === user_roles ===
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin() AND user_id <> auth.uid());

-- === trades ===
CREATE POLICY "Users can view trades based on visibility" ON public.trades FOR SELECT USING (can_access_trade(visibility));
CREATE POLICY "Only admins can insert trades" ON public.trades FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update trades" ON public.trades FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete trades" ON public.trades FOR DELETE USING (is_admin());

-- === trade_comments ===
CREATE POLICY "Users can view comments on accessible trades" ON public.trade_comments FOR SELECT USING (EXISTS (SELECT 1 FROM trades t WHERE t.id = trade_comments.trade_id AND can_access_trade(t.visibility)));
CREATE POLICY "Users can comment on accessible trades" ON public.trade_comments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM trades t WHERE t.id = trade_comments.trade_id AND can_access_trade(t.visibility)));
CREATE POLICY "Users can update own comments" ON public.trade_comments FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own comments" ON public.trade_comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === trade_comment_likes ===
CREATE POLICY "Users can view comment likes" ON public.trade_comment_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can like comments" ON public.trade_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.trade_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- === trade_followers ===
CREATE POLICY "Users can view trade followers" ON public.trade_followers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can follow trades they can access" ON public.trade_followers FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM trades t WHERE t.id = trade_followers.trade_id AND can_access_trade(t.visibility)));
CREATE POLICY "Users can unfollow" ON public.trade_followers FOR DELETE USING (auth.uid() = user_id);

-- === trade_shares ===
CREATE POLICY "Users can view own shares" ON public.trade_shares FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can share accessible trades" ON public.trade_shares FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM trades t WHERE t.id = trade_shares.trade_id AND can_access_trade(t.visibility)));

-- === analyses ===
CREATE POLICY "Users can view analyses based on visibility" ON public.analyses FOR SELECT USING (can_access_trade(visibility));
CREATE POLICY "Only admins can insert analyses" ON public.analyses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update analyses" ON public.analyses FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete analyses" ON public.analyses FOR DELETE USING (is_admin());

-- === analysis_likes ===
CREATE POLICY "Users can view analysis likes" ON public.analysis_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can like analyses" ON public.analysis_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.analysis_likes FOR DELETE USING (auth.uid() = user_id);

-- === user_posts ===
CREATE POLICY "Users can view posts based on visibility" ON public.user_posts FOR SELECT USING (can_view_post(user_id, visibility));
CREATE POLICY "Users can create own posts" ON public.user_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.user_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.user_posts FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === post_likes ===
CREATE POLICY "Users can view post likes" ON public.post_likes FOR SELECT USING (EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_likes.post_id AND can_view_post(p.user_id, p.visibility)));
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_likes.post_id AND can_view_post(p.user_id, p.visibility)));
CREATE POLICY "Users can remove own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- === post_comments ===
CREATE POLICY "Users can view post comments" ON public.post_comments FOR SELECT USING (EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_comments.post_id AND can_view_post(p.user_id, p.visibility)));
CREATE POLICY "Users can comment on posts" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_comments.post_id AND can_view_post(p.user_id, p.visibility)));
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === community_rooms ===
CREATE POLICY "Everyone can view rooms" ON public.community_rooms FOR SELECT USING (true);
CREATE POLICY "Only admins can create rooms" ON public.community_rooms FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update rooms" ON public.community_rooms FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete rooms" ON public.community_rooms FOR DELETE USING (is_admin());

-- === room_members ===
CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT USING (can_access_room(room_id) OR user_id = auth.uid() OR is_room_moderator(room_id));
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "Moderators and admins can update members" ON public.room_members FOR UPDATE USING (is_room_moderator(room_id) OR user_id = auth.uid());
CREATE POLICY "Admins can delete members" ON public.room_members FOR DELETE USING (is_admin() OR is_room_moderator(room_id));

-- === room_join_requests ===
CREATE POLICY "Users can view own requests" ON public.room_join_requests FOR SELECT USING (user_id = auth.uid() OR is_room_moderator(room_id) OR is_admin());
CREATE POLICY "Users can create join requests" ON public.room_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Moderators can update requests" ON public.room_join_requests FOR UPDATE USING (is_room_moderator(room_id) OR is_admin());
CREATE POLICY "Users can delete own requests" ON public.room_join_requests FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- === room_messages ===
CREATE POLICY "Users can view room messages" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.room_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users or moderators can delete messages" ON public.room_messages FOR DELETE USING (auth.uid() = user_id OR is_admin() OR is_room_moderator(room_id));

-- === threads ===
CREATE POLICY "Users can view all threads" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Users can create threads" ON public.threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own threads" ON public.threads FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own threads" ON public.threads FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === replies ===
CREATE POLICY "Users can view all replies" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.replies FOR UPDATE USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users or moderators can delete replies" ON public.replies FOR DELETE USING (auth.uid() = user_id OR is_admin() OR is_room_moderator(get_thread_room_id(thread_id)));

-- === reply_likes ===
CREATE POLICY "Users can view all likes" ON public.reply_likes FOR SELECT USING (true);
CREATE POLICY "Users can like replies" ON public.reply_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.reply_likes FOR DELETE USING (auth.uid() = user_id);

-- === learning_categories ===
CREATE POLICY "Admins can manage categories" ON public.learning_categories FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can view active categories" ON public.learning_categories FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- === learning_courses ===
CREATE POLICY "Admins can manage courses" ON public.learning_courses FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can view published courses" ON public.learning_courses FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- === learning_lessons ===
CREATE POLICY "Admins can manage lessons" ON public.learning_lessons FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users can view published lessons" ON public.learning_lessons FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- === conversations ===
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (is_conversation_participant(id) OR created_by = auth.uid());
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Conversation admins can update" ON public.conversations FOR UPDATE USING (is_conversation_admin(id));

-- === conversation_participants ===
CREATE POLICY "Participants can view their conversations" ON public.conversation_participants FOR SELECT USING (is_conversation_participant(conversation_id));
CREATE POLICY "Conversation creator can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR is_conversation_creator(conversation_id) OR is_conversation_admin(conversation_id));
CREATE POLICY "Participants can update their own record" ON public.conversation_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave conversations" ON public.conversation_participants FOR DELETE USING (auth.uid() = user_id);

-- === direct_messages ===
CREATE POLICY "Participants can view messages" ON public.direct_messages FOR SELECT USING (is_conversation_participant(conversation_id));
CREATE POLICY "Participants can send messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_conversation_participant(conversation_id));
CREATE POLICY "Senders can update own messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Senders can delete own messages" ON public.direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- === follows ===
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- === friend_requests ===
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Users can delete own requests" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- === user_privacy_settings ===
CREATE POLICY "Users can view all privacy settings" ON public.user_privacy_settings FOR SELECT USING (true);
CREATE POLICY "Users can insert own privacy settings" ON public.user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings" ON public.user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- === service_requests ===
CREATE POLICY "Users can view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can update service requests" ON public.service_requests FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete service requests" ON public.service_requests FOR DELETE USING (is_admin());

-- === usdt_listings ===
CREATE POLICY "Authenticated users can view active USDT listings" ON public.usdt_listings FOR SELECT USING (auth.uid() IS NOT NULL AND (is_active = true OR is_admin()));
CREATE POLICY "Only admins can insert USDT listings" ON public.usdt_listings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update USDT listings" ON public.usdt_listings FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete USDT listings" ON public.usdt_listings FOR DELETE USING (is_admin());

-- === flagged_content ===
CREATE POLICY "Admins can view flagged content" ON public.flagged_content FOR SELECT USING (is_admin());
CREATE POLICY "Users can insert flagged content for their own posts" ON public.flagged_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update flagged content" ON public.flagged_content FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete flagged content" ON public.flagged_content FOR DELETE USING (is_admin());

-- === user_notifications ===
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.user_notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);

-- === admin_notifications ===
CREATE POLICY "Only admins can view notifications" ON public.admin_notifications FOR SELECT USING (is_admin());
CREATE POLICY "Only admins can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update notifications" ON public.admin_notifications FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete notifications" ON public.admin_notifications FOR DELETE USING (is_admin());
-- === app_settings ===
CREATE POLICY "Anyone can view non-secret settings" ON public.app_settings FOR SELECT USING (setting_key !~~ '%api_key%' AND setting_key !~~ '%secret%');
CREATE POLICY "Admins can view secret settings" ON public.app_settings FOR SELECT USING ((setting_key ~~ '%api_key%' OR setting_key ~~ '%secret%') AND is_admin());
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete settings" ON public.app_settings FOR DELETE USING (is_admin());

-- === support_tickets ===
CREATE POLICY "Users and agents can view tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR is_support_agent());
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners and agents can update tickets" ON public.support_tickets FOR UPDATE USING (is_support_agent() OR auth.uid() = user_id);
CREATE POLICY "Agents can delete tickets" ON public.support_tickets FOR DELETE USING (is_support_agent());

-- === support_messages ===
CREATE POLICY "Users and agents can view messages" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR is_support_agent())));
CREATE POLICY "Users and agents can send messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR is_support_agent())));
CREATE POLICY "Agents can delete messages" ON public.support_messages FOR DELETE USING (is_support_agent() OR auth.uid() = sender_id);

-- === support_agents ===
CREATE POLICY "Admins can manage support agents" ON public.support_agents FOR ALL USING (is_admin());
CREATE POLICY "Agents can view themselves" ON public.support_agents FOR SELECT USING (auth.uid() = user_id);


-- ============================================================
-- 7. INDEXES (الفهارس)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_visibility ON public.trades(visibility);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_comments_trade_id ON public.trade_comments(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_followers_trade_id ON public.trade_followers(trade_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON public.user_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON public.user_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_rooms_id ON public.community_rooms(id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_usdt_listings_is_active ON public.usdt_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_threads_room_id ON public.threads(room_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON public.threads(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON public.replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON public.user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_learning_courses_category_id ON public.learning_courses(category_id);
CREATE INDEX IF NOT EXISTS idx_learning_lessons_course_id ON public.learning_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_flagged_content_user_id ON public.flagged_content(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_agents_user_id ON public.support_agents(user_id);


-- ============================================================
-- 8. REALTIME (البث المباشر)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usdt_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;


-- ============================================================
-- 9. STORAGE (التخزين)
-- ============================================================

-- إنشاء buckets للتخزين
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('analysis-attachments', 'analysis-attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-attachments', 'post-attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-videos', 'lesson-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-assets', 'cms-assets', true);

-- سياسات التخزين للصور الشخصية
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- سياسات تخزين فيديوهات الدروس
CREATE POLICY "Lesson videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'lesson-videos');
CREATE POLICY "Only admins can upload lesson videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lesson-videos' AND public.is_admin());
CREATE POLICY "Only admins can update lesson videos" ON storage.objects FOR UPDATE USING (bucket_id = 'lesson-videos' AND public.is_admin());
CREATE POLICY "Only admins can delete lesson videos" ON storage.objects FOR DELETE USING (bucket_id = 'lesson-videos' AND public.is_admin());

-- سياسات تخزين مرفقات الدعم الفني
CREATE POLICY "Support attachments accessible by ticket participants" ON storage.objects FOR SELECT USING (bucket_id = 'support-attachments' AND (public.is_support_agent() OR auth.uid()::text = (storage.foldername(name))[1]));
CREATE POLICY "Users can upload support attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.uid() IS NOT NULL);

-- سياسات تخزين أصول CMS
CREATE POLICY "CMS assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'cms-assets');
CREATE POLICY "Only admins can upload CMS assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cms-assets' AND public.is_admin());
CREATE POLICY "Only admins can update CMS assets" ON storage.objects FOR UPDATE USING (bucket_id = 'cms-assets' AND public.is_admin());
CREATE POLICY "Only admins can delete CMS assets" ON storage.objects FOR DELETE USING (bucket_id = 'cms-assets' AND public.is_admin());


-- ============================================================
-- 10. SEED DATA (بيانات أولية)
-- ============================================================

-- إنشاء الغرف الافتراضية
INSERT INTO public.community_rooms (id, name, name_ar, description, description_ar, icon, color, requires_approval) VALUES
    ('general', 'General Discussion', 'المناقشات العامة', 'General discussions about trading and markets', 'مناقشات عامة حول التداول والأسواق', 'MessageSquare', 'blue', true),
    ('learning', 'Learning & Development', 'التعلم والتطوير', 'Lessons and tips for beginners and pros', 'دروس ونصائح للمبتدئين والمحترفين', 'GraduationCap', 'green', false),
    ('vip', 'VIP Room', 'غرفة VIP', 'Exclusive discussions for VIP members', 'مناقشات حصرية لأعضاء VIP', 'Crown', 'gold', true),
    ('news', 'News Discussion', 'مناقشة الأخبار', 'Discuss latest market news', 'مناقشة آخر أخبار السوق', 'Newspaper', 'purple', true);


-- ============================================================
-- انتهى التنفيذ بنجاح! ✅
-- عدد الجداول: 37
-- عدد الدوال: 35+
-- عدد سياسات RLS: 95+
-- عدد حاويات التخزين: 6
-- ============================================================
