# QuickHand Mobile AI Agent

A **mobile-first, role-aware AI agent** built with Expo (React Native + TypeScript) that helps non-technical users complete small digital tasks fast.

## 🚀 Quickstart

```powershell
# Install dependencies
npm install

# Set up Supabase and deploy edge function
# See SETUP_GUIDE.md for detailed instructions

# Start development server
npm start

# Run on specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

**First time setup?** Follow the [Setup Guide](./SETUP_GUIDE.md) for complete instructions.

## 📁 Project Structure

```
/app                      # Expo Router screens
  _layout.tsx            # Root layout with splash screen integration
  index.tsx              # Role selector screen
  chat.tsx               # Chat interface with citations & action confirmations
/lib
  api.ts                 # API client (runAgent calls Supabase Edge Function)
  supabase.ts            # Supabase client singleton
  roles.ts               # Role presets (system prompts for 7 roles)
  types.ts               # TypeScript types (Message, Citation, ActionPlan, etc.)
  use-app-launch.ts      # App initialization hook (preloads role presets)
  /ui
    splash-screen.tsx    # Animated splash screen component
/supabase
  /functions
    /plan
      index.ts           # Edge function: OpenAI + Exa integration
    deno.json            # Deno config for edge functions
  config.toml            # Supabase project configuration
/assets
  logo.svg               # QuickHand logo (source file)
  README.md              # Asset generation instructions
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```bash
# Client-side (safe to expose in app bundle)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Server-side secrets** (set via Supabase CLI):
```powershell
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set EXA_API_KEY=...
```

⚠️ **Security:** API keys live on Supabase servers only, never exposed to the app bundle.

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup instructions.

## 🎯 Current Implementation Status

### ✅ Fully Implemented

- **App Launch:** Animated splash screen with role preset preloading
- **Role selector:** 7 roles (Founder, Student, Teacher, Creator, Property Agent, Product Manager, General)
- **Chat with AI:** Full OpenAI GPT-4o-mini integration via Supabase Edge Function
- **Web Search:** Exa API integration for grounded answers with citations
- **Citations UI:** Inline `[1]`, `[2]` citations with expandable source cards
- **Action Proposals:** AI suggests actions (Save to Notion, Draft in Gmail) with checkpoint confirmation
- **Loading States:** Smooth loading indicators and disabled states

### 🚧 Partially Implemented (Stubbed)

- **Notion Integration:** Action button ready, needs Smithery MCP connection
- **Gmail Integration:** Action button ready, needs Smithery MCP connection

### 🔄 Chat Interaction Flow

1. User types query → sent to Supabase Edge Function
2. Edge function analyzes intent, calls Exa API if web search needed
3. OpenAI generates response with inline citations `[1]`, `[2]`
4. Response includes action plan (e.g., "Save to Notion") if applicable
5. User sees:
   - AI response with citations
   - Expandable "Sources" section (tap to open URL)
   - "Proposed Actions" with confirmation buttons
6. User taps action button → executes (currently stubbed)

**Next steps:** Complete Smithery MCP integration for Notion & Gmail actions.

### 🎨 App Launch Flow
1. User opens app → sees animated QuickHand splash screen (⚡👆)
2. App preloads role presets from `lib/roles.ts` (7 roles validated)
3. Minimum 1.5s splash duration ensures smooth UX
4. Transitions to role selector screen

**See** `assets/README.md` for logo asset generation instructions.

## 🧪 Manual Testing Checklist

- [x] **App launch:** Splash screen displays with animation
- [x] **Role presets:** 7 roles load successfully (check console logs)
- [x] **Role select:** Tap each role pill, chat screen opens with correct system prompt
- [x] **Chat interaction:** Messages display correctly, OpenAI responds
- [x] **Web search:** Queries like "latest AI hackathon prizes" trigger Exa search
- [x] **Citations:** Inline `[1]`, `[2]` displayed, sources expandable, tap to open URL
- [x] **Action proposals:** Actions suggested (e.g., "Save to Notion") with confirmation UI
- [x] **Loading states:** Typing indicator, disabled input, button spinners work
- [x] **Error handling:** Network failures show friendly "Couldn't reach the server" message
- [ ] **Notion action:** Execute "Save to Notion" button (stubbed, returns mock URL)
- [ ] **Gmail action:** Execute "Draft in Gmail" button (stubbed, returns mock URL)

## 📦 Tech Stack

- **Framework:** Expo SDK ~54, React Native 0.81, React 19
- **Routing:** Expo Router v6
- **State:** @tanstack/react-query v5
- **Validation:** Zod v3
- **Backend:** Supabase Edge Functions (Deno runtime)
- **AI:** OpenAI GPT-4o-mini
- **Search:** Exa API (web search with citations)
- **Database:** Supabase PostgreSQL (future: message history)
- **Language:** TypeScript 5.9
- **Platform:** Windows 10/11 (PowerShell)

## 🔨 Development Notes

- EAS Project ID: `bf67a839-7e9d-4e5b-987e-30eab0c17637`
- New Architecture: **Enabled** (see app.json)
- Target: Mobile-first, single-hand use
- See `.cursorrules` for full development guidelines

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [TanStack Query](https://tanstack.com/query/latest)
