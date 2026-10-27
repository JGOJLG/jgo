create table if not exists public.guide_signup_email_history (
 id bigint generated always as identity primary key,
 signup_email text not null,
 email_message_id bigint not null unique,
 template_name text not null,
 subject text not null,
 sent_at timestamptz not null default now()
);
create index if not exists guide_signup_email_history_email_idx on public.guide_signup_email_history (lower(signup_email), sent_at desc);
alter table public.guide_signup_email_history enable row level security;
-- Keep private until explicit owner-scoped RLS policy is configured.
