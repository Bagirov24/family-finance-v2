import type { FamilyMember } from '@/hooks/useFamily'
import type { Account } from '@/hooks/useAccounts'
import type { Transaction } from '@/hooks/useTransactions'

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
  /** Транзакции текущего периода (limit 30), префетчнутые на сервере.
   *  Передаются как initialData в useTransactions и useCategoryBreakdown — нулевой RTT. */
  transactions: Transaction[]
  month: number
  year: number
}
