-- Audience and campaign tagging foundation. Apply in Supabase before enabling persistence.
create table if not exists email_contact_tags (
 id bigint generated always as identity primary key,
 email text not null,
 tag text not null,
 created_at timestamptz not null default now(),
 unique(email,tag)
);
create table if not exists email_campaigns (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 subject text not null default '',
 body text not null default '',
 audience jsonb not null default '{}'::jsonb,
 excluded_emails jsonb not null default '[]'::jsonb,
 tags text[] not null default '{}',
 status text not null default 'draft' check(status in ('draft','scheduled','sending','sent','failed','cancelled')),
 scheduled_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists email_campaign_recipients (
 campaign_id uuid not null references email_campaigns(id) on delete cascade,
 email text not null,
 status text not null default 'pending',
 resend_id text,
 sent_at timestamptz,
 primary key(campaign_id,email)
);
create table if not exists email_saved_audiences (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 groups text[] not null default '{}',
 excluded_emails text[] not null default '{}',
 created_at timestamptz not null default now()
);
alter table email_contacts add column if not exists unsubscribed_at timestamptz;
alter table email_contacts add column if not exists suppressed_at timestamptz;
alter table email_messages add column if not exists campaign_id uuid references email_campaigns(id);
alter table email_messages add column if not exists email_tags text[] not null default '{}';
alter table email_contact_tags enable row level security;
alter table email_campaigns enable row level security;
alter table email_campaign_recipients enable row level security;
alter table email_saved_audiences enable row level security;
-- No permissive policies: add owner-scoped policies after verifying auth roles.
