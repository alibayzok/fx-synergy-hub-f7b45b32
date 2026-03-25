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
-- آخر تحديث: 2026-03-25
-- ============================================================


-- ============================================================
-- 1. ENUMS (أنواع البيانات المخصصة)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'vip', 'free', 'moderator', 'support');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE public.asset_type AS ENUM ('forex', 'metals', 'crypto');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_visibility') THEN
    CREATE TYPE public.content_visibility AS ENUM ('free', 'vip');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
    CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_level') THEN
    CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
    CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_visibility') THEN
    CREATE TYPE public.post_visibility AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_setting') THEN
    CREATE TYPE public.privacy_setting AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_membership_status') THEN
    CREATE TYPE public.room_membership_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_role') THEN
    CREATE TYPE public.room_role AS ENUM ('member', 'moderator', 'owner');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    CREATE TYPE public.service_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'redemption_status') THEN
    CREATE TYPE public.redemption_status AS ENUM ('pending', 'approved', 'rejected', 'delivered');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE public.service_type AS ENUM ('broker_deposit', 'broker_withdraw', 'usdt_buy', 'usdt_sell', 'broker_account', 'card_fund');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_type') THEN
    CREATE TYPE public.signal_type AS ENUM ('signal', 'tip');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timeframe') THEN
    CREATE TYPE public.timeframe AS ENUM ('M5', 'M15', 'H1', 'H4', 'D1');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usdt_listing_type') THEN
    CREATE TYPE public.usdt_listing_type AS ENUM ('buy', 'sell');
  END IF;
END $$;


-- ============================================================
-- 2. TABLES (الجداول)
-- ============================================================

-- جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
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
    referral_code TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    kyc_status TEXT NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أدوار المستخدمين
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- جدول حظر المستخدمين
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL,
    blocked_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

-- جدول الإشارات
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe DEFAULT 'H4',
    visibility public.content_visibility NOT NULL DEFAULT 'free',
    attachments TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعجابات الإشارات
CREATE TABLE IF NOT EXISTS public.signal_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(signal_id, user_id)
);

-- جدول التحليلات
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe DEFAULT 'H4',
    visibility public.content_visibility NOT NULL DEFAULT 'free',
    attachments TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعجابات التحليلات
CREATE TABLE IF NOT EXISTS public.analysis_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(analysis_id, user_id)
);

