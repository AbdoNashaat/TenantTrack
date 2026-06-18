import { supabase } from "./supabase"

export async function getAllTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      phone_number,
      standard_monthly_fee,
      apartments (
        floor_number,
        unit_number
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tenants:', error.message)
    throw new Error(error.message)
  }
  return data
}

export async function getAllBills() {
  const { data, error } = await supabase
    .from('monthly_bills')
    .select(`
      id,
      amount_due,
      amount_paid,
      status,
      monthly_records ( year, month ),
      tenants ( name, apartments(unit_number) )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bills:', error.message)
    throw new Error(error.message)
  }
  return data
}

export async function getAllExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      id,
      description,
      amount,
      status,
      amount_paid,
      created_at,
      tenant_id,
      tenants ( name, apartments(unit_number) )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all expenses:', error.message)
    throw new Error(error.message)
  }
  return data
}

export async function updateExpense(expenseId: string, amountPaid: number, status: string) {
  const { error } = await supabase
    .from('expenses')
    .update({
      amount_paid: amountPaid,
      status: status
    })
    .eq('id', expenseId)

  if (error) {
    console.error('Error updating expense:', error.message)
    throw new Error(error.message)
  }
  return true
}

export async function createTenant(tenantData: any, serviceRoleKey: string) {
  // Use createClient directly from the installed package
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  if (!serviceRoleKey) {
    throw new Error('Service Role Key is required to create a user.')
  }

  // Initialize a temporary admin client
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Create the user in auth.users
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: tenantData.email,
    password: tenantData.password,
    email_confirm: true,
    app_metadata: { role: 'tenant' }
  })

  if (createError) {
    console.error('Error creating auth user:', createError)
    throw new Error(`Failed to create auth user: ${createError.message}`)
  }

  // 2. Insert into the public.tenants table
  const { error: insertError } = await supabaseAdmin
    .from('tenants')
    .insert({
      id: newUser.user.id,
      name: tenantData.name,
      phone_number: tenantData.phoneNumber,
      standard_monthly_fee: tenantData.standardMonthlyFee || 0,
      apartment_id: tenantData.apartmentId || null
    })

  if (insertError) {
    console.error('Error creating tenant profile:', insertError)
    throw new Error(`Failed to create tenant profile: ${insertError.message}`)
  }

  return newUser.user
}

export async function generateMonthlyBills(year: number, month: number) {
  const monthId = `${year}-${String(month).padStart(2, '0')}`

  // 1. Ensure the monthly_record exists
  const { error: recordError } = await supabase
    .from('monthly_records')
    .upsert({ id: monthId, year, month }, { onConflict: 'id' })

  if (recordError) {
    throw new Error('Failed to create monthly record: ' + recordError.message)
  }

  // 2. Fetch all tenants
  const tenants = await getAllTenants()
  if (!tenants || tenants.length === 0) return 0

  // 3. Create a bill for each tenant
  const billsToInsert = tenants.map((t: any) => ({
    month_id: monthId,
    tenant_id: t.id,
    amount_due: t.standard_monthly_fee,
    amount_paid: 0,
    status: 'Red'
  }))

  const { error: billsError } = await supabase
    .from('monthly_bills')
    .insert(billsToInsert)

  if (billsError) {
    // If it fails, maybe some bills already exist. Supabase might throw duplicate key error depending on constraints.
    // For a robust system, we would check which exist, but simple insert works for now.
    throw new Error('Failed to insert bills: ' + billsError.message)
  }

  return billsToInsert.length
}

export async function createSplitExpense(description: string, totalAmount: number, tenantShares: { tenantId: string, amount: number }[]) {
  const expensesToInsert = tenantShares.map(share => ({
    description: description,
    amount: share.amount,
    tenant_id: share.tenantId,
    amount_paid: 0,
    status: 'Red'
  }))

  const { error: insertError } = await supabase
    .from('expenses')
    .insert(expensesToInsert)

  if (insertError) {
    throw new Error('Failed to create split expenses: ' + insertError.message)
  }

  return true
}

export async function getAllApartments() {
  const { data, error } = await supabase
    .from('apartments')
    .select('id, floor_number, unit_number')
    .order('unit_number', { ascending: true })

  if (error) {
    console.error('Error fetching apartments:', error.message)
    throw new Error(error.message)
  }
  return data
}

export async function updateBill(billId: string, amountPaid: number, status: string) {
  const { error } = await supabase
    .from('monthly_bills')
    .update({
      amount_paid: amountPaid,
      status: status
    })
    .eq('id', billId)

  if (error) {
    console.error('Error updating bill:', error.message)
    throw new Error(error.message)
  }
  return true
}

