import type { Category, Expense, Group, Member, Settlement } from '../types'

export interface GroupRow {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMemberRow {
  group_id: string
  user_id: string
  display_name: string
  color_tag: string
  joined_at: string
}

export interface CategoryRow {
  id: string
  group_id: string
  name: string
  is_default: boolean
  order_index: number
  archived: boolean
}

export interface ExpenseRow {
  id: string
  group_id: string
  amount_cents: number
  description: string
  category_id: string | null
  date: string
  paid_by: string
  split_type: string
  split_details: Record<string, number>
  created_by: string
  created_at: string
  updated_at: string
}

export interface SettlementRow {
  id: string
  group_id: string
  amount_cents: number
  from_user_id: string
  to_user_id: string
  date: string
  note: string
  created_by: string
  created_at: string
}

export function groupFromRow(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function memberFromRow(row: GroupMemberRow): Member {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    colorTag: row.color_tag,
    joinedAt: row.joined_at,
  }
}

export function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    orderIndex: row.order_index,
    archived: row.archived,
  }
}

export function expenseFromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    description: row.description,
    categoryId: row.category_id,
    date: row.date,
    paidByUserId: row.paid_by,
    splitType: row.split_type as Expense['splitType'],
    splitDetails: row.split_details,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function settlementFromRow(row: SettlementRow): Settlement {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    date: row.date,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
