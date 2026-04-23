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
          balance: number
          color: string | null
          created_at: string | null
          currency: string
          family_id: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_hidden_from_total: boolean
          name: string
          owner_user_id: string | null
          type: string
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string | null
          currency?: string
          family_id?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_hidden_from_total?: boolean
          name: string
          owner_user_id?: string | null
          type: string
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string | null
          currency?: string
          family_id?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_hidden_from_total?: boolean
          name?: string
          owner_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          family_id: string | null
          id: string
          period_month: number
          period_year: number
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          period_month: number
          period_year: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          period_month?: number
          period_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_cards: {
        Row: {
          bank_name: string
          card_name: string
          cashback_type: string
          color: string | null
          created_at: string | null
          family_id: string | null
          id: string
          is_active: boolean | null
          points_to_rubles_rate: number
          user_id: string | null
        }
        Insert: {
          bank_name: string
          card_name: string
          cashback_type?: string
          color?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          points_to_rubles_rate?: number
          user_id?: string | null
        }
        Update: {
          bank_name?: string
          card_name?: string
          cashback_type?: string
          color?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_active?: boolean | null
          points_to_rubles_rate?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_cards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_categories: {
        Row: {
          card_id: string | null
          category_key: string
          created_at: string | null
          id: string
          monthly_limit_rub: number
          percent: number
          period_month: number
          period_year: number
          spent_this_month_rub: number
        }
        Insert: {
          card_id?: string | null
          category_key: string
          created_at?: string | null
          id?: string
          monthly_limit_rub?: number
          percent: number
          period_month: number
          period_year: number
          spent_this_month_rub?: number
        }
        Update: {
          card_id?: string | null
          category_key?: string
          created_at?: string | null
          id?: string
          monthly_limit_rub?: number
          percent?: number
          period_month?: number
          period_year?: number
          spent_this_month_rub?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashback_categories_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cashback_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          family_id: string | null
          icon: string
          id: string
          is_default: boolean | null
          name_key: string
          type: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          family_id?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          name_key: string
          type: string
        }
        Update: {
          color?: string
          created_at?: string | null
          family_id?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          name_key?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          family_id: string | null
          id: string
          joined_at: string | null
          locale: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          family_id?: string | null
          id?: string
          joined_at?: string | null
          locale?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          family_id?: string | null
          id?: string
          joined_at?: string | null
          locale?: string
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      food_expenses: {
        Row: {
          created_at: string | null
          family_id: string
          id: string
          store_name: string | null
          subcategory: string
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          family_id: string
          id?: string
          store_name?: string | null
          subcategory?: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          family_id?: string
          id?: string
          store_name?: string | null
          subcategory?: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_expenses_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_expenses_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_entries: {
        Row: {
          created_at: string | null
          expense_id: string | null
          fuel_type: string | null
          id: string
          liters: number
          mileage_km: number
          notes: string | null
          price_per_liter: number
          station: string | null
          total_cost: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          expense_id?: string | null
          fuel_type?: string | null
          id?: string
          liters: number
          mileage_km: number
          notes?: string | null
          price_per_liter: number
          station?: string | null
          total_cost: number
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string | null
          fuel_type?: string | null
          id?: string
          liters?: number
          mileage_km?: number
          notes?: string | null
          price_per_liter?: number
          station?: string | null
          total_cost?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string | null
          created_by_user_id: string | null
          currency: string | null
          deadline: string | null
          description: string | null
          emoji: string | null
          family_id: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          emoji?: string | null
          family_id?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string | null
          emoji?: string | null
          family_id?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contributed_at: string | null
          goal_id: string | null
          id: string
          note: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          contributed_at?: string | null
          goal_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          contributed_at?: string | null
          goal_id?: string | null
          id?: string
          note?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      member_transfers: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          date: string
          family_id: string | null
          from_account_id: string | null
          from_user_id: string
          id: string
          note: string | null
          status: string
          to_account_id: string | null
          to_user_id: string
          transfer_type: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          family_id?: string | null
          from_account_id?: string | null
          from_user_id: string
          id?: string
          note?: string | null
          status?: string
          to_account_id?: string | null
          to_user_id: string
          transfer_type?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          family_id?: string | null
          from_account_id?: string | null
          from_user_id?: string
          id?: string
          note?: string | null
          status?: string
          to_account_id?: string | null
          to_user_id?: string
          transfer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_transfers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          locale: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          locale?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          locale?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          added_by_user_id: string | null
          checked_by_user_id: string | null
          created_at: string | null
          family_id: string
          id: string
          is_checked: boolean | null
          name: string
          quantity: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          checked_by_user_id?: string | null
          created_at?: string | null
          family_id: string
          id?: string
          is_checked?: boolean | null
          name: string
          quantity?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          checked_by_user_id?: string | null
          created_at?: string | null
          family_id?: string
          id?: string
          is_checked?: boolean | null
          name?: string
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_day: number
          category_id: string | null
          color: string | null
          created_at: string | null
          created_by_user_id: string | null
          currency: string
          family_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          next_billing_date: string | null
          period: string
        }
        Insert: {
          amount: number
          billing_day: number
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string
          family_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          next_billing_date?: string | null
          period?: string
        }
        Update: {
          amount?: number
          billing_day?: number
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string
          family_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_billing_date?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          family_id: string | null
          id: string
          note: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          family_id?: string | null
          id?: string
          note?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          family_id?: string | null
          id?: string
          note?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          family_id: string | null
          id: string
          make: string
          model: string
          user_id: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          make: string
          model: string
          user_id?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          make?: string
          model?: string
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_summary: {
        Args: {
          p_family_id: string
          p_month: number
          p_year: number
        }
        Returns: {
          total_income: number
          total_expense: number
          net: number
          top_categories: Json
        }[]
      }
      get_spending_trend: {
        Args: {
          p_family_id: string
          p_months: number
        }
        Returns: {
          month: number
          year: number
          total_expense: number
          total_income: number
        }[]
      }
      get_user_family_id: {
        Args: {
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][PublicCompositeTypeNameOrOptions["schema"]][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
