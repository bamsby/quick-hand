# Search Bias Fix - Removing Context Pollution

## 🐛 Issue

**Query:** "Research about AI agents and save to Notion"

**Bad Response (Before Fix):**
```
AI agents, particularly in the context of Notion, are designed to 
enhance productivity...

Notion's new AI functionalities allow users to create agents...
```

**Problem:** The search results and AI response were biased toward Notion-specific content, even though the user just wanted general information about AI agents. The action phrase "save to Notion" was polluting the search query.

---

## 🔍 Root Cause

### The Search Pollution Chain:

1. **Full Query Used for Search:**
   - Query: "Research about AI agents **and save to Notion**"
   - Exa search received: "Research about AI agents **and save to Notion**"
   - Search results: Biased toward Notion-related AI agents

2. **Biased Sources:**
   - Exa returned sources about "Notion AI agents" instead of general AI agents
   - LLM summarized from these biased sources
   - Result: Response incorrectly focused on Notion context

3. **Flow:**
   ```
   User Query → Exa Search (with action phrases) → Biased Sources → Biased Response
   ```

---

## ✅ Solution

### Use Cleaned Topic for Search

Extract the main topic **BEFORE** searching, then use the cleaned topic for the Exa API call:

```typescript
// BEFORE (v6): Used full query for search
citations = await searchExa(userQuery, exaApiKey, citationLimit);
// Query: "Research about AI agents and save to Notion"
// ❌ Results biased toward Notion

// AFTER (v7): Extract topic first, then search
const mainTopic = extractMainTopic(userQuery);
// mainTopic: "Research about AI agents"
console.log(`Cleaned search topic: "${mainTopic}"`);

citations = await searchExa(mainTopic, exaApiKey, citationLimit);
// ✅ Results are general AI agents, not Notion-specific
```

### Flow Diagram:

```
User Query: "Research about AI agents and save to Notion"
     ↓
extractMainTopic() → "Research about AI agents"
     ↓
Exa Search with cleaned topic → General AI agent sources
     ↓
LLM summarizes from general sources → Unbiased response
     ↓
Action detection (separate) → "Save to Notion" button
```

---

## 📊 Impact

### Before Fix (v6):
- ❌ Search query: "Research about AI agents **and save to Notion**"
- ❌ Results: Notion-specific AI agent content
- ❌ Response: "AI agents in the context of Notion..."
- ❌ User gets wrong information

### After Fix (v7):
- ✅ Search query: "Research about AI agents" (cleaned)
- ✅ Results: General AI agent content from diverse sources
- ✅ Response: General AI agent information
- ✅ User gets accurate, unbiased research
- ✅ "Save to Notion" button still works (action detection is separate)

---

## 🎯 Expected Results (After Fix)

**Query:** "Research about AI agents and save to Notion"

**Good Response (After Fix):**
```
AI agents are autonomous software systems that can perform tasks 
and make decisions based on their environment [1]. They operate 
using various AI techniques including machine learning, natural 
language processing, and reasoning systems [2].

Key capabilities include:
- Autonomous task execution [1]
- Adaptive learning from experience [2]
- Multi-domain application [3]
```

**Then:** "Save to Notion" button appears

---

## 🔧 Implementation Details

### Changes in `supabase/functions/plan/index.ts`:

