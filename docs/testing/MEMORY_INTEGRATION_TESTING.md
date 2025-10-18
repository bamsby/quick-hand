# Memory Integration Testing Guide

## Overview

This guide covers comprehensive testing of the mem0.ai memory integration in QuickHand using Playwright automation.

## 🎯 Test Objectives

The memory integration tests verify:

1. **Role-Specific Memory Isolation**: Founder conversations don't leak into Student conversations
2. **Cross-Session Persistence**: Memories survive browser restarts and new sessions  
3. **Memory Relevance**: Assistant naturally references previous conversations
4. **User Isolation**: Different authenticated users have separate memories
5. **Error Handling**: App works gracefully when memory service fails
6. **Action Integration**: Memory works with Notion and Gmail action suggestions

## 🧪 Test Scenarios

### 1. Role-Specific Memory Isolation

**Test**: `Role-specific memory isolation`

**Scenario**:
1. Start conversation as "Founder" about startup funding
2. Switch to "Student" role and ask about funding
3. Verify Student doesn't reference startup context
4. Switch back to Founder and ask follow-up
5. Verify Founder remembers the startup context

**Expected Results**:
- ✅ Student responses don't contain startup/business keywords
- ✅ Founder responses reference previous startup funding discussion
- ✅ Role switching maintains memory boundaries

### 2. Cross-Session Memory Persistence

**Test**: `Cross-session memory persistence`

**Scenario**:
1. Have conversation about electric vehicles as "Creator"
2. Close browser (simulates new session)
3. Open new session, same role
4. Ask to "save that research to Notion"
5. Verify it remembers the EV research

**Expected Results**:
- ✅ New session remembers previous EV research
- ✅ "Save to Notion" action references EV content
- ✅ Memory persists across browser restarts

### 3. Memory Relevance in Responses

**Test**: `Memory relevance in responses`

**Scenario**:
1. Start conversation about mobile app feedback
2. Ask follow-up about "performance issues mentioned"
3. Verify response references previous feedback context

**Expected Results**:
- ✅ Follow-up responses reference previous feedback discussion
- ✅ Context is natural and relevant
- ✅ No technical memory metadata exposed

### 4. Memory with Action Suggestions

**Test**: `Memory with action suggestions`

**Scenario**:
1. Create lesson plan about renewable energy
2. Ask to save lesson plan to Notion
3. Verify response references lesson content
4. Check that Notion action button appears

**Expected Results**:
- ✅ Response references renewable energy lesson content
- ✅ "Save to Notion" action button appears
- ✅ Action parameters include lesson content

### 5. Memory with Email Drafting

**Test**: `Memory with email drafting`

**Scenario**:
1. Research real estate trends in San Francisco
2. Ask to draft email about trends
3. Verify email references San Francisco research
4. Check that email action button appears

**Expected Results**:
- ✅ Email draft references San Francisco research
- ✅ "Draft Email" action button appears
- ✅ Email content includes relevant research data

### 6. Memory Context Integration

**Test**: `Memory context in system prompts`

**Scenario**:
1. Have conversation about artificial intelligence
2. Ask follow-up about applications
3. Verify response naturally references AI context

**Expected Results**:
- ✅ Response references AI without explicit "previous conversation" mentions
- ✅ Context feels natural and conversational
- ✅ No technical memory implementation details exposed

### 7. Error Handling

**Test**: `Error handling when memory fails`

**Scenario**:
1. Simulate memory service failure
2. Have normal conversation
3. Verify app continues working

**Expected Results**:
- ✅ App continues working without memory
- ✅ No crashes or errors
- ✅ Graceful degradation

## 🔧 Test Setup

### Prerequisites

1. **Environment Variables**:
   ```bash
   MEM0_API_KEY=your_mem0_api_key  # Set in Supabase Edge Function secrets
   OPENAI_API_KEY=sk-your_openai_key
   EXA_API_KEY=your_exa_api_key  # Optional
   ```

2. **App Running**:
   ```bash
   npm start  # Should run on http://localhost:8081
   ```

3. **Playwright Installed**:
   ```bash
   npm install @playwright/test
   npx playwright install
   ```

### Running Tests

#### All Memory Tests
```bash
npm run test:memory
```

#### Interactive UI Mode
```bash
npm run test:memory:ui
```

#### Debug Mode
```bash
npm run test:memory:debug
```

#### Headed Mode (see browser)
```bash
npm run test:memory:headed
```

#### Windows PowerShell
```powershell
.\scripts\test-memory.ps1
```

## 📊 Test Results Analysis

### ✅ Passing Tests

Tests pass when:
- mem0.ai API is accessible and working
- Supabase Edge Functions are deployed
- User authentication is working
- App is running on localhost:8081
- All environment variables are set

### ❌ Common Failures

#### Memory Not Persisting
**Symptoms**: Tests fail with "memory not found" errors
**Causes**:
- MEM0_API_KEY not set or incorrect
- mem0.ai API not accessible
- Supabase Edge Function not deployed

**Solutions**:
```bash
# Check Edge Function logs
npx supabase functions logs plan

# Test mem0.ai API directly
curl -X POST https://api.mem0.ai/v1/memories \
  -H "Authorization: Bearer YOUR_MEM0_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","agent_id":"founder","messages":[{"role":"user","content":"test"}]}'
```

#### Role Isolation Failing
**Symptoms**: Student role references Founder context
**Causes**:
- User authentication not working
- Role not being passed correctly to mem0.ai
- Memory search not filtering by role

**Solutions**:
- Verify user authentication in Edge Function
- Check that role parameter is passed to mem0.ai
- Ensure mem0.ai is using correct user_id and agent_id

#### Tests Timing Out
**Symptoms**: Tests fail with timeout errors
**Causes**:
- App not running on correct port
- Network connectivity issues
- API responses too slow

**Solutions**:
```bash
# Check if app is running
curl http://localhost:8081

# Restart Expo
npm start --clear

# Check network connectivity
ping api.mem0.ai
```

## 🐛 Debugging Tests

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

### Check Browser Console
```bash
npx playwright test --headed --debug
```

## 📈 Performance Testing

### Memory Response Times
- Memory search: < 2 seconds
- Memory storage: < 1 second
- Total conversation time: < 15 seconds

### Memory Limits
- Maximum 5 memories retrieved per query
- Memory context limited to prevent token overflow
- Graceful handling of memory API failures

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Memory Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install
      - run: npm start &
      - run: npm run test:memory
```

## 📝 Test Data Management

### Test Conversations
- Use realistic conversation topics
- Include both short and long messages
- Test edge cases (empty messages, very long conversations)
- Verify role-specific language patterns

### Memory Validation
- Check that memories are stored with correct metadata
- Verify role isolation in memory storage
- Test memory retrieval relevance
- Validate memory cleanup (if implemented)

## 🚀 Production Readiness

### Pre-Production Checklist
- [ ] All memory integration tests passing
- [ ] Role isolation verified
- [ ] Cross-session persistence confirmed
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] Memory API rate limits understood
- [ ] User privacy considerations addressed

### Monitoring
- Track memory API response times
- Monitor memory storage success rates
- Alert on memory service failures
- Log memory-related errors

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [mem0.ai API Documentation](https://docs.mem0.ai/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Web Testing](https://docs.expo.dev/workflow/web/)

## 🤝 Contributing

When adding new memory tests:

1. Follow existing test structure
2. Use descriptive test names
3. Include both positive and negative cases
4. Test edge cases and error scenarios
5. Update this documentation
6. Ensure tests are deterministic and reliable