-- جدول منشورات المستخدمين
CREATE TABLE IF NOT EXISTS public.user_posts (
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
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- جدول تعليقات المنشورات
CREATE TABLE IF NOT EXISTS public.post_comments (
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
CREATE TABLE IF NOT EXISTS public.community_rooms (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    category TEXT DEFAULT 'general',
    icon TEXT DEFAULT 'MessageSquare',
    color TEXT DEFAULT 'blue',
    is_private BOOLEAN DEFAULT false,
    is_broadcast BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول أعضاء الغرف
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role public.room_role DEFAULT 'member',
    status public.room_membership_status DEFAULT 'pending',
    is_muted BOOLEAN DEFAULT false,
    muted_reason TEXT,
    muted_until TIMESTAMP WITH TIME ZONE,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(room_id, user_id)
);

-- جدول طلبات الانضمام للغرف
CREATE TABLE IF NOT EXISTS public.room_join_requests (
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
CREATE TABLE IF NOT EXISTS public.room_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تفاعلات رسائل الغرف
CREATE TABLE IF NOT EXISTS public.room_message_reactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- جدول مشاهدات رسائل الغرف
CREATE TABLE IF NOT EXISTS public.room_message_views (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- جدول المواضيع
CREATE TABLE IF NOT EXISTS public.threads (
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
CREATE TABLE IF NOT EXISTS public.replies (
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
CREATE TABLE IF NOT EXISTS public.reply_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reply_id UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- جدول فئات التعلم
CREATE TABLE IF NOT EXISTS public.learning_categories (
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
CREATE TABLE IF NOT EXISTS public.learning_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.learning_categories(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    channel_url TEXT,
    level public.course_level NOT NULL DEFAULT 'beginner',
    is_vip BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول دروس التعلم
CREATE TABLE IF NOT EXISTS public.learning_lessons (
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
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL,
    name TEXT,
    type public.conversation_type NOT NULL DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المشاركين في المحادثات
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(conversation_id, user_id)
);

-- جدول الرسائل المباشرة
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المتابعات
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- جدول طلبات الصداقة
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status public.friend_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(sender_id, receiver_id)
);

-- جدول إعدادات الخصوصية
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    messaging_privacy public.privacy_setting NOT NULL DEFAULT 'everyone',
    friends_visibility public.privacy_setting NOT NULL DEFAULT 'everyone',
    show_online_status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول طلبات الخدمات
CREATE TABLE IF NOT EXISTS public.service_requests (
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
CREATE TABLE IF NOT EXISTS public.usdt_listings (
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
CREATE TABLE IF NOT EXISTS public.flagged_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.user_notifications (
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
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات التطبيق
CREATE TABLE IF NOT EXISTS public.app_settings (
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
CREATE TABLE IF NOT EXISTS public.support_tickets (
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
    sla_deadline TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT false,
    sla_notified BOOLEAN DEFAULT false,
    first_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل الدعم الفني
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول وكلاء الدعم الفني
CREATE TABLE IF NOT EXISTS public.support_agents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الوسطاء
CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    features_ar TEXT[] DEFAULT '{}',
    features_en TEXT[] DEFAULT '{}',
    logo_url TEXT,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    registration_url TEXT NOT NULL DEFAULT '',
    stats JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الخدمات
CREATE TABLE IF NOT EXISTS public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'Settings',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    card_type TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_external_link BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    link_label_ar TEXT,
    link_label_en TEXT,
    play_store_url TEXT,
    app_store_url TEXT,
    apk_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المقالات
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL DEFAULT '',
    summary_ar TEXT,
    summary_en TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول اشتراكات VIP
CREATE TABLE IF NOT EXISTS public.vip_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'pending',
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل الاشتراكات
CREATE TABLE IF NOT EXISTS public.subscription_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.vip_subscriptions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول البطاقات الافتراضية
CREATE TABLE IF NOT EXISTS public.virtual_cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    card_type TEXT NOT NULL DEFAULT 'virtual',
    card_status TEXT NOT NULL DEFAULT 'pending',
    card_last_four TEXT,
    nickname TEXT,
    spending_limit NUMERIC,
    currency TEXT DEFAULT 'USD',
    marqeta_user_token TEXT,
    marqeta_card_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الجلسات المباشرة
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'scheduled',
    stream_url TEXT,
    thumbnail_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    current_viewers INTEGER DEFAULT 0,
    max_viewers INTEGER DEFAULT 0,
    is_vip BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل الجلسات المباشرة
CREATE TABLE IF NOT EXISTS public.live_session_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول توكنات FCM
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول النقاط
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    level_name_ar TEXT NOT NULL DEFAULT 'مبتدئ',
    level_name_en TEXT NOT NULL DEFAULT 'Beginner',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول معاملات النقاط
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الشارات
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'Award',
    color TEXT NOT NULL DEFAULT '#F59E0B',
    badge_type TEXT NOT NULL DEFAULT 'achievement',
    points_required INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول شارات المستخدمين
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- جدول السلاسل (Streaks)
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date DATE,
    total_quests_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المهام اليومية
CREATE TABLE IF NOT EXISTS public.daily_quests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quest_key TEXT NOT NULL UNIQUE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'Target',
    quest_type TEXT NOT NULL DEFAULT 'daily',
    target_count INTEGER NOT NULL DEFAULT 1,
    points_reward INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقدم المهام اليومية
CREATE TABLE IF NOT EXISTS public.user_daily_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    quest_id UUID NOT NULL REFERENCES public.daily_quests(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_count INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    points_claimed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, quest_id, quest_date)
);

-- جدول الإحالات
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    referral_code TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مكافآت الإحالات
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL DEFAULT '',
    description_ar TEXT NOT NULL DEFAULT '',
    description_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '🎁',
    points_cost INTEGER NOT NULL,
    reward_type TEXT NOT NULL DEFAULT 'custom',
    reward_value TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول استبدال المكافآت
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    reward_id UUID REFERENCES public.referral_rewards(id) ON DELETE SET NULL,
    redemption_type TEXT NOT NULL DEFAULT 'catalog',
    points_spent INTEGER NOT NULL,
    status public.redemption_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول طلبات التوثيق
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'national_id',
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    selfie_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مشاهدات المحتوى
CREATE TABLE IF NOT EXISTS public.content_views (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, content_type, content_id)
);

-- جدول تحديثات الإشارات
CREATE TABLE IF NOT EXISTS public.signal_updates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    parent_type TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_by UUID,
    telegram_message_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. HELPER FUNCTIONS (دوال مساعدة - يجب إنشاؤها قبل Views)
-- ============================================================

-- دالة إخفاء رقم الهاتف (مطلوبة للـ Views)
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
    SELECT CASE
        WHEN phone IS NULL THEN NULL
        WHEN length(phone) <= 4 THEN '****'
        ELSE concat(repeat('*', length(phone) - 4), right(phone, 4))
    END
$$;


-- ============================================================
-- 4. VIEWS (العروض)
-- ============================================================

-- عرض الملفات الشخصية العامة (بدون بيانات حساسة)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
    id, user_id, username, display_name, first_name, last_name,
    avatar_url, country, language, is_verified,
    created_at, updated_at
FROM public.profiles;

-- عرض الملفات الشخصية للأدمن (مع إخفاء أرقام الهاتف)
CREATE OR REPLACE VIEW public.profiles_admin_view AS
SELECT 
    id, user_id, username, display_name, first_name, last_name,
    avatar_url, country, public.mask_phone_number(phone) as phone,
    language, onboarding_completed, trading_preferences,
    is_verified, kyc_status, phone_verified,
    created_at, updated_at
FROM public.profiles;


-- ============================================================
-- 5. FUNCTIONS (الدوال)
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

-- دالة التحقق من المشرف
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')) $$;

-- دالة التحقق من دور الدعم
CREATE OR REPLACE FUNCTION public.is_support_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'support')) $$;

-- دالة التحقق من VIP
CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'vip') $$;

-- (mask_phone_number تم نقلها لقبل Views)

-- دالة التحقق من الوصول للمحتوى
CREATE OR REPLACE FUNCTION public.can_access_content(content_vis content_visibility)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT CASE 
        WHEN public.is_admin() THEN true
        WHEN content_vis = 'free' AND auth.uid() IS NOT NULL THEN true
        WHEN content_vis = 'vip' AND public.is_vip() THEN true
        ELSE false
    END
$$;

-- دالة التحقق من الحظر
CREATE OR REPLACE FUNCTION public.is_blocked(checker_id uuid, target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = checker_id AND blocked_id = target_id)
       OR (blocker_id = target_id AND blocked_id = checker_id)
  )
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

-- دوال جدول ديناميكي
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.table_name::text FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' ORDER BY t.table_name;
$$;

CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.column_name::text, c.data_type::text, c.is_nullable::text, c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = p_table_name ORDER BY c.ordinal_position;
$$;

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

-- دوال النقاط والتلعيب
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id uuid, p_points integer, p_action_type text, p_description_ar text DEFAULT '', p_description_en text DEFAULT '', p_reference_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total integer; v_level integer; v_level_ar text; v_level_en text;
BEGIN
  INSERT INTO public.point_transactions (user_id, points, action_type, description_ar, description_en, reference_id)
  VALUES (p_user_id, p_points, p_action_type, p_description_ar, p_description_en, p_reference_id);
  INSERT INTO public.user_points (user_id, total_points) VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO UPDATE SET total_points = user_points.total_points + p_points, updated_at = now();
  SELECT total_points INTO v_total FROM public.user_points WHERE user_id = p_user_id;
  v_level := CASE
    WHEN v_total >= 10000 THEN 10 WHEN v_total >= 7500 THEN 9 WHEN v_total >= 5000 THEN 8
    WHEN v_total >= 3500 THEN 7 WHEN v_total >= 2500 THEN 6 WHEN v_total >= 1500 THEN 5
    WHEN v_total >= 1000 THEN 4 WHEN v_total >= 500 THEN 3 WHEN v_total >= 200 THEN 2 ELSE 1
  END;
  v_level_ar := CASE v_level WHEN 1 THEN 'مبتدئ' WHEN 2 THEN 'نشيط' WHEN 3 THEN 'متقدم' WHEN 4 THEN 'خبير' WHEN 5 THEN 'محترف' WHEN 6 THEN 'أسطوري' WHEN 7 THEN 'نخبة' WHEN 8 THEN 'قائد' WHEN 9 THEN 'بطل' WHEN 10 THEN 'أسطورة' END;
  v_level_en := CASE v_level WHEN 1 THEN 'Beginner' WHEN 2 THEN 'Active' WHEN 3 THEN 'Advanced' WHEN 4 THEN 'Expert' WHEN 5 THEN 'Pro' WHEN 6 THEN 'Legendary' WHEN 7 THEN 'Elite' WHEN 8 THEN 'Leader' WHEN 9 THEN 'Champion' WHEN 10 THEN 'Legend' END;
  UPDATE public.user_points SET level = v_level, level_name_ar = v_level_ar, level_name_en = v_level_en WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_quest_progress(p_user_id uuid, p_quest_key text, p_increment integer DEFAULT 1)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quest RECORD; v_progress RECORD; v_today DATE := CURRENT_DATE;
  v_new_count INT; v_completed BOOLEAN := false; v_all_done BOOLEAN; v_streak RECORD;
BEGIN
  SELECT * INTO v_quest FROM daily_quests WHERE quest_key = p_quest_key AND is_active = true;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'message', 'Quest not found'); END IF;
  INSERT INTO user_daily_progress (user_id, quest_id, quest_date, current_count) VALUES (p_user_id, v_quest.id, v_today, p_increment)
  ON CONFLICT (user_id, quest_id, quest_date) DO UPDATE SET current_count = LEAST(user_daily_progress.current_count + p_increment, v_quest.target_count)
  RETURNING * INTO v_progress;
  IF v_progress.current_count >= v_quest.target_count AND NOT v_progress.completed THEN
    UPDATE user_daily_progress SET completed = true, completed_at = now() WHERE id = v_progress.id;
    v_completed := true;
    PERFORM add_user_points(p_user_id, v_quest.points_reward, 'daily_quest', v_quest.title_ar, v_quest.title_en);
  END IF;
  SELECT NOT EXISTS (
    SELECT 1 FROM daily_quests dq WHERE dq.is_active = true AND NOT EXISTS (
      SELECT 1 FROM user_daily_progress udp WHERE udp.user_id = p_user_id AND udp.quest_id = dq.id AND udp.quest_date = v_today AND udp.completed = true
    )
  ) INTO v_all_done;
  IF v_all_done THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completed_date, total_quests_completed)
    VALUES (p_user_id, 1, 1, v_today, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = CASE WHEN user_streaks.last_completed_date = v_today - 1 THEN user_streaks.current_streak + 1 WHEN user_streaks.last_completed_date = v_today THEN user_streaks.current_streak ELSE 1 END,
      longest_streak = GREATEST(user_streaks.longest_streak, CASE WHEN user_streaks.last_completed_date = v_today - 1 THEN user_streaks.current_streak + 1 WHEN user_streaks.last_completed_date = v_today THEN user_streaks.current_streak ELSE 1 END),
      last_completed_date = v_today,
      total_quests_completed = user_streaks.total_quests_completed + (CASE WHEN user_streaks.last_completed_date = v_today THEN 0 ELSE 1 END),
      updated_at = now();
  END IF;
  RETURN json_build_object('success', true, 'completed', v_completed, 'all_done', v_all_done);
END; $$;

-- دوال نقاط التلعيب التلقائية
CREATE OR REPLACE FUNCTION public.award_points_on_room_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.add_user_points(NEW.user_id, 2, 'room_message', 'إرسال رسالة في الغرفة', 'Sent a room message', NEW.id::text);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.award_points_on_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.add_user_points(NEW.user_id, 10, 'post_created', 'نشر منشور جديد', 'Created a new post', NEW.id::text);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.award_points_on_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post_owner uuid;
BEGIN
  SELECT user_id INTO v_post_owner FROM public.user_posts WHERE id = NEW.post_id;
  IF v_post_owner IS NOT NULL AND v_post_owner != NEW.user_id THEN
    PERFORM public.add_user_points(v_post_owner, 3, 'post_liked', 'حصل منشورك على إعجاب', 'Your post got a like', NEW.post_id::text);
  END IF;
  RETURN NEW;
END; $$;

-- دوال VIP
CREATE OR REPLACE FUNCTION public.request_vip_subscription(p_plan text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; user_email TEXT; v_sub_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = auth.uid();
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.vip_subscriptions (user_id, plan, status) VALUES (auth.uid(), p_plan, 'pending') RETURNING id INTO v_sub_id;
  INSERT INTO public.admin_notifications (type, title, message, data) VALUES (
    'vip_request', 'طلب اشتراك VIP 👑',
    user_display_name || ' يطلب اشتراك VIP - باقة ' || CASE WHEN p_plan = 'monthly' THEN 'شهرية' ELSE p_plan END,
    jsonb_build_object('user_id', auth.uid(), 'plan', p_plan, 'email', user_email, 'subscription_id', v_sub_id));
END; $$;

CREATE OR REPLACE FUNCTION public.activate_vip_subscription(p_subscription_id uuid, p_duration_days integer DEFAULT 30)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can activate subscriptions'; END IF;
  SELECT user_id INTO v_user_id FROM public.vip_subscriptions WHERE id = p_subscription_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  UPDATE public.vip_subscriptions SET status = 'active', starts_at = now(), expires_at = now() + (p_duration_days || ' days')::interval, approved_by = auth.uid(), approved_at = now() WHERE id = p_subscription_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'vip') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (v_user_id, 'vip_activated', 'تم تفعيل اشتراك VIP 👑', 'مبروك! تم تفعيل اشتراكك VIP لمدة ' || p_duration_days || ' يوم', jsonb_build_object('subscription_id', p_subscription_id, 'expires_at', now() + (p_duration_days || ' days')::interval));
END; $$;

CREATE OR REPLACE FUNCTION public.deactivate_vip_subscription(p_subscription_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_has_other_active BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can deactivate subscriptions'; END IF;
  SELECT user_id INTO v_user_id FROM public.vip_subscriptions WHERE id = p_subscription_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Subscription not found'; END IF;
  UPDATE public.vip_subscriptions SET status = 'expired' WHERE id = p_subscription_id;
  SELECT EXISTS (SELECT 1 FROM public.vip_subscriptions WHERE user_id = v_user_id AND status = 'active' AND id != p_subscription_id) INTO v_has_other_active;
  IF NOT v_has_other_active THEN DELETE FROM public.user_roles WHERE user_id = v_user_id AND role = 'vip'; END IF;
  INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (v_user_id, 'vip_expired', 'انتهى اشتراك VIP', 'انتهى اشتراكك VIP. يمكنك تجديده من صفحة الاشتراكات', jsonb_build_object('subscription_id', p_subscription_id));
END; $$;

CREATE OR REPLACE FUNCTION public.reject_vip_subscription(p_subscription_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can reject subscriptions'; END IF;
  SELECT user_id INTO v_user_id FROM public.vip_subscriptions WHERE id = p_subscription_id;
  UPDATE public.vip_subscriptions SET status = 'rejected', admin_notes = COALESCE(p_reason, admin_notes), approved_by = auth.uid(), approved_at = now() WHERE id = p_subscription_id;
  INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (v_user_id, 'vip_rejected', 'تم رفض طلب VIP', 'للأسف تم رفض طلب اشتراكك VIP' || CASE WHEN p_reason IS NOT NULL THEN '. السبب: ' || p_reason ELSE '' END, jsonb_build_object('subscription_id', p_subscription_id));
END; $$;

-- دوال الإشعارات
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INTEGER; milestone INTEGER;
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data) VALUES (
        'new_user', 'مستخدم جديد', 'انضم ' || COALESCE(NEW.display_name, 'مستخدم جديد') || ' إلى المنصة',
        jsonb_build_object('user_id', NEW.user_id, 'display_name', NEW.display_name, 'country', NEW.country));
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    milestone := CASE WHEN user_count = 10 THEN 10 WHEN user_count = 25 THEN 25 WHEN user_count = 50 THEN 50 WHEN user_count = 100 THEN 100 WHEN user_count = 250 THEN 250 WHEN user_count = 500 THEN 500 WHEN user_count = 1000 THEN 1000 WHEN user_count = 5000 THEN 5000 WHEN user_count = 10000 THEN 10000 ELSE NULL END;
    IF milestone IS NOT NULL THEN
        INSERT INTO public.admin_notifications (type, title, message, data) VALUES ('milestone', '🎉 إنجاز جديد!', 'تهانينا! وصل عدد المستخدمين إلى ' || milestone || ' مستخدم', jsonb_build_object('milestone', milestone, 'total_users', user_count));
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_service_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; request_title TEXT; request_message TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    CASE NEW.type
        WHEN 'broker_account' THEN request_title := 'طلب فتح حساب تداول'; request_message := user_display_name || ' يطلب فتح حساب تداول جديد';
        WHEN 'broker_deposit' THEN request_title := 'طلب إيداع للوسيط'; request_message := user_display_name || ' يطلب إيداع بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'broker_withdraw' THEN request_title := 'طلب سحب من الوسيط'; request_message := user_display_name || ' يطلب سحب بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_buy' THEN request_title := 'طلب شراء USDT'; request_message := user_display_name || ' يطلب شراء USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_sell' THEN request_title := 'طلب بيع USDT'; request_message := user_display_name || ' يطلب بيع USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'card_fund' THEN request_title := 'طلب شحن بطاقة'; request_message := user_display_name || ' يطلب شحن بطاقة بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
    END CASE;
    INSERT INTO public.admin_notifications (type, title, message, data) VALUES (
        'service_request', request_title, request_message,
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
    INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (thread_owner_id, 'reply', 'رد جديد', replier_name || ' رد على موضوعك: ' || LEFT(thread_title, 50), jsonb_build_object('thread_id', NEW.thread_id, 'reply_id', NEW.id, 'replier_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT; recipient RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
    FOR recipient IN SELECT user_id FROM public.conversation_participants WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (recipient.user_id, 'message', 'رسالة جديدة', sender_name || ': ' || LEFT(NEW.content, 50), jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id));
    END LOOP;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (NEW.receiver_id, 'friend_request', 'طلب صداقة جديد', sender_name || ' أرسل لك طلب صداقة', jsonb_build_object('request_id', NEW.id, 'sender_id', NEW.sender_id));
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name FROM public.profiles WHERE user_id = NEW.receiver_id;
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (NEW.sender_id, 'friend_accepted', 'تم قبول طلب الصداقة', sender_name || ' قبل طلب صداقتك', jsonb_build_object('request_id', NEW.id, 'friend_id', NEW.receiver_id));
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
    INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (post_owner_id, 'post_like', 'إعجاب جديد ❤️', liker_name || ' أعجب بمنشورك', jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner_id UUID; commenter_name TEXT; parent_commenter_id UUID;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.user_posts WHERE id = NEW.post_id;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_commenter_id FROM public.post_comments WHERE id = NEW.parent_id;
        IF parent_commenter_id IS NOT NULL AND parent_commenter_id != NEW.user_id THEN
            INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (parent_commenter_id, 'comment_reply', 'رد على تعليقك 💬', commenter_name || ' رد على تعليقك', jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id));
        END IF;
    END IF;
    IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (post_owner_id, 'post_comment', 'تعليق جديد 💬', commenter_name || ' علق على منشورك: ' || LEFT(NEW.content, 30), jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_analysis_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE analysis_owner_id UUID; liker_name TEXT; analysis_title TEXT;
BEGIN
    SELECT created_by, title INTO analysis_owner_id, analysis_title FROM public.analyses WHERE id = NEW.analysis_id;
    IF analysis_owner_id IS NULL OR analysis_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (analysis_owner_id, 'analysis_like', 'إعجاب بتحليلك 📊', liker_name || ' أعجب بتحليلك: ' || LEFT(analysis_title, 30), jsonb_build_object('analysis_id', NEW.analysis_id, 'liker_id', NEW.user_id));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_reply_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reply_owner_id UUID; liker_name TEXT; v_thread_id UUID;
BEGIN
    SELECT user_id, thread_id INTO reply_owner_id, v_thread_id FROM public.replies WHERE id = NEW.reply_id;
    IF reply_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (reply_owner_id, 'reply_like', 'إعجاب بردك ❤️', liker_name || ' أعجب بردك', jsonb_build_object('thread_id', v_thread_id, 'reply_id', NEW.reply_id, 'liker_id', NEW.user_id));
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
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (moderator.user_id, 'room_join_request', 'طلب انضمام جديد', requester_name || ' يطلب الانضمام إلى غرفة ' || room_name, jsonb_build_object('request_id', NEW.id, 'room_id', NEW.room_id, 'user_id', NEW.user_id));
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
            INSERT INTO public.room_members (room_id, user_id, role, status, approved_by, approved_at) VALUES (NEW.room_id, NEW.user_id, 'member', 'approved', NEW.reviewed_by, now())
            ON CONFLICT (room_id, user_id) DO UPDATE SET status = 'approved', approved_by = NEW.reviewed_by, approved_at = now();
        ELSE
            status_text := 'تم رفض طلب انضمامك إلى غرفة ' || room_name; title_text := 'تم رفض طلبك ❌';
        END IF;
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (NEW.user_id, 'room_request_status', title_text, status_text, jsonb_build_object('request_id', NEW.id, 'room_id', NEW.room_id, 'status', NEW.status));
    END IF;
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_flagged_content()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; content_type_ar TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    content_type_ar := CASE NEW.content_type WHEN 'post' THEN 'منشور' WHEN 'room_message' THEN 'رسالة' WHEN 'thread' THEN 'موضوع' WHEN 'reply' THEN 'رد' ELSE NEW.content_type END;
    INSERT INTO public.admin_notifications (type, title, message, data) VALUES ('flagged_content', '🚨 محتوى مخالف', 'تم اكتشاف ' || content_type_ar || ' يحتوي على محتوى غير لائق من ' || user_display_name, jsonb_build_object('flagged_id', NEW.id, 'content_type', NEW.content_type, 'content_id', NEW.content_id, 'user_id', NEW.user_id, 'reason', NEW.flag_reason, 'confidence', NEW.confidence, 'flagged_url', NEW.flagged_url));
    RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_support_ticket()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_display_name TEXT; agent RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name FROM public.profiles WHERE user_id = NEW.user_id;
    FOR agent IN SELECT user_id FROM public.support_agents WHERE is_active = true
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (agent.user_id, 'support_ticket', 'تذكرة دعم جديدة 🎫', user_display_name || ': ' || LEFT(NEW.subject, 50), jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id));
    END LOOP;
    INSERT INTO public.admin_notifications (type, title, message, data) VALUES ('support_ticket', 'تذكرة دعم جديدة 🎫', user_display_name || ' أرسل تذكرة دعم: ' || LEFT(NEW.subject, 50), jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject));
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
        INSERT INTO public.user_notifications (user_id, type, title, message, data) VALUES (target_user_id, 'support_ticket', action_text || ' 🎫', sender_name || ': ' || LEFT(NEW.subject, 50), jsonb_build_object('ticket_id', NEW.id, 'transferred_by', COALESCE(NEW.escalated_by, auth.uid()), 'reason', NEW.escalation_reason));
    END IF;
    RETURN NEW;
END; $$;

-- دالة Push Notification عند إشعار جديد
CREATE OR REPLACE FUNCTION public.notify_push_on_user_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE edge_url TEXT; service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO edge_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  IF edge_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := edge_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
      body := jsonb_build_object('user_id', NEW.user_id, 'title', NEW.title, 'body', NEW.message, 'data', COALESCE(NEW.data, '{}'::jsonb), 'type', NEW.type)
    );
  END IF;
  RETURN NEW;
END; $$;

-- دالة توليد كود الإحالة
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(NEW.user_id::text || gen_random_uuid()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END; $$;

-- دالة معالجة الإحالة
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_referred_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_referrer_id UUID;
BEGIN
  SELECT user_id INTO v_referrer_id FROM profiles WHERE referral_code = p_referral_code AND user_id != p_referred_user_id;
  IF v_referrer_id IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN RETURN; END IF;
  INSERT INTO referrals (referrer_id, referred_id, referral_code, points_awarded, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 0, 'pending');
END; $$;

-- دالة منح نقاط الإحالة بعد التوثيق
CREATE OR REPLACE FUNCTION public.award_referral_on_kyc_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_referral RECORD;
BEGIN
  IF NEW.kyc_status = 'approved' AND (OLD.kyc_status IS DISTINCT FROM 'approved') THEN
    SELECT * INTO v_referral FROM referrals WHERE referred_id = NEW.user_id AND status = 'pending' LIMIT 1;
    IF v_referral IS NOT NULL THEN
      UPDATE referrals SET points_awarded = 50, status = 'completed' WHERE id = v_referral.id;
      PERFORM add_user_points(v_referral.referrer_id, 50, 'referral', 'نقاط إحالة صديق (بعد التوثيق)', 'Referral bonus (after verification)', NEW.user_id::text);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- دالة زيادة عداد مشاهدات رسائل الغرف
CREATE OR REPLACE FUNCTION public.increment_room_message_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.room_messages SET views_count = views_count + 1 WHERE id = NEW.message_id;
  RETURN NEW;
END; $$;

-- دالة زيادة عداد المشاهدات العامة
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name text, p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.content_views (user_id, content_type, content_id) VALUES (v_user_id, p_table_name, p_id) ON CONFLICT (user_id, content_type, content_id) DO NOTHING;
  IF p_table_name = 'signals' THEN UPDATE public.signals SET views_count = views_count + 1 WHERE id = p_id;
  ELSIF p_table_name = 'analyses' THEN UPDATE public.analyses SET views_count = views_count + 1 WHERE id = p_id;
  END IF;
END; $$;

-- دالة تسجيل أول استجابة للدعم
CREATE OR REPLACE FUNCTION public.record_first_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_admin = true THEN
    UPDATE public.support_tickets SET first_response_at = now() WHERE id = NEW.ticket_id AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END; $$;

-- دالة تعيين موعد SLA
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.sla_deadline := CASE NEW.priority
    WHEN 'urgent' THEN NEW.created_at + interval '30 minutes'
    WHEN 'high' THEN NEW.created_at + interval '1 hour'
    WHEN 'normal' THEN NEW.created_at + interval '4 hours'
    WHEN 'low' THEN NEW.created_at + interval '24 hours'
    ELSE NEW.created_at + interval '4 hours'
  END;
  RETURN NEW;
END; $$;

-- دالة تحديث SLA عند تغيير الأولوية
CREATE OR REPLACE FUNCTION public.update_sla_on_priority_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority AND NEW.status = 'open' AND NOT COALESCE(NEW.sla_breached, false) THEN
    NEW.sla_deadline := CASE NEW.priority
      WHEN 'urgent' THEN now() + interval '30 minutes'
      WHEN 'high' THEN now() + interval '1 hour'
      WHEN 'normal' THEN now() + interval '4 hours'
      WHEN 'low' THEN now() + interval '24 hours'
      ELSE now() + interval '4 hours'
    END;
    NEW.sla_notified := false;
  END IF;
  RETURN NEW;
END; $$;

-- دالة تحديث حالة KYC
CREATE OR REPLACE FUNCTION public.update_kyc_status(p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can update KYC status'; END IF;
  UPDATE public.profiles SET kyc_status = p_status WHERE user_id = p_user_id;
END; $$;

-- دالة التحقق من المستخدم
CREATE OR REPLACE FUNCTION public.toggle_user_verification(p_user_id uuid, p_verified boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can toggle verification'; END IF;
  UPDATE public.profiles SET is_verified = p_verified WHERE user_id = p_user_id;
END; $$;

-- دالة التحقق من الهاتف
CREATE OR REPLACE FUNCTION public.verify_user_phone(p_user_id uuid, p_verified boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can verify phone'; END IF;
  UPDATE public.profiles SET phone_verified = p_verified WHERE user_id = p_user_id;
END; $$;


-- ============================================================
-- 5. TRIGGERS (المشغّلات)
-- ============================================================

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers تحديث updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON public.user_privacy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_usdt_listings_updated_at ON public.usdt_listings;
CREATE TRIGGER update_usdt_listings_updated_at BEFORE UPDATE ON public.usdt_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_threads_updated_at ON public.threads;
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_replies_updated_at ON public.replies;
CREATE TRIGGER update_replies_updated_at BEFORE UPDATE ON public.replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_analyses_updated_at ON public.analyses;
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_posts_updated_at ON public.user_posts;
CREATE TRIGGER update_user_posts_updated_at BEFORE UPDATE ON public.user_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_learning_categories_updated_at ON public.learning_categories;
CREATE TRIGGER update_learning_categories_updated_at BEFORE UPDATE ON public.learning_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_learning_courses_updated_at ON public.learning_courses;
CREATE TRIGGER update_learning_courses_updated_at BEFORE UPDATE ON public.learning_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_learning_lessons_updated_at ON public.learning_lessons;
CREATE TRIGGER update_learning_lessons_updated_at BEFORE UPDATE ON public.learning_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_signals_updated_at ON public.signals;
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_vip_subscriptions_updated_at ON public.vip_subscriptions;
CREATE TRIGGER update_vip_subscriptions_updated_at BEFORE UPDATE ON public.vip_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_virtual_cards_updated_at ON public.virtual_cards;
CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON public.virtual_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON public.live_sessions;
CREATE TRIGGER update_live_sessions_updated_at BEFORE UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_brokers_updated_at ON public.brokers;
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON public.fcm_tokens;
CREATE TRIGGER update_fcm_tokens_updated_at BEFORE UPDATE ON public.fcm_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers الإشعارات
DROP TRIGGER IF EXISTS on_new_profile ON public.profiles;
CREATE TRIGGER on_new_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();
DROP TRIGGER IF EXISTS on_new_service_request ON public.service_requests;
CREATE TRIGGER on_new_service_request AFTER INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_service_request();
DROP TRIGGER IF EXISTS on_new_reply ON public.replies;
CREATE TRIGGER on_new_reply AFTER INSERT ON public.replies FOR EACH ROW EXECUTE FUNCTION public.notify_thread_owner_on_reply();
DROP TRIGGER IF EXISTS on_new_direct_message ON public.direct_messages;
CREATE TRIGGER on_new_direct_message AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
DROP TRIGGER IF EXISTS on_friend_request_change ON public.friend_requests;
CREATE TRIGGER on_friend_request_change AFTER INSERT OR UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();
DROP TRIGGER IF EXISTS on_flagged_content ON public.flagged_content;
CREATE TRIGGER on_flagged_content AFTER INSERT ON public.flagged_content FOR EACH ROW EXECUTE FUNCTION public.notify_admin_flagged_content();
DROP TRIGGER IF EXISTS on_new_support_ticket ON public.support_tickets;
CREATE TRIGGER on_new_support_ticket AFTER INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_support_ticket();
DROP TRIGGER IF EXISTS on_support_ticket_transfer ON public.support_tickets;
CREATE TRIGGER on_support_ticket_transfer AFTER UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_transfer();
DROP TRIGGER IF EXISTS on_room_join_request ON public.room_join_requests;
CREATE TRIGGER on_room_join_request AFTER INSERT ON public.room_join_requests FOR EACH ROW EXECUTE FUNCTION public.notify_room_join_request();
DROP TRIGGER IF EXISTS on_room_request_status_change ON public.room_join_requests;
CREATE TRIGGER on_room_request_status_change AFTER UPDATE ON public.room_join_requests FOR EACH ROW EXECUTE FUNCTION public.notify_room_request_status();

-- Triggers العدادات
DROP TRIGGER IF EXISTS on_reply_count ON public.replies;
CREATE TRIGGER on_reply_count AFTER INSERT OR DELETE ON public.replies FOR EACH ROW EXECUTE FUNCTION public.update_thread_replies_count();
DROP TRIGGER IF EXISTS on_reply_like_count ON public.reply_likes;
CREATE TRIGGER on_reply_like_count AFTER INSERT OR DELETE ON public.reply_likes FOR EACH ROW EXECUTE FUNCTION public.update_reply_likes_count();
DROP TRIGGER IF EXISTS on_analysis_like_count ON public.analysis_likes;
CREATE TRIGGER on_analysis_like_count AFTER INSERT OR DELETE ON public.analysis_likes FOR EACH ROW EXECUTE FUNCTION public.update_analysis_likes_count();
DROP TRIGGER IF EXISTS on_post_like_count ON public.post_likes;
CREATE TRIGGER on_post_like_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
DROP TRIGGER IF EXISTS on_post_comment_count ON public.post_comments;
CREATE TRIGGER on_post_comment_count AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Triggers الإشعارات المتقدمة
DROP TRIGGER IF EXISTS on_post_like_notify ON public.post_likes;
CREATE TRIGGER on_post_like_notify AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();
DROP TRIGGER IF EXISTS on_post_comment_notify ON public.post_comments;
CREATE TRIGGER on_post_comment_notify AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();
DROP TRIGGER IF EXISTS on_analysis_like_notify ON public.analysis_likes;
CREATE TRIGGER on_analysis_like_notify AFTER INSERT ON public.analysis_likes FOR EACH ROW EXECUTE FUNCTION public.notify_analysis_like();
DROP TRIGGER IF EXISTS on_reply_like_notify ON public.reply_likes;
CREATE TRIGGER on_reply_like_notify AFTER INSERT ON public.reply_likes FOR EACH ROW EXECUTE FUNCTION public.notify_reply_like();

-- Triggers التلعيب
DROP TRIGGER IF EXISTS on_room_message_points ON public.room_messages;
CREATE TRIGGER on_room_message_points AFTER INSERT ON public.room_messages FOR EACH ROW EXECUTE FUNCTION public.award_points_on_room_message();
DROP TRIGGER IF EXISTS on_post_created_points ON public.user_posts;
CREATE TRIGGER on_post_created_points AFTER INSERT ON public.user_posts FOR EACH ROW EXECUTE FUNCTION public.award_points_on_post();
DROP TRIGGER IF EXISTS on_post_liked_points ON public.post_likes;
CREATE TRIGGER on_post_liked_points AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.award_points_on_post_like();

-- Triggers الإحالات
DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();
DROP TRIGGER IF EXISTS trigger_award_referral_on_kyc ON public.profiles;
CREATE TRIGGER trigger_award_referral_on_kyc AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.award_referral_on_kyc_approval();

-- Triggers مشاهدات رسائل الغرف
DROP TRIGGER IF EXISTS trg_increment_room_message_views ON public.room_message_views;
CREATE TRIGGER trg_increment_room_message_views AFTER INSERT ON public.room_message_views FOR EACH ROW EXECUTE FUNCTION public.increment_room_message_views();

-- Triggers SLA الدعم الفني
DROP TRIGGER IF EXISTS trg_set_sla_deadline ON public.support_tickets;
CREATE TRIGGER trg_set_sla_deadline BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_sla_deadline();
DROP TRIGGER IF EXISTS trg_update_sla_on_priority ON public.support_tickets;
CREATE TRIGGER trg_update_sla_on_priority BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_sla_on_priority_change();
DROP TRIGGER IF EXISTS trg_record_first_response ON public.support_messages;
CREATE TRIGGER trg_record_first_response AFTER INSERT ON public.support_messages FOR EACH ROW EXECUTE FUNCTION public.record_first_response();

-- Trigger Push Notification
DROP TRIGGER IF EXISTS on_user_notification_push ON public.user_notifications;
CREATE TRIGGER on_user_notification_push AFTER INSERT ON public.user_notifications FOR EACH ROW EXECUTE FUNCTION public.notify_push_on_user_notification();


-- ============================================================
-- 6. ROW LEVEL SECURITY (سياسات الأمان)
-- ============================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_message_views ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;

-- === profiles ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can view all profiles via view" ON public.profiles;
CREATE POLICY "Admins can view all profiles via view" ON public.profiles FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- === user_roles ===
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin() AND user_id <> auth.uid());

-- === user_blocks ===
DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
CREATE POLICY "Users can view own blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS "Users can block others" ON public.user_blocks;
CREATE POLICY "Users can block others" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Users can unblock" ON public.user_blocks;
CREATE POLICY "Users can unblock" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- === signals ===
DROP POLICY IF EXISTS "Users can view signals based on visibility" ON public.signals;
CREATE POLICY "Users can view signals based on visibility" ON public.signals FOR SELECT USING (can_access_content(visibility));
DROP POLICY IF EXISTS "Only admins can insert signals" ON public.signals;
CREATE POLICY "Only admins can insert signals" ON public.signals FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update signals" ON public.signals;
CREATE POLICY "Only admins can update signals" ON public.signals FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete signals" ON public.signals;
CREATE POLICY "Only admins can delete signals" ON public.signals FOR DELETE USING (is_admin());

-- === signal_likes ===
DROP POLICY IF EXISTS "Users can view signal likes" ON public.signal_likes;
CREATE POLICY "Users can view signal likes" ON public.signal_likes FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can like signals" ON public.signal_likes;
CREATE POLICY "Users can like signals" ON public.signal_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own likes" ON public.signal_likes;
CREATE POLICY "Users can remove own likes" ON public.signal_likes FOR DELETE USING (auth.uid() = user_id);

-- === analyses ===
DROP POLICY IF EXISTS "Users can view analyses based on visibility" ON public.analyses;
CREATE POLICY "Users can view analyses based on visibility" ON public.analyses FOR SELECT USING (can_access_content(visibility));
DROP POLICY IF EXISTS "Only admins can insert analyses" ON public.analyses;
CREATE POLICY "Only admins can insert analyses" ON public.analyses FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update analyses" ON public.analyses;
CREATE POLICY "Only admins can update analyses" ON public.analyses FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete analyses" ON public.analyses;
CREATE POLICY "Only admins can delete analyses" ON public.analyses FOR DELETE USING (is_admin());

-- === analysis_likes ===
DROP POLICY IF EXISTS "Users can view analysis likes" ON public.analysis_likes;
CREATE POLICY "Users can view analysis likes" ON public.analysis_likes FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can like analyses" ON public.analysis_likes;
CREATE POLICY "Users can like analyses" ON public.analysis_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own likes" ON public.analysis_likes;
CREATE POLICY "Users can remove own likes" ON public.analysis_likes FOR DELETE USING (auth.uid() = user_id);

-- === user_posts ===
DROP POLICY IF EXISTS "Users can view posts based on visibility" ON public.user_posts;
CREATE POLICY "Users can view posts based on visibility" ON public.user_posts FOR SELECT USING (can_view_post(user_id, visibility));
DROP POLICY IF EXISTS "Users can create own posts" ON public.user_posts;
CREATE POLICY "Users can create own posts" ON public.user_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own posts" ON public.user_posts;
CREATE POLICY "Users can update own posts" ON public.user_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON public.user_posts;
CREATE POLICY "Users can delete own posts" ON public.user_posts FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === post_likes ===
DROP POLICY IF EXISTS "Users can view post likes" ON public.post_likes;
CREATE POLICY "Users can view post likes" ON public.post_likes FOR SELECT USING (EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_likes.post_id AND can_view_post(p.user_id, p.visibility)));
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_likes.post_id AND can_view_post(p.user_id, p.visibility)));
DROP POLICY IF EXISTS "Users can remove own likes" ON public.post_likes;
CREATE POLICY "Users can remove own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- === post_comments ===
DROP POLICY IF EXISTS "Users can view post comments" ON public.post_comments;
CREATE POLICY "Users can view post comments" ON public.post_comments FOR SELECT USING (EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_comments.post_id AND can_view_post(p.user_id, p.visibility)));
DROP POLICY IF EXISTS "Users can comment on posts" ON public.post_comments;
CREATE POLICY "Users can comment on posts" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM user_posts p WHERE p.id = post_comments.post_id AND can_view_post(p.user_id, p.visibility)));
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === community_rooms ===
DROP POLICY IF EXISTS "Everyone can view rooms" ON public.community_rooms;
CREATE POLICY "Everyone can view rooms" ON public.community_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can create rooms" ON public.community_rooms;
CREATE POLICY "Only admins can create rooms" ON public.community_rooms FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update rooms" ON public.community_rooms;
CREATE POLICY "Only admins can update rooms" ON public.community_rooms FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete rooms" ON public.community_rooms;
CREATE POLICY "Only admins can delete rooms" ON public.community_rooms FOR DELETE USING (is_admin());

-- === room_members ===
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT USING (can_access_room(room_id) OR user_id = auth.uid() OR is_room_moderator(room_id));
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Moderators and admins can update members" ON public.room_members;
CREATE POLICY "Moderators and admins can update members" ON public.room_members FOR UPDATE USING (is_room_moderator(room_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can delete members" ON public.room_members;
CREATE POLICY "Admins can delete members" ON public.room_members FOR DELETE USING (is_admin() OR is_room_moderator(room_id));

-- === room_join_requests ===
DROP POLICY IF EXISTS "Users can view own requests" ON public.room_join_requests;
CREATE POLICY "Users can view own requests" ON public.room_join_requests FOR SELECT USING (user_id = auth.uid() OR is_room_moderator(room_id) OR is_admin());
DROP POLICY IF EXISTS "Users can create join requests" ON public.room_join_requests;
CREATE POLICY "Users can create join requests" ON public.room_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Moderators can update requests" ON public.room_join_requests;
CREATE POLICY "Moderators can update requests" ON public.room_join_requests FOR UPDATE USING (is_room_moderator(room_id) OR is_admin());
DROP POLICY IF EXISTS "Users can delete own requests" ON public.room_join_requests;
CREATE POLICY "Users can delete own requests" ON public.room_join_requests FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- === room_messages ===
DROP POLICY IF EXISTS "Users can view room messages" ON public.room_messages;
CREATE POLICY "Users can view room messages" ON public.room_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can send messages" ON public.room_messages;
CREATE POLICY "Users can send messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own messages" ON public.room_messages;
CREATE POLICY "Users can update own messages" ON public.room_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users or moderators can delete messages" ON public.room_messages;
CREATE POLICY "Users or moderators can delete messages" ON public.room_messages FOR DELETE USING (auth.uid() = user_id OR is_admin() OR is_room_moderator(room_id));

-- === threads ===
DROP POLICY IF EXISTS "Users can view all threads" ON public.threads;
CREATE POLICY "Users can view all threads" ON public.threads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create threads" ON public.threads;
CREATE POLICY "Users can create threads" ON public.threads FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own threads" ON public.threads;
CREATE POLICY "Users can update own threads" ON public.threads FOR UPDATE USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can delete own threads" ON public.threads;
CREATE POLICY "Users can delete own threads" ON public.threads FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- === replies ===
DROP POLICY IF EXISTS "Users can view all replies" ON public.replies;
CREATE POLICY "Users can view all replies" ON public.replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create replies" ON public.replies;
CREATE POLICY "Users can create replies" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own replies" ON public.replies;
CREATE POLICY "Users can update own replies" ON public.replies FOR UPDATE USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users or moderators can delete replies" ON public.replies;
CREATE POLICY "Users or moderators can delete replies" ON public.replies FOR DELETE USING (auth.uid() = user_id OR is_admin() OR is_room_moderator(get_thread_room_id(thread_id)));

-- === reply_likes ===
DROP POLICY IF EXISTS "Users can view all likes" ON public.reply_likes;
CREATE POLICY "Users can view all likes" ON public.reply_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like replies" ON public.reply_likes;
CREATE POLICY "Users can like replies" ON public.reply_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own likes" ON public.reply_likes;
CREATE POLICY "Users can remove own likes" ON public.reply_likes FOR DELETE USING (auth.uid() = user_id);

-- === learning_categories ===
DROP POLICY IF EXISTS "Admins can manage categories" ON public.learning_categories;
CREATE POLICY "Admins can manage categories" ON public.learning_categories FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can view active categories" ON public.learning_categories;
CREATE POLICY "Authenticated users can view active categories" ON public.learning_categories FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- === learning_courses ===
DROP POLICY IF EXISTS "Admins can manage courses" ON public.learning_courses;
CREATE POLICY "Admins can manage courses" ON public.learning_courses FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can view published courses" ON public.learning_courses;
CREATE POLICY "Authenticated users can view published courses" ON public.learning_courses FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- === learning_lessons ===
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.learning_lessons;
CREATE POLICY "Admins can manage lessons" ON public.learning_lessons FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Authenticated users can view published lessons" ON public.learning_lessons;
CREATE POLICY "Authenticated users can view published lessons" ON public.learning_lessons FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);

-- === conversations ===
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (is_conversation_participant(id) OR created_by = auth.uid());
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Conversation admins can update" ON public.conversations;
CREATE POLICY "Conversation admins can update" ON public.conversations FOR UPDATE USING (is_conversation_admin(id));

-- === conversation_participants ===
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversation_participants;
CREATE POLICY "Participants can view their conversations" ON public.conversation_participants FOR SELECT USING (is_conversation_participant(conversation_id));
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creator can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR is_conversation_creator(conversation_id) OR is_conversation_admin(conversation_id));
DROP POLICY IF EXISTS "Participants can update their own record" ON public.conversation_participants;
CREATE POLICY "Participants can update their own record" ON public.conversation_participants FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;
CREATE POLICY "Users can leave conversations" ON public.conversation_participants FOR DELETE USING (auth.uid() = user_id);

-- === direct_messages ===
DROP POLICY IF EXISTS "Participants can view messages" ON public.direct_messages;
CREATE POLICY "Participants can view messages" ON public.direct_messages FOR SELECT USING (is_conversation_participant(conversation_id));
DROP POLICY IF EXISTS "Participants can send messages" ON public.direct_messages;
CREATE POLICY "Participants can send messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_conversation_participant(conversation_id));
DROP POLICY IF EXISTS "Senders can update own messages" ON public.direct_messages;
CREATE POLICY "Senders can update own messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.direct_messages;
CREATE POLICY "Senders can delete own messages" ON public.direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- === follows ===
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- === friend_requests ===
DROP POLICY IF EXISTS "Users can view own friend requests" ON public.friend_requests;
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users can update received requests" ON public.friend_requests;
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users can delete own requests" ON public.friend_requests;
CREATE POLICY "Users can delete own requests" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- === user_privacy_settings ===
DROP POLICY IF EXISTS "Users can view all privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can view all privacy settings" ON public.user_privacy_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can insert own privacy settings" ON public.user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.user_privacy_settings;
CREATE POLICY "Users can update own privacy settings" ON public.user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- === service_requests ===
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
CREATE POLICY "Users can view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can create service requests" ON public.service_requests;
CREATE POLICY "Users can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Only admins can update service requests" ON public.service_requests;
CREATE POLICY "Only admins can update service requests" ON public.service_requests FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete service requests" ON public.service_requests;
CREATE POLICY "Only admins can delete service requests" ON public.service_requests FOR DELETE USING (is_admin());

-- === usdt_listings ===
DROP POLICY IF EXISTS "Authenticated users can view active USDT listings" ON public.usdt_listings;
CREATE POLICY "Authenticated users can view active USDT listings" ON public.usdt_listings FOR SELECT USING (auth.uid() IS NOT NULL AND (is_active = true OR is_admin()));
DROP POLICY IF EXISTS "Only admins can insert USDT listings" ON public.usdt_listings;
CREATE POLICY "Only admins can insert USDT listings" ON public.usdt_listings FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update USDT listings" ON public.usdt_listings;
CREATE POLICY "Only admins can update USDT listings" ON public.usdt_listings FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete USDT listings" ON public.usdt_listings;
CREATE POLICY "Only admins can delete USDT listings" ON public.usdt_listings FOR DELETE USING (is_admin());

-- === flagged_content ===
DROP POLICY IF EXISTS "Admins can view flagged content" ON public.flagged_content;
CREATE POLICY "Admins can view flagged content" ON public.flagged_content FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Users can insert flagged content" ON public.flagged_content;
CREATE POLICY "Users can insert flagged content" ON public.flagged_content FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update flagged content" ON public.flagged_content;
CREATE POLICY "Admins can update flagged content" ON public.flagged_content FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete flagged content" ON public.flagged_content;
CREATE POLICY "Admins can delete flagged content" ON public.flagged_content FOR DELETE USING (is_admin());

-- === user_notifications ===
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.user_notifications;
CREATE POLICY "Users can insert own notifications" ON public.user_notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.user_notifications;
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);

-- === admin_notifications ===
DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications" ON public.admin_notifications FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Only admins can insert notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Only admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can update notifications" ON public.admin_notifications FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Only admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can delete notifications" ON public.admin_notifications FOR DELETE USING (is_admin());

-- === app_settings ===
DROP POLICY IF EXISTS "Anyone can view non-secret settings" ON public.app_settings;
CREATE POLICY "Anyone can view non-secret settings" ON public.app_settings FOR SELECT USING (setting_key !~~ '%api_key%' AND setting_key !~~ '%secret%');
DROP POLICY IF EXISTS "Admins can view secret settings" ON public.app_settings;
CREATE POLICY "Admins can view secret settings" ON public.app_settings FOR SELECT USING ((setting_key ~~ '%api_key%' OR setting_key ~~ '%secret%') AND is_admin());
DROP POLICY IF EXISTS "Admins can insert settings" ON public.app_settings;
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete settings" ON public.app_settings;
CREATE POLICY "Admins can delete settings" ON public.app_settings FOR DELETE USING (is_admin());

-- === support_tickets ===
DROP POLICY IF EXISTS "Users and agents can view tickets" ON public.support_tickets;
CREATE POLICY "Users and agents can view tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR is_support_agent());
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Owners and agents can update tickets" ON public.support_tickets;
CREATE POLICY "Owners and agents can update tickets" ON public.support_tickets FOR UPDATE USING (is_support_agent() OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Agents can delete tickets" ON public.support_tickets;
CREATE POLICY "Agents can delete tickets" ON public.support_tickets FOR DELETE USING (is_support_agent());

-- === support_messages ===
DROP POLICY IF EXISTS "Users and agents can view messages" ON public.support_messages;
CREATE POLICY "Users and agents can view messages" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR is_support_agent())));
DROP POLICY IF EXISTS "Users and agents can send messages" ON public.support_messages;
CREATE POLICY "Users and agents can send messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = support_messages.ticket_id AND (t.user_id = auth.uid() OR is_support_agent())));
DROP POLICY IF EXISTS "Agents can delete messages" ON public.support_messages;
CREATE POLICY "Agents can delete messages" ON public.support_messages FOR DELETE USING (is_support_agent() OR auth.uid() = sender_id);