```typescript
// Check if web search is needed
if (exaApiKey && needsWebSearch(userQuery)) {
  console.log("Performing web search for:", userQuery);
  const citationLimit = getCitationLimit(userQuery);
  console.log(`Citation limit for this query: ${citationLimit}`);
  
  // Extract main topic BEFORE searching to avoid biased results
  const mainTopic = extractMainTopic(userQuery);
  console.log(`Cleaned search topic: "${mainTopic}"`);
  
  // Use cleaned topic for search to avoid context bias
  citations = await searchExa(mainTopic, exaApiKey, citationLimit);
  
  if (citations.length > 0) {
    contextPrompt = "\n\nWEB SEARCH RESULTS:\n" +
      citations.map(c => 
        `[${c.id}] ${c.title}\n${c.snippet}\nURL: ${c.url}`
      ).join("\n\n") +
      `\n\nIMPORTANT INSTRUCTIONS:\n` +
      `User wants to know about: "${mainTopic}"\n` +
      `1. Use ONLY the above sources to provide information about this topic\n` +
      `2. Provide a clear, informative summary based on the sources\n` +
      `3. Include inline citations like [1], [2] to reference specific information\n` +
      `4. Be concise and accurate\n` +
      `5. Do NOT give instructions on how to save/email - just provide the information itself\n` +
      `6. Do NOT add context or assumptions beyond what's in the sources (e.g., don't focus on Notion/email if that's not the topic)\n` +
      `7. The user's actions (save to Notion, draft email, etc.) will be handled automatically with action buttons`;
  }
}
```

### Key Improvements:

1. **Extract before searching** - Clean the query first
2. **Use cleaned topic** - Pass only the core research question to Exa
3. **Log cleaned topic** - Console log helps with debugging
4. **Additional instruction** - Added instruction #6 to prevent context assumptions

---

## 🧪 Testing Examples

### Test 1: General Research + Action

**Query:** "Research about AI agents and save to Notion"

**Expected:**
- Search query to Exa: "Research about AI agents"
- Sources: General AI agent information
- Response: Unbiased AI agent summary
- Action: "Save to Notion" button

### Test 2: Email Draft + Research

**Query:** "Find information about climate change and draft email"

**Expected:**
- Search query to Exa: "Find information about climate change"
- Sources: General climate change content
- Response: Climate change information (not email-focused)
- Action: "Draft Email" button

### Test 3: Multiple Actions

**Query:** "Research machine learning and save to Notion and email"

**Expected:**
- Search query to Exa: "Research machine learning"
- Sources: General ML content
- Response: ML information
- Actions: Both "Save to Notion" and "Draft Email" buttons

---

## 📝 Files Modified

1. **`supabase/functions/plan/index.ts`**
   - Moved `extractMainTopic()` call before search
   - Changed `searchExa()` to use `mainTopic` instead of `userQuery`
   - Added console log for cleaned search topic
   - Added instruction #6 to prevent context assumptions
   - Deployed as **version 7**

---

## 🎓 Key Learning

### Problem: Context Pollution in Search

When users combine information queries with action requests:
```
"Research about X and [action]"
```

The action phrase can pollute the search query and bias results.

### Solution: Separate Concerns

1. **Content Query:** Clean and use for search → Unbiased results
2. **Action Detection:** Detect separately → Proper action buttons

### Principle: Clean Input, Separate Concerns

```typescript
// ❌ BAD: Mixed concerns
searchExa("Research about AI agents and save to Notion")

// ✅ GOOD: Separated concerns
const topic = extractMainTopic(query);        // "Research about AI agents"
const results = searchExa(topic);             // Unbiased search
const action = detectAction(query);            // "Save to Notion"
```

This is a fundamental software engineering principle: **Separation of Concerns**

---

## 🚀 Deployment

- ✅ Edge function `plan` updated to **version 7** (ACTIVE)
- ✅ Changes deployed via Supabase MCP
- ✅ Console logging added for debugging
- ✅ Ready for testing

---

## ✅ Success Criteria

After this fix, the following should be true:

1. ✅ Query "Research about AI agents and save to Notion"
   - Returns general AI agent information
   - NOT Notion-specific content

2. ✅ Search is unbiased by action phrases
   - "save to Notion" doesn't bias search
   - "draft email" doesn't bias search

3. ✅ Actions still work correctly
   - "Save to Notion" button appears
   - Citations are included
   - Auto-generated title works

4. ✅ Separation of concerns maintained
   - Content generation is independent
   - Action detection is independent
   - Both work together seamlessly

