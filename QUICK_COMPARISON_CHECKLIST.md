# Quick Comparison Checklist

## What to Do RIGHT NOW

### Step 1: Test Our Frontend and Copy Console Output

1. Open your frontend (localhost or Vercel)
2. Open DevTools (F12) → **Console** tab
3. **Clear console** (right-click → Clear console)
4. Ask a question (e.g., "What is Article 50 TEU?")
5. In the console, find the line that says:
   ```
   [API Client] 📋 COPY THIS FOR DEBUGGING:
   ```
6. **Copy the entire JSON object** below that line
7. Also copy the line that says:
   ```
   [API Client] 📋 ERROR RESPONSE (COPY FOR DEBUGGING):
   ```
   And the JSON below it
8. **Paste both here** in your response

---

### Step 2: Test Working Website and Copy Request Details

1. Open `https://asistenti.deputeti.ai/` in a **new browser window/tab**
2. Log in (username: michael, password: IUsedToBeAStrongPass__)
3. Open DevTools (F12) → **Network** tab
4. **Clear network** (trash icon)
5. Ask the **SAME question** (e.g., "What is Article 50 TEU?")
6. In Network tab, find the request (look for `/v1/chat/completions` or similar)
7. Click on that request
8. You'll see several tabs: **Headers, Payload, Response**

#### From Headers Tab:
- Scroll to **Request Headers** section
- **Right-click** on any header → **Copy all as cURL** (if available)
- OR manually copy ALL headers and paste here
- Scroll to **Response Headers** section
- Copy all response headers and paste here

#### From Payload Tab (or Request tab):
- Copy the **Request Payload** JSON and paste here

#### From Response Tab:
- Copy the **Response** JSON and paste here

---

### Step 3: Check for Cookies

#### On Working Website:
1. After logging in, go to DevTools → **Application** tab (or **Storage** in Firefox)
2. Click **Cookies** → `https://asistenti.deputeti.ai`
3. **List all cookies** (name and value) OR take a screenshot

#### On Our Frontend:
1. Go to DevTools → **Application** tab
2. Click **Cookies** → Check your domain (localhost or Vercel)
3. **List all cookies** (if any) OR confirm "No cookies"

---

## What I'm Looking For

The most common differences are:

1. **Missing Authorization Header**
   - Working site might send: `Authorization: Bearer <token>`
   - We send: `X-API-Key: <key>`
   - **Need to check**: Do they send both?

2. **Missing Cookies**
   - Working site might set cookies after login
   - We might not be sending those cookies
   - **Need to check**: What cookies exist?

3. **Different Request Body Structure**
   - Working site might send additional fields
   - Different nesting structure
   - **Need to check**: Compare JSON structures side-by-side

4. **Different Content-Type**
   - Working site might use different content-type
   - **Need to check**: What's in the headers?

---

## Alternative: Use Browser Extension

If copying manually is too tedious:

1. Install **"HAR Export Trigger"** Chrome extension
2. On working website, after asking a question:
   - Click extension icon → Export HAR
   - Share the HAR file contents
3. On our frontend, do the same:
   - Click extension icon → Export HAR
   - Share the HAR file contents

---

## Most Important: Copy These 3 Things

1. **Our frontend console output** (the "COPY THIS FOR DEBUGGING" JSON)
2. **Working website request headers** (all of them)
3. **Working website request payload** (the JSON body)

With just these 3 things, I can identify the problem!

