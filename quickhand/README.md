# QuickHand Mobile AI Agent

A **mobile-first, role-aware AI agent** built with Expo (React Native + TypeScript) that helps non-technical users complete small digital tasks fast.

## 🚀 Quickstart

```powershell
# Install dependencies (already done)
npm install

# Set up environment variables
# Create .env manually and add your API keys
# See "Environment Setup" section below

# Start development server
npm start

# Run on specific platforms
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS only)
npm run web        # Web browser
```

## 📁 Project Structure

```
/app                      # Expo Router screens
  _layout.tsx            # Root layout with splash screen integration
  index.tsx              # Role selector screen
  chat.tsx               # Chat interface
/lib
  api.ts                 # API stubs (runAgent, exaSearch, notionCreatePage, gmailCreateDraft)
  roles.ts               # Role presets (system prompts for Founder/Student/Teacher/Creator/General)
  types.ts               # TypeScript types (Message, RoleKey, PlanStep)
  use-app-launch.ts      # App initialization hook (preloads role presets)
  /ui
    splash-screen.tsx    # Animated splash screen component
/assets
  logo.svg               # QuickHand logo (source file)
  README.md              # Asset generation instructions
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```bash
# Public variables (safe to bundle, use EXPO_PUBLIC_ prefix)
EXPO_PUBLIC_API_URL=http://localhost:3001

# Server-only secrets (NEVER use EXPO_PUBLIC_ prefix)
OPENAI_API_KEY=sk-...
EXA_API_KEY=...
SMITHERY_API_KEY=...
```

⚠️ **Security:** Never prefix secrets with `EXPO_PUBLIC_` or they'll be exposed in the app bundle.

## 🎯 Current Implementation Status

All integrations are **stubbed** for rapid prototyping:

- ✅ **App Launch:** Animated splash screen with role preset preloading
- ✅ Role selector (5 roles: Founder, Student, Teacher, Creator, General)
- ✅ Chat interface with message history
- 🚧 **Stubbed:** LLM agent (OpenAI/Gemini) - returns echo replies
- 🚧 **Stubbed:** Exa web search - returns mock results
- 🚧 **Stubbed:** Notion page creation via Smithery MCP
- 🚧 **Stubbed:** Gmail draft creation via Smithery MCP

**Next steps:** Migrate API stubs to backend (Node/Express or Supabase Edge Functions) and integrate real services.

### 🎨 App Launch Flow
1. User opens app → sees animated QuickHand splash screen (⚡👆)
2. App preloads role presets from `lib/roles.ts` (5 roles validated)
3. Minimum 1.5s splash duration ensures smooth UX
4. Transitions to role selector screen

**See** `assets/README.md` for logo asset generation instructions.

## 🧪 Manual Testing Checklist

- [x] **App launch:** Splash screen displays with animation
- [x] **Role presets:** 5 roles load successfully (check console logs)
- [ ] Role select works (tap each role pill)
- [ ] Chat displays messages and role-based responses
- [ ] Exa search returns mock citations
- [ ] Notion draft creates mock page link
- [ ] Gmail draft creates mock thread link
- [ ] Error states show friendly messages
- [ ] Loading indicators visible during operations

## 📦 Tech Stack

- **Framework:** Expo SDK ~54, React Native 0.81, React 19
- **Routing:** Expo Router v6
- **State:** @tanstack/react-query v5
- **Validation:** Zod v3
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
