# QuickHand - Quick Start

## 🎯 What Was Implemented

✅ **Full chat interaction with AI backend:**
- User types query → Supabase Edge Function processes → AI responds with citations
- OpenAI GPT-4o-mini integration
- Exa API for web search with citations
- Action proposals (Save to Notion, Draft in Gmail) with confirmation UI

✅ **User Authentication System:**
- Email/password sign-in and sign-up
- Persistent sessions using Expo SecureStore
- User profile display in chat header
- Integration status auto-loading (Notion/Gmail connections remembered)

## 🚀 Setup in 5 Minutes

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create new project, copy URL and anon key
3. Copy environment template and add your credentials:

```powershell
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_NOTION_CLIENT_ID=your-notion-client-id
EXPO_PUBLIC_GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
```

### 2. Install Supabase CLI & Set Secrets

```powershell
# Install CLI globally
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Set API keys (server-side only)
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase secrets set EXA_API_KEY=your-exa-key  # Optional
supabase secrets set NOTION_CLIENT_SECRET=your-notion-secret
supabase secrets set GMAIL_CLIENT_SECRET=your-gmail-secret
```

### 3. Deploy Edge Function

```powershell
# Deploy the plan function
supabase functions deploy plan

# Verify
supabase functions list
```

### 4. Run the App

```powershell
npm start
```

That's it! 🎉

## 📱 Test the App

### Authentication Flow
1. **First launch:** You'll see the sign-in/sign-up screen
2. **Sign up:** Create account with email/password
3. **Sign in:** Use existing credentials
4. **Session persistence:** App remembers you after restart

### Chat Testing
Try these queries:

1. **Simple question:** "What is React Native?"
2. **Web search (with citations):** "Summarize the latest AI hackathon prizes"
3. **Action trigger:** "Create a summary and save to Notion"

You should see:
- User email in chat header
- Integration status badges (✓ Notion, ✓ Gmail)
- AI responses in chat bubbles
- Citations `[1]`, `[2]` with expandable sources
- Action buttons for Notion/Gmail (currently stubbed)
- Sign out button in header

## 🐛 Common Issues

**"Couldn't reach the server"**
- Check Supabase URL and anon key in `.env`
- Verify edge function is deployed: `supabase functions list`
- Check secrets are set: `supabase secrets list`

**"Function not found"**
```powershell
supabase functions deploy plan
```

**"OpenAI authentication error"**
```powershell
supabase secrets set OPENAI_API_KEY=sk-your-actual-key
```

## 📖 Full Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup instructions
- [README.md](./README.md) - Project overview and architecture
- [.cursorrules](./.cursorrules) - Development guidelines

## 🔑 Required API Keys

1. **OpenAI API Key** (required)
   - Get from: https://platform.openai.com/api-keys
   - Set via: `supabase secrets set OPENAI_API_KEY=sk-...`

2. **Exa API Key** (optional, for web search)
   - Get from: https://exa.ai
   - Set via: `supabase secrets set EXA_API_KEY=...`

3. **Supabase Credentials** (required)
   - Get from: Project Settings → API in Supabase dashboard
   - Add to `.env` (client-side safe)

## 🎨 What's Next

- [ ] Connect Smithery MCP for real Notion integration
- [ ] Connect Smithery MCP for real Gmail integration
- [ ] Add voice input/output
- [ ] Persist chat history in Supabase database
- [x] Add user authentication ✅

## 💡 Tips

- Use `supabase functions logs plan` to debug edge function
- Test locally with `supabase start` for faster iteration
- Keep secrets secure - never commit `.env` or use `EXPO_PUBLIC_` for API keys

