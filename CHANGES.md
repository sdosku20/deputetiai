# Changes Made to Deputeti Frontend

This document summarizes the changes made to adapt the frontend for Deputeti AI.

## Major Changes

### 1. API Client (`src/lib/api/client.ts`)
- **Removed**: JWT-based authentication with token refresh
- **Added**: OpenAI-compatible chat API client using `/v1/chat/completions`
- **Changed**: Authentication uses `X-API-Key` header instead of `Authorization: Bearer`
- **Changed**: API base URL now points to `https://asistenti.deputeti.ai`
- **Added**: Client-side session management using localStorage
- **Changed**: Chat responses follow OpenAI format with `choices[0].message.content`

### 2. Authentication (`src/contexts/AuthContext.tsx`)
- **Simplified**: Removed JWT token management, refresh tokens, and cookie handling
- **Added**: Simple API key storage in localStorage
- **Changed**: Login function now accepts API key and optional email
- **Removed**: Token refresh logic and backend auth endpoints

### 3. Login Page (`src/app/login/page.tsx`)
- **Changed**: Now accepts API key instead of email/password
- **Changed**: Email field is optional
- **Changed**: Branding updated to "Deputeti AI"
- **Removed**: Backend warm-up logic and redirect destination checks

### 4. Home Page (`src/app/page.tsx`)
- **Changed**: Simplified to client-side redirect based on authentication state
- **Removed**: Server-side token checking and redirect destination API calls

### 5. Chat Hooks
- **`useAgentSession.ts`**: Updated to work with new OpenAI-compatible API
- **`useConversationSessions.ts`**: Updated to use localStorage-based sessions

### 6. Package Configuration
- **Updated**: Package name to `deputeti-frontend`

## Environment Variables

Create `.env.local` with:
```env
NEXT_PUBLIC_API_URL=https://asistenti.deputeti.ai
NEXT_PUBLIC_CHAT_MODEL=eu-law-rag
```

## API Configuration

- **Endpoint**: `https://asistenti.deputeti.ai/v1/chat/completions`
- **Model**: `eu-law-rag`
- **Auth Header**: `X-API-Key: sk-...`
- **Format**: OpenAI-compatible request/response

## Authentication Flow

1. User enters API key on login page
2. API key stored in localStorage
3. All API requests include `X-API-Key` header
4. No backend authentication endpoints needed
5. Sessions stored client-side in localStorage

## Removed Features

- JWT token management
- Token refresh mechanism
- Backend auth endpoints (`/auth/login`, `/auth/me`, etc.)
- Cookie-based authentication
- Server-side authentication checks
- Dashboard redirect logic

## Notes

- The tenant context and dashboard features are still present but may not be fully functional without backend support
- All conversations are stored client-side only
- API key is required for all chat requests
- The UI maintains the same design as the original frontend

