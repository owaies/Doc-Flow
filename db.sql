-- DocFlow Database Schema

-- 1. Profiles Table (maps user ID to email)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Only owner can read/write their own profile row
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Trigger to automatically copy users from auth.users to public.profiles on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Documents Table
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  title text default 'Untitled Document' not null,
  content text default '' not null,
  owner_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on documents
alter table public.documents enable row level security;

-- 3. Document Shares Table
create table if not exists public.document_shares (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  permission text not null check (permission in ('editor', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (document_id, user_id)
);

-- Enable RLS on document shares
alter table public.document_shares enable row level security;

-- 4. Attachments Table
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents on delete cascade not null,
  file_name text not null,
  file_url text not null,
  uploaded_by uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on attachments
alter table public.attachments enable row level security;


-- =========================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (PREVENT RLS RECURSION)
-- =========================================================================

-- Check if user is the document owner
create or replace function public.is_document_owner(doc_id uuid, user_uuid uuid)
returns boolean
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.documents
    where id = doc_id and owner_id = user_uuid
  );
end;
$$ language plpgsql;

-- Check if user has document access (owner, editor, or viewer)
create or replace function public.has_document_access(doc_id uuid, user_uuid uuid)
returns boolean
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.documents
    where id = doc_id and owner_id = user_uuid
  ) or exists (
    select 1 from public.document_shares
    where document_id = doc_id and user_id = user_uuid
  );
end;
$$ language plpgsql;

-- Check if user has edit permissions (owner or editor)
create or replace function public.can_edit_document(doc_id uuid, user_uuid uuid)
returns boolean
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.documents
    where id = doc_id and owner_id = user_uuid
  ) or exists (
    select 1 from public.document_shares
    where document_id = doc_id and user_id = user_uuid and permission = 'editor'
  );
end;
$$ language plpgsql;


-- =========================================================================
-- RLS POLICIES USING SECURITY DEFINER HELPERS
-- =========================================================================

-- Documents Policies
create policy "Select documents with access"
  on public.documents for select
  to authenticated
  using (owner_id = auth.uid() or public.has_document_access(id, auth.uid()));

create policy "Insert documents as owner"
  on public.documents for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Update documents with edit access"
  on public.documents for update
  to authenticated
  using (owner_id = auth.uid() or public.can_edit_document(id, auth.uid()))
  with check (owner_id = auth.uid() or public.can_edit_document(id, auth.uid()));

create policy "Delete documents as owner only"
  on public.documents for delete
  to authenticated
  using (owner_id = auth.uid());

-- Document Shares Policies
create policy "Select shares for owned or joined documents"
  on public.document_shares for select
  to authenticated
  using (user_id = auth.uid() or public.is_document_owner(document_id, auth.uid()));

create policy "Manage shares as document owner"
  on public.document_shares for insert
  to authenticated
  with check (public.is_document_owner(document_id, auth.uid()));

create policy "Update shares as document owner"
  on public.document_shares for update
  to authenticated
  using (public.is_document_owner(document_id, auth.uid()))
  with check (public.is_document_owner(document_id, auth.uid()));

create policy "Delete shares as document owner"
  on public.document_shares for delete
  to authenticated
  using (public.is_document_owner(document_id, auth.uid()));

-- Attachments Policies
create policy "Select attachments if user has document access"
  on public.attachments for select
  to authenticated
  using (public.has_document_access(document_id, auth.uid()));

create policy "Insert attachments if user has edit access"
  on public.attachments for insert
  to authenticated
  with check (public.can_edit_document(document_id, auth.uid()));

create policy "Delete attachments as document owner"
  on public.attachments for delete
  to authenticated
  using (public.is_document_owner(document_id, auth.uid()));


-- =========================================================================
-- SECURE COLLABORATOR LOOKUP RPC
-- =========================================================================

-- Resolve collaborator by exact email without exposing directory
create or replace function public.get_profile_by_email(email_addr text)
returns table (id uuid, email text)
security definer
set search_path = public
stable
as $$
begin
  return query
  select p.id, p.email
  from public.profiles p
  where p.email = email_addr;
end;
$$ language plpgsql;


-- =========================================================================
-- AUTOMATIC TIMESTAMPS
-- =========================================================================

create or replace function public.handle_update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_document_updated
  before update on public.documents
  for each row execute procedure public.handle_update_timestamp();


-- =========================================================================
-- STORAGE SETUP & POLICIES
-- =========================================================================

-- Helper to extract UUID from a path (e.g., 'document_id/file.txt')
create or replace function public.extract_uuid(path text)
returns uuid as $$
declare
  parts text[];
begin
  parts := regexp_split_to_array(path, '/');
  if array_length(parts, 1) > 0 then
    begin
      return parts[1]::uuid;
    exception when others then
      return null;
    end;
  end if;
  return null;
end;
$$ language plpgsql stable;

-- Storage Policies on storage.objects table
drop policy if exists "Allow download of attachments if user has document access" on storage.objects;
drop policy if exists "Allow upload of attachments if user has edit access" on storage.objects;
drop policy if exists "Allow delete of attachments if user is document owner" on storage.objects;

create policy "Allow download of attachments if user has document access"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'attachments' and public.has_document_access(public.extract_uuid(name), auth.uid()));

create policy "Allow upload of attachments if user has edit access"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attachments' and public.can_edit_document(public.extract_uuid(name), auth.uid()));

create policy "Allow delete of attachments if user is document owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'attachments' and public.is_document_owner(public.extract_uuid(name), auth.uid()));
