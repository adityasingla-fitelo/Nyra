# 🚀 Quick Start Guide

## Step-by-Step Deployment

### 1️⃣ Prerequisites (5 minutes)

✅ Install Node.js (v18 or higher): https://nodejs.org
✅ Create Supabase account: https://supabase.com
✅ Create OpenAI account: https://platform.openai.com

### 2️⃣ Set Up Supabase Database (10 minutes)

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose a name and password

2. **Run Database Schema**
   - Go to SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Paste and click "Run"

3. **Get API Keys**
   - Go to Project Settings > API
   - Copy `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Enable Google Authentication**
   - Go to Authentication > Providers
   - Click on Google provider
   - Toggle "Enable"
   - **Get Google OAuth Credentials:**
     a. Go to https://console.cloud.google.com
     b. Create a new project (or select existing)
     c. Go to "APIs & Services" > "Credentials"
     d. Click "Create Credentials" > "OAuth 2.0 Client ID"
     e. Set application type to "Web application"
     f. Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
     g. Copy Client ID and Client Secret
   - Paste Client ID and Secret in Supabase Google provider settings
   - Save

### 3️⃣ Get OpenAI API Key (5 minutes)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. **Important:** Add billing information in OpenAI dashboard (required for API access)

### 4️⃣ Local Setup (3 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Edit .env.local with your keys
# Use your favorite text editor (VS Code, nano, vim, etc.)
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc.....
OPENAI_API_KEY=sk-proj-....
```

```bash
# 4. Run the app
npm run dev
```

🎉 Open http://localhost:3000

### 5️⃣ Deploy to Vercel (5 minutes)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`
   - Click "Deploy"

3. **Update Google OAuth**
   - Copy your Vercel deployment URL
   - Go to Google Cloud Console > Credentials
   - Add new authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - Add authorized origin: `https://YOUR-APP.vercel.app`

✅ Done! Your app is live!

---

## 🔍 Verification Checklist

Before deploying, verify:

- [ ] Database schema is created (check Supabase SQL Editor)
- [ ] Google OAuth is enabled in Supabase
- [ ] Environment variables are set correctly
- [ ] OpenAI has billing enabled
- [ ] App runs locally (`npm run dev` works)
- [ ] You can sign in with Google
- [ ] Chat responses are working

---

## ⚠️ Common Issues

**"Invalid redirect URL" error**
- Check Google OAuth redirect URL exactly matches Supabase callback URL
- Format: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

**OpenAI API errors**
- Ensure API key is correct
- Verify billing is enabled on OpenAI account
- Check if you have credits/payment method

**Can't connect to Supabase**
- Verify environment variables are set
- Check Supabase URL doesn't have trailing slash
- Ensure RLS policies are created (run schema again)

**Dark mode not working**
- Clear browser cache
- Check if localStorage is enabled
- Try incognito/private window

---

## 📊 Monitoring

Once deployed, monitor:

1. **Supabase Dashboard**
   - Database usage
   - API requests
   - Authentication logs

2. **OpenAI Dashboard**
   - API usage
   - Token consumption
   - Costs

3. **Vercel Dashboard**
   - Function executions
   - Bandwidth
   - Error logs

---

## 🎯 Next Steps

After deployment:

1. **Customize Branding**
   - Update avatar image in `src/app/page.tsx`
   - Change colors in `src/app/globals.css`
   - Update app name in `src/app/layout.tsx`

2. **Improve AI**
   - Modify system prompt in `src/app/api/chat/route.ts`
   - Add more intent types
   - Adjust temperature and max_tokens

3. **Add Features**
   - Image analysis
   - Voice input
   - Export chat history
   - Calendar integrations

---

## 💬 Support

Need help?
- Check README.md for detailed documentation
- Review Supabase docs: https://supabase.com/docs
- Check Next.js docs: https://nextjs.org/docs
- OpenAI docs: https://platform.openai.com/docs