-- === support_agents ===
DROP POLICY IF EXISTS "Admins can manage support agents" ON public.support_agents;
CREATE POLICY "Admins can manage support agents" ON public.support_agents FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Agents can view themselves" ON public.support_agents;
CREATE POLICY "Agents can view themselves" ON public.support_agents FOR SELECT USING (auth.uid() = user_id);

-- === brokers ===
DROP POLICY IF EXISTS "Everyone can view active brokers" ON public.brokers;
CREATE POLICY "Everyone can view active brokers" ON public.brokers FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Only admins can manage brokers" ON public.brokers;
CREATE POLICY "Only admins can manage brokers" ON public.brokers FOR ALL USING (is_admin());

-- === services ===
DROP POLICY IF EXISTS "Everyone can view active services" ON public.services;
CREATE POLICY "Everyone can view active services" ON public.services FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Only admins can manage services" ON public.services;
CREATE POLICY "Only admins can manage services" ON public.services FOR ALL USING (is_admin());

-- === articles ===
DROP POLICY IF EXISTS "Everyone can view published articles" ON public.articles;
CREATE POLICY "Everyone can view published articles" ON public.articles FOR SELECT USING (is_published = true OR is_admin());
DROP POLICY IF EXISTS "Only admins can manage articles" ON public.articles;
CREATE POLICY "Only admins can manage articles" ON public.articles FOR ALL USING (is_admin());

