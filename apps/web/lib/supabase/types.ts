/**
 * Supabase database types for the family-finance app.
 *
 * These are hand-authored stubs for the tables that are accessed via the
 * generic Database<> type path. Other tables (transactions, accounts,
 * categories, budgets, subscriptions) define their own explicit interfaces
 * inside their respective hook files.
 *
 * To regenerate from the live project run:
 *   npx supabase gen types typescript --project-id <project-ref> > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          invite_code: string
          currency: string
          created_at: string
          owner_user_id: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          currency?: string
          created_at?: string
          owner_user_id: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          currency?: string
          owner_user_id?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: 'owner' | 'member'
          display_name: string | null
          avatar_url: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role?: 'owner' | 'member'
          display_name?: string | null
          avatar_url?: string | null
          joined_at?: string
        }
        Update: {
          family_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          display_name?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
