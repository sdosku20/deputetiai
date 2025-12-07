# Diagnostic Steps: Compare Working Website vs Our Frontend

## Goal
Find the exact differences between the working website's requests and our frontend's requests.

---

## Step 1: Capture Request from Working Website

### Instructions:
1. Open the **working website** in Chrome/Firefox: `https://asistenti.deputeti.ai/`
2. Log in with your credentials (username: michael, password: IUsedToBeAStrongPass__)
3. Open **Developer Tools** (F12 or Right-click → Inspect)
4. Go to the **Network** tab
5. **Clear** all previous requests (trash icon)
6. Ask a question that you know works (e.g., "What is Article 50 TEU?")
7. In the Network tab, find the request that was made (look for `/v1/chat/completions` or `/api/v1/conversations` or similar)
8. Click on that request
9. Copy all the information below:

### Information to Capture:

#### A. Request Headers (Headers tab → Request Headers section)
```
Please copy ALL request headers and paste here:
General
Request URL
https://asistenti.deputeti.ai/api/v1/conversations
Request Method
GET
Status Code
200 OK
Remote Address
49.13.170.51:443
Referrer Policy
strict-origin-when-cross-origin
Response Headers
connection
keep-alive
content-length
1273
content-type
application/json
date
Sun, 07 Dec 2025 19:04:47 GMT
permissions-policy
geolocation=(), microphone=(), camera=()
referrer-policy
strict-origin-when-cross-origin
server
nginx/1.24.0 (Ubuntu)
x-content-type-options
nosniff
x-frame-options
DENY
x-ratelimit-limit
30
x-ratelimit-remaining
30
x-ratelimit-reset
1765134347
x-request-id
627d9791
x-tokenbudget-daily-remaining
82156
x-tokenbudget-monthly-remaining
978055
x-xss-protection
1; mode=block
(Raw:
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Date: Sun, 07 Dec 2025 19:04:47 GMT
Content-Type: application/json
Content-Length: 1273
Connection: keep-alive
x-request-id: 627d9791
x-ratelimit-limit: 30
x-ratelimit-remaining: 30
x-ratelimit-reset: 1765134347
x-tokenbudget-daily-remaining: 82156
x-tokenbudget-monthly-remaining: 978055
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
x-xss-protection: 1; mode=block
permissions-policy: geolocation=(), microphone=(), camera=())

Request Headers
accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.5
authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzY1MjA5NjIwfQ.F3s7BSzCLt27JrtqJpLY9KvJzjHZluSdVnieWoisNlg
connection
keep-alive
content-type
application/json
host
asistenti.deputeti.ai
referer
https://asistenti.deputeti.ai/
sec-ch-ua
"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"Windows"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
sec-gpc
1
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
(Raw: 
GET /api/v1/conversations HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: en-US,en;q=0.5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzY1MjA5NjIwfQ.F3s7BSzCLt27JrtqJpLY9KvJzjHZluSdVnieWoisNlg
Connection: keep-alive
Content-Type: application/json
Host: asistenti.deputeti.ai
Referer: https://asistenti.deputeti.ai/
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Sec-GPC: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
sec-ch-ua: "Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows")

```

#### B. Request Payload (Payload tab or Request tab)
```
Please copy the exact request body/JSON and paste here:
{content: "What is Article 50 TEU?"}
content
: 
"What is Article 50 TEU?"
```

#### C. Response Headers (Headers tab → Response Headers section)
```
Please copy ALL response headers and paste here:
```

#### D. Response Body (Response tab)
```
Please copy the response body and paste here (if it's JSON):
[
    {
        "id": "c7580138-e4c1-47e9-a903-235bbeb9e9a7",
        "title": "What constitutes high risk under the AI Act and wh...",
        "profile": "general",
        "is_archived": false,
        "created_at": "2025-12-07T18:46:35.999251",
        "updated_at": "2025-12-07T18:46:44.947663",
        "message_count": 4,
        "scope": "private",
        "organization_id": null,
        "organization_name": null
    },
    {
        "id": "557531d3-5269-437e-b7cb-58931a6efbb6",
        "title": "What constitutes high risk under the AI Act and wh...",
        "profile": "general",
        "is_archived": false,
        "created_at": "2025-12-07T18:36:11.433645",
        "updated_at": "2025-12-07T18:36:22.931761",
        "message_count": 2,
        "scope": "private",
        "organization_id": null,
        "organization_name": null
    },
    {
        "id": "e7a610d8-dd34-453a-8787-87a2240d6a8b",
        "title": "What constitutes high risk under the AI Act and wh...",
        "profile": "general",
        "is_archived": false,
        "created_at": "2025-12-05T18:50:43.278437",
        "updated_at": "2025-12-05T18:50:56.740324",
        "message_count": 6,
        "scope": "private",
        "organization_id": null,
        "organization_name": null
    },
    {
        "id": "7d8ae97b-6f7c-4ad2-927b-2187f2833012",
        "title": "What is the relationship between EU regulations an...",
        "profile": "general",
        "is_archived": false,
        "created_at": "2025-12-05T00:32:28.755181",
        "updated_at": "2025-12-05T00:32:38.678485",
        "message_count": 2,
        "scope": "private",
        "organization_id": null,
        "organization_name": null
    }
]
```