-- === vip_subscriptions ===
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.vip_subscriptions FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can create subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Users can create subscriptions" ON public.vip_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.vip_subscriptions;
CREATE POLICY "Admins can update subscriptions" ON public.vip_subscriptions FOR UPDATE USING (is_admin());

-- === subscription_messages ===
DROP POLICY IF EXISTS "Users and admins can view subscription messages" ON public.subscription_messages;
CREATE POLICY "Users and admins can view subscription messages" ON public.subscription_messages FOR SELECT USING (EXISTS (SELECT 1 FROM vip_subscriptions s WHERE s.id = subscription_messages.subscription_id AND (s.user_id = auth.uid() OR is_admin())));
DROP POLICY IF EXISTS "Users and admins can send subscription messages" ON public.subscription_messages;
CREATE POLICY "Users and admins can send subscription messages" ON public.subscription_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM vip_subscriptions s WHERE s.id = subscription_messages.subscription_id AND (s.user_id = auth.uid() OR is_admin())));

-- === virtual_cards ===
DROP POLICY IF EXISTS "Users can view own cards" ON public.virtual_cards;
CREATE POLICY "Users can view own cards" ON public.virtual_cards FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can create cards" ON public.virtual_cards;
CREATE POLICY "Users can create cards" ON public.virtual_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update cards" ON public.virtual_cards;
CREATE POLICY "Admins can update cards" ON public.virtual_cards FOR UPDATE USING (is_admin());

