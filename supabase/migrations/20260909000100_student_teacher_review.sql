-- Apply after 20260827000100_isolate_media_auth.sql.
begin;
alter table public.media_profiles add column if not exists role text not null default 'teacher'
  check (role in ('student', 'teacher'));
-- Existing accounts retain teacher access; new memberships default to student.
alter table public.media_profiles alter column role set default 'student';
revoke update on public.media_profiles from authenticated;
grant update (username, family_name, first_name, middle_initial) on public.media_profiles to authenticated;

create or replace function public.has_media_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.media_profiles mp where mp.id = auth.uid()
    and (mp.role = 'student' or public.is_app_email_allowed('news', mp.real_email)));
$$;
create or replace function public.is_media_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.media_profiles mp where mp.id = auth.uid()
    and mp.role = 'teacher' and public.is_app_email_allowed('news', mp.real_email));
$$;
revoke all on function public.is_media_teacher() from public, anon;
grant execute on function public.is_media_teacher() to authenticated;

-- Preserve existing status values when this database already has the column.
alter table public.news_articles
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'published' check (status in ('pending', 'published'));
alter table public.news_articles alter column status set default 'pending';
alter table public.news_articles alter column submitted_by set default auth.uid();
create index if not exists news_articles_review_idx on public.news_articles(status, created_at desc);
create index if not exists news_articles_submitter_idx on public.news_articles(submitted_by);

-- Replace the legacy public-read policy: unpublished articles must never reach the website.
drop policy if exists "Public read" on public.news_articles;
drop policy if exists "Public published news" on public.news_articles;
create policy "Public published news" on public.news_articles for select to anon, authenticated
  using (status = 'published');
drop policy if exists "Media review queue" on public.news_articles;
create policy "Media review queue" on public.news_articles for select to authenticated
  using (public.is_media_teacher() or (public.has_media_access() and submitted_by = auth.uid()));
drop policy if exists "Media insert news" on public.news_articles;
drop policy if exists "Media update news" on public.news_articles;
drop policy if exists "Media delete news" on public.news_articles;
create policy "Media insert news" on public.news_articles for insert to authenticated
  with check (public.has_media_access() and submitted_by = auth.uid()
    and (public.is_media_teacher() or status = 'pending'));
create policy "Media update news" on public.news_articles for update to authenticated
  using (public.is_media_teacher() or (public.has_media_access() and submitted_by = auth.uid() and status = 'pending'))
  with check (public.is_media_teacher() or (public.has_media_access() and submitted_by = auth.uid() and status = 'pending'));
create policy "Media delete news" on public.news_articles for delete to authenticated
  using (public.is_media_teacher() or (public.has_media_access() and submitted_by = auth.uid() and status = 'pending'));

-- The submitter is an immutable ownership field, separate from the editable byline.
create or replace function public.protect_news_submitter() returns trigger language plpgsql as $$
begin
  if new.submitted_by is distinct from old.submitted_by and auth.role() = 'authenticated' then
    raise exception 'Article submitter cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_news_submitter on public.news_articles;
create trigger protect_news_submitter before update on public.news_articles
  for each row execute function public.protect_news_submitter();

-- Students can upload to their own folder, but cannot remove assets after review.
drop policy if exists "Media upload news photos" on storage.objects;
drop policy if exists "Media delete news photos" on storage.objects;
create policy "Media upload news photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'news-photos' and public.has_media_access()
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Media delete news photos" on storage.objects for delete to authenticated
  using (bucket_id = 'news-photos' and public.is_media_teacher());
create or replace function public.ensure_media_owner_profile()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_email text;
begin
  if not public.is_dashboard_owner() then
    return false;
  end if;

  select lower(email) into owner_email
  from auth.users
  where id = auth.uid();

  if owner_email is null then
    return false;
  end if;

  insert into public.media_profiles (
    id, real_email, auth_email, username, family_name, first_name,
    middle_initial, role
  ) values (
    auth.uid(), owner_email, owner_email, 'owner.jaybhee84',
    'BAZAN', 'JONYBHEE', 'A', 'teacher'
  )
  on conflict (id) do update set
    real_email = excluded.real_email,
    auth_email = excluded.auth_email;

  return true;
end;
$$;


commit;
