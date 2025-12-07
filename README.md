# Deputeti AI Frontend

A Next.js frontend for Deputeti AI chat interface, built on OpenAI-compatible API.

## Features

- **OpenAI-Compatible Chat API** - Uses `/v1/chat/completions` endpoint
- **API Key Authentication** - Simple API key-based authentication
- **Chat Interface** - Modern chat UI with conversation history
- **Session Management** - Client-side session management with localStorage

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://asistenti.deputeti.ai
NEXT_PUBLIC_CHAT_MODEL=eu-law-rag
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login

The login page accepts:
- **API Key**: Your Deputeti AI API key (starts with `sk-`)
- **Email** (Optional): Your email address

The API key is stored in localStorage for authentication.

### Build

Build for production:
```bash
npm run build
npm start
```

## Configuration

### API Configuration

- **API Base URL**: `https://asistenti.deputeti.ai`
- **Chat Endpoint**: `/v1/chat/completions`
- **Model**: `eu-law-rag`
- **Authentication**: X-API-Key header

### API Key Storage

API keys are stored in localStorage after login. To clear:
- Use the logout button, or
- Clear browser localStorage

## 🚀 FREE Deployment (No Domain Needed!)

### Want to show your boss? Deploy in 5 minutes!

**📖 See these guides:**
- **`QUICK_DEPLOY.md`** - Super fast 5-minute guide
- **`DEPLOY_STEPS.md`** - Detailed step-by-step with troubleshooting

### Quick Summary:

1. **Push code to GitHub** (free account needed)
2. **Deploy on Vercel** (free, no credit card)
3. **Get permanent URL** like `https://your-app.vercel.app`
4. **Share URL with boss!**

**Vercel is FREE forever and perfect for Next.js apps!**

## Project Structure

```
deputeti-frontend/
├── src/
│   ├── app/
│   │   ├── chat/          # Main chat interface
│   │   ├── login/         # API key login
│   │   └── page.tsx       # Home/redirect
│   ├── components/        # React components
│   ├── contexts/          # Auth context
│   ├── hooks/             # Chat hooks
│   └── lib/api/
│       └── client.ts      # OpenAI-compatible API client
```

## API Usage

The frontend uses an OpenAI-compatible chat API:

```typescript
POST https://asistenti.deputeti.ai/v1/chat/completions
Headers:
  X-API-Key: sk-...
  Content-Type: application/json
Body:
{
  "model": "eu-law-rag",
  "messages": [
    {"role": "user", "content": "Your question"}
  ]
}
```

## Notes

- Conversations are stored in localStorage (client-side only)
- No backend session management required
- API key is required for all requests
- Sessions persist across page refreshes

## License

Copyright © 2025 Deputeti AI. All rights reserved.

