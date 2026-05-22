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

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

-- trigger to insert default settings on signup (optional)

COMMIT;
