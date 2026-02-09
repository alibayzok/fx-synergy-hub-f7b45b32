-- Create room membership status enum
CREATE TYPE public.room_membership_status AS ENUM ('pending', 'approved', 'rejected', 'banned');

-- Create room role enum
CREATE TYPE public.room_role AS ENUM ('member', 'moderator', 'owner');

-- Create community_rooms table for room definitions
CREATE TABLE public.community_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    icon TEXT DEFAULT 'MessageSquare',
    color TEXT DEFAULT 'blue',
    is_private BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room_members table for membership management
CREATE TABLE public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role room_role DEFAULT 'member',
    status room_membership_status DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    banned_until TIMESTAMP WITH TIME ZONE,
    ban_reason TEXT,
    UNIQUE(room_id, user_id)
);

-- Create room_join_requests table for tracking requests
CREATE TABLE public.room_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT,
    status room_membership_status DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(room_id, user_id, status)
);

-- Enable RLS
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is room moderator or owner
CREATE OR REPLACE FUNCTION public.is_room_moderator(p_room_id TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = p_room_id 
        AND user_id = p_user_id 
        AND role IN ('moderator', 'owner')
        AND status = 'approved'
    ) OR public.is_admin()
$$;

-- Helper function: Check if user is room member
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = p_room_id 
        AND user_id = p_user_id 
        AND status = 'approved'
    )
$$;

-- Helper function: Check if user can access room
CREATE OR REPLACE FUNCTION public.can_access_room(p_room_id TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        -- Admins can access all rooms
        public.is_admin() OR
        -- Check if room is public (not private)
        EXISTS (SELECT 1 FROM public.community_rooms WHERE id = p_room_id AND is_private = false) OR
        -- Check if user is approved member
        public.is_room_member(p_room_id, p_user_id)
$$;

-- RLS Policies for community_rooms
CREATE POLICY "Everyone can view rooms" ON public.community_rooms
FOR SELECT USING (true);

CREATE POLICY "Only admins can create rooms" ON public.community_rooms
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update rooms" ON public.community_rooms
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete rooms" ON public.community_rooms
FOR DELETE USING (is_admin());

-- RLS Policies for room_members
CREATE POLICY "Users can view room members" ON public.room_members
FOR SELECT USING (
    can_access_room(room_id) OR 
    user_id = auth.uid() OR
    is_room_moderator(room_id)
);

CREATE POLICY "Users can join rooms" ON public.room_members
FOR INSERT WITH CHECK (
    user_id = auth.uid() OR is_admin()
);

CREATE POLICY "Moderators and admins can update members" ON public.room_members
FOR UPDATE USING (
    is_room_moderator(room_id) OR user_id = auth.uid()
);

CREATE POLICY "Admins can delete members" ON public.room_members
FOR DELETE USING (
    is_admin() OR is_room_moderator(room_id)
);

-- RLS Policies for room_join_requests
CREATE POLICY "Users can view own requests" ON public.room_join_requests
FOR SELECT USING (
    user_id = auth.uid() OR is_room_moderator(room_id) OR is_admin()
);

CREATE POLICY "Users can create join requests" ON public.room_join_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can update requests" ON public.room_join_requests
FOR UPDATE USING (is_room_moderator(room_id) OR is_admin());

CREATE POLICY "Users can delete own requests" ON public.room_join_requests
FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- Trigger to notify on join request
CREATE OR REPLACE FUNCTION public.notify_room_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requester_name TEXT;
    room_name TEXT;
    moderator RECORD;
BEGIN
    -- Get requester name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO requester_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Get room name
    SELECT name_ar INTO room_name
    FROM public.community_rooms WHERE id = NEW.room_id;
    
    -- Notify all moderators and owners of this room
    FOR moderator IN
        SELECT user_id FROM public.room_members
        WHERE room_id = NEW.room_id AND role IN ('moderator', 'owner') AND status = 'approved'
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            moderator.user_id,
            'room_join_request',
            'طلب انضمام جديد',
            requester_name || ' يطلب الانضمام إلى غرفة ' || room_name,
            jsonb_build_object(
                'request_id', NEW.id,
                'room_id', NEW.room_id,
                'user_id', NEW.user_id
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_room_join_request
AFTER INSERT ON public.room_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_room_join_request();

-- Trigger to notify on request approval/rejection
CREATE OR REPLACE FUNCTION public.notify_room_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    room_name TEXT;
    status_text TEXT;
    title_text TEXT;
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        -- Get room name
        SELECT name_ar INTO room_name
        FROM public.community_rooms WHERE id = NEW.room_id;
        
        IF NEW.status = 'approved' THEN
            status_text := 'تم قبول طلب انضمامك إلى غرفة ' || room_name;
            title_text := 'تم قبول طلبك ✅';
            
            -- Auto-add user to room_members if approved
            INSERT INTO public.room_members (room_id, user_id, role, status, approved_by, approved_at)
            VALUES (NEW.room_id, NEW.user_id, 'member', 'approved', NEW.reviewed_by, now())
            ON CONFLICT (room_id, user_id) DO UPDATE SET
                status = 'approved',
                approved_by = NEW.reviewed_by,
                approved_at = now();
        ELSE
            status_text := 'تم رفض طلب انضمامك إلى غرفة ' || room_name;
            title_text := 'تم رفض طلبك ❌';
        END IF;
        
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            NEW.user_id,
            'room_request_status',
            title_text,
            status_text,
            jsonb_build_object(
                'request_id', NEW.id,
                'room_id', NEW.room_id,
                'status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_room_request_status_change
AFTER UPDATE ON public.room_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_room_request_status();

-- Insert default rooms
INSERT INTO public.community_rooms (id, name, name_ar, description, description_ar, icon, color, is_private, requires_approval)
VALUES
    ('general', 'General', 'العام', 'General discussions', 'مناقشات عامة', 'MessageSquare', 'blue', false, true),
    ('learning', 'Learning', 'التعلم', 'Educational content', 'محتوى تعليمي', 'GraduationCap', 'green', false, true),
    ('vip', 'VIP Room', 'غرفة VIP', 'VIP members only', 'لأعضاء VIP فقط', 'Crown', 'amber', true, true),
    ('usdt', 'USDT Exchange', 'تبادل USDT', 'USDT trading discussions', 'مناقشات تداول USDT', 'DollarSign', 'emerald', false, true),
    ('news', 'News', 'الأخبار', 'Market news and updates', 'أخبار وتحديثات السوق', 'Newspaper', 'red', false, true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_join_requests;