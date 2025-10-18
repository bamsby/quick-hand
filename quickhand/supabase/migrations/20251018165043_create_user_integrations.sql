-- Create user_integrations table to store OAuth tokens for Notion, Gmail, etc.
create table user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  integration_type text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  workspace_id text,
  workspace_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, integration_type)
);

-- Add index for faster lookups
create index user_integrations_user_id_idx on user_integrations(user_id);
create index user_integrations_type_idx on user_integrations(integration_type);

-- Enable RLS
alter table user_integrations enable row level security;

-- Policy: users can only access their own integrations
create policy "Users can manage own integrations"
  on user_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_user_integrations_updated_at
  before update on user_integrations
  for each row
  execute function update_updated_at_column();

