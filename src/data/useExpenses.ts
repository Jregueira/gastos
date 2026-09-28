import { useEffect, useState } from 'react'
import type { Expense, SplitType } from '../types'
import { expenseFromRow, type ExpenseRow } from './mappers'
import { supabase } from './supabaseClient'

export interface NewExpenseInput {
  amountCents: number
  description: string
  categoryId: string | null
  date: string
  paidByUserId: string
  splitType: SplitType
  splitDetails: Record<string, number>
}

export function useExpenses(groupId: string): Expense[] {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })
      if (!cancelled && data) setExpenses((data as ExpenseRow[]).map(expenseFromRow))
    }
    load()

    const channel = supabase
      .channel(`expenses:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [groupId])

  return expenses
}

export async function getExpense(id: string): Promise<Expense | null> {
  const { data } = await supabase.from('expenses').select('*').eq('id', id).maybeSingle()
  return data ? expenseFromRow(data as ExpenseRow) : null
}

export async function addExpense(groupId: string, input: NewExpenseInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { error } = await supabase.from('expenses').insert({
    group_id: groupId,
    amount_cents: input.amountCents,
    description: input.description,
    category_id: input.categoryId,
    date: input.date,
    paid_by: input.paidByUserId,
    split_type: input.splitType,
    split_details: input.splitDetails,
    created_by: user.id,
  })
  if (error) throw error
}

export async function updateExpense(id: string, input: NewExpenseInput): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({
      amount_cents: input.amountCents,
      description: input.description,
      category_id: input.categoryId,
      date: input.date,
      paid_by: input.paidByUserId,
      split_type: input.splitType,
      split_details: input.splitDetails,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
