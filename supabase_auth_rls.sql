-- SBK Estimator — Update RLS policies to require authentication
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- Drop the old open policies
drop policy if exists "allow_all_jobs" on jobs;
drop policy if exists "allow_all_customers" on customers;
drop policy if exists "allow_all_settings" on settings;

-- Create new policies that require a logged-in user
create policy "auth_users_jobs" on jobs
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth_users_customers" on customers
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth_users_settings" on settings
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
