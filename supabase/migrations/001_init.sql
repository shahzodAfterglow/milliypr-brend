-- PR Brend · 001_init.sql · 0-bosqich
-- 16 jadval (docs/CONCEPT.md, Texnik ilova E), RLS (policy'siz), GRANT'lar, pg_trgm.
-- Supabase Dashboard → SQL Editor'da bir marta bajariladi. Keyin supabase/seed.sql.
-- DB funksiyalari (add_version, set_decision, search_assets ...) 002-migratsiyada (1-bosqich).

begin;

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- umumiy
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- departments
create table public.departments (
  id                 smallint generated always as identity primary key,
  slug               text not null unique check (slug ~ '^[a-z0-9_]{2,32}$'),
  name_uz            text not null,
  archive_chat_id    bigint unique,
  team_chat_id       bigint unique,
  default_visibility text not null default 'bolim'
                     check (default_visibility in ('bolim', 'hamma', 'rahbariyat')),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------- members
create table public.members (
  id               bigint generated always as identity primary key,
  telegram_user_id bigint unique,                    -- null = taklif qilingan, hali kirmagan
  display_name     text not null,
  tg_username      text,
  role             text not null
                   check (role in ('admin', 'rahbar', 'bolim_boshligi', 'dizayner', 'kuzatuvchi')),
  department_id    smallint references public.departments (id),
  can_approve      boolean not null default false,
  status           text not null default 'invited'
                   check (status in ('invited', 'active', 'removed')),
  consent_at       timestamptz,
  bot_started_at   timestamptz,
  quiet_hours      jsonb,
  last_seen_at     timestamptz,
  removed_at       timestamptz,
  removed_by       bigint references public.members (id),
  created_at       timestamptz not null default now()
);
create index members_department_idx on public.members (department_id);

-- ---------------------------------------------------------------- invites
create table public.invites (
  id          bigint generated always as identity primary key,
  member_id   bigint not null references public.members (id),
  code_hash   text not null unique,
  created_by  bigint references public.members (id),
  expires_at  timestamptz not null default now() + interval '72 hours',
  used_at     timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index invites_member_idx on public.invites (member_id);

-- ---------------------------------------------------------------- sessions
create table public.sessions (
  id           bigint generated always as identity primary key,
  token_hash   text not null unique,
  member_id    bigint not null references public.members (id),
  via          text not null check (via in ('login_url', 'qr')),
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  user_agent   text
);
create index sessions_member_idx on public.sessions (member_id);

-- ---------------------------------------------------------------- login_tokens
create table public.login_tokens (
  nonce_hash          text primary key,
  expires_at          timestamptz not null default now() + interval '3 minutes',
  user_agent          text,
  confirmed_member_id bigint references public.members (id),
  confirmed_at        timestamptz,
  consumed_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------- projects
create table public.projects (
  id                  bigint generated always as identity primary key,
  slug                text not null unique check (slug ~ '^[a-z0-9_]{2,24}$'),
  title               text not null,
  owner_department_id smallint references public.departments (id),
  event_date          date,
  status              text not null default 'faol' check (status in ('faol', 'yopilgan')),
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------- asset_types
create table public.asset_types (
  slug              text primary key check (slug ~ '^[a-z0-9_]{2,24}$'),
  name_uz           text not null,
  department_id     smallint references public.departments (id),   -- null = hamma bo'limga
  requires_approval boolean not null default true,
  aliases           text[] not null default '{}',
  sort_order        int not null default 100
);

-- ---------------------------------------------------------------- assets
create table public.assets (
  id                bigint generated always as identity primary key,
  code              text not null unique,               -- 'K27', trigger bilan
  department_id     smallint not null references public.departments (id),
  project_id        bigint references public.projects (id),
  type_slug         text not null references public.asset_types (slug),
  title             text not null,
  language          text check (language in ('uz', 'ru', 'en', 'kk', 'boshqa')),
  visibility        text not null default 'bolim'
                    check (visibility in ('bolim', 'hamma', 'rahbariyat')),
  figma_url         text,
  figma_file_key    text,
  figma_node_id     text,
  latest_version_id bigint,
  final_version_id  bigint,
  status            text not null default 'faol' check (status in ('faol', 'arxiv')),
  search_text       text not null default '',
  created_by        bigint references public.members (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index assets_department_idx on public.assets (department_id);
create index assets_project_idx on public.assets (project_id);
create index assets_search_trgm on public.assets
  using gin (search_text extensions.gin_trgm_ops);

create or replace function public.assets_set_code() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'K' || new.id;
  end if;
  return new;
end $$;

-- code ustuni not null, lekin BEFORE trigger uni to'ldiradi (default o'rniga).
alter table public.assets alter column code set default '';
create trigger assets_set_code before insert on public.assets
  for each row execute function public.assets_set_code();
create trigger assets_touch before update on public.assets
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- versions
create table public.versions (
  id                    bigint generated always as identity primary key,
  asset_id              bigint not null references public.assets (id),
  version_no            int not null check (version_no > 0),
  status                text not null default 'qoralama'
                        check (status in ('qoralama', 'korib_chiqishda', 'ozgartirish_kerak',
                                          'tasdiqlangan', 'tayyor', 'eskirgan', 'arxiv')),
  change_note           text,
  uploaded_by           bigint references public.members (id),
  source                text not null default 'bot' check (source in ('bot', 'kanal', 'import')),
  channel_chat_id       bigint,
  channel_message_id    bigint,
  media_group_id        text,
  figma_node_id         text,
  preview_path          text,
  thumb_path            text,
  preview_photo_file_id text,
  preview_status        text not null default 'pending'
                        check (preview_status in ('pending', 'ok', 'too_large', 'failed', 'none')),
  bot_caption_hash      text,
  decided_by            bigint references public.members (id),
  decided_at            timestamptz,
  created_at            timestamptz not null default now(),
  unique (asset_id, version_no)
);
create unique index versions_media_group_uq on public.versions (channel_chat_id, media_group_id)
  where media_group_id is not null;

alter table public.assets
  add constraint assets_latest_version_fk foreign key (latest_version_id) references public.versions (id),
  add constraint assets_final_version_fk  foreign key (final_version_id)  references public.versions (id);

-- ---------------------------------------------------------------- files
create table public.files (
  id             bigint generated always as identity primary key,
  version_id     bigint references public.versions (id),   -- null = Saralanmagan
  chat_id        bigint not null,
  message_id     bigint not null,
  kind           text not null check (kind in ('document', 'photo', 'video', 'animation', 'audio')),
  file_id        text not null,
  file_unique_id text not null unique,
  file_name      text,
  mime_type      text,
  file_size      bigint,
  width          int,
  height         int,
  is_image       boolean not null default false,
  origin         jsonb,
  broken_at      timestamptz,
  created_at     timestamptz not null default now(),
  unique (chat_id, message_id)
);
create index files_version_idx on public.files (version_id);
create index files_unsorted_idx on public.files (created_at) where version_id is null;

-- ---------------------------------------------------------------- feedback
create table public.feedback (
  id                     bigint generated always as identity primary key,
  version_id             bigint not null references public.versions (id),
  author_member_id       bigint not null references public.members (id),
  kind                   text not null check (kind in ('matn', 'ovoz', 'rasm', 'hujjat', 'qaror')),
  body                   text,
  tg_file_id             text,
  source_chat_id         bigint,
  source_message_id      bigint,
  group_message_id       bigint,
  status                 text not null default 'ochiq'
                         check (status in ('ochiq', 'bajarildi', 'qisman', 'yoq')),
  resolved_in_version_id bigint references public.versions (id),
  via                    text not null default 'bot' check (via in ('bot', 'sayt')),
  created_at             timestamptz not null default now()
);
create index feedback_version_idx on public.feedback (version_id);

-- ---------------------------------------------------------------- bot_messages
create table public.bot_messages (
  id         bigint generated always as identity primary key,
  chat_id    bigint not null,
  message_id bigint not null,
  purpose    text not null check (purpose in ('review_card', 'team_notice', 'delivery', 'digest')),
  version_id bigint references public.versions (id),
  member_id  bigint references public.members (id),
  state      text not null default 'ochiq' check (state in ('ochiq', 'yopilgan')),
  created_at timestamptz not null default now(),
  unique (chat_id, message_id)
);
create index bot_messages_version_idx on public.bot_messages (version_id);

-- ---------------------------------------------------------------- audit_log (faqat qo'shiladi)
create table public.audit_log (
  id              bigint generated always as identity primary key,
  at              timestamptz not null default now(),
  actor_member_id bigint references public.members (id),
  actor_tg_id     bigint,
  surface         text not null check (surface in ('bot', 'sayt', 'tizim')),
  action          text not null,
  target_type     text,
  target_id       text,
  meta            jsonb not null default '{}'
);
create index audit_log_at_idx on public.audit_log (at);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

create or replace function public.audit_log_immutable() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'audit_log faqat qo''shiladi: % taqiqlangan', tg_op;
end $$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

-- ---------------------------------------------------------------- tg_updates
create table public.tg_updates (
  update_id   bigint primary key,
  received_at timestamptz not null default now()
);
create index tg_updates_received_idx on public.tg_updates (received_at);

-- ---------------------------------------------------------------- bot_state
create table public.bot_state (
  member_id  bigint not null references public.members (id) on delete cascade,
  key        text not null check (key in ('wizard', 'import', 'last_query', 'pending_comment')),
  value      jsonb not null default '{}',
  expires_at timestamptz,
  primary key (member_id, key)
);

-- ---------------------------------------------------------------- synonyms
create table public.synonyms (
  term       text primary key,          -- normalize() natijasi
  canonical  text not null,
  created_by bigint references public.members (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS va GRANT'lar
-- RLS yoqilgan, policy yo'q: anon/authenticated hech narsa ko'rmaydi.
-- Faqat server (service_role) ishlaydi. Yangi Supabase loyihalarida GRANT'larsiz Data API ishlamaydi.
do $$
declare t text;
begin
  foreach t in array array[
    'departments', 'members', 'invites', 'sessions', 'login_tokens', 'projects',
    'asset_types', 'assets', 'versions', 'files', 'feedback', 'bot_messages',
    'audit_log', 'tg_updates', 'bot_state', 'synonyms'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    if t = 'audit_log' then
      execute format('grant select, insert on public.%I to service_role', t);
    else
      execute format('grant select, insert, update, delete on public.%I to service_role', t);
    end if;
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;
revoke usage, select on all sequences in schema public from anon, authenticated;
revoke execute on function public.touch_updated_at(), public.assets_set_code(),
  public.audit_log_immutable() from public, anon, authenticated;

commit;
