# Supabase Configuration

## ✅ Retrieved from Supabase Project

**Project URL:**
```
https://bvarcwjloubxagszzkqf.supabase.co
```

**Anon/Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXJjd2psb3VieGFnc3p6a3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTM1MzYsImV4cCI6MjA3OTQ2OTUzNn0.wu05PiXH2UvU0O9ExWqCKMPIRpItFiazDavS-PXSmJo
```

## ⚠️ Service Role Key Required

The **Service Role Key** cannot be retrieved via API for security reasons. You need to get it manually:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find **Project API keys** section
5. Copy the **`service_role` `secret`** key

## Netlify Environment Variables

Set these in **Netlify Dashboard** → **Site settings** → **Environment variables**:

```
SUPABASE_URL=https://bvarcwjloubxagszzkqf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXJjd2psb3VieGFnc3p6a3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTM1MzYsImV4cCI6MjA3OTQ2OTUzNn0.wu05PiXH2UvU0O9ExWqCKMPIRpItFiazDavS-PXSmJo
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## ✅ Files Updated

I've automatically updated these files with your Supabase credentials:
- ✅ `index.html`
- ✅ `signup.html`
- ✅ `login.html`
- ✅ `dashboard.html`

The frontend will now work with your Supabase project!

## Next Steps

1. **Get Service Role Key** from Supabase Dashboard (required for `consumeDiscount` function)
2. **Set in Netlify** environment variables
3. **Run database migration** to create the `users` table
4. **Test authentication** flow

