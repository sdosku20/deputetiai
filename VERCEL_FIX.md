# Vercel Deployment Fix Guide

## Why It Works on Localhost But Not Vercel

The most common reason is **missing environment variables** in Vercel.

## Quick Fix Steps

### Step 1: Check Environment Variables in Vercel

1. Go to https://vercel.com
2. Log in to your account
3. Click on your project (`deputeti-ai` or similar)
4. Go to **Settings** → **Environment Variables**
5. Check if these variables exist:
   - `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
   - `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`

### Step 2: Add Missing Variables

If they're missing:

1. Click **"Add New"**
2. Add Variable 1:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://asistenti.deputeti.ai`
   - **Environment**: Select ALL (Production, Preview, Development)
   - Click **"Save"**

3. Add Variable 2:
   - **Key**: `NEXT_PUBLIC_CHAT_MODEL`
   - **Value**: `eu-law-rag`
   - **Environment**: Select ALL (Production, Preview, Development)
   - Click **"Save"**

### Step 3: Redeploy

**IMPORTANT**: After adding environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Wait 2-3 minutes

**OR** simply push a new commit to trigger auto-deploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## Common Issues

### Issue 1: Variables Set But Not Working

**Solution**: Make sure you selected ALL environments (Production, Preview, Development) when adding the variable.

### Issue 2: Build Succeeds But App Doesn't Work

**Solution**: 
- Environment variables need `NEXT_PUBLIC_` prefix to be available in the browser
- After adding variables, you MUST redeploy

### Issue 3: Different Behavior on Localhost vs Vercel

**Possible Causes**:
1. Environment variables not set in Vercel
2. Different API URL being used
3. CORS issues (API might block Vercel domain)
4. Build-time vs runtime variable issues

## Verify It's Working

After redeploying, check the browser console:
1. Open your Vercel URL
2. Press F12 → Console tab
3. Look for `[API Client]` logs
4. Check if `API_BASE_URL` shows correctly: `https://asistenti.deputeti.ai`

If you see `undefined` or wrong URL, the environment variable isn't set correctly.

## Testing Locally vs Vercel

**Localhost:**
- Uses `.env.local` file (if you have one)
- OR uses default fallback values in code

**Vercel:**
- Only uses environment variables set in Vercel dashboard
- `.env.local` files are NOT used (they're gitignored)

This is why it works locally but not on Vercel!

