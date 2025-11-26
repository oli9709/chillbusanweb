# Quick Sentry Test - Step by Step

## Method 1: Run Test Script (Easiest)

```bash
# Set your Sentry DSN (if not already in Vercel)
export SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"

# Run the test script
node test-sentry.js
```

Then check your Sentry dashboard for the error.

---

## Method 2: Use Test Page

1. **Deploy to Vercel** (if not already deployed)
2. **Visit:** `https://your-domain.vercel.app/sentry-test.html`
3. **Click:** "Trigger API Error" button
4. **Check:** Sentry Dashboard → Issues

---

## Method 3: Direct API Call

```bash
# Replace with your actual domain
curl -X POST https://your-domain.vercel.app/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"test": "error"}'
```

---

## Method 4: Browser Console

1. Open your website: `https://your-domain.vercel.app`
2. Press F12 to open console
3. Paste and run:
   ```javascript
   fetch('/api/sentry-test', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ test: 'error' })
   }).then(r => r.json()).then(console.log);
   ```
4. Check Sentry dashboard

---

## What You Should See in Sentry

1. Go to: https://sentry.io → Your Project → Issues
2. Look for error: "Sentry Integration Test Error"
3. Error should have:
   - Tag: `test: sentry_verification`
   - Extra context with timestamp
   - Stack trace

---

## Troubleshooting

### No events in Sentry?
1. ✅ Verify `SENTRY_DSN` is set in Vercel
2. ✅ Check DSN format is correct (starts with `https://`)
3. ✅ Wait 10-30 seconds (events are batched)
4. ✅ Check Sentry project is not paused
5. ✅ Verify you're looking at the correct Sentry project

### Still not working?
Run the test script with debug:
```bash
NODE_ENV=development node test-sentry.js
```

This will show more detailed logs.

