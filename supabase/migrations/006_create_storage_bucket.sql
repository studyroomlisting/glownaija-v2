-- ── FIX: photo uploads always failing — the storage bucket was never created ──
-- app/api/upload-image/route.ts uploads to supabase.storage.from('salon-images'),
-- but that bucket never existed anywhere in this project (no migration, no
-- dashboard setup). Every upload attempt failed with a "bucket not found" error —
-- silently, because the client code never checked for/displayed that error either
-- (fixed separately in components/dashboard/PhotoUpload.tsx).

insert into storage.buckets (id, name, public)
values ('salon-images', 'salon-images', true)
on conflict (id) do nothing;

-- Anyone can view salon photos (they're shown publicly on salon listing pages).
drop policy if exists "Public read access for salon images" on storage.objects;
create policy "Public read access for salon images"
on storage.objects for select
using (bucket_id = 'salon-images');

-- Files are uploaded to a path like "<user_id>/<timestamp>.<ext>" (see
-- app/api/upload-image/route.ts) — only the owner of that folder may upload/delete.
drop policy if exists "Users can upload their own salon images" on storage.objects;
create policy "Users can upload their own salon images"
on storage.objects for insert
with check (bucket_id = 'salon-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own salon images" on storage.objects;
create policy "Users can delete their own salon images"
on storage.objects for delete
using (bucket_id = 'salon-images' and auth.uid()::text = (storage.foldername(name))[1]);