-- === live_sessions ===
DROP POLICY IF EXISTS "Everyone can view live sessions" ON public.live_sessions;
CREATE POLICY "Everyone can view live sessions" ON public.live_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Only admins can manage live sessions" ON public.live_sessions;
CREATE POLICY "Only admins can manage live sessions" ON public.live_sessions FOR ALL USING (is_admin());

-- === live_session_messages ===
DROP POLICY IF EXISTS "Users can view session messages" ON public.live_session_messages;
CREATE POLICY "Users can view session messages" ON public.live_session_messages FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can send session messages" ON public.live_session_messages;
CREATE POLICY "Users can send session messages" ON public.live_session_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- === fcm_tokens ===
DROP POLICY IF EXISTS "Users can view own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can view own tokens" ON public.fcm_tokens FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can insert own tokens" ON public.fcm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can update own tokens" ON public.fcm_tokens FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can delete own tokens" ON public.fcm_tokens FOR DELETE USING (auth.uid() = user_id);

-- === user_points ===
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;
CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can view all points" ON public.user_points;
CREATE POLICY "Users can view all points" ON public.user_points FOR SELECT USING (auth.uid() IS NOT NULL);

-- === point_transactions ===
DROP POLICY IF EXISTS "Users can view own transactions" ON public.point_transactions;
CREATE POLICY "Users can view own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- === badges ===
DROP POLICY IF EXISTS "Everyone can view badges" ON public.badges;
CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Only admins can manage badges" ON public.badges;
CREATE POLICY "Only admins can manage badges" ON public.badges FOR ALL USING (is_admin());

