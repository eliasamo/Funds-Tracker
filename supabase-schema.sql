-- ==============================================
-- Supabase Schema for Stock Tracker
-- Run this in the Supabase SQL Editor
-- ==============================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS fund_holdings CASCADE;
DROP TABLE IF EXISTS funds CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;

-- Table for individual stocks (cached metadata)
CREATE TABLE stocks (
  ticker TEXT PRIMARY KEY,
  name TEXT,
  sector TEXT,
  country TEXT
);

-- Table for funds
CREATE TABLE funds (
  isin TEXT PRIMARY KEY,
  name TEXT
);

-- Mapping: Which fund owns which stock and at what weight (percentage)
CREATE TABLE fund_holdings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fund_isin TEXT REFERENCES funds(isin),
  stock_ticker TEXT REFERENCES stocks(ticker),
  weight_percentage DECIMAL,
  UNIQUE(fund_isin, stock_ticker)
);

-- News Articles with a UNIQUE constraint on the URL for deduplication
CREATE TABLE news_articles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url TEXT UNIQUE,
  headline TEXT,
  published_at TIMESTAMPTZ,
  related_ticker TEXT REFERENCES stocks(ticker)
);

-- Enable Row Level Security (allow all for now via anon key)
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Policies (open read/write for anon key, tighten for production)
CREATE POLICY "Allow all on stocks" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on funds" ON funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on fund_holdings" ON fund_holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on news_articles" ON news_articles FOR ALL USING (true) WITH CHECK (true);

-- ==============================================
-- Function: delete_user
-- Allows a logged-in user to delete their own account.
-- Must be run in the Supabase SQL Editor.
-- ==============================================
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
