-- Gastos: multi-person groups, expenses, settlements, categories.
create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────────────

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  invite_code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  color_tag text not null default '#6366f1',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  is_default boolean not null default false,
  order_index integer not null default 0,
  archived boolean not null default false
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  date date not null,
  paid_by uuid not null references auth.users(id),
  split_type text not null check (split_type in ('equal', 'custom', 'full')),
  split_details jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  from_user_id uuid not null references auth.users(id),
  to_user_id uuid not null references auth.users(id),
  date date not null,
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create index expenses_group_date_idx on public.expenses (group_id, date desc);
create index expenses_group_category_idx on public.expenses (group_id, category_id);
create index settlements_group_date_idx on public.settlements (group_id, date desc);
create index categories_group_order_idx on public.categories (group_id, order_index);
create index group_members_group_idx on public.group_members (group_id);
create index group_members_user_idx on public.group_members (user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

-- ── Membership helper (SECURITY DEFINER avoids RLS self-recursion) ───

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  );
$$;

-- ── RLS ────────────────────────────────────────────────────────────

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;

create policy groups_select on public.groups
  for select using (public.is_group_member(id));
create policy groups_update on public.groups
  for update using (public.is_group_member(id));
-- No insert/delete policy on groups — creation only via create_group() RPC below.

create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));
create policy group_members_update_self on public.group_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No insert policy — membership rows are created only via create_group()/join_group() RPCs
-- (a user isn't a member yet at insert time, so a normal RLS insert check can't pass).

create policy categories_select on public.categories
  for select using (public.is_group_member(group_id));
create policy categories_insert on public.categories
  for insert with check (public.is_group_member(group_id));
create policy categories_update on public.categories
  for update using (public.is_group_member(group_id));
create policy categories_delete on public.categories
  for delete using (public.is_group_member(group_id));

create policy expenses_select on public.expenses
  for select using (public.is_group_member(group_id));
create policy expenses_insert on public.expenses
  for insert with check (public.is_group_member(group_id) and created_by = auth.uid());
create policy expenses_update on public.expenses
  for update using (public.is_group_member(group_id));
create policy expenses_delete on public.expenses
  for delete using (public.is_group_member(group_id));

create policy settlements_select on public.settlements
  for select using (public.is_group_member(group_id));
create policy settlements_insert on public.settlements
  for insert with check (public.is_group_member(group_id) and created_by = auth.uid());
create policy settlements_update on public.settlements
  for update using (public.is_group_member(group_id));
create policy settlements_delete on public.settlements
  for delete using (public.is_group_member(group_id));

-- ── Group creation / joining (SECURITY DEFINER RPCs) ─────────────────
-- Both bypass the "you must already be a member to insert group_members" chicken-and-egg
-- problem, and both assign a color deterministically server-side from the join palette.

create or replace function public.create_group(p_name text, p_display_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups;
  v_code text;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.groups where invite_code = v_code);
  end loop;

  insert into public.groups (name, invite_code, created_by)
  values (trim(p_name), v_code, auth.uid())
  returning * into v_group;

  insert into public.group_members (group_id, user_id, display_name, color_tag)
  values (v_group.id, auth.uid(), trim(p_display_name), '#6366f1');

  insert into public.categories (group_id, name, is_default, order_index) values
    (v_group.id, 'Groceries', true, 0),
    (v_group.id, 'Utilities', true, 1),
    (v_group.id, 'Rent/Mortgage', true, 2),
    (v_group.id, 'Household Supplies', true, 3),
    (v_group.id, 'Internet/Cable', true, 4),
    (v_group.id, 'Maintenance/Repairs', true, 5),
    (v_group.id, 'Other', true, 6);

  return v_group;
end;
$$;

create or replace function public.join_group(p_invite_code text, p_display_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups;
  v_count int;
  v_palette text[] := array['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#a855f7','#14b8a6','#ec4899'];
begin
  select * into v_group from public.groups where invite_code = upper(trim(p_invite_code));
  if not found then
    raise exception 'Invalid invite code';
  end if;

  select count(*) into v_count from public.group_members where group_id = v_group.id;

  insert into public.group_members (group_id, user_id, display_name, color_tag)
  values (
    v_group.id, auth.uid(), trim(p_display_name),
    v_palette[(v_count % array_length(v_palette, 1)) + 1]
  )
  on conflict (group_id, user_id) do update set display_name = excluded.display_name;

  return v_group;
end;
$$;

grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group(text, text) to authenticated;

-- ── Realtime ──────────────────────────────────────────────────────
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.group_members;
