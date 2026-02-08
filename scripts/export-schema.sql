-- ============================================================
-- ASSASSIN FX - Database Schema Export
-- ============================================================
-- 
-- هذا الملف يحتوي على كامل هيكل قاعدة البيانات
-- نفّذه في Supabase SQL Editor لإنشاء جميع الجداول والسياسات
--
-- ترتيب التنفيذ:
-- 1. Enums (أنواع البيانات المخصصة)
-- 2. Tables (الجداول)
-- 3. Functions (الدوال)
-- 4. Triggers (المشغّلات)
-- 5. RLS Policies (سياسات الأمان)
-- 6. Indexes (الفهارس)
--
-- ============================================================


-- ============================================================
-- 1. ENUMS (أنواع البيانات المخصصة)
-- ============================================================

-- نوع دور المستخدم
CREATE TYPE public.app_role AS ENUM ('admin', 'vip', 'free');

-- نوع الأصل المالي
CREATE TYPE public.asset_type AS ENUM ('forex', 'metals', 'crypto');

-- نوع المحادثة
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- نوع الدخول للصفقة
CREATE TYPE public.entry_type AS ENUM ('market', 'limit', 'stop');

-- حالة طلب الصداقة
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

-- خصوصية الرسائل
CREATE TYPE public.messaging_privacy AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');

-- حالة طلب الخدمة
CREATE TYPE public.service_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'completed');

-- نوع الخدمة
CREATE TYPE public.service_type AS ENUM ('broker_deposit', 'broker_withdraw', 'usdt_buy', 'usdt_sell', 'broker_account');

-- الإطار الزمني
CREATE TYPE public.timeframe AS ENUM ('M5', 'M15', 'H1', 'H4', 'D1');

-- اتجاه الصفقة
CREATE TYPE public.trade_direction AS ENUM ('buy', 'sell');

-- حالة الصفقة
CREATE TYPE public.trade_status AS ENUM ('pending', 'running', 'tp_hit', 'sl_hit', 'cancelled', 'closed_manual');

-- رؤية الصفقة
CREATE TYPE public.trade_visibility AS ENUM ('free', 'vip');

-- نوع إعلان USDT
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

-- جدول المتابعات
CREATE TABLE public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- جدول إعدادات الخصوصية
CREATE TABLE public.user_privacy_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    messaging_privacy public.messaging_privacy NOT NULL DEFAULT 'everyone',
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

-- جدول المواضيع (المنتدى)
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

-- جدول رسائل الغرف
CREATE TABLE public.room_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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


-- ============================================================
-- 3. VIEWS (العروض)
-- ============================================================

-- عرض الملفات الشخصية للأدمن (مع إخفاء أرقام الهاتف)
CREATE OR REPLACE VIEW public.profiles_admin_view AS
SELECT 
    id,
    user_id,
    username,
    display_name,
    first_name,
    last_name,
    avatar_url,
    country,
    public.mask_phone_number(phone) as phone,
    language,
    created_at,
    updated_at
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
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- دالة التحقق من الأدمن
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- دالة التحقق من VIP
CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'vip')
$$;

-- دالة إخفاء رقم الهاتف
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN phone IS NULL THEN NULL
        WHEN length(phone) <= 4 THEN '****'
        ELSE concat(
            repeat('*', length(phone) - 4),
            right(phone, 4)
        )
    END
$$;

-- دالة التحقق من الوصول للصفقة
CREATE OR REPLACE FUNCTION public.can_access_trade(trade_visibility trade_visibility)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE 
            WHEN public.is_admin() THEN true
            WHEN trade_visibility = 'free' AND auth.uid() IS NOT NULL THEN true
            WHEN trade_visibility = 'vip' AND public.is_vip() THEN true
            ELSE false
        END
$$;

-- دالة التحقق من الصداقة
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.friend_requests
        WHERE status = 'accepted'
        AND ((sender_id = user1_id AND receiver_id = user2_id)
             OR (sender_id = user2_id AND receiver_id = user1_id))
    )
$$;

-- دالة التحقق من إمكانية إرسال رسالة
CREATE OR REPLACE FUNCTION public.can_message_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    privacy_setting messaging_privacy;
    is_friend BOOLEAN;
    is_follower BOOLEAN;
