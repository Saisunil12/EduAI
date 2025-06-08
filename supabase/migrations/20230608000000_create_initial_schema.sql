-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- Create notes table
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.notes enable row level security;

-- Create policies for notes
create policy "Users can view their own notes" 
  on public.notes for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create a trigger to update the updated_at column
create trigger handle_updated_at
  before update on public.notes
  for each row
  execute function update_updated_at_column();
