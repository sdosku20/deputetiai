# Quick Start Guide

## 🎯 Get Your Boss a Testable URL in 5 Minutes

### Step 1: Push to GitHub (2 min)

```bash
cd deputeti-frontend
git init
git add .
git commit -m "Deputeti AI Chat Frontend"
```

Create a new repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/deputeti-ai.git
git push -u origin main
```

### Step 2: Deploy to Vercel (2 min)

1. Go to **https://vercel.com**
2. Click **"Sign Up"** → Use GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. **Environment Variables** (click "Environment Variables"):
   - `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
   - `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`
6. Click **"Deploy"**

### Step 3: Get Your URL (1 min)

Wait 2-3 minutes, then you'll get:
- ✅ **Your live URL**: `https://your-project.vercel.app`

### Step 4: Share with Boss!

Send them:
- **URL**: Your Vercel URL
- **API Key**: `sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`

## ✨ That's It!

Your boss can now:
1. Visit the URL
2. Enter the API key
3. Start chatting with the AI!

## 🔄 Making Updates?

Just push to GitHub - Vercel auto-deploys!

```bash
git add .
git commit -m "Update"
git push
```

## 🆘 Need Help?

See `DEPLOYMENT_SUMMARY.md` for more details.