BEGIN
    SELECT messaging_privacy INTO privacy_setting
    FROM public.user_privacy_settings
    WHERE user_id = target_user_id;
    
    IF privacy_setting IS NULL THEN
        RETURN true;
    END IF;
    
    CASE privacy_setting
        WHEN 'everyone' THEN
            RETURN true;
        WHEN 'nobody' THEN
            RETURN false;
        WHEN 'friends_only' THEN
            SELECT EXISTS (
                SELECT 1 FROM public.friend_requests
                WHERE status = 'accepted'
                AND ((sender_id = auth.uid() AND receiver_id = target_user_id)
                     OR (sender_id = target_user_id AND receiver_id = auth.uid()))
            ) INTO is_friend;
            RETURN is_friend;
        WHEN 'followers_only' THEN
            SELECT EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = target_user_id
            ) INTO is_follower;
            RETURN is_follower;
        ELSE
            RETURN true;
    END CASE;
END;
$$;

-- دالة التحقق من المشاركة في المحادثة
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    )
$$;

-- دالة التحقق من أدمن المحادثة
CREATE OR REPLACE FUNCTION public.is_conversation_admin(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id AND is_admin = true
    )
$$;

-- دالة التحقق من منشئ المحادثة
CREATE OR REPLACE FUNCTION public.is_conversation_creator(conv_id uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conv_id AND created_by = check_user_id
    )
$$;

-- دالة إنشاء ملف شخصي للمستخدم الجديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free');
    
    RETURN NEW;
END;
$$;

-- دالة تحديث عدد الردود
CREATE OR REPLACE FUNCTION public.update_thread_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.threads SET replies_count = replies_count + 1 WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.threads SET replies_count = replies_count - 1 WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
END;
$$;

-- دالة تحديث عدد الإعجابات
CREATE OR REPLACE FUNCTION public.update_reply_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.replies SET likes_count = likes_count - 1 WHERE id = OLD.reply_id;
        RETURN OLD;
    END IF;
END;
$$;

-- دالة إشعار صاحب الموضوع عند الرد
CREATE OR REPLACE FUNCTION public.notify_thread_owner_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    thread_owner_id UUID;
    thread_title TEXT;
    replier_name TEXT;
BEGIN
    SELECT user_id, title INTO thread_owner_id, thread_title
    FROM public.threads WHERE id = NEW.thread_id;
    
    IF thread_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    SELECT COALESCE(display_name, username, 'مستخدم') INTO replier_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        thread_owner_id,
        'reply',
        'رد جديد',
        replier_name || ' رد على موضوعك: ' || LEFT(thread_title, 50),
        jsonb_build_object(
            'thread_id', NEW.thread_id,
            'reply_id', NEW.id,
            'replier_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- دالة إشعار الأدمن عند طلب خدمة جديد
CREATE OR REPLACE FUNCTION public.notify_admin_new_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_display_name TEXT;
    request_title TEXT;
    request_message TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    CASE NEW.type
        WHEN 'broker_account' THEN
            request_title := 'طلب فتح حساب تداول';
            request_message := user_display_name || ' يطلب فتح حساب تداول جديد';
        WHEN 'broker_deposit' THEN
            request_title := 'طلب إيداع للوسيط';
            request_message := user_display_name || ' يطلب إيداع بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'broker_withdraw' THEN
            request_title := 'طلب سحب من الوسيط';
            request_message := user_display_name || ' يطلب سحب بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_buy' THEN
            request_title := 'طلب شراء USDT';
            request_message := user_display_name || ' يطلب شراء USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_sell' THEN
            request_title := 'طلب بيع USDT';
            request_message := user_display_name || ' يطلب بيع USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
    END CASE;
    
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'service_request',
        request_title,
        request_message,
        jsonb_build_object(
            'request_id', NEW.id,
            'user_id', NEW.user_id,
            'type', NEW.type,
            'amount', NEW.amount,
            'network', NEW.network
        )
    );
    
    RETURN NEW;
END;
$$;

