# Debugging Guide - Frontend vs Working Website

## The Problem
- ✅ Working website (https://asistenti.deputeti.ai/): Works perfectly
- ❌ Our frontend: Gets "RAG pipeline error: 'str' object has no attribute 'get'"

## Steps to Debug

### 1. Compare Network Requests

**On the working website:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Ask a question
4. Find the `/v1/chat/completions` request
5. Click on it and check:
   - **Request Headers** - All headers (especially cookies, auth tokens)
   - **Request Payload** - Exact JSON being sent
   - **Request Method** - Should be POST

**On our frontend:**
1. Open browser DevTools (F12)
2. Go to Network tab  
3. Ask a question
4. Find the `/v1/chat/completions` request
5. Click on it and check:
   - **Request Headers** - Compare with working site
   - **Request Payload** - Compare with working site
   - **Request Method** - Should be POST

### 2. Check Console Logs

Our frontend logs detailed information:
- `[API Client] 🔍 Final request details:` - Shows exact request
- `[ChatAPI] Request body (JSON):` - Shows JSON being sent
- `[API Client] Error details:` - Shows full error response

### 3. Key Differences to Check

1. **Cookies/Session**: Working site might send session cookies
2. **Headers**: Different headers might be required
3. **Request Format**: JSON structure might be slightly different
4. **Encoding**: Character encoding might differ

### 4. Common Issues

- **Missing session cookie**: Working site might authenticate first
- **Different Content-Type**: Headers might differ
- **Request encoding**: Axios might encode differently than working site
- **CORS issues**: Request origin might matter

## Next Steps

After comparing, share:
1. Request Headers from working site (especially cookies/auth)
2. Request Payload from working site
3. Request Headers from our site
4. Request Payload from our site

This will help identify the exact difference causing the error.

