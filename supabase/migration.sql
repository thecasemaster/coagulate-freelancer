-- Supabase Migration: Lead Capture Funnel
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Create leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  freelancer_type text check (freelancer_type in ('design', 'development', 'copywriting', 'photography_video', 'consulting', 'other')),
  payment_intent text check (payment_intent in ('yes', 'maybe', 'no')),
  referral_source text,
  referral_code text unique not null,
  referred_by text,
  created_at timestamptz default now()
);

-- Create email_logs table
create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  email_number int not null check (email_number between 1 and 4),
  sent_at timestamptz default now(),
  resend_id text,
  status text default 'sent'
);

-- Indexes
create index idx_leads_email on public.leads(email);
create index idx_leads_referral_code on public.leads(referral_code);
create index idx_leads_created_at on public.leads(created_at);
create index idx_email_logs_lead_id on public.email_logs(lead_id);
create index idx_email_logs_lead_email on public.email_logs(lead_id, email_number);

-- Row Level Security
alter table public.leads enable row level security;
alter table public.email_logs enable row level security;

-- Service role can do everything (used by API routes with service role key)
create policy "Service role full access on leads"
  on public.leads for all
  using (true)
  with check (true);

create policy "Service role full access on email_logs"
  on public.email_logs for all
  using (true)
  with check (true);
