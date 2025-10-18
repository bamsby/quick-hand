# Memory Integration Testing with Playwright

This directory contains automated tests for the mem0.ai memory integration in QuickHand.

## Test Overview

The tests verify that:
- **Role-specific memory isolation**: Founder conversations don't leak into Student conversations
- **Cross-session persistence**: Memories survive browser restarts
- **Memory relevance**: Assistant references previous conversations naturally
- **User isolation**: Different users have separate memories
- **Error handling**: App works even when memory service fails

## Setup

### Prerequisites

1. **Install Playwright**:
   ```bash
   npm install
   npx playwright install
   ```

2. **Set up environment**:
   - Ensure your Supabase project has `MEM0_API_KEY` set in Edge Function secrets
   - Make sure your app is running on `http://localhost:8081`

3. **Start the app**:
   ```bash
   npm start
   # In another terminal, run tests
   npm run test:memory
   ```

## Running Tests

### All Memory Tests
```bash
npm run test:memory
```

### Interactive UI Mode
```bash
npm run test:memory:ui
```

### Debug Mode (step through tests)
```bash
npm run test:memory:debug
```

### Headed Mode (see browser)
```bash
npm run test:memory:headed
```

## Test Scenarios

### 1. Role-Specific Memory Isolation
- **Test**: `Role-specific memory isolation`
- **What it does**: 
  - Has a conversation as "Founder" about startup funding
  - Switches to "Student" role and asks about funding
  - Verifies Student doesn't reference startup context
  - Switches back to Founder and asks follow-up
  - Verifies Founder remembers the startup context

### 2. Cross-Session Memory Persistence
- **Test**: `Cross-session memory persistence`
- **What it does**:
  - Has a conversation about electric vehicles as "Creator"
  - Closes browser (simulates new session)
  - Opens new session, same role
  - Asks to "save that research to Notion"
  - Verifies it remembers the EV research

### 3. Memory Relevance in Responses
- **Test**: `Memory relevance in responses`
- **What it does**:
  - Starts conversation about mobile app feedback
  - Asks follow-up about "performance issues mentioned"
  - Verifies response references previous feedback context

### 4. Memory with Action Suggestions
- **Test**: `Memory with action suggestions`
- **What it does**:
  - Creates lesson plan about renewable energy
  - Asks to save lesson plan to Notion
  - Verifies response references lesson content
  - Checks that Notion action button appears

### 5. Memory with Email Drafting
- **Test**: `Memory with email drafting`
- **What it does**:
  - Researches real estate trends in San Francisco
  - Asks to draft email about trends
  - Verifies email references San Francisco research
  - Checks that email action button appears

### 6. Memory Context Integration
- **Test**: `Memory context in system prompts`
- **What it does**:
  - Tests that memories are injected naturally
  - Verifies no technical memory metadata is exposed
  - Ensures responses feel natural and contextual

### 7. Error Handling
- **Test**: `Error handling when memory fails`
- **What it does**:
  - Simulates memory service failure
  - Verifies app continues working normally
  - Ensures graceful degradation

## Test Data Requirements

### Required Environment Variables
- `MEM0_API_KEY`: Your mem0.ai API key (set in Supabase Edge Function secrets)
- `OPENAI_API_KEY`: Your OpenAI API key
- `EXA_API_KEY`: Your Exa API key (optional, for web search)

### Test User Setup
The tests assume the app works without authentication for simplicity. In production, you may need to:
1. Set up test user accounts
2. Handle authentication in test setup
3. Use different user IDs for isolation testing

## Debugging Tests

### View Test Results
```bash
npx playwright show-report
```

### Debug Specific Test
```bash
npx playwright test tests/memory-integration.spec.ts --grep "Role-specific memory isolation" --debug
```

### Run Single Test File
```bash
npx playwright test tests/memory-integration.spec.ts
```

## Test Configuration

### Browser Support
Tests run on:
- Chromium (Desktop)
- Firefox (Desktop) 
- WebKit (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Timeouts
- Default timeout: 15 seconds for API responses
- App startup timeout: 2 minutes
- Network idle timeout: 10 seconds

## Expected Test Results

### ✅ Passing Tests
All tests should pass when:
- mem0.ai API is working
- Supabase Edge Functions are deployed
- App is running on localhost:8081
- All environment variables are set

### ❌ Common Failures

1. **Memory not persisting**:
   - Check MEM0_API_KEY is set correctly
   - Verify mem0.ai API is accessible
   - Check Supabase Edge Function logs

2. **Role isolation failing**:
   - Verify user authentication is working
   - Check that role is being passed correctly
   - Ensure mem0.ai is using correct user_id and agent_id

3. **Tests timing out**:
   - Check if app is running on correct port
   - Verify Expo web server is accessible
   - Check network connectivity

## Manual Testing Checklist

Before running automated tests, verify manually:

- [ ] App loads on http://localhost:8081
- [ ] Role selector works (Founder, Student, Creator, etc.)
- [ ] Chat interface responds to messages
- [ ] Action buttons appear (Save to Notion, Draft Email)
- [ ] Supabase authentication works
- [ ] Edge functions are deployed and accessible

## Troubleshooting

### Test Setup Issues
```bash
# Reinstall Playwright
npx playwright install

# Clear test cache
rm -rf playwright/.cache

# Reset test state
rm -rf playwright/.auth
```

### Memory Integration Issues
```bash
# Check Edge Function logs
npx supabase functions logs plan

# Test mem0.ai API directly
curl -X POST https://api.mem0.ai/v1/memories \
  -H "Authorization: Bearer YOUR_MEM0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","agent_id":"founder","messages":[{"role":"user","content":"test"}]}'
```

### App Issues
```bash
# Restart Expo
npm start --clear

# Check Expo logs
npx expo start --web --verbose
```

## Contributing

When adding new memory tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Test edge cases (empty messages, very long conversations)
5. Verify error handling scenarios
6. Update this README with new test descriptions
