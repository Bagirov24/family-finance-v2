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
          user_id: string | null
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
          fuel_consumption_calculated: number | null
          full_tank: boolean
          id: string
          liters: number
          mileage: number
          price_per_liter: number
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          expense_id?: string | null
          fuel_consumption_calculated?: number | null
          full_tank?: boolean
          id?: string
          liters: number
          mileage: number
          price_per_liter: number
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          expense_id?: string | null
          fuel_consumption_calculated?: number | null
          full_tank?: boolean
          id?: string
          liters?: number
          mileage?: number
          price_per_liter?: number
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "vehicle_expenses"
            referencedColumns: ["id"]
          },
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
          auto_save_type: string | null
          auto_save_value: number | null
          color: string | null
          created_at: string | null
          current_amount: number
          deadline: string | null
          family_id: string | null
          icon: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
        }
        Insert: {
          auto_save_type?: string | null
          auto_save_value?: number | null
          color?: string | null
          created_at?: string | null
          current_amount?: number
          deadline?: string | null
          family_id?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
        }
        Update: {
          auto_save_type?: string | null
          auto_save_value?: number | null
          color?: string | null
          created_at?: string | null
          current_amount?: number
          deadline?: string | null
          family_id?: string | null
          icon?: string | null
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
      grocery_items: {
        Row: {
          added_by_user_id: string | null
          category: string
          created_at: string | null
          expiry_date: string | null
          family_id: string
          id: string
          is_consumed: boolean
          name: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          storage_location: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          category?: string
          created_at?: string | null
          expiry_date?: string | null
          family_id: string
          id?: string
          is_consumed?: boolean
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          category?: string
          created_at?: string | null
          expiry_date?: string | null
          family_id?: string
          id?: string
          is_consumed?: boolean
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
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
          family_id: string
          from_account_id: string | null
          from_user_id: string
          id: string
          note: string | null
          status: string
          to_account_id: string | null
          to_user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          family_id: string
          from_account_id?: string | null
          from_user_id: string
          id?: string
          note?: string | null
          status?: string
          to_account_id?: string | null
          to_user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          family_id?: string
          from_account_id?: string | null
          from_user_id?: string
          id?: string
          note?: string | null
          status?: string
          to_account_id?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_member_transfers_from_user"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_member_transfers_to_user"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_transfers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          family_id: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          family_id?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          family_id: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_date: string
          note: string | null
          type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          family_id?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_date: string
          note?: string | null
          type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          family_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_date?: string
          note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          created_at: string | null
          id: string
          last_replaced_date: string | null
          last_replaced_mileage: number | null
          name_key: string
          next_due_date: string | null
          notes: string | null
          replace_every_km: number | null
          replace_every_months: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_replaced_date?: string | null
          last_replaced_mileage?: number | null
          name_key: string
          next_due_date?: string | null
          notes?: string | null
          replace_every_km?: number | null
          replace_every_months?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_replaced_date?: string | null
          last_replaced_mileage?: number | null
          name_key?: string
          next_due_date?: string | null
          notes?: string | null
          replace_every_km?: number | null
          replace_every_months?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          actual_price: number | null
          added_by_user_id: string | null
          category: string
          checked_at: string | null
          checked_by_user_id: string | null
          created_at: string | null
          id: string
          is_checked: boolean
          list_id: string
          name: string
          planned_price: number | null
          quantity: number
          unit: string
        }
        Insert: {
          actual_price?: number | null
          added_by_user_id?: string | null
          category?: string
          checked_at?: string | null
          checked_by_user_id?: string | null
          created_at?: string | null
          id?: string
          is_checked?: boolean
          list_id: string
          name: string
          planned_price?: number | null
          quantity?: number
          unit?: string
        }
        Update: {
          actual_price?: number | null
          added_by_user_id?: string | null
          category?: string
          checked_at?: string | null
          checked_by_user_id?: string | null
          created_at?: string | null
          id?: string
          is_checked?: boolean
          list_id?: string
          name?: string
          planned_price?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          family_id: string
          id: string
          is_completed: boolean
          name: string
          planned_budget: number | null
          store_name: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          family_id: string
          id?: string
          is_completed?: boolean
          name: string
          planned_budget?: number | null
          store_name?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          family_id?: string
          id?: string
          is_completed?: boolean
          name?: string
          planned_budget?: number | null
          store_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          account_id: string | null
          amount: number
          auto_create_tx: boolean
          billing_cycle: string
          category_id: string | null
          color: string
          created_at: string | null
          created_by_user_id: string | null
          currency: string
          description: string | null
          family_id: string
          icon: string
          id: string
          is_active: boolean
          name: string
          next_billing_date: string
          reminder_days: number
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_create_tx?: boolean
          billing_cycle?: string
          category_id?: string | null
          color?: string
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string
          description?: string | null
          family_id: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          next_billing_date: string
          reminder_days?: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_create_tx?: boolean
          billing_cycle?: string
          category_id?: string | null
          color?: string
          created_at?: string | null
          created_by_user_id?: string | null
          currency?: string
          description?: string | null
          family_id?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          next_billing_date?: string
          reminder_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
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
          cashback_card_id: string | null
          cashback_category_id: string | null
          cashback_earned_rub: number | null
          category_id: string | null
          created_at: string | null
          date: string
          family_id: string
          id: string
          note: string | null
          source: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          cashback_card_id?: string | null
          cashback_category_id?: string | null
          cashback_earned_rub?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          family_id: string
          id?: string
          note?: string | null
          source?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          cashback_card_id?: string | null
          cashback_category_id?: string | null
          cashback_earned_rub?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          family_id?: string
          id?: string
          note?: string | null
          source?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cashback_card"
            columns: ["cashback_card_id"]
            isOneToOne: false
            referencedRelation: "cashback_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cashback_category"
            columns: ["cashback_category_id"]
            isOneToOne: false
            referencedRelation: "cashback_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
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
      vehicle_expenses: {
        Row: {
          amount_rub: number
          category: string
          created_at: string | null
          date: string
          id: string
          mileage_at_moment: number | null
          note: string | null
          photo_url: string | null
          transaction_id: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount_rub: number
          category: string
          created_at?: string | null
          date?: string
          id?: string
          mileage_at_moment?: number | null
          note?: string | null
          photo_url?: string | null
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount_rub?: number
          category?: string
          created_at?: string | null
          date?: string
          id?: string
          mileage_at_moment?: number | null
          note?: string | null
          photo_url?: string | null
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_fines: {
        Row: {
          amount_rub: number
          created_at: string | null
          description: string | null
          discount_amount_rub: number | null
          discount_until: string | null
          external_id: string | null
          id: string
          issued_date: string | null
          paid_at: string | null
          status: string
          transaction_id: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount_rub: number
          created_at?: string | null
          description?: string | null
          discount_amount_rub?: number | null
          discount_until?: string | null
          external_id?: string | null
          id?: string
          issued_date?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount_rub?: number
          created_at?: string | null
          description?: string | null
          discount_amount_rub?: number | null
          discount_until?: string | null
          external_id?: string | null
          id?: string
          issued_date?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_fines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_fines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          current_mileage: number
          family_id: string | null
          fuel_type: string | null
          id: string
          initial_mileage: number
          is_active: boolean | null
          license_plate: string | null
          make: string
          model: string
          name: string
          photo_url: string | null
          purchase_date: string | null
          user_id: string | null
          vin: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          current_mileage?: number
          family_id?: string | null
          fuel_type?: string | null
          id?: string
          initial_mileage?: number
          is_active?: boolean | null
          license_plate?: string | null
          make: string
          model: string
          name: string
          photo_url?: string | null
          purchase_date?: string | null
          user_id?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          current_mileage?: number
          family_id?: string | null
          fuel_type?: string | null
          id?: string
          initial_mileage?: number
          is_active?: boolean | null
          license_plate?: string | null
          make?: string
          model?: string
          name?: string
          photo_url?: string | null
          purchase_date?: string | null
          user_id?: string | null
          vin?: string | null
          year?: number
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
      add_fuel_entry:
        | {
            Args: {
              p_account_id: string
              p_date?: string
              p_family_id: string
              p_full_tank?: boolean
              p_liters: number
              p_mileage: number
              p_note?: string
              p_price_per_liter: number
              p_user_id: string
              p_vehicle_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_account_id: string
              p_family_id: string
              p_full_tank: boolean
              p_liters: number
              p_mileage: number
              p_note?: string
              p_price_per_liter: number
              p_user_id: string
              p_vehicle_id: string
            }
            Returns: undefined
          }
      add_vehicle_expense: {
        Args: {
          p_account_id: string
          p_amount_rub: number
          p_category: string
          p_date: string
          p_family_id: string
          p_mileage_at_moment?: number
          p_note?: string
          p_user_id: string
          p_vehicle_id: string
        }
        Returns: undefined
      }
      adjust_account_balance: {
        Args: { p_account_id: string; p_delta: number }
        Returns: undefined
      }
      confirm_transfer_atomic: {
        Args: {
          p_amount: number
          p_from_account_id: string
          p_to_account_id: string
          p_transfer_id: string
        }
        Returns: undefined
      }
      contribute_to_goal: {
        Args: { p_amount: number; p_goal_id: string }
        Returns: {
          auto_save_type: string | null
          auto_save_value: number | null
          color: string | null
          created_at: string | null
          current_amount: number
          deadline: string | null
          family_id: string | null
          icon: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
        }
      }
      get_expiring_items: {
        Args: { p_days_ahead?: number; p_family_id: string }
        Returns: {
          days_left: number
          expiry_date: string
          id: string
          name: string
          quantity: number
          storage_location: string
          unit: string
        }[]
      }
      get_food_stats: {
        Args: { p_family_id: string; p_month: number; p_year: number }
        Returns: {
          subcategory: string
          total: number
          tx_count: number
        }[]
      }
      get_income_expense_trend: {
        Args: { p_family_id: string; p_months?: number }
        Returns: {
          expense: number
          income: number
          month: string
        }[]
      }
      get_monthly_summary: {
        Args: { p_family_id: string; p_month: number; p_year: number }
        Returns: {
          net: number
          top_category: string
          total_expense: number
          total_income: number
        }[]
      }
      get_period_comparison: {
        Args: { p_family_id: string; p_month: number; p_year: number }
        Returns: {
          expense: number
          income: number
          period: string
        }[]
      }
      get_personal_inflation: {
        Args: { p_family_id: string; p_months?: number }
        Returns: {
          avg_expense: number
          month: string
        }[]
      }
      get_spending_heatmap: {
        Args: { p_family_id: string; p_month: number; p_year: number }
        Returns: {
          day: number
          total: number
        }[]
      }
      get_user_family_id: { Args: never; Returns: string }
      get_weekday_spending: {
        Args: { p_family_id: string; p_month: number; p_year: number }
        Returns: {
          day_name: string
          dow: number
          total: number
        }[]
      }
      seed_family_categories: {
        Args: { p_family_id: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