-- === user_badges ===
DROP POLICY IF EXISTS "Users can view badges" ON public.user_badges;
CREATE POLICY "Users can view badges" ON public.user_badges FOR SELECT USING (auth.uid() IS NOT NULL);

-- === user_streaks ===
DROP POLICY IF EXISTS "Users can view own streaks" ON public.user_streaks;
CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can view all streaks" ON public.user_streaks;
CREATE POLICY "Users can view all streaks" ON public.user_streaks FOR SELECT USING (auth.uid() IS NOT NULL);

-- === daily_quests ===
DROP POLICY IF EXISTS "Everyone can view active quests" ON public.daily_quests;
CREATE POLICY "Everyone can view active quests" ON public.daily_quests FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Only admins can manage quests" ON public.daily_quests;
CREATE POLICY "Only admins can manage quests" ON public.daily_quests FOR ALL USING (is_admin());

-- === user_daily_progress ===
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_daily_progress;
CREATE POLICY "Users can view own progress" ON public.user_daily_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_daily_progress;
CREATE POLICY "Users can insert own progress" ON public.user_daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_daily_progress;
CREATE POLICY "Users can update own progress" ON public.user_daily_progress FOR UPDATE USING (auth.uid() = user_id);

-- === referrals ===
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;
CREATE POLICY "Authenticated users can insert referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL USING (is_admin());

