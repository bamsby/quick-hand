# QuickHand Setup Guide

This guide will help you set up the QuickHand project with Supabase Edge Functions for chat interaction with OpenAI and Exa integration.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key
- Exa API key (optional, for web search)

## Step 1: Install Dependencies

```powershell
npm install
```

## Step 2: Environment Variables

1. Create a `.env` file in the project root:

```powershell
# Copy the example file
copy .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Never commit `.env` to git. It's already in `.gitignore`.

## Step 3: Set Up Supabase Project

### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization, enter project name, database password, and region
4. Wait for project to be created (~2 minutes)
5. Copy your project URL and anon key from Settings > API

### 3.2 Install Supabase CLI

```powershell
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### 3.3 Link Your Project

```powershell
# Initialize Supabase in your project (already done, but run if needed)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref
```

You'll be prompted for your database password (the one you set when creating the project).

### 3.4 Set Secrets

Set your API keys as Supabase secrets (these are server-side only and never exposed):

```powershell
# Set OpenAI API key (REQUIRED)
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here

# Set Exa API key (optional, for web search)
supabase secrets set EXA_API_KEY=your-exa-key-here
```

## Step 4: Deploy Edge Function

Deploy the `plan` edge function to Supabase:

```powershell
# Deploy the function
supabase functions deploy plan

# Verify deployment
supabase functions list
```

You should see `plan` in the list of deployed functions.

## Step 5: Run the App

```powershell
# Start Expo development server
npm start

# Or run directly on platform
npm run android  # Android emulator/device
npm run ios      # iOS simulator (macOS only)
npm run web      # Web browser
```

## Step 6: Test Chat Interaction

1. Launch the app
2. Select a role (e.g., "General")
3. Type a query like:
   - "What is React Native?"
   - "Summarize the latest AI hackathon prizes" (triggers web search)
   - "Create a summary and save to Notion" (triggers action plan)
4. Observe:
   - Loading indicator while processing
   - Response with inline citations `[1]`, `[2]` if web search was used
   - Expandable "Sources" section with citation cards
   - "Proposed Actions" section with confirmation buttons (if applicable)

## Troubleshooting

### Edge Function Not Found

If you get a "Function not found" error:

```powershell
# Check function deployment
supabase functions list

# Redeploy if needed
supabase functions deploy plan
```

### Secrets Not Set

If OpenAI returns authentication errors:

```powershell
# List current secrets
supabase secrets list

# Set missing secrets
supabase secrets set OPENAI_API_KEY=sk-your-key
```

### CORS Errors

The edge function includes CORS headers for all origins (`*`). If you still get CORS errors:
- Check that you're using the correct Supabase URL in `.env`
- Verify the anon key is correct
- Try restarting the Expo dev server

### Network Errors

If you get "Couldn't reach the server" errors:
- Check your internet connection
- Verify Supabase project is active (not paused)
- Check API keys are valid
- Review edge function logs: `supabase functions logs plan`

## Local Development with Supabase

You can run Supabase locally for faster iteration:

```powershell
# Start local Supabase
supabase start

# This will start:
# - PostgreSQL database
# - Edge Functions runtime
# - Studio UI (http://localhost:54323)
```

Update your `.env` to use local Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

When developing locally, set environment variables in `supabase/.env.local`:

```env
OPENAI_API_KEY=sk-your-key
EXA_API_KEY=your-exa-key
```

## Connecting Supabase MCP to Cursor

To use Supabase MCP features in Cursor (database operations, auth management):

1. Open Cursor Settings (Ctrl+Shift+P → "Open Settings")
2. Search for "MCP" or "Model Context Protocol"
3. Add Supabase MCP server configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project-ref.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key"
      }
    }
  }
}
```

**Note:** Use service role key (not anon key) for MCP. Find it in Supabase Dashboard → Settings → API.

## Next Steps

- Implement Notion integration via Smithery MCP
- Implement Gmail draft creation via Smithery MCP
- Add voice input/output
- Persist message history in Supabase database
- Add user authentication

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Exa API Docs](https://docs.exa.ai/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)

