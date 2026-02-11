// Market Types
export type AssetType = 'forex' | 'metals' | 'crypto';
export type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
export type ContentVisibility = 'free' | 'vip';

export interface MarketSymbol {
  symbol: string;
  name: string;
  asset_type: AssetType;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  last_update: string;
}

// Community Types
export type RoomType = 'general' | 'learning' | 'vip' | 'usdt' | 'news';
export type ThreadTag = 'question' | 'analysis' | 'alert' | 'help';

export interface Room {
  id: string;
  type: RoomType;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  members_count: number;
  is_vip: boolean;
  last_activity: string;
}

export interface Thread {
  id: string;
  room_id: string;
  created_at: string;
  created_by: User;
  title: string;
  content: string;
  tag: ThreadTag;
  replies_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  has_best_answer: boolean;
}

export interface Reply {
  id: string;
  thread_id: string;
  parent_id?: string;
  created_at: string;
  created_by: User;
  content: string;
  is_best_answer: boolean;
  likes_count: number;
}

// User Types
export type UserRole = 'admin' | 'vip' | 'free';

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar?: string;
  role: UserRole;
  language: 'ar' | 'en';
  joined_at: string;
  watchlist: string[];
}

// Service Types
export type ServiceType = 'broker_account' | 'usdt_buy' | 'usdt_sell' | 'deposit' | 'withdraw';
export type ServiceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';

export interface ServiceRequest {
  id: string;
  type: ServiceType;
  user_id: string;
  amount?: number;
  network?: string;
  status: ServiceStatus;
  notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  admin_replies?: AdminReply[];
}

export interface AdminReply {
  id: string;
  request_id: string;
  admin_id: string;
  message: string;
  created_at: string;
}

// Price Alert Types
export type AlertCondition = 'above' | 'below' | 'enter_zone' | 'near_sl' | 'near_tp';

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  condition: AlertCondition;
  target_price: number;
  is_triggered: boolean;
  created_at: string;
}

// News Types
export interface NewsItem {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  image?: string;
  published_at: string;
  is_breaking: boolean;
}
