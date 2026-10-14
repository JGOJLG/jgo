-- JGO Hire Statistics: private coaching meetings and offers
create table if not exists public.jgo_client_statistics (
 id bigint generated always as identity primary key,
 client_id bigint not null references public.clients(id) on delete cascade,
 kind text not null check (kind in ('meeting','offer')),
 event_date date not null,
 company text,
 job_title text,
 offer_status text check (offer_status is null or offer_status in ('Received','Accepted','Declined')),
 notes text,
 created_at timestamptz not null default now()
);
create index if not exists jgo_client_statistics_client_date_idx on public.jgo_client_statistics(client_id,event_date);
alter table public.jgo_client_statistics enable row level security;
create policy "jgo admin manages statistics" on public.jgo_client_statistics for all to authenticated using (public.is_jgo_admin()) with check (public.is_jgo_admin());
grant select,insert,update,delete on public.jgo_client_statistics to authenticated;
grant usage,select on sequence public.jgo_client_statistics_id_seq to authenticated;
