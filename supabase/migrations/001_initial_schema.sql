-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  onboarding_completed boolean default false,
  shadow_mode_ends_at timestamptz,
  ai_profile jsonb default '{
    "identity_contexts": [],
    "energy_windows": [],
    "life_goals": [],
    "current_blockers": [],
    "tried_and_failed": [],
    "productivity_patterns": [],
    "collapse_risk_score": 0,
    "last_updated": null
  }'::jsonb,
  preferences jsonb default '{
    "theme": "light",
    "notification_time": "08:00",
    "weekly_replay_day": 1,
    "language": "pt-BR"
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  priority_score float default 0,
  urgency float default 5,
  impact float default 5,
  energy_cost float default 3,
  context_tag text default 'personal' check (context_tag in ('work', 'health', 'creativity', 'social', 'learning', 'finance', 'personal')),
  goal_id uuid,
  due_date timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  ai_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Goals table
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  horizon text default 'medium' check (horizon in ('short', 'medium', 'long')),
  identity_link text,
  progress float default 0,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  target_date timestamptz,
  weekly_micro_actions jsonb default '[]'::jsonb,
  ai_notes text,
  days_stalled int default 0,
  last_activity_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Calendar events table
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  context_tag text default 'personal',
  is_protected boolean default false,
  is_ai_scheduled boolean default false,
  task_id uuid references public.tasks(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily check-ins
create table public.check_ins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  mood int not null check (mood between 1 and 10),
  energy int not null check (energy between 1 and 10),
  focus int not null check (focus between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- AI conversations
create table public.ai_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  context text default 'chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI daily briefings
create table public.ai_briefings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  content text not null,
  trigger text default 'morning' check (trigger in ('morning', 'checkin', 'crisis', 'goal_completed')),
  generated_at timestamptz default now()
);

-- Weekly replays
create table public.weekly_replays (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  content jsonb not null,
  generated_at timestamptz default now(),
  unique (user_id, week_start)
);

-- Onboarding sessions
create table public.onboarding_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  messages jsonb not null default '[]'::jsonb,
  completed boolean default false,
  extracted_profile jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.calendar_events enable row level security;
alter table public.check_ins enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_briefings enable row level security;
alter table public.weekly_replays enable row level security;
alter table public.onboarding_sessions enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users manage own goals" on public.goals for all using (auth.uid() = user_id);
create policy "Users manage own events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "Users manage own check_ins" on public.check_ins for all using (auth.uid() = user_id);
create policy "Users manage own conversations" on public.ai_conversations for all using (auth.uid() = user_id);
create policy "Users manage own briefings" on public.ai_briefings for all using (auth.uid() = user_id);
create policy "Users manage own replays" on public.weekly_replays for all using (auth.uid() = user_id);
create policy "Users manage own onboarding" on public.onboarding_sessions for all using (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks for each row execute function update_updated_at();
create trigger goals_updated_at before update on public.goals for each row execute function update_updated_at();
create trigger calendar_events_updated_at before update on public.calendar_events for each row execute function update_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function update_updated_at();
