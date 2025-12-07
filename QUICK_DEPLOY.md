# ⚡ SUPER QUICK: Deploy in 5 Minutes!

## The Fastest Way (Copy-Paste Commands)

### 1. Open Terminal in Your Project Folder

Press `Win + R`, type `cmd`, press Enter, then:

```bash
cd "C:\Users\User\Documents\SHFA-AI\Frontend\deputeti-frontend"
```

### 2. Push to GitHub (3 minutes)

**A. Create repo on GitHub:**
- Go to https://github.com/new
- Name: `deputeti-ai`
- Make it **Public**
- Click "Create repository"

**B. Push your code:**

```bash
git init
git add .
git commit -m "Deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/deputeti-ai.git
git push -u origin main
```

*(Replace YOUR_USERNAME with your GitHub username)*

### 3. Deploy on Vercel (2 minutes)

**A. Go to Vercel:**
- https://vercel.com
- Sign up with GitHub

**B. Import project:**
- Click "Add New..." → "Project"
- Find `deputeti-ai` → Click "Import"

**C. Add environment variables:**
- Click "Environment Variables"
- Add:
  1. `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
  2. `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`

**D. Deploy:**
- Click "Deploy"
- Wait 2 minutes
- **Copy your URL!** (like `https://deputeti-ai-xyz.vercel.app`)

### 4. Test & Share!

- Open your URL
- Login with API key: `sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`
- If it works → Share URL with boss! 🎉

---

**That's it! You now have a permanent FREE URL!**

For detailed steps with screenshots, see `DEPLOY_STEPS.md`

