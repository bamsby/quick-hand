# Notion OAuth - Quick Start Checklist

This is a quick reference guide to get Notion OAuth working. For detailed instructions, see `NOTION_OAUTH_SETUP.md`.

## ⚡ Quick Setup (5 minutes)

### 1. Register Notion OAuth App
- [ ] Go to https://www.notion.so/profile/integrations
- [ ] Click **"+ New integration"**
- [ ] Name: **QuickHand**, Type: **Public**
- [ ] Add redirect URIs:
  - `quickhand://oauth/notion`
  - `http://localhost:8081/oauth/notion`
- [ ] Copy **OAuth client ID** and **client secret**

### 2. Set Environment Variables

**Local .env file:**
```bash
EXPO_PUBLIC_NOTION_CLIENT_ID=your-notion-client-id-here
```

**Supabase Dashboard → Settings → Edge Functions → Secrets:**
```bash
NOTION_CLIENT_ID=your-notion-client-id-here
NOTION_CLIENT_SECRET=your-notion-client-secret-here
```

### 3. Deploy to Supabase

```powershell
# Apply database migration
npx supabase db push

# Deploy Edge Functions
npx supabase functions deploy notion-auth-status
npx supabase functions deploy notion-oauth-callback
npx supabase functions deploy notion-create-page
```

### 4. Test It!

```powershell
# Start the app
npm start

# In the app:
# 1. Type: "Save this note: Testing Notion integration"
# 2. Tap "Save to Notion"
# 3. Tap "Connect Notion"
# 4. Authorize in browser
# 5. Confirm page creation
# 6. Check Notion! 🎉
```

## 🔍 Troubleshooting

**Can't connect?**
- Restart Expo after adding env vars: `npm start --clear`
- Check redirect URIs match exactly in Notion settings

**"OAuth not configured"?**
- Verify `EXPO_PUBLIC_NOTION_CLIENT_ID` is in `.env`
- Check Supabase secrets are set correctly

**Deep linking not working?**
- Verify `scheme: "quickhand"` is in `app.json` (already done ✅)
- Try on a real device (deep links can be flaky in simulators)

**Edge Function errors?**
- Check logs: `npx supabase functions logs notion-create-page`
- Verify secrets: `npx supabase secrets list`

## 📚 Documentation

- **Setup Guide:** `NOTION_OAUTH_SETUP.md` (detailed instructions)
- **Implementation:** `NOTION_IMPLEMENTATION_SUMMARY.md` (what was built)
- **Architecture:** See plan file for system design

## ✅ Success Criteria

You'll know it works when:
- Connection modal appears first time
- Browser opens for OAuth
- App redirects back after auth
- Page appears in your Notion workspace
- "Connected to [Workspace]" toast shows
- Subsequent saves work without re-auth

## 🚀 Next: Gmail Integration

After Notion works, Gmail OAuth follows the same pattern:
1. Register Google OAuth app
2. Add credentials to env vars
3. Create similar Edge Functions
4. Test the flow

---

**Current Status:** ✅ Code Complete - Needs Configuration

**Time to Production:** ~5 minutes (just configuration)

