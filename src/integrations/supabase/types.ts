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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_size: number
          account_type: Database["public"]["Enums"]["account_type"]
          broker: string | null
          created_at: string
          currency: string
          daily_dd_limit: number | null
          id: string
          is_default: boolean
          max_dd_limit: number | null
          name: string
          notes: string | null
          profit_target: number | null
          prop_firm: string | null
          starting_balance: number
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_size?: number
          account_type?: Database["public"]["Enums"]["account_type"]
          broker?: string | null
          created_at?: string
          currency?: string
          daily_dd_limit?: number | null
          id?: string
          is_default?: boolean
          max_dd_limit?: number | null
          name: string
          notes?: string | null
          profit_target?: number | null
          prop_firm?: string | null
          starting_balance?: number
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_size?: number
          account_type?: Database["public"]["Enums"]["account_type"]
          broker?: string | null
          created_at?: string
          currency?: string
          daily_dd_limit?: number | null
          id?: string
          is_default?: boolean
          max_dd_limit?: number | null
          name?: string
          notes?: string | null
          profit_target?: number | null
          prop_firm?: string | null
          starting_balance?: number
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          label: string
          position: number
          user_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          label: string
          position?: number
          user_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          tag: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          tag?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          tag?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          label: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      model_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          model_id: string
          position: number
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          model_id: string
          position?: number
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          model_id?: string
          position?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "trading_models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          display_name: string | null
          id: string
          starting_balance: number
          timezone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          id: string
          starting_balance?: number
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          starting_balance?: number
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          account_id: string | null
          created_at: string
          id: string
          lessons: string | null
          next_focus: string | null
          period_end: string
          period_start: string
          review_type: Database["public"]["Enums"]["review_type"]
          title: string | null
          updated_at: string
          user_id: string
          what_didnt: string | null
          what_worked: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          period_end: string
          period_start: string
          review_type?: Database["public"]["Enums"]["review_type"]
          title?: string | null
          updated_at?: string
          user_id: string
          what_didnt?: string | null
          what_worked?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          next_focus?: string | null
          period_end?: string
          period_start?: string
          review_type?: Database["public"]["Enums"]["review_type"]
          title?: string | null
          updated_at?: string
          user_id?: string
          what_didnt?: string | null
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      rulebook_rules: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          position: number
          rule: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          position?: number
          rule: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          position?: number
          rule?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          accent_color: string
          preferences: Json
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          preferences?: Json
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          preferences?: Json
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          phase: Database["public"]["Enums"]["trade_phase"] | null
          position: number
          storage_path: string
          trade_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["trade_phase"] | null
          position?: number
          storage_path: string
          trade_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          phase?: Database["public"]["Enums"]["trade_phase"] | null
          position?: number
          storage_path?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_images_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_mistakes: {
        Row: {
          mistake_id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          mistake_id: string
          trade_id: string
          user_id: string
        }
        Update: {
          mistake_id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_mistakes_mistake_id_fkey"
            columns: ["mistake_id"]
            isOneToOne: false
            referencedRelation: "mistakes"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_tag_links: {
        Row: {
          tag_id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          tag_id: string
          trade_id: string
          user_id: string
        }
        Update: {
          tag_id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "trade_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["trade_direction"]
          emotions_after: string | null
          emotions_before: string | null
          entry_price: number | null
          grade: Database["public"]["Enums"]["trade_grade"] | null
          id: string
          killzone: string | null
          lessons: string | null
          lot_size: number | null
          market: string | null
          mistakes: string | null
          model: string | null
          model_id: string | null
          notes: string | null
          pair: string
          pnl: number
          position_size: number | null
          rationale: string | null
          result: Database["public"]["Enums"]["trade_result"] | null
          risk_percent: number | null
          rr_achieved: number | null
          rr_planned: number | null
          session: string | null
          stop_loss: number | null
          take_profit: number | null
          trade_date: string
          tradingview_link: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["trade_direction"]
          emotions_after?: string | null
          emotions_before?: string | null
          entry_price?: number | null
          grade?: Database["public"]["Enums"]["trade_grade"] | null
          id?: string
          killzone?: string | null
          lessons?: string | null
          lot_size?: number | null
          market?: string | null
          mistakes?: string | null
          model?: string | null
          model_id?: string | null
          notes?: string | null
          pair: string
          pnl?: number
          position_size?: number | null
          rationale?: string | null
          result?: Database["public"]["Enums"]["trade_result"] | null
          risk_percent?: number | null
          rr_achieved?: number | null
          rr_planned?: number | null
          session?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          trade_date?: string
          tradingview_link?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["trade_direction"]
          emotions_after?: string | null
          emotions_before?: string | null
          entry_price?: number | null
          grade?: Database["public"]["Enums"]["trade_grade"] | null
          id?: string
          killzone?: string | null
          lessons?: string | null
          lot_size?: number | null
          market?: string | null
          mistakes?: string | null
          model?: string | null
          model_id?: string | null
          notes?: string | null
          pair?: string
          pnl?: number
          position_size?: number | null
          rationale?: string | null
          result?: Database["public"]["Enums"]["trade_result"] | null
          risk_percent?: number | null
          rr_achieved?: number | null
          rr_planned?: number | null
          session?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          trade_date?: string
          tradingview_link?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "trading_models"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_models: {
        Row: {
          active: boolean
          checklist: Json
          confirmation_rules: string | null
          created_at: string
          entry_rules: string | null
          id: string
          invalidation_rules: string | null
          management_rules: string | null
          market: string | null
          name: string
          notes: string | null
          risk_rules: string | null
          setup_grade: string | null
          timeframes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          checklist?: Json
          confirmation_rules?: string | null
          created_at?: string
          entry_rules?: string | null
          id?: string
          invalidation_rules?: string | null
          management_rules?: string | null
          market?: string | null
          name: string
          notes?: string | null
          risk_rules?: string | null
          setup_grade?: string | null
          timeframes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          checklist?: Json
          confirmation_rules?: string | null
          created_at?: string
          entry_rules?: string | null
          id?: string
          invalidation_rules?: string | null
          management_rules?: string | null
          market?: string | null
          name?: string
          notes?: string | null
          risk_rules?: string | null
          setup_grade?: string | null
          timeframes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_status:
        | "active"
        | "passed"
        | "failed"
        | "funded"
        | "breached"
        | "archived"
      account_type: "personal" | "prop" | "demo" | "funded" | "challenge"
      checklist_type: "pretrade" | "daily" | "posttrade" | "weekly"
      review_type: "weekly" | "monthly" | "custom"
      trade_direction: "buy" | "sell"
      trade_grade: "A+" | "A" | "B+" | "B" | "C" | "F"
      trade_phase: "before" | "during" | "after"
      trade_result: "win" | "loss" | "breakeven"
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
      account_status: [
        "active",
        "passed",
        "failed",
        "funded",
        "breached",
        "archived",
      ],
      account_type: ["personal", "prop", "demo", "funded", "challenge"],
      checklist_type: ["pretrade", "daily", "posttrade", "weekly"],
      review_type: ["weekly", "monthly", "custom"],
      trade_direction: ["buy", "sell"],
      trade_grade: ["A+", "A", "B+", "B", "C", "F"],
      trade_phase: ["before", "during", "after"],
      trade_result: ["win", "loss", "breakeven"],
    },
  },
} as const
