import type { FamilyMember } from '@/hooks/useFamily'
import type { Account } from '@/hooks/useAccounts'

export interface OverviewInitialData {
  members: FamilyMember[]
  family: {
    id: string
    name: string
    invite_code: string
    currency: string
  } | null
  accounts: Account[]
  summary: {
    total_income: number
    total_expense: number
    net: number
    top_category: string
  } | null
  month: number
  year: number
}
