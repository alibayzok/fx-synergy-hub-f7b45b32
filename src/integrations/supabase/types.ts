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
      analyses: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          attachments: string[] | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          likes_count: number | null
          symbol: string | null
          timeframe: Database["public"]["Enums"]["timeframe"] | null
          title: string
          updated_at: string
          views_count: number | null
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes_count?: number | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          title: string
          updated_at?: string
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes_count?: number | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          title?: string
          updated_at?: string
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: []
      }
      analysis_likes: {
        Row: {
          analysis_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_likes_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          description_ar: string | null
          id: string
          label_ar: string
          label_en: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          description_ar?: string | null
          id?: string
          label_ar: string
          label_en?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          description_ar?: string | null
          id?: string
          label_ar?: string
          label_en?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      community_rooms: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          icon: string | null
          id: string
          is_private: boolean | null
          name: string
          name_ar: string
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id: string
          is_private?: boolean | null
          name: string
          name_ar: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          name_ar?: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_admin: boolean
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_content: {
        Row: {
          action_taken: string | null
          confidence: number | null
          content_id: string
          content_type: string
          created_at: string
          flag_reason: string
          flagged_url: string | null
          id: string
          predictions: Json | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          confidence?: number | null
          content_id: string
          content_type: string
          created_at?: string
          flag_reason: string
          flagged_url?: string | null
          id?: string
          predictions?: Json | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          confidence?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          flag_reason?: string
          flagged_url?: string | null
          id?: string
          predictions?: Json | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      learning_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_courses: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description_ar: string
          description_en: string
          icon: string
          id: string
          is_published: boolean
          is_vip: boolean
          level: Database["public"]["Enums"]["course_level"]
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          is_published?: boolean
          is_vip?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          is_published?: boolean
          is_vip?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lessons: {
        Row: {
          content_ar: string
          content_en: string
          content_type: string
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          is_published: boolean
          is_vip: boolean
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_ar?: string
          content_en?: string
          content_type?: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          is_vip?: boolean
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_ar?: string
          content_en?: string
          content_type?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          is_vip?: boolean
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
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
          onboarding_completed: boolean | null
          phone: string | null
          trading_preferences: Json | null
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
          onboarding_completed?: boolean | null
          phone?: string | null
          trading_preferences?: Json | null
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
          onboarding_completed?: boolean | null
          phone?: string | null
          trading_preferences?: Json | null
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
      room_join_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: Database["public"]["Enums"]["room_membership_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["room_membership_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["room_membership_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_join_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          ban_reason: string | null
          banned_until: string | null
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["room_role"] | null
          room_id: string
          status: Database["public"]["Enums"]["room_membership_status"] | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["room_role"] | null
          room_id: string
          status?: Database["public"]["Enums"]["room_membership_status"] | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          ban_reason?: string | null
          banned_until?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["room_role"] | null
          room_id?: string
          status?: Database["public"]["Enums"]["room_membership_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "community_rooms"
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
          payment_method: string | null
          status: Database["public"]["Enums"]["service_status"]
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          network?: string | null
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string
          id?: string
          network?: string | null
          notes?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["service_status"]
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      signal_likes: {
        Row: {
          created_at: string
          id: string
          signal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_likes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          attachments: string[] | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          likes_count: number | null
          symbol: string | null
          timeframe: Database["public"]["Enums"]["timeframe"] | null
          title: string
          updated_at: string
          views_count: number | null
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes_count?: number | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          title: string
          updated_at?: string
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          likes_count?: number | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          title?: string
          updated_at?: string
          views_count?: number | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: []
      }
      subscription_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          subscription_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          subscription_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_messages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "vip_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          is_admin: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          escalated_at: string | null
          escalated_by: string | null
          escalated_to: string | null
          escalation_reason: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
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
      user_posts: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          attachments: string[] | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          is_hidden: boolean | null
          likes_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string | null
          symbol: string | null
          timeframe: Database["public"]["Enums"]["timeframe"] | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          attachments?: string[] | null
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          symbol?: string | null
          timeframe?: Database["public"]["Enums"]["timeframe"] | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: []
      }
      user_privacy_settings: {
        Row: {
          created_at: string
          friends_visibility: Database["public"]["Enums"]["privacy_setting"]
          id: string
          messaging_privacy: Database["public"]["Enums"]["privacy_setting"]
          show_online_status: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friends_visibility?: Database["public"]["Enums"]["privacy_setting"]
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["privacy_setting"]
          show_online_status?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friends_visibility?: Database["public"]["Enums"]["privacy_setting"]
          id?: string
          messaging_privacy?: Database["public"]["Enums"]["privacy_setting"]
          show_online_status?: boolean
          updated_at?: string
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
      vip_subscriptions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
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
          onboarding_completed: boolean | null
          phone: string | null
          trading_preferences: Json | null
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
          onboarding_completed?: boolean | null
          phone?: string | null
          trading_preferences?: Json | null
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
          onboarding_completed?: boolean | null
          phone?: string | null
          trading_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string | null
          language: string | null
          last_name: string | null
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
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_vip_subscription: {
        Args: { p_duration_days?: number; p_subscription_id: string }
        Returns: undefined
      }
      are_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      can_access_content: {
        Args: { content_vis: Database["public"]["Enums"]["content_visibility"] }
        Returns: boolean
      }
      can_access_room: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_message_user: { Args: { target_user_id: string }; Returns: boolean }
      can_view_post: {
        Args: {
          post_user_id: string
          post_visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Returns: boolean
      }
      close_stale_support_tickets: { Args: never; Returns: number }
      deactivate_vip_subscription: {
        Args: { p_subscription_id: string }
        Returns: undefined
      }
      get_table_columns: {
        Args: { p_table_name: string }
        Returns: {
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_thread_room_id: { Args: { p_thread_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_admin: {
        Args: { check_user_id?: string; conv_id: string }
        Returns: boolean
      }
      is_conversation_creator: {
        Args: { check_user_id?: string; conv_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { check_user_id?: string; conv_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_room_moderator: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_support_agent: { Args: { p_user_id?: string }; Returns: boolean }
      is_vip: { Args: never; Returns: boolean }
      list_public_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      mask_phone_number: { Args: { phone: string }; Returns: string }
      reject_vip_subscription: {
        Args: { p_reason?: string; p_subscription_id: string }
        Returns: undefined
      }
      request_vip_subscription: { Args: { p_plan: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "vip" | "free"
      asset_type: "forex" | "metals" | "crypto"
      content_visibility: "free" | "vip"
      conversation_type: "direct" | "group"
      course_level: "beginner" | "intermediate" | "advanced"
      friend_request_status: "pending" | "accepted" | "rejected"
      post_visibility: "everyone" | "friends_only" | "followers_only" | "nobody"
      privacy_setting: "everyone" | "friends_only" | "followers_only" | "nobody"
      room_membership_status: "pending" | "approved" | "rejected" | "banned"
      room_role: "member" | "moderator" | "owner"
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
      signal_type: "signal" | "tip"
      timeframe: "M5" | "M15" | "H1" | "H4" | "D1"
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
      content_visibility: ["free", "vip"],
      conversation_type: ["direct", "group"],
      course_level: ["beginner", "intermediate", "advanced"],
      friend_request_status: ["pending", "accepted", "rejected"],
      post_visibility: ["everyone", "friends_only", "followers_only", "nobody"],
      privacy_setting: ["everyone", "friends_only", "followers_only", "nobody"],
      room_membership_status: ["pending", "approved", "rejected", "banned"],
      room_role: ["member", "moderator", "owner"],
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
      signal_type: ["signal", "tip"],
      timeframe: ["M5", "M15", "H1", "H4", "D1"],
      usdt_listing_type: ["buy", "sell"],
    },
  },
} as const
