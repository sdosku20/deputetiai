# API Migration Complete ✅

## Summary
The frontend has been updated to match the working website's API exactly.

## Changes Made

### 1. ✅ Authentication Method Changed
- **Before**: `X-API-Key` header with API key
- **After**: `Authorization: Bearer <JWT_TOKEN>` header with JWT token
- **Location**: `src/lib/api/client.ts` - APIClient interceptor
- **Location**: `src/contexts/AuthContext.tsx` - Login function now uses username/password

### 2. ✅ API Endpoint Changed
- **Before**: `/v1/chat/completions` (OpenAI-compatible)
- **After**: `/api/v1/conversations/{conversation_id}/messages` (Conversation-based)
- **Location**: `src/lib/api/client.ts` - ChatAPIClient.sendMessage()

### 3. ✅ Request Body Format Changed
- **Before**: `{"model": "eu-law-rag", "messages": [{"role": "user", "content": "..."}]}`
- **After**: `{"content": "..."}` (simple format)
- **Location**: `src/lib/api/client.ts` - ChatAPIClient.sendMessage()

### 4. ✅ Conversation Management
- Added `getOrCreateConversation()` method to create/retrieve conversations
- Conversations are now managed on the backend
- **Location**: `src/lib/api/client.ts` - ChatAPIClient class

### 5. ✅ Removed tenant_id and Email
- Removed `tenant_id` from `src/types/auth.ts`
- Email `mfassetmgmt@gmail.com` was not in codebase (only in localStorage)
- **Note**: User must clear browser localStorage to remove old data

## How to Test

### Step 1: Clear Browser Data
1. Open DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Clear all items (or manually remove: `api_key`, `user`, `jwt_token`, etc.)

### Step 2: Login
The login page is currently disabled (auto-redirects to chat). To enable login:

1. Update `src/app/login/page.tsx` to use username/password form
2. Update `src/contexts/AuthContext.tsx` to remove auto-login
3. Use credentials:
   - Username: `michael`
   - Password: `IUsedToBeAStrongPass__`

### Step 3: Test Chat
1. Navigate to `/chat`
2. Ask a question (e.g., "What is Article 50 TEU?")
3. Check Network tab - should see:
   - `POST /api/v1/conversations/{id}/messages`
   - Headers: `Authorization: Bearer <JWT>`
   - Body: `{"content": "..."}`

## API Flow

1. **Login**: `POST /api/v1/auth/login` with `{username, password}`
   - Returns JWT token
   - Store in `localStorage` as `jwt_token`

2. **Get/Create Conversation**: `POST /api/v1/conversations` or `GET /api/v1/conversations/{id}`
   - Creates new conversation or retrieves existing one
   - Returns conversation ID

3. **Send Message**: `POST /api/v1/conversations/{conversation_id}/messages`
   - Body: `{"content": "..."}`
   - Headers: `Authorization: Bearer <JWT>`
   - Returns: `{user_message: {...}, assistant_message: {...}}`

## Response Format

The API now returns:
```json
{
  "user_message": {
    "id": "...",
    "role": "user",
    "content": "...",
    "created_at": "..."
  },
  "assistant_message": {
    "id": "...",
    "role": "assistant",
    "content": "...",
    "sources": [...],
    "created_at": "..."
  },
  "tracking_id": 31
}
```

We extract `assistant_message.content` for display.

## Next Steps

1. **Enable Login Page**: Update login form to use username/password
2. **Test on Vercel**: Deploy and verify environment variables
3. **Handle Token Refresh**: Implement JWT token refresh if needed
4. **Load Conversations from Backend**: Currently using localStorage, should load from `/api/v1/conversations`

## Notes

- The email `mfassetmgmt@gmail.com` and `tenant_id` were only in browser localStorage, not in code
- User should clear localStorage to remove old data
- Login page is currently disabled - needs to be updated to use username/password
- All API calls now use JWT Bearer token authentication

