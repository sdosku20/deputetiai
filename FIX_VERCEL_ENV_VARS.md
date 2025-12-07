# Fix: Environment Variables Not Working on Vercel

## The Problem

Even though environment variables exist in Vercel settings, they're not being used by the deployed app.

## Common Causes & Solutions

### 1. Variables Not Set for All Environments ⚠️ MOST COMMON

**Problem**: Variables might only be set for "Preview" but not "Production"

**Fix**:
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. For EACH variable (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_CHAT_MODEL`):
   - Click the variable
   - Make sure **ALL THREE** checkboxes are checked:
     - ☑️ Production
     - ☑️ Preview  
     - ☑️ Development
3. If they're not all checked, check them and **Save**

### 2. Variables Added But Not Redeployed ⚠️ VERY COMMON

**Problem**: Environment variables only take effect on NEW deployments

**Fix**:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Wait 2-3 minutes for rebuild

**OR** trigger a new deployment by pushing a commit:
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

### 3. Variable Names Have Typos

**Check these exact names** (case-sensitive):
- `NEXT_PUBLIC_API_URL` (not `NEXT_PUBLIC_API_BASE_URL` or `API_URL`)
- `NEXT_PUBLIC_CHAT_MODEL` (not `CHAT_MODEL` or `MODEL`)

**Fix**:
1. Check Settings → Environment Variables
2. Verify exact spelling matches above
3. If wrong, delete old one and add correct one
4. Redeploy

### 4. Variables Need `NEXT_PUBLIC_` Prefix

**Important**: For Next.js to expose variables to the browser, they MUST start with `NEXT_PUBLIC_`

✅ **Correct:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CHAT_MODEL`

❌ **Wrong:**
- `API_URL` (won't be available in browser)
- `CHAT_MODEL` (won't be available in browser)

### 5. Check Variable Values

Make sure values are exactly:
- `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai` (no trailing slash)
- `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`

## Step-by-Step Fix

### Step 1: Verify Variables Exist

1. Go to https://vercel.com
2. Click your project
3. **Settings** → **Environment Variables**
4. You should see:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CHAT_MODEL`

### Step 2: Check Environment Checkboxes

For EACH variable:
1. Click on the variable name
2. Verify these are ALL checked:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
3. If any are unchecked, check them and **Save**

### Step 3: Redeploy

**CRITICAL**: After any changes, you MUST redeploy:

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### Step 4: Verify It Worked

After redeploy:
1. Open your Vercel URL
2. Press F12 → Console tab
3. Look for: `=== CHAT PAGE ENVIRONMENT CHECK ===`
4. Should show:
   ```
   API URL: https://asistenti.deputeti.ai
   Model: eu-law-rag
   ```

If you see `NOT SET` or `undefined`, the variables still aren't working.

## Quick Test Command

Run this in your browser console on Vercel (after redeploy):

```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Model:', process.env.NEXT_PUBLIC_CHAT_MODEL);
```

Expected:
```
API URL: https://asistenti.deputeti.ai
Model: eu-law-rag
```

If you see `undefined`, variables aren't set correctly.

## Nuclear Option: Delete and Re-add

If nothing works:

1. Go to Settings → Environment Variables
2. **Delete** both variables
3. **Add them again**:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://asistenti.deputeti.ai`
   - Environment: Select **ALL** (Production, Preview, Development)
   - Click "Add"
   
   - Name: `NEXT_PUBLIC_CHAT_MODEL`
   - Value: `eu-law-rag`
   - Environment: Select **ALL** (Production, Preview, Development)
   - Click "Add"
4. **Redeploy** (go to Deployments → Redeploy)

## Still Not Working?

If after all this it still doesn't work:

1. Check build logs in Vercel for errors
2. Verify you're using the correct project (not a fork/clone)
3. Try redeploying from a different branch
4. Contact Vercel support (they're usually very helpful)

## Remember

- ✅ Variables MUST start with `NEXT_PUBLIC_` for browser access
- ✅ Must be set for ALL environments (Production, Preview, Development)
- ✅ Must redeploy after adding/changing variables
- ✅ Variable names are case-sensitive

