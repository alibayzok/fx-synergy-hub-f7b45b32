import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Database, 
  Download, 
  FileJson, 
  FileCode,
  Loader2,
  CheckCircle,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TABLES = [
  'profiles',
  'user_roles',
  'trades',
  'threads',
  'replies',
  'reply_likes',
  'room_messages',
  'conversations',
  'conversation_participants',
  'direct_messages',
  'follows',
  'friend_requests',
  'service_requests',
  'usdt_listings',
  'admin_notifications',
  'user_notifications',
  'user_privacy_settings'
] as const;

type TableName = typeof TABLES[number];

const SCHEMA_SQL = `-- ASSASSIN FX Database Schema
-- Exported on: ${new Date().toISOString()}
-- Project: ASSASSIN FX Trading Community

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE app_role AS ENUM ('admin', 'vip', 'free');
CREATE TYPE asset_type AS ENUM ('forex', 'metals', 'crypto');
CREATE TYPE conversation_type AS ENUM ('direct', 'group');
CREATE TYPE entry_type AS ENUM ('market', 'limit', 'stop');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE messaging_privacy AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');
CREATE TYPE service_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'completed');
CREATE TYPE service_type AS ENUM ('broker_deposit', 'broker_withdraw', 'usdt_buy', 'usdt_sell', 'broker_account');
CREATE TYPE timeframe AS ENUM ('M5', 'M15', 'H1', 'H4', 'D1');
CREATE TYPE trade_direction AS ENUM ('buy', 'sell');
CREATE TYPE trade_status AS ENUM ('pending', 'running', 'tp_hit', 'sl_hit', 'cancelled', 'closed_manual');
CREATE TYPE trade_visibility AS ENUM ('free', 'vip');
CREATE TYPE usdt_listing_type AS ENUM ('buy', 'sell');

-- ============================================
-- TABLES
-- ============================================

-- Profiles Table
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trades Table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  symbol TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  direction trade_direction NOT NULL,
  entry_type entry_type NOT NULL DEFAULT 'market',
  entry_price NUMERIC NOT NULL,
  sl_price NUMERIC NOT NULL,
  tp_prices NUMERIC[] NOT NULL DEFAULT '{}',
  status trade_status NOT NULL DEFAULT 'pending',
  visibility trade_visibility NOT NULL DEFAULT 'free',
  timeframe timeframe NOT NULL DEFAULT 'H1',
  reason TEXT NOT NULL,
  risk_note TEXT,
  alternative_scenario TEXT,
  last_update_note TEXT,
  attachments TEXT[],
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threads Table
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Replies Table
CREATE TABLE public.replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reply Likes Table
CREATE TABLE public.reply_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Room Messages Table
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations Table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  type conversation_type NOT NULL DEFAULT 'direct',
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation Participants Table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

-- Direct Messages Table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Follows Table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Friend Requests Table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Requests Table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type service_type NOT NULL,
  status service_status NOT NULL DEFAULT 'pending',
  amount NUMERIC,
  network TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USDT Listings Table
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Notifications Table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Notifications Table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Privacy Settings Table
CREATE TABLE public.user_privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  messaging_privacy messaging_privacy NOT NULL DEFAULT 'everyone',
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is VIP
CREATE OR REPLACE FUNCTION public.is_vip()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'vip')
$$;

-- Check if user can access a trade based on visibility
CREATE OR REPLACE FUNCTION public.can_access_trade(trade_visibility trade_visibility)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN public.is_admin() THEN true
      WHEN trade_visibility = 'free' AND auth.uid() IS NOT NULL THEN true
      WHEN trade_visibility = 'vip' AND public.is_vip() THEN true
      ELSE false
    END
$$;

-- Check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE status = 'accepted'
    AND ((sender_id = user1_id AND receiver_id = user2_id)
         OR (sender_id = user2_id AND receiver_id = user1_id))
  )
$$;

-- Check if current user can message target user
CREATE OR REPLACE FUNCTION public.can_message_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    WHEN 'everyone' THEN RETURN true;
    WHEN 'nobody' THEN RETURN false;
    WHEN 'friends_only' THEN
      SELECT public.are_friends(auth.uid(), target_user_id) INTO is_friend;
      RETURN is_friend;
    WHEN 'followers_only' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid() AND following_id = target_user_id
      ) INTO is_follower;
      RETURN is_follower;
    ELSE RETURN true;
  END CASE;
END;
$$;

-- Mask phone number for privacy
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN phone IS NULL THEN NULL
    WHEN length(phone) <= 4 THEN '****'
    ELSE concat(repeat('*', length(phone) - 4), right(phone, 4))
  END
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Examples - Add your own)
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin());

-- Trades policies  
CREATE POLICY "Users can view trades based on visibility" ON public.trades FOR SELECT USING (can_access_trade(visibility));
CREATE POLICY "Only admins can insert trades" ON public.trades FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update trades" ON public.trades FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete trades" ON public.trades FOR DELETE USING (is_admin());

-- Add more RLS policies as needed...
`;