-- === referral_rewards ===
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.referral_rewards;
CREATE POLICY "Anyone can view active rewards" ON public.referral_rewards FOR SELECT USING (is_active = true OR is_admin());
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.referral_rewards;
CREATE POLICY "Admins can manage rewards" ON public.referral_rewards FOR ALL USING (is_admin());

-- === reward_redemptions ===
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.reward_redemptions;
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can create redemptions" ON public.reward_redemptions;
CREATE POLICY "Users can create redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update redemptions" ON public.reward_redemptions;
CREATE POLICY "Admins can update redemptions" ON public.reward_redemptions FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete redemptions" ON public.reward_redemptions;
CREATE POLICY "Admins can delete redemptions" ON public.reward_redemptions FOR DELETE USING (is_admin());

-- === verification_requests ===
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view own verification requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS "Users can submit verification requests" ON public.verification_requests;
CREATE POLICY "Users can submit verification requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update verification requests" ON public.verification_requests FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete verification requests" ON public.verification_requests;
CREATE POLICY "Admins can delete verification requests" ON public.verification_requests FOR DELETE USING (is_admin());

-- === content_views ===
DROP POLICY IF EXISTS "Users can view own views" ON public.content_views;
CREATE POLICY "Users can view own views" ON public.content_views FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own views" ON public.content_views;
CREATE POLICY "Users can insert own views" ON public.content_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- === signal_updates ===
DROP POLICY IF EXISTS "Anyone authenticated can view updates" ON public.signal_updates;
CREATE POLICY "Anyone authenticated can view updates" ON public.signal_updates FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can manage updates" ON public.signal_updates;
CREATE POLICY "Admins can manage updates" ON public.signal_updates FOR ALL USING (is_admin());

