# Database Migrations Guide

This guide explains how to manage database migrations for the TitipYuk Semarang project using Supabase CLI.

## Prerequisites

- Docker installed and running
- Node.js and npm installed
- Supabase CLI (installed automatically via npx)

## Quick Start

1. **Start local development environment:**
   ```bash
   npm run setup
   # or manually:
   npm run db:start
   ```

2. **Create a new migration:**
   ```bash
   npx supabase migration new your_migration_name
   ```

3. **Apply migrations to local database:**
   ```bash
   npm run db:migrate
   # or
   npx supabase db push
   ```

4. **Generate TypeScript types:**
   ```bash
   npm run db:generate-types
   ```

## Available Scripts

- `npm run setup` - Setup complete development environment
- `npm run db:start` - Start local Supabase services
- `npm run db:stop` - Stop local Supabase services
- `npm run db:reset` - Reset local database (destructive!)
- `npm run db:migrate` - Apply pending migrations
- `npm run db:generate-types` - Generate TypeScript types from schema

## Migration Workflow

### Creating Migrations

1. Create a new migration file:
   ```bash
   npx supabase migration new add_new_feature
   ```

2. Edit the generated SQL file in `supabase/migrations/`

3. Apply the migration:
   ```bash
   npm run db:migrate
   ```

### Example Migration

```sql
-- Create a new table
CREATE TABLE public.example_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view all examples" 
ON public.example_table FOR SELECT 
USING (true);
```

## Database Schema

### Current Tables

1. **profiles** - User profile information
2. **storage_locations** - Available storage locations in Semarang
3. **box_types** - Different box sizes and pricing
4. **storage_bookings** - User bookings for storage
5. **booking_history** - Audit trail for booking changes

### Key Features

- **Row Level Security (RLS)** enabled on all tables
- **Automatic profile creation** when users sign up
- **Audit trails** with created_at/updated_at timestamps
- **Proper foreign key relationships**

## Local Development URLs

When running locally, you can access:

- **API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio**: http://localhost:54323
- **Inbucket (Email)**: http://localhost:54324

## Production Deployment

1. **Link to your production project:**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. **Push migrations to production:**
   ```bash
   npx supabase db push --linked
   ```

3. **Generate production types:**
   ```bash
   npx supabase gen types typescript --linked > types/supabase.ts
   ```

## Best Practices

1. **Always test migrations locally first**
2. **Create backup before major schema changes**
3. **Use descriptive migration names**
4. **Include rollback instructions in comments**
5. **Enable RLS on all user-facing tables**
6. **Use proper foreign key constraints**

## Troubleshooting

### Common Issues

1. **Docker not running:**
   ```bash
   # Start Docker Desktop or Docker service
   sudo systemctl start docker  # Linux
   ```

2. **Port conflicts:**
   ```bash
   # Stop other services using ports 54321-54324
   npx supabase stop
   ```

3. **Migration fails:**
   ```bash
   # Check logs
   npx supabase status
   # Reset database (destructive!)
   npx supabase db reset
   ```

### Getting Help

- Check Supabase CLI docs: https://supabase.com/docs/guides/cli
- View logs: `docker logs supabase_db_titipyuk`
- Reset everything: `npx supabase stop --no-backup && npx supabase start`