-- دالة إشعار الأدمن عند صفقة جديدة
CREATE OR REPLACE FUNCTION public.notify_admin_new_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'trade_created',
        'صفقة جديدة',
        'تم إنشاء صفقة ' || NEW.direction || ' على ' || NEW.symbol,
        jsonb_build_object(
            'trade_id', NEW.id,
            'symbol', NEW.symbol,
            'direction', NEW.direction,
            'visibility', NEW.visibility
        )
    );
    RETURN NEW;
END;
$$;

-- دالة إشعار الأدمن عند مستخدم جديد
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
    milestone INTEGER;
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'new_user',
        'مستخدم جديد',
        'انضم ' || COALESCE(NEW.display_name, 'مستخدم جديد') || ' إلى المنصة',
        jsonb_build_object(
            'user_id', NEW.user_id,
            'display_name', NEW.display_name,
            'country', NEW.country
        )
    );

    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    milestone := CASE
        WHEN user_count = 10 THEN 10
        WHEN user_count = 25 THEN 25
        WHEN user_count = 50 THEN 50
        WHEN user_count = 100 THEN 100
        WHEN user_count = 250 THEN 250
        WHEN user_count = 500 THEN 500
        WHEN user_count = 1000 THEN 1000
        WHEN user_count = 5000 THEN 5000
        WHEN user_count = 10000 THEN 10000
        ELSE NULL
    END;

    IF milestone IS NOT NULL THEN
        INSERT INTO public.admin_notifications (type, title, message, data)
        VALUES (
            'milestone',
            '🎉 إنجاز جديد!',
            'تهانينا! وصل عدد المستخدمين إلى ' || milestone || ' مستخدم',
            jsonb_build_object('milestone', milestone, 'total_users', user_count)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- دالة إشعار الرسالة الجديدة
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name TEXT;
    conv_name TEXT;
    recipient RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
    FROM public.profiles WHERE user_id = NEW.sender_id;
    
    SELECT name, type INTO conv_name FROM public.conversations WHERE id = NEW.conversation_id;
    
    FOR recipient IN
        SELECT user_id FROM public.conversation_participants
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            recipient.user_id,
            'message',
            'رسالة جديدة',
            sender_name || ': ' || LEFT(NEW.content, 50),
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- دالة إشعار طلب الصداقة
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
        FROM public.profiles WHERE user_id = NEW.sender_id;
        
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            NEW.receiver_id,
            'friend_request',
            'طلب صداقة جديد',
            sender_name || ' أرسل لك طلب صداقة',
            jsonb_build_object('request_id', NEW.id, 'sender_id', NEW.sender_id)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
        FROM public.profiles WHERE user_id = NEW.receiver_id;
        
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            NEW.sender_id,
            'friend_accepted',
            'تم قبول طلب الصداقة',
            sender_name || ' قبل طلب صداقتك',
            jsonb_build_object('request_id', NEW.id, 'friend_id', NEW.receiver_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;


-- ============================================================
-- 5. TRIGGERS (المشغّلات)
-- ============================================================

-- Trigger لإنشاء ملف شخصي عند تسجيل مستخدم جديد
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers لتحديث updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
    BEFORE UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at
    BEFORE UPDATE ON public.user_privacy_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usdt_listings_updated_at
    BEFORE UPDATE ON public.usdt_listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON public.threads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON public.replies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers للإشعارات
CREATE TRIGGER on_new_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_user();

CREATE TRIGGER on_new_trade
    AFTER INSERT ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_trade();

CREATE TRIGGER on_new_service_request
    AFTER INSERT ON public.service_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_service_request();

CREATE TRIGGER on_new_reply
    AFTER INSERT ON public.replies
    FOR EACH ROW EXECUTE FUNCTION public.notify_thread_owner_on_reply();

CREATE TRIGGER on_reply_insert_update_count
    AFTER INSERT ON public.replies
    FOR EACH ROW EXECUTE FUNCTION public.update_thread_replies_count();

CREATE TRIGGER on_reply_delete_update_count
    AFTER DELETE ON public.replies
    FOR EACH ROW EXECUTE FUNCTION public.update_thread_replies_count();

CREATE TRIGGER on_reply_like_insert
    AFTER INSERT ON public.reply_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_reply_likes_count();

CREATE TRIGGER on_reply_like_delete
    AFTER DELETE ON public.reply_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_reply_likes_count();

CREATE TRIGGER on_new_direct_message
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE TRIGGER on_friend_request_change
    AFTER INSERT OR UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();


-- ============================================================
-- 6. ROW LEVEL SECURITY (سياسات الأمان)
-- ============================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles via view" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- سياسات user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin() AND user_id <> auth.uid());

-- سياسات trades
CREATE POLICY "Users can view trades based on visibility" ON public.trades FOR SELECT USING (can_access_trade(visibility));
CREATE POLICY "Only admins can insert trades" ON public.trades FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update trades" ON public.trades FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete trades" ON public.trades FOR DELETE USING (is_admin());

-- سياسات conversations
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (is_conversation_participant(id) OR created_by = auth.uid());
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Conversation admins can update" ON public.conversations FOR UPDATE USING (is_conversation_admin(id));

-- سياسات conversation_participants
CREATE POLICY "Participants can view their conversations" ON public.conversation_participants FOR SELECT USING (is_conversation_participant(conversation_id));
CREATE POLICY "Conversation creator can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR is_conversation_creator(conversation_id) OR is_conversation_admin(conversation_id));
CREATE POLICY "Participants can update their own record" ON public.conversation_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave conversations" ON public.conversation_participants FOR DELETE USING (auth.uid() = user_id);

-- سياسات direct_messages
CREATE POLICY "Participants can view messages" ON public.direct_messages FOR SELECT USING (is_conversation_participant(conversation_id));
CREATE POLICY "Participants can send messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_conversation_participant(conversation_id));
CREATE POLICY "Senders can update own messages" ON public.direct_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Senders can delete own messages" ON public.direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- سياسات friend_requests
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
CREATE POLICY "Users can delete own requests" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- سياسات follows
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- سياسات user_privacy_settings
CREATE POLICY "Users can view all privacy settings" ON public.user_privacy_settings FOR SELECT USING (true);
CREATE POLICY "Users can insert own privacy settings" ON public.user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings" ON public.user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- سياسات service_requests
CREATE POLICY "Users can view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can update service requests" ON public.service_requests FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete service requests" ON public.service_requests FOR DELETE USING (is_admin());

-- سياسات usdt_listings
CREATE POLICY "Authenticated users can view active USDT listings" ON public.usdt_listings FOR SELECT USING (auth.uid() IS NOT NULL AND (is_active = true OR is_admin()));
CREATE POLICY "Only admins can insert USDT listings" ON public.usdt_listings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update USDT listings" ON public.usdt_listings FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete USDT listings" ON public.usdt_listings FOR DELETE USING (is_admin());

-- سياسات threads
CREATE POLICY "Users can view all threads" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Users can create threads" ON public.threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own threads" ON public.threads FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own threads" ON public.threads FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- سياسات replies
CREATE POLICY "Users can view all replies" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.replies FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own replies" ON public.replies FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- سياسات reply_likes
CREATE POLICY "Users can view all likes" ON public.reply_likes FOR SELECT USING (true);
CREATE POLICY "Users can like replies" ON public.reply_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON public.reply_likes FOR DELETE USING (auth.uid() = user_id);

-- سياسات room_messages
CREATE POLICY "Users can view room messages" ON public.room_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON public.room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages or admin" ON public.room_messages FOR UPDATE USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can delete own messages" ON public.room_messages FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- سياسات user_notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);

-- سياسات admin_notifications
CREATE POLICY "Only admins can view notifications" ON public.admin_notifications FOR SELECT USING (is_admin());
CREATE POLICY "Only admins can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update notifications" ON public.admin_notifications FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete notifications" ON public.admin_notifications FOR DELETE USING (is_admin());


-- ============================================================
-- 7. INDEXES (الفهارس)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_visibility ON public.trades(visibility);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
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


-- ============================================================
-- 8. REALTIME (البث المباشر)
-- ============================================================

-- تفعيل Realtime للجداول التي تحتاجه
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;


-- ============================================================
-- انتهى التنفيذ بنجاح! ✅
-- ============================================================
