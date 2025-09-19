# Comments System Setup Guide

## 🗄️ Database Setup (Neon Postgres)

1. **Create the comments table in your Neon database:**
   ```sql
   CREATE TABLE comments (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL,
       text TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Get your Neon connection string:**
   - Go to your Neon dashboard
   - Copy the connection string (it looks like: `postgresql://username:password@hostname/database?sslmode=require`)

## 🔧 Netlify Environment Variables

1. **Go to your Netlify dashboard:**
   - Navigate to your site
   - Go to Site settings → Environment variables

2. **Add the following environment variable:**
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon connection string from step 2

## 🚀 Deployment

1. **Install dependencies:**
   ```bash
   cd netlify/functions
   npm install
   ```
   
   **Note:** The function now uses `@netlify/neon` package which automatically reads the `DATABASE_URL` environment variable.

2. **Deploy to Netlify:**
   - Push your changes to GitHub
   - Netlify will automatically deploy the functions

## 🧪 Testing

1. **Test the functions locally (optional):**
   ```bash
   npx netlify dev
   ```

2. **Test on live site:**
   - Go to your website
   - Scroll to the comments section
   - Try posting a comment
   - Check if comments appear

## 📁 File Structure

```
/
├── netlify/
│   └── functions/
│       ├── comments.js        # GET/POST /api/comments
│       └── package.json       # Dependencies
├── index.html                 # Updated with comment section
├── style.css                 # Comment section styles
└── main.js                   # Comment functionality
```

## 🔒 Security Features

- ✅ Input sanitization (XSS prevention)
- ✅ SQL injection protection
- ✅ CORS headers
- ✅ Input length limits
- ✅ HTML escaping

## 🎨 Features

- ✅ Real-time comment posting
- ✅ Automatic comment loading
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Loading states
- ✅ Error handling
- ✅ Success messages
- ✅ Mobile-friendly

## 🐛 Troubleshooting

**If comments don't work:**

1. Check Netlify Functions logs in your dashboard
2. Verify DATABASE_URL environment variable is set
3. Check browser console for JavaScript errors
4. Ensure the comments table exists in your database

**Common issues:**
- Missing environment variable
- Database connection issues
- CORS errors (should be handled by functions)
- Network connectivity

## 📞 Support

If you need help, check:
1. Netlify Functions logs
2. Browser developer console
3. Database connection status
4. Environment variables in Netlify dashboard
