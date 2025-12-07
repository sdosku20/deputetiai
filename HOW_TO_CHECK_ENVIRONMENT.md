# How to Check Environment Configuration on Vercel

## Quick Check Method

### Step 1: Open Your Vercel URL
1. Go to your deployed Vercel URL (e.g., `https://deputeti-ai.vercel.app`)
2. **Press F12** to open Developer Tools
3. Go to the **Console** tab

### Step 2: Look for Environment Check Logs

You should see a log that looks like this:

```
=== CHAT PAGE ENVIRONMENT CHECK ===
API URL: https://asistenti.deputeti.ai
Model: eu-law-rag
NODE_ENV: production
Location: https://deputeti-ai.vercel.app/chat
====================================
```

**What to check:**
- ✅ **API URL** should be: `https://asistenti.deputeti.ai`
- ✅ **Model** should be: `eu-law-rag`
- ⚠️ If you see `NOT SET (using fallback)`, the environment variables aren't configured in Vercel

### Step 3: Check API Config Logs

Also look for this log (appears when API client loads):

```
[API Config] Environment check: {
  API_BASE_URL: "https://asistenti.deputeti.ai",
  DEFAULT_MODEL: "eu-law-rag",
  env_API_URL: "https://asistenti.deputeti.ai",
  env_MODEL: "eu-law-rag",
  isProduction: true
}
```

**What to check:**
- ✅ `API_BASE_URL` should NOT be `undefined`
- ✅ `env_API_URL` should show the actual value, not `undefined`
- ✅ `isProduction` should be `true` on Vercel

## If Environment Variables Are NOT Set

If you see `undefined` or `NOT SET`, you need to:

1. Go to https://vercel.com
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:
   - `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
   - `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`
5. Make sure to select **ALL environments** (Production, Preview, Development)
6. **Redeploy** after adding variables

## Quick Browser Console Check

You can also run this directly in the browser console:

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');
console.log('Model:', process.env.NEXT_PUBLIC_CHAT_MODEL || 'NOT SET');
```

Expected output:
```
API URL: https://asistenti.deputeti.ai
Model: eu-law-rag
```

If you see `NOT SET`, environment variables aren't configured.

## Why It Works on Localhost But Not Vercel

**Common reasons:**

1. **Environment variables not set in Vercel**
   - Localhost might use `.env.local` file
   - Vercel doesn't use `.env.local` files
   - Must set variables in Vercel dashboard

2. **Variables set but not redeployed**
   - After adding variables, you MUST redeploy
   - Existing deployments don't automatically get new variables

3. **Different conversation history**
   - Localhost might have fresh sessions
   - Vercel might have old sessions with error messages
   - **Solution**: Clear localStorage on Vercel (or start a new chat)

## Clear Conversation History on Vercel

If you suspect corrupted conversation history:

1. Open Vercel URL
2. Press F12 → Console tab
3. Run:
```javascript
localStorage.clear();
location.reload();
```

This will clear all saved conversations and start fresh.

