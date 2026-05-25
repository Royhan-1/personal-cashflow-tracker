-- Run this in your Supabase SQL Editor
BEGIN;
SET default_transaction_read_only = off;

-- 1. Create Profiles Table (New)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Transactions Table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  date TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  currency TEXT DEFAULT 'IDR',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Settings Table
CREATE TABLE settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_currency TEXT DEFAULT 'IDR',
  theme TEXT DEFAULT 'light',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN DEFAULT false,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Recurring Transactions Table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  last_generated_date TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recurring transactions" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