-- === room_message_reactions ===
DROP POLICY IF EXISTS "Anyone authenticated can view reactions" ON public.room_message_reactions;
CREATE POLICY "Anyone authenticated can view reactions" ON public.room_message_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can add reactions" ON public.room_message_reactions;
CREATE POLICY "Users can add reactions" ON public.room_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.room_message_reactions;
CREATE POLICY "Users can remove own reactions" ON public.room_message_reactions FOR DELETE USING (auth.uid() = user_id);

-- === room_message_views ===
DROP POLICY IF EXISTS "Anyone authenticated can read views" ON public.room_message_views;
CREATE POLICY "Anyone authenticated can read views" ON public.room_message_views FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can insert own views" ON public.room_message_views;
CREATE POLICY "Users can insert own views" ON public.room_message_views FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. INDEXES (الفهارس)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON public.signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_visibility ON public.signals(visibility);
CREATE INDEX IF NOT EXISTS idx_signal_likes_signal_id ON public.signal_likes(signal_id);
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
CREATE INDEX IF NOT EXISTS idx_room_message_reactions_message_id ON public.room_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_room_message_views_message_id ON public.room_message_views(message_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON public.support_tickets(sla_deadline) WHERE status = 'open' AND sla_notified = false;
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
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON public.vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_user_date ON public.user_daily_progress(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON public.articles(is_published);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user_id ON public.content_views(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_parent_id ON public.signal_updates(parent_id);


-- ============================================================
-- 8. REALTIME (البث المباشر)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usdt_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_updates;


-- ============================================================
-- 9. STORAGE (التخزين)
-- ============================================================

-- إنشاء buckets للتخزين
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('analysis-attachments', 'analysis-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-attachments', 'post-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-videos', 'lesson-videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-assets', 'cms-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('article-images', 'article-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('signal-attachments', 'signal-attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

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

-- سياسات تخزين صور المقالات
CREATE POLICY "Article images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');
CREATE POLICY "Only admins can upload article images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-images' AND public.is_admin());
CREATE POLICY "Only admins can update article images" ON storage.objects FOR UPDATE USING (bucket_id = 'article-images' AND public.is_admin());
CREATE POLICY "Only admins can delete article images" ON storage.objects FOR DELETE USING (bucket_id = 'article-images' AND public.is_admin());

-- سياسات تخزين مرفقات التحليلات والمنشورات
CREATE POLICY "Analysis attachments accessible" ON storage.objects FOR SELECT USING (bucket_id = 'analysis-attachments');
CREATE POLICY "Admins can upload analysis attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'analysis-attachments' AND public.is_admin());
CREATE POLICY "Post attachments accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-attachments');
CREATE POLICY "Users can upload post attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-attachments' AND auth.uid() IS NOT NULL);

-- سياسات تخزين مرفقات الإشارات
CREATE POLICY "Signal attachments accessible" ON storage.objects FOR SELECT USING (bucket_id = 'signal-attachments');
CREATE POLICY "Admins can upload signal attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signal-attachments' AND public.is_admin());

-- سياسات تخزين وثائق KYC
CREATE POLICY "KYC documents accessible by owner and admin" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
CREATE POLICY "Users can upload KYC documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- 10. SEED DATA (بيانات أولية)
-- ============================================================

-- إنشاء الغرف الافتراضية
INSERT INTO public.community_rooms (id, name, name_ar, description, description_ar, icon, color, category, requires_approval) VALUES
    ('general', 'General Discussion', 'المناقشات العامة', 'General discussions about trading and markets', 'مناقشات عامة حول التداول والأسواق', 'MessageSquare', 'blue', 'general', true),
    ('learning', 'Learning & Development', 'التعلم والتطوير', 'Lessons and tips for beginners and pros', 'دروس ونصائح للمبتدئين والمحترفين', 'GraduationCap', 'green', 'learning', false),
    ('vip', 'VIP Room', 'غرفة VIP', 'Exclusive discussions for VIP members', 'مناقشات حصرية لأعضاء VIP', 'Crown', 'gold', 'vip', true),
    ('news', 'News Discussion', 'مناقشة الأخبار', 'Discuss latest market news', 'مناقشة آخر أخبار السوق', 'Newspaper', 'purple', 'general', true);


-- ============================================================
-- انتهى التنفيذ بنجاح! ✅
-- عدد الجداول: 56 (شامل room_message_reactions و room_message_views)
-- عدد الدوال: 65+
-- عدد سياسات RLS: 170+
-- عدد حاويات التخزين: 9
-- آخر تحديث: 2026-03-25
-- ============================================================
