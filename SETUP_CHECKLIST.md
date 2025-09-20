# Comment System Setup Checklist

## 🔍 Quick Diagnosis Steps

### 1. Check if Comment Section is Visible
- Open your website in a browser
- Scroll down to see if the "💬 Share Your Experience" section is visible
- Open browser Developer Tools (F12) and check the Console tab for any errors

### 2. Test Functions Directly
- Open the test file: `test-comments.html` in your browser
- Click "Test GET /api/comments" to check if functions are accessible
- If this fails, the issue is with Netlify Functions deployment

### 3. Check Environment Variables
In your Netlify dashboard:
1. Go to Site settings → Environment variables
2. Verify `DATABASE_URL` is set with your Neon connection string
3. The format should be: `postgresql://username:password@hostname/database?sslmode=require`

### 4. Verify Database Table
In your Neon database console, run this SQL to create the table if it doesn't exist:
```sql
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Check Netlify Functions
In your Netlify dashboard:
1. Go to Functions tab
2. Verify `comments` function is listed
3. Check function logs for any errors

## 🚨 Common Issues & Solutions

### Issue: Comment section not visible
**Solution:** Check if the HTML file is being served correctly and the JavaScript is loading

### Issue: Functions return 404
**Solution:** 
- Verify `netlify.toml` has the correct functions directory
- Redeploy the site
- Check that functions are in the right location

### Issue: Database connection errors
**Solution:**
- Verify `DATABASE_URL` environment variable
- Check Neon database is active
- Ensure the comments table exists

### Issue: CORS errors
**Solution:** The functions already include CORS headers, but check browser console for specific errors

## 🔧 Manual Testing Commands

Test the function directly using curl (replace YOUR_SITE_URL with your actual site):

```bash
# Test GET
curl https://YOUR_SITE_URL/.netlify/functions/comments

# Test POST
curl -X POST https://YOUR_SITE_URL/.netlify/functions/comments \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","text":"Test comment"}'
```

## 📋 Deployment Checklist

Before deploying:
- [ ] `netlify.toml` is configured correctly
- [ ] Functions are in `netlify/functions/` directory
- [ ] `DATABASE_URL` environment variable is set in Netlify
- [ ] Database table exists
- [ ] All files are committed to git

## 🆘 If Still Not Working

1. Check Netlify Function logs in the dashboard
2. Check browser console for JavaScript errors
3. Verify the site URL is correct
4. Try redeploying the entire site
5. Contact support with specific error messages from logs
