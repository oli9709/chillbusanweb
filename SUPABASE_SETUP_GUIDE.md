# How to Get Your Supabase Keys

## Step 1: Create/Login to Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account or log in
3. Create a new project (or select existing project)

## Step 2: Get Your Project URL

1. In your Supabase dashboard, go to **Settings** → **API**
2. Find **Project URL** section
3. Copy the URL (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

**Example:**
```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

## Step 3: Get Your Anon/Public Key

1. In the same **Settings** → **API** page
2. Find **Project API keys** section
3. Copy the **`anon` `public`** key (this is your public key)

**Example:**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Get Your Service Role Key

1. Still in **Settings** → **API** page
2. In **Project API keys** section
3. Copy the **`service_role` `secret`** key (⚠️ KEEP THIS SECRET!)

**Example:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT:** The Service Role Key has admin privileges. Never expose it in client-side code!

## Step 5: Set Environment Variables in Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add each variable:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
```

### Option B: Via netlify.toml (For version control)

Create or update `netlify.toml` in your project root:

```toml
[build.environment]
  SUPABASE_URL = "https://your-project.supabase.co"
  SUPABASE_ANON_KEY = "your-anon-key-here"
  SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"
```

⚠️ **Note:** Don't commit `netlify.toml` with real keys to public repos!

## Step 6: Set Frontend Environment Variables

For the frontend pages (`index.html`, `signup.html`, `login.html`, `dashboard.html`), you have two options:

### Option A: Inject via Netlify Build (Recommended)

Create a build script that injects the variables. Add to `package.json`:

```json
{
  "scripts": {
    "build": "node scripts/inject-env.js && npm run build:html"
  }
}
```

### Option B: Set via Netlify Environment Variables

Netlify can inject environment variables into your HTML during build. Update your HTML files to use:

```javascript
window.SUPABASE_URL = process.env.SUPABASE_URL || '';
window.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
```

Then configure Netlify to replace these during build.

## Step 7: Verify Your Setup

1. Check that all three variables are set in Netlify
2. Deploy your site
3. Test signup/login functionality
4. Check Netlify function logs for any errors

## Security Checklist

- ✅ Never commit keys to Git
- ✅ Use `.gitignore` to exclude `.env` files
- ✅ Service Role Key only in Netlify environment variables (server-side)
- ✅ Anon Key can be in frontend (it's public by design)
- ✅ Rotate keys if accidentally exposed

## Troubleshooting

### "Supabase client not initialized"
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Verify they're being injected into HTML correctly
- Check browser console for errors

### "Authentication failed"
- Verify your Supabase project has Authentication enabled
- Check that email provider is configured
- Ensure RLS policies are set correctly

### "Service role key error"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify environment variables
- Check that it's only used in serverless functions (not frontend)
- Ensure the key hasn't expired

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/

