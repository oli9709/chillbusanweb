# Sentry Verification Guide

## ✅ Quick Verification Steps

### Option 1: Use Test Page (Recommended)

1. **Deploy to Vercel** (or run locally)
2. **Visit:** `https://your-domain.com/sentry-test.html`
3. **Click:** "Trigger API Error" button
4. **Check:** Your Sentry Dashboard → Issues
5. **Verify:** You should see an error event within 10-30 seconds

### Option 2: Use API Endpoint Directly

```bash
# Test error
curl -X POST https://your-domain.com/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"test": "error"}'

# Test message
curl -X POST https://your-domain.com/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"test": "message", "message": "Test message"}'

# Test with context
curl -X POST https://your-domain.com/api/sentry-test \
  -H "Content-Type: application/json" \
  -d '{"test": "context", "context": {"userId": "test-123"}}'
```

### Option 3: Browser Console

1. Open your website
2. Open browser console (F12)
3. Run:
   ```javascript
   myUndefinedFunction();
   ```
4. Check Sentry dashboard

---

## 🔍 What to Look For in Sentry

### Successful Integration:
- ✅ Error appears in **Issues** tab
- ✅ Error has stack trace
- ✅ Error includes tags (test: sentry_verification)
- ✅ Error includes extra context (timestamp, environment)
- ✅ Error shows correct environment (production/development)

### If No Events Appear:
1. ✅ Check `SENTRY_DSN` is set in Vercel
2. ✅ Verify DSN format is correct
3. ✅ Check Sentry project is active
4. ✅ Wait 10-30 seconds (events may be delayed)
5. ✅ Check Vercel function logs for errors
6. ✅ Verify Sentry initialization in `utils/sentry.js`

---

## 📊 Test Results Checklist

After running tests, verify:

- [ ] Error event appears in Sentry Issues
- [ ] Error has correct message
- [ ] Error includes stack trace
- [ ] Error has tags (test: sentry_verification)
- [ ] Error has extra context data
- [ ] Message event appears (if tested)
- [ ] Context data is visible in error details

---

## 🚨 Troubleshooting

### Error: "Sentry DSN not configured"
- **Fix:** Set `SENTRY_DSN` in Vercel environment variables
- **Verify:** Check `utils/sentry.js` initialization

### Error: "No events in Sentry"
- **Fix:** Wait 10-30 seconds (events are batched)
- **Fix:** Check Sentry project is not paused
- **Fix:** Verify DSN matches your Sentry project

### Error: "Events appear but no stack trace"
- **Fix:** This is normal for some error types
- **Fix:** Check source maps are configured (optional)

---

## ✅ Success Criteria

You have successfully verified Sentry when:
1. ✅ Test error appears in Sentry Issues
2. ✅ Error includes relevant context
3. ✅ Error is tagged correctly
4. ✅ You can see error details in Sentry dashboard

