-- Create a storage bucket for PDF files
insert into storage.buckets (id, name, public)
values ('pdf_files', 'pdf_files', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'pdf_files');

create policy "Users can upload their own files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'pdf_files' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (bucket_id = 'pdf_files' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'pdf_files' AND (storage.foldername(name))[1] = auth.uid()::text);
