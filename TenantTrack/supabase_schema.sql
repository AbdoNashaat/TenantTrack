-- Supabase Schema for TenantTrack
-- Run this in the Supabase SQL Editor

-- 1. APARTMENT Table
CREATE TABLE IF NOT EXISTS public.apartments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  floor_number int NOT NULL,
  unit_number text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

-- 2. TENANT Table (Links to auth.users)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  apartment_id uuid REFERENCES public.apartments(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone_number text,
  standard_monthly_fee numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. MONTHLY_RECORD Table
CREATE TABLE IF NOT EXISTS public.monthly_records (
  id text PRIMARY KEY, -- e.g., '2023-10'
  year int NOT NULL,
  month int NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.monthly_records ENABLE ROW LEVEL SECURITY;

-- 4. MONTHLY_BILL Table
CREATE TABLE IF NOT EXISTS public.monthly_bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text REFERENCES public.monthly_records(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount_due numeric NOT NULL DEFAULT 0.00,
  amount_paid numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'Red', -- Green, Yellow, Red
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;

-- 5. PAYMENT Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  month_id text REFERENCES public.monthly_records(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  purpose text NOT NULL, -- e.g. 'Monthly Fee', 'Maintenance Fund'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. EXPENSE Table (assuming it might already exist but providing schema)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE, -- if tenant logged it
  month_id text REFERENCES public.monthly_records(id) ON DELETE SET NULL,
  type text, -- 'Standard', 'Non-standard'
  description text NOT NULL,
  amount numeric NOT NULL,
  expense_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 7. MAINTENANCE_FUND Table
CREATE TABLE IF NOT EXISTS public.maintenance_funds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  current_balance numeric NOT NULL DEFAULT 0.00,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.maintenance_funds ENABLE ROW LEVEL SECURITY;

-- 8. FUND_TRANSACTION Table
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id uuid REFERENCES public.maintenance_funds(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'Contribution', 'Repair Expense'
  amount numeric NOT NULL,
  transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- We assume `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` defines an admin
-- -----------------------------------------------------------------------------

-- Helper function to check if admin (optional, can just inline it)
-- CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
--   SELECT auth.jwt() -> 'app_metadata' ->> 'role' = 'admin';
-- $$ LANGUAGE SQL STABLE;

-- APARTMENTS: Admins can do everything, Tenants can view
CREATE POLICY "Admins have full access to apartments" ON public.apartments FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view apartments" ON public.apartments FOR SELECT USING (true);

-- TENANTS: Admins can do everything, Tenants can see themselves
CREATE POLICY "Admins have full access to tenants" ON public.tenants FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view their own profile" ON public.tenants FOR SELECT USING (auth.uid() = id);

-- MONTHLY_RECORDS: Admins full, Tenants view
CREATE POLICY "Admins have full access to monthly records" ON public.monthly_records FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view monthly records" ON public.monthly_records FOR SELECT USING (true);

-- MONTHLY_BILLS: Admins full, Tenants see their own
CREATE POLICY "Admins have full access to monthly bills" ON public.monthly_bills FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view their own bills" ON public.monthly_bills FOR SELECT USING (auth.uid() = tenant_id);

-- PAYMENTS: Admins full, Tenants see their own
CREATE POLICY "Admins have full access to payments" ON public.payments FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = tenant_id);

-- EXPENSES: Admins full, Tenants see their own (or all, depending on transparency)
-- ERD says financial data is transparent. So we can let tenants view all expenses.
CREATE POLICY "Admins have full access to expenses" ON public.expenses FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view all expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Tenants can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- MAINTENANCE FUNDS: Admins full, Tenants view
CREATE POLICY "Admins have full access to maintenance funds" ON public.maintenance_funds FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view maintenance funds" ON public.maintenance_funds FOR SELECT USING (true);

-- FUND TRANSACTIONS: Admins full, Tenants view
CREATE POLICY "Admins have full access to fund transactions" ON public.fund_transactions FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view fund transactions" ON public.fund_transactions FOR SELECT USING (true);


-- 9. EXPENSE_SHARES Table
CREATE TABLE IF NOT EXISTS public.expense_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount_due numeric NOT NULL DEFAULT 0.00,
  amount_paid numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'Red', -- Green, Yellow, Red
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

-- EXPENSE_SHARES RLS Policies
CREATE POLICY "Admins have full access to expense shares" ON public.expense_shares FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "Tenants can view their own expense shares" ON public.expense_shares FOR SELECT USING (auth.uid() = tenant_id);

-- 10. EXPENSES TABLE ADDITIONS (Simplification)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Red';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0.00;