export const DatabaseExport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'schema' | 'data' | 'full' | null>(null);
  const [progress, setProgress] = useState(0);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});

  const fetchTableCounts = async () => {
    const stats: Record<string, number> = {};
    
    for (const table of TABLES) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      stats[table] = count || 0;
    }
    
    setTableStats(stats);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSchema = () => {
    setExporting(true);
    setExportType('schema');
    setProgress(50);
    
    setTimeout(() => {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(SCHEMA_SQL, `assassin-fx-schema-${timestamp}.sql`, 'text/sql');
      setProgress(100);
      
      setTimeout(() => {
        setExporting(false);
        setExportType(null);
        setProgress(0);
        toast({
          title: t('admin.export.schemaExported'),
          description: t('admin.export.schemaExportedDesc')
        });
      }, 500);
    }, 1000);
  };

  const exportData = async () => {
    setExporting(true);
    setExportType('data');
    setProgress(0);
    
    const allData: Record<string, unknown[]> = {};
    const totalTables = TABLES.length;
    
    for (let i = 0; i < totalTables; i++) {
      const table = TABLES[i];
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error && data) {
        allData[table] = data;
      } else {
        allData[table] = [];
      }
      
      setProgress(Math.round(((i + 1) / totalTables) * 100));
    }
    
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      projectName: 'ASSASSIN FX',
      data: allData,
      metadata: {
        totalRecords: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
        tablesCount: totalTables
      }
    };
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(exportPayload, null, 2), 
      `assassin-fx-data-${timestamp}.json`, 
      'application/json'
    );
    
    setTimeout(() => {
      setExporting(false);
      setExportType(null);
      setProgress(0);
      toast({
        title: t('admin.export.dataExported'),
        description: t('admin.export.dataExportedDesc')
      });
    }, 500);
  };

  const exportFull = async () => {
    setExporting(true);
    setExportType('full');
    setProgress(0);
    
    const allData: Record<string, unknown[]> = {};
    const totalTables = TABLES.length;
    
    for (let i = 0; i < totalTables; i++) {
      const table = TABLES[i];
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error && data) {
        allData[table] = data;
      } else {
        allData[table] = [];
      }
      
      setProgress(Math.round(((i + 1) / totalTables) * 80));
    }
    
    setProgress(90);
    
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      projectName: 'ASSASSIN FX',
      schema: {
        sql: SCHEMA_SQL
      },
      data: allData,
      metadata: {
        totalRecords: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
        tablesCount: totalTables
      }
    };
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(
      JSON.stringify(exportPayload, null, 2), 
      `assassin-fx-full-backup-${timestamp}.json`, 
      'application/json'
    );
    
    setProgress(100);
    
    setTimeout(() => {
      setExporting(false);
      setExportType(null);
      setProgress(0);
      toast({
        title: t('admin.export.fullExported'),
        description: t('admin.export.fullExportedDesc')
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCode className="w-5 h-5 text-primary" />
              {t('admin.export.schemaTitle')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('admin.export.schemaDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportSchema} 
              disabled={exporting}
              className="w-full gap-2"
              variant="outline"
            >
              {exporting && exportType === 'schema' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('admin.export.downloadSql')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="w-5 h-5 text-profit" />
              {t('admin.export.dataTitle')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('admin.export.dataDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportData} 
              disabled={exporting}
              className="w-full gap-2"
              variant="outline"
            >
              {exporting && exportType === 'data' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('admin.export.downloadJson')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              {t('admin.export.fullTitle')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('admin.export.fullDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportFull} 
              disabled={exporting}
              className="w-full gap-2"
            >
              {exporting && exportType === 'full' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t('admin.export.downloadFull')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {exporting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('admin.export.exporting')}...
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>
      )}

      {/* Tables Overview */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Table className="w-5 h-5 text-muted-foreground" />
              {t('admin.export.tablesOverview')}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchTableCounts}
              className="gap-2"
            >
              {t('admin.export.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TABLES.map((table) => (
              <div 
                key={table}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
              >
                <span className="truncate text-muted-foreground">{table}</span>
                {tableStats[table] !== undefined ? (
                  <Badge variant="secondary" className="ml-2">
                    {tableStats[table]}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">
                    -
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
