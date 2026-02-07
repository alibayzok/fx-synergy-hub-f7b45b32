export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_best_answer: boolean | null
          likes_count: number | null
          parent_id: string | null
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_best_answer?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_likes: {
        Row: {
          created_at: string | null
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          admin_notes: string | null
          amount: number | null
          created_at: string
          id: string
          network: string | null
          notes: string | null
          status: Database["public"]["Enums"]["service_status"]
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          network?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          network?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      threads: {
        Row: {
          content: string
          created_at: string | null
          has_best_answer: boolean | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          replies_count: number | null
          room_id: string
          tag: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          has_best_answer?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          room_id: string
          tag: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          has_best_answer?: boolean | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          room_id?: string
          tag?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          alternative_scenario: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          attachments: string[] | null
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          entry_type: Database["public"]["Enums"]["entry_type"]
          followers_count: number | null
          id: string
          last_update_note: string | null
          reason: string
          risk_note: string | null
          sl_price: number
          status: Database["public"]["Enums"]["trade_status"]
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe"]
          tp_prices: number[]
          updated_at: string
          visibility: Database["public"]["Enums"]["trade_visibility"]
        }
        Insert: {
          alternative_scenario?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          attachments?: string[] | null
          created_at?: string
          created_by?: string | null
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          entry_type?: Database["public"]["Enums"]["entry_type"]
          followers_count?: number | null
          id?: string
          last_update_note?: string | null
          reason: string
          risk_note?: string | null
          sl_price: number
          status?: Database["public"]["Enums"]["trade_status"]
          symbol: string
          timeframe?: Database["public"]["Enums"]["timeframe"]
          tp_prices?: number[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trade_visibility"]
        }
        Update: {
          alternative_scenario?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          attachments?: string[] | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["trade_direction"]
          entry_price?: number
          entry_type?: Database["public"]["Enums"]["entry_type"]
          followers_count?: number | null
          id?: string
          last_update_note?: string | null
          reason?: string
          risk_note?: string | null
          sl_price?: number
          status?: Database["public"]["Enums"]["trade_status"]
          symbol?: string
          timeframe?: Database["public"]["Enums"]["timeframe"]
          tp_prices?: number[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["trade_visibility"]
        }
        Relationships: []
      }
      usdt_listings: {
        Row: {
          commission: number
          contact_info: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          listing_type: Database["public"]["Enums"]["usdt_listing_type"]
          max_amount: number | null
          min_amount: number | null
          notes: string | null
          payment_methods: string[]
          price: number
          updated_at: string
        }
        Insert: {
          commission?: number
          contact_info: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          listing_type: Database["public"]["Enums"]["usdt_listing_type"]
          max_amount?: number | null
          min_amount?: number | null
          notes?: string | null
          payment_methods?: string[]
          price: number
          updated_at?: string
        }
        Update: {
          commission?: number
          contact_info?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          listing_type?: Database["public"]["Enums"]["usdt_listing_type"]
          max_amount?: number | null
          min_amount?: number | null
          notes?: string | null
          payment_methods?: string[]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_admin_view: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string | null
          language: string | null
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          language?: string | null
          last_name?: string | null
          phone?: never
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string | null
          language?: string | null
          last_name?: string | null
          phone?: never
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_trade: {
        Args: {
          trade_visibility: Database["public"]["Enums"]["trade_visibility"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_vip: { Args: never; Returns: boolean }
      mask_phone_number: { Args: { phone: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "vip" | "free"
      asset_type: "forex" | "metals" | "crypto"
      entry_type: "market" | "limit" | "stop"
      service_status:
        | "pending"
        | "in_progress"
        | "approved"
        | "rejected"
        | "completed"
      service_type:
        | "broker_deposit"
        | "broker_withdraw"
        | "usdt_buy"
        | "usdt_sell"
        | "broker_account"
      timeframe: "M5" | "M15" | "H1" | "H4" | "D1"
      trade_direction: "buy" | "sell"
      trade_status:
        | "pending"
        | "running"
        | "tp_hit"
        | "sl_hit"
        | "cancelled"
        | "closed_manual"
      trade_visibility: "free" | "vip"
      usdt_listing_type: "buy" | "sell"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vip", "free"],
      asset_type: ["forex", "metals", "crypto"],
      entry_type: ["market", "limit", "stop"],
      service_status: [
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "completed",
      ],
      service_type: [
        "broker_deposit",
        "broker_withdraw",
        "usdt_buy",
        "usdt_sell",
        "broker_account",
      ],
      timeframe: ["M5", "M15", "H1", "H4", "D1"],
      trade_direction: ["buy", "sell"],
      trade_status: [
        "pending",
        "running",
        "tp_hit",
        "sl_hit",
        "cancelled",
        "closed_manual",
      ],
      trade_visibility: ["free", "vip"],
      usdt_listing_type: ["buy", "sell"],
    },
  },
} as const
