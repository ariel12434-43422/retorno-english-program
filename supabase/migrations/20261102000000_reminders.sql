-- Summary reminders: a schedule inside the database calls the "reminders" function every 10 minutes.
-- The call carries a random key kept in app_secrets, which only the server can read.

create table if not exists public.app_secrets (k text primary key, v text not null);
alter table public.app_secrets enable row level security; -- no policies: hidden from every app user
revoke all on public.app_secrets from anon, authenticated;
insert into public.app_secrets (k, v) values ('cron', encode(gen_random_bytes(24), 'hex')) on conflict (k) do nothing;

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin perform cron.unschedule('summary-reminders'); exception when others then null; end $$;
select cron.schedule(
  'summary-reminders',
  '*/10 * * * *',
  $job$
  select net.http_post(
    url := 'https://ukdqkogqimugwwqyvtxq.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', (select v from public.app_secrets where k = 'cron')),
    body := '{}'::jsonb
  );
  $job$
);
