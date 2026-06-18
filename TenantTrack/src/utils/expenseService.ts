import { supabase } from "./supabase"

export async function getMyExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching expenses:', error.message)
    throw new Error(error.message)
  }
  return data
}

// Fetch all bills for the logged-in tenant
export async function getMyBills() {
  const { data, error } = await supabase
    .from('monthly_bills')
    .select('*, monthly_records(year, month)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bills:', error.message)
    throw new Error(error.message)
  }
  return data
}