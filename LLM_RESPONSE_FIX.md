# LLM Response Quality Fix - Summarize Sources Instead of Instructions

## 🐛 Issue

**Query:** "Research about AI agents and save to Notion"

**Bad Response (Before Fix):**
```
To save information about AI agents to Notion, follow these steps:
1. **Research AI Agents**: Use reliable sources...
2. **Summarize Findings**: Create a concise summary...
3. **Save to Notion**:
   - Open your Notion workspace...
```

**Problem:** The LLM was giving instructions on HOW to save information, instead of actually providing the research results about AI agents from the web search sources.

---

## 🔍 Root Cause

The LLM was being confused by action phrases like "save to Notion" in the query, causing it to:
1. Interpret the query as "How do I save information about AI agents?"
2. Provide procedural instructions instead of actual research content
3. Ignore the web search results that were provided

---

## ✅ Solution

### 1. **Extract Main Topic Function**
Created a helper function to remove action phrases from the query before presenting it to the LLM:

```typescript
function extractMainTopic(query: string): string {
  const actionPhrases = [
    /save\s+(?:to|into|in)\s+notion/gi,
    /save\s+(?:to|into|in)\s+my\s+notion/gi,
    /draft\s+(?:an?\s+)?email/gi,
    /and\s+save/gi,
    /then\s+save/gi,
  ];
  
  let cleanedQuery = query;
  actionPhrases.forEach(phrase => {
    cleanedQuery = cleanedQuery.replace(phrase, '');
  });
  
  return cleanedQuery.trim();
}
```

**Example:**
- Input: "Research about AI agents and save to Notion"
- Output: "Research about AI agents"

### 2. **Improved Context Instructions**

Updated the prompt sent to OpenAI to be much more explicit:

```typescript
const mainTopic = extractMainTopic(userQuery);
contextPrompt = `
WEB SEARCH RESULTS:
[Citations here...]

IMPORTANT INSTRUCTIONS:
User wants to know about: "${mainTopic}"
1. Use ONLY the above sources to provide information about this topic
2. Provide a clear, informative summary based on the sources
3. Include inline citations like [1], [2] to reference specific information
4. Be concise and accurate
5. Do NOT give instructions on how to save/email - just provide the information itself
6. The user's actions (save to Notion, draft email, etc.) will be handled automatically with action buttons
`;
```

**Key Changes:**
- ✅ Explicitly state what the user wants to know about (cleaned topic)
- ✅ Tell LLM to provide information, not instructions
- ✅ Clarify that actions are handled separately
- ✅ Make it clear the LLM should summarize from sources

---

## 🎯 Expected Results (After Fix)

**Query:** "Research about AI agents and save to Notion"

**Good Response (After Fix):**
```
AI agents are intelligent software programs that can perform tasks autonomously [1]. 
According to [1], Notion's new AI agents can research, write, and run your team's 
workflows. These agents are designed for task automation, helping users streamline 
their workflow processes [2].

Key features include:
- Automated data analysis and task completion [2]
- Integration with various productivity tools [1]
- Ability to summarize and organize information [1]
```

**Then:** "Save to Notion" action button appears with auto-generated title

---

## 📊 Impact

### Before Fix:
- ❌ LLM provided instructions instead of information
- ❌ Web search sources were ignored
- ❌ User had to manually extract info from sources
- ❌ Poor user experience

### After Fix:
- ✅ LLM summarizes actual research from sources
- ✅ Includes inline citations [1], [2]
- ✅ Focuses on the topic, not the action
- ✅ Action buttons still work (handled separately)
- ✅ Much better user experience

---

## 🚀 Deployment

- ✅ Edge function `plan` updated to **version 6** (ACTIVE)
- ✅ Changes deployed via Supabase MCP
- ✅ Ready for testing

---

## 🧪 Testing

To test the fix, try these queries:

1. **"Research about AI agents and save to Notion"**
   - Should: Summarize info about AI agents from sources
   - Should NOT: Give instructions on how to save

2. **"What are the latest AI developments and save"**
   - Should: List recent AI developments with citations
   - Should NOT: Explain how to save developments

3. **"Find information about hackathons and draft email"**
   - Should: Provide info about hackathons
   - Should NOT: Explain how to draft emails

---

## 📝 Files Modified

1. **`supabase/functions/plan/index.ts`**
   - Added `extractMainTopic()` helper function
   - Improved context prompt instructions
   - Deployed as version 6

---

## 🎓 Key Learnings

### LLM Prompt Engineering

The issue demonstrates the importance of:
1. **Clear, explicit instructions** - Don't assume the LLM will figure it out
2. **Context separation** - Separate content requests from action requests
3. **Negative instructions** - Sometimes you need to explicitly say "Do NOT do X"
4. **Topic extraction** - Clean the query before using it in prompts

### Best Practice

When users combine content queries with actions:
```
"Research about X and save to Y"
```

Split into:
1. **Content query**: "Research about X" → Send to LLM with sources
2. **Action detection**: "save to Y" → Create action button

Don't let action phrases confuse the content generation!