#### E. Cookies (Application tab → Cookies → https://asistenti.deputeti.ai)
```
Please list all cookies that are set for this domain:
https://asistenti.deputeti.ai
None cookies
etc.
```

#### F. Initator/Timing (Network tab → Select request → Look at bottom panel)
```
What is the "Request Method"? (GET, POST, OPTIONS, etc.)
What is the full "Request URL"?
What is the "Status Code"?
```

---

## Step 2: Capture Request from Our Frontend

### Instructions:
1. Open **your frontend** (localhost:3000 or Vercel URL)
2. Open **Developer Tools** (F12)
3. Go to **Console** tab and **clear** it
4. Go to the **Network** tab
5. **Clear** all previous requests (trash icon)
6. Ask the **SAME question** (e.g., "What is Article 50 TEU?")
7. In the Network tab, find the `/v1/chat/completions` request
8. Click on that request
9. Copy all the information below:

### Information to Capture:

#### A. Request Headers (Headers tab → Request Headers section)
```
Please copy ALL request headers and paste here:
General
Request URL
https://asistenti.deputeti.ai/v1/chat/completions
Request Method
POST
Status Code
500 Internal Server Error
Remote Address
49.13.170.51:443
Referrer Policy
strict-origin-when-cross-origin

Response Headers
access-control-allow-credentials
true
access-control-allow-origin
*
connection
keep-alive
content-length
68
content-type
application/json
date
Sun, 07 Dec 2025 19:15:00 GMT
permissions-policy
geolocation=(), microphone=(), camera=()
referrer-policy
strict-origin-when-cross-origin
server
nginx/1.24.0 (Ubuntu)
x-content-type-options
nosniff
x-frame-options
DENY
x-request-id
39d5cc68
x-xss-protection
1; mode=block
(Raw:
HTTP/1.1 500 Internal Server Error
Server: nginx/1.24.0 (Ubuntu)
Date: Sun, 07 Dec 2025 19:15:00 GMT
Content-Type: application/json
Content-Length: 68
Connection: keep-alive
access-control-allow-origin: *
access-control-allow-credentials: true
x-request-id: 39d5cc68
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
x-xss-protection: 1; mode=block
permissions-policy: geolocation=(), microphone=(), camera=())

Request Headers
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.7
connection
keep-alive
content-length
87
content-type
application/json
host
asistenti.deputeti.ai
origin
http://localhost:3000
referer
http://localhost:3000/
sec-ch-ua
"Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile
?0
sec-ch-ua-platform
"Windows"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
cross-site
sec-gpc
1
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
x-api-key
sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4
(Raw:
POST /v1/chat/completions HTTP/1.1
Accept: application/json, text/plain, */*
Accept-Encoding: gzip, deflate, br, zstd
Accept-Language: en-US,en;q=0.7
Connection: keep-alive
Content-Length: 87
Content-Type: application/json
Host: asistenti.deputeti.ai
Origin: http://localhost:3000
Referer: http://localhost:3000/
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: cross-site
Sec-GPC: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
X-API-Key: sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4
sec-ch-ua: "Brave";v="143", "Chromium";v="143", "Not A(Brand";v="24"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows")
```

#### B. Request Payload (Payload tab or Request tab)
```
Please copy the exact request body/JSON and paste here:
{model: "eu-law-rag", messages: [{role: "user", content: "What is Article 50 TEU?"}]}
messages
: 
[{role: "user", content: "What is Article 50 TEU?"}]
model
: 
"eu-law-rag"
```

#### C. Response Headers (Headers tab → Response Headers section)
```
Please copy ALL response headers and paste here:
```

#### D. Response Body (Response tab)
```
Please copy the error response body and paste here:
{"detail":"RAG pipeline error: 'str' object has no attribute 'get'"}
```

#### E. Cookies (Application tab → Cookies → Check all domains)
```
Are there any cookies set? If yes, list them:
cookie 1: __next_hmr_refresh_hash__
cookie 2: _xsrf
cookie 3: username-localhost-8888
```

