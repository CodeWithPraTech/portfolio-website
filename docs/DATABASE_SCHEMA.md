# Database Schema

Use PostgreSQL for production. The schema below maps directly to the app collections in `data.js`.

## Core Tables

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  location text,
  mission text not null,
  summary text not null,
  email text not null,
  resume_url text,
  github_username text,
  leetcode_username text,
  socials jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  status text not null,
  overview text not null,
  problem text,
  dataset text,
  architecture text,
  stack text[] not null default '{}',
  metrics text,
  screenshot_url text,
  demo_url text,
  github_url text,
  lessons text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  type text not null,
  summary text not null,
  body_md text not null,
  read_time text,
  published_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table daily_progress (
  id uuid primary key default gen_random_uuid(),
  log_date date not null unique,
  tasks integer not null default 0,
  hours numeric(5, 2) not null default 0,
  topics text[] not null default '{}',
  project_progress integer check (project_progress between 0 and 100),
  notes text,
  weekly_goal text,
  monthly_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skill_group text not null,
  level integer not null check (level between 0 and 100),
  sort_order integer not null default 0
);

create table experiences (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  company text not null,
  period text not null,
  location text,
  employment_type text,
  is_current boolean not null default false,
  business_focus text,
  highlights text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  achieved_at date,
  proof_url text,
  category text
);

create table reading_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  item_type text not null,
  author text,
  progress integer not null check (progress between 0 and 100),
  status text not null,
  source_url text,
  notes text,
  completed_at date
);

create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  progress integer not null check (progress between 0 and 100),
  status text not null,
  eta date,
  resources text[] not null default '{}',
  milestones text[] not null default '{}',
  sort_order integer not null default 0
);
```

## Integration Cache Tables

```sql
create table github_snapshots (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  repos jsonb not null,
  contribution_calendar jsonb,
  captured_at timestamptz not null default now()
);

create table leetcode_snapshots (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  total_solved integer,
  easy_solved integer,
  medium_solved integer,
  hard_solved integer,
  ranking integer,
  captured_at timestamptz not null default now()
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  insight_type text not null,
  input_hash text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);
```

## Auth Model

Keep public reads open and restrict writes to the owner.

- `viewer`: can read published content.
- `owner`: can create, update, delete, and publish all content.
- `service`: can refresh GitHub, LeetCode, and AI insight caches.
