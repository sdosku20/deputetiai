# Vercel Troubleshooting - Localhost Works But Vercel Doesn't

## Quick Diagnosis

### Step 1: Check Environment Variables in Vercel

1. Go to: https://vercel.com
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Verify these exist:
   - ✅ `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
   - ✅ `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`

**Important**: Make sure they're set for ALL environments (Production, Preview, Development)

### Step 2: Redeploy After Adding Variables

**CRITICAL**: Environment variables only take effect after redeploy!

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 3: Check Browser Console on Vercel

1. Open your Vercel URL
2. Press F12 → Console tab
3. Look for: `[API Config] Environment check:`
4. Verify:
   - `API_BASE_URL` = `https://asistenti.deputeti.ai`
   - `DEFAULT_MODEL` = `eu-law-rag`

If you see `undefined`, the environment variables aren't set correctly.

## Common Causes

### 1. Missing Environment Variables (Most Common)

**Symptom**: Works locally, fails on Vercel
**Cause**: `.env.local` file works locally but isn't used on Vercel
**Fix**: Add variables in Vercel dashboard + redeploy

### 2. Variables Set But Not Redeployed

**Symptom**: Variables exist in Vercel but app still uses defaults
**Cause**: Added variables but didn't redeploy
**Fix**: Redeploy after adding variables

### 3. Wrong Environment Selected

**Symptom**: Variables exist but don't work in production
**Cause**: Only set for Preview/Development, not Production
**Fix**: Set for ALL environments

### 4. CORS Issues

**Symptom**: Network errors, blocked requests
**Cause**: API server blocking Vercel domain
**Fix**: Check API server CORS settings (may need backend team)

### 5. Build vs Runtime Variables

**Symptom**: Works in dev, fails in production build
**Cause**: `NEXT_PUBLIC_` prefix required for client-side access
**Fix**: Ensure variables start with `NEXT_PUBLIC_`

## Verify Configuration

Run this in browser console on Vercel:
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');
console.log('Model:', process.env.NEXT_PUBLIC_CHAT_MODEL || 'NOT SET');
```

Expected output:
```
API URL: https://asistenti.deputeti.ai
Model: eu-law-rag
```

If you see "NOT SET", variables aren't configured correctly.

## Quick Fix Checklist

- [ ] Variables added in Vercel dashboard
- [ ] Variables set for ALL environments
- [ ] Redeployed after adding variables
- [ ] Checked browser console for config logs
- [ ] Verified API URL in logs matches expected value

