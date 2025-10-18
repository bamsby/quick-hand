# Notion OAuth Setup Guide

This guide walks you through setting up Notion OAuth integration for QuickHand.

## Prerequisites

- Notion account
- Supabase project (already configured)
- Access to your Notion workspace

## Step 1: Register Notion OAuth Application

1. Go to https://www.notion.so/profile/integrations
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name:** QuickHand
   - **Associated workspace:** Select your workspace
   - **Type:** Select **"Public"** (for OAuth)
4. Under **"Capabilities"**, ensure these are enabled:
   - Read content
   - Update content
   - Insert content
5. Under **"OAuth Domain & URIs"**:
   - **Redirect URIs:** Add both:
     - `quickhand://oauth/notion` (for mobile)
     - `http://localhost:8081/oauth/notion` (for Expo dev)
6. Click **"Submit"**
7. Copy your **OAuth client ID** and **OAuth client secret**

## Step 2: Configure Environment Variables

### Local Development (.env file)

Create a `.env` file in the project root (if it doesn't exist):

```bash
# Supabase Configuration (already set)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Notion OAuth Client ID (public, safe to expose)
EXPO_PUBLIC_NOTION_CLIENT_ID=your-notion-oauth-client-id-here

# OAuth Redirect URI
EXPO_PUBLIC_OAUTH_REDIRECT_URI=quickhand://oauth/notion
```

### Supabase Edge Function Secrets

Set these secrets in your Supabase project (server-side only):

1. Go to your Supabase Dashboard
2. Navigate to **Settings → Edge Functions → Secrets**
3. Add these secrets:

```bash
NOTION_CLIENT_ID=your-notion-oauth-client-id-here
NOTION_CLIENT_SECRET=your-notion-oauth-client-secret-here
```

## Step 3: Apply Database Migration

Run the migration to create the `user_integrations` table:

```powershell
# Start Supabase locally (if not already running)
npx supabase start

# Apply the migration
npx supabase db push
```

Or if using Supabase hosted:

```powershell
npx supabase db push --linked
```

## Step 4: Deploy Edge Functions

Deploy the three Notion-related Edge Functions:

```powershell
# Deploy all functions at once
npx supabase functions deploy notion-auth-status
npx supabase functions deploy notion-oauth-callback
npx supabase functions deploy notion-create-page
```

## Step 5: Enable Anonymous Authentication

Anonymous auth should already be enabled from the migration, but verify in Supabase:

1. Go to **Authentication → Providers**
2. Ensure **"Anonymous sign-ins"** is enabled
3. Check **Authentication → Settings → Anonymous Sign-ins** is ON

## Step 6: Test the Integration

1. Start the Expo dev server:
   ```powershell
   npm start
   ```

2. Open the app on a device or emulator

3. In chat, ask to save something to Notion:
   ```
   "Save this note: Meeting notes from today's standup"
   ```

4. Tap **"Save to Notion"** action button

5. You should see the connection modal

6. Tap **"Connect Notion"** → Browser opens for OAuth

7. Authorize QuickHand in your Notion workspace

8. You'll be redirected back to the app

9. The confirmation modal should appear → Create the page

10. Check your Notion workspace for the new page!

## Troubleshooting

### "OAuth not configured" error
- Make sure `EXPO_PUBLIC_NOTION_CLIENT_ID` is set in `.env`
- Restart the Expo dev server after changing `.env`

### "Failed to connect to Notion"
- Check that Edge Function secrets are set correctly
- Verify redirect URIs match in Notion integration settings
- Check Supabase Edge Function logs: `npx supabase functions logs`

### Deep linking not working
- Ensure `scheme: "quickhand"` is in `app.json`
- On Android, you may need to rebuild: `npx expo run:android`
- On iOS with Expo Go, deep links work automatically

### "Notion not connected" error
- Check if `user_integrations` table exists: `npx supabase db diff`
- Verify RLS policies are enabled
- Check browser console and app logs for errors

### Token exchange fails
- Verify `NOTION_CLIENT_SECRET` is correct in Supabase secrets
- Check that redirect URI matches exactly (including trailing slashes)
- Review Notion integration settings for correct OAuth configuration

## Notes

- **Anonymous users:** Each device gets a unique user ID. Clearing app data creates a new user.
- **Token persistence:** Notion tokens don't expire unless revoked by the user.
- **Workspace permissions:** Users grant access to specific pages during OAuth flow.
- **Multiple workspaces:** Users can only connect one workspace per device (for MVP).

## Security Considerations

✅ **Client secret stays server-side** - Never exposed to the app bundle  
✅ **RLS policies protect tokens** - Users can only access their own integrations  
✅ **OAuth flow is secure** - Standard OAuth 2.0 authorization code flow  
✅ **Tokens encrypted at rest** - Stored securely in Supabase PostgreSQL  

## Next Steps

After Notion OAuth is working:

1. Add Gmail OAuth integration (similar pattern)
2. Implement token refresh logic (if needed)
3. Add workspace selector (if supporting multiple workspaces)
4. Add integration management screen (view/revoke connections)
5. Handle token revocation gracefully

## Resources

- [Notion OAuth Documentation](https://developers.notion.com/docs/authorization)
- [Expo AuthSession Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)