#### F. Console Errors (Console tab)
```
Copy any error messages from the console:
useAgentSession.ts:154 [useAgentSession] ❌ Backend indicated failure: 
{success: false, hasResponse: false, error: "RAG pipeline error: 'str' object has no attribute 'get'"}
client.ts:217 
 POST https://asistenti.deputeti.ai/v1/chat/completions 500 (Internal Server Error)
client.ts:141 [API Client] ❌ 500 POST /v1/chat/completions
client.ts:149 [API Client] Error details: 
{status: 500, statusText: 'Internal Server Error', responseData: `{\n  "detail": "RAG pipeline error: 'str' object has no attribute 'get'"\n}`, requestHeaders: '{\n  "Accept": "application/json, text/plain, */*",…sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4"\n}', requestData: '{"model":"eu-law-rag","messages":[{"role":"user","content":"What is Article 50 TEU?"}]}'}
client.ts:167 [API Client] 500 Server Error - Full response: {
  "detail": "RAG pipeline error: 'str' object has no attribute 'get'"
}
client.ts:185 [API Client] 📋 ERROR RESPONSE (COPY FOR DEBUGGING):
client.ts:186 {
  "timestamp": "2025-12-07T19:15:10.882Z",
  "status": 500,
  "statusText": "Internal Server Error",
  "errorMessage": "Request failed with status code 500",
  "errorCode": "ERR_BAD_RESPONSE",
  "responseHeaders": {
    "content-length": "68",
    "content-type": "application/json"
  },
  "responseData": {
    "detail": "RAG pipeline error: 'str' object has no attribute 'get'"
  },
  "requestUrl": "/v1/chat/completions",
  "requestMethod": "POST",
  "requestHeaders": {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-API-Key": "sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4"
  },
  "requestData": "{\"model\":\"eu-law-rag\",\"messages\":[{\"role\":\"user\",\"content\":\"What is Article 50 TEU?\"}]}"
}
client.ts:397 [ChatAPI] Error sending message: 
{status: 500, statusText: 'Internal Server Error', errorMessage: 'Request failed with status code 500', errorCode: 'ERR_BAD_RESPONSE', errorResponseData: `{\n  "detail": "RAG pipeline error: 'str' object has no attribute 'get'"\n}`, …}
client.ts:432 [ChatAPI] ⚠️ RAG Pipeline Error detected!
client.ts:433 [ChatAPI] This suggests the backend received data in an unexpected format.
client.ts:434 [ChatAPI] Error response: {
  "detail": "RAG pipeline error: 'str' object has no attribute 'get'"
}
client.ts:435 [ChatAPI] What we sent: {"model":"eu-law-rag","messages":[{"role":"user","content":"What is Article 50 TEU?"}]}
client.ts:436 [ChatAPI] Expected format (from curl): {
  "model": "eu-law-rag",
  "messages": [
    {
      "role": "user",
      "content": "What is Article 50 TEU?"
    }
  ]
}
useAgentSession.ts:154 [useAgentSession] ❌ Backend indicated failure: 
{success: false, hasResponse: false, error: "RAG pipeline error: 'str' object has no attribute 'get'"}
﻿


```

---

## Step 3: Export Network Data (Alternative Method)

### For Working Website:
1. In Network tab, right-click anywhere
2. Select **"Save all as HAR with content"**
3. Save the file as `working-website.har`
4. **Upload or paste the contents** of this file

### For Our Frontend:
1. In Network tab, right-click anywhere
2. Select **"Save all as HAR with content"**
3. Save the file as `our-frontend.har`
4. **Upload or paste the contents** of this file

---

## Step 4: Additional Checks

### Check Authentication Method:
1. On the **working website**, after logging in:
   - Open **Application** tab → **Local Storage** → `https://asistenti.deputeti.ai`
   - Take a screenshot or list all keys/values
   
2. On **our frontend**:
   - Open **Application** tab → **Local Storage** → Your domain
   - List all keys/values

### Check for Session/Cookies:
1. On the **working website**:
   - Are there any cookies set after login?
   - Are there any session storage items?

---

## Quick Test: Try with Browser Extension

If you want to test if cookies are the issue:

1. Install a cookie export extension (like "Cookie Editor" for Chrome)
2. After logging into the working website, **export all cookies**
3. **Import those cookies** into your frontend domain (localhost or Vercel)
4. Try asking a question again
5. Report if it works

---

## What I'll Do With This Information

Once you provide the information above, I will:
1. Compare request headers (especially cookies, authorization, content-type)
2. Compare request bodies (JSON structure, field names, values)
3. Compare response differences
4. Identify what authentication/authorization mechanism the working site uses
5. Fix our frontend to match exactly

---

## Quick Checklist

Before sending me the information, make sure you have:
- [ ] Request headers from working website
- [ ] Request payload from working website
- [ ] Response from working website
- [ ] Cookies from working website
- [ ] Request headers from our frontend
- [ ] Request payload from our frontend
- [ ] Error response from our frontend
- [ ] Console errors from our frontend
- [ ] (Optional) HAR files from both

---

## Most Likely Issues Based on Past Experience

1. **Missing Cookies**: Working site might use session cookies that we're not sending
2. **Different Authentication Header**: Might use `Authorization: Bearer` instead of or in addition to `X-API-Key`
3. **Request Body Format**: Slight differences in JSON structure (extra fields, different nesting)
4. **CORS Preflight**: OPTIONS request might be failing differently
5. **Content-Type**: Different content-type header

---

## Alternative: Share Screenshots

If it's easier, you can:
1. Take screenshots of the Network tab for both requests
2. Take screenshots of the Headers, Payload, and Response tabs
3. Share those screenshots

This might be faster than copying text!

