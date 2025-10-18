# Testing Guide - Auto-Title & Citations Feature

## 🚀 Quick Test Commands

### Test 1: Simple Query (1 Citation Expected)
**Query:** "What is OpenAI? Save to Notion"
- Expected: 1 citation, auto-generated title like "What is OpenAI"
- Check: Notion page should have title + content + 1 source

### Test 2: General Query (3 Citations Expected)
**Query:** "Tell me about AI hackathons and save to Notion"
- Expected: 3 citations, auto-generated title like "AI Hackathons Guide"
- Check: Notion page should have title + content + 3 sources

### Test 3: Complex Query (5 Citations Expected)
**Query:** "Compare GPT-4 vs Claude differences and save to Notion"
- Expected: 5 citations, auto-generated title like "GPT-4 vs Claude Comparison"
- Check: Notion page should have title + content + 5 sources

## 📱 Step-by-Step Testing Process

### 1. Open the App
- Scan the QR code with Expo Go (Android) or Camera (iOS)
- Or use web browser: http://localhost:8081

### 2. Select a Role
- Tap any role pill (e.g., "General", "Founder", "Student")
- This loads the appropriate system prompt

### 3. Test Simple Query
```
What is OpenAI? Save to Notion
```
**Expected Results:**
- ✅ Response with inline citations [1]
- ✅ "Save to Notion" action button appears
- ✅ Auto-generated title in confirmation modal
- ✅ 1 citation in Sources section

### 4. Test General Query
```
Tell me about AI hackathons and save to Notion
```
**Expected Results:**
- ✅ Response with inline citations [1], [2], [3]
- ✅ "Save to Notion" action button appears
- ✅ Auto-generated title in confirmation modal
- ✅ 3 citations in Sources section

### 5. Test Complex Query
```
Compare GPT-4 vs Claude differences and save to Notion
```
**Expected Results:**
- ✅ Response with inline citations [1], [2], [3], [4], [5]
- ✅ "Save to Notion" action button appears
- ✅ Auto-generated title in confirmation modal
- ✅ 5 citations in Sources section

## 🔍 What to Check in Notion

### Title Generation
- ✅ Title is auto-generated (not "Untitled")
- ✅ Title is concise (under 60 characters)
- ✅ Title is descriptive and relevant

### Content Structure
- ✅ Main content with inline citations [1], [2], etc.
- ✅ "Sources" section at the bottom
- ✅ Each source has:
  - **Bold** citation number and title
  - Clickable URL

### Citation Quality
- ✅ Citations are relevant to the query
- ✅ URLs are working
- ✅ Titles are descriptive
- ✅ Right number of citations (1, 3, or 5)

## 🐛 Troubleshooting

### If Citations Don't Appear
1. Check if query triggers web search (contains keywords like "latest", "what is", etc.)
2. Check Supabase logs: `mcp_supabase_get_logs` with service "edge-function"
3. Verify EXA_API_KEY is set in Supabase secrets

### If Title Generation Fails
1. Check OpenAI API key is set in Supabase secrets
2. Check edge function logs for errors
3. Fallback should be "Note" if generation fails

### If Notion Page Creation Fails
1. Check Notion connection status
2. Verify user has connected Notion OAuth
3. Check Notion API permissions

## 📊 Expected Citation Limits

| Query Type | Keywords | Expected Citations |
|------------|----------|-------------------|
| Simple | "what is", "define", "who is" | 1 |
| General | Most questions | 3 |
| Complex | "compare", "analyze", "comprehensive" | 5 |

## 🎯 Success Criteria

### ✅ Feature Working If:
1. **Auto-titles** are generated and editable
2. **Citations** appear in correct numbers (1, 3, or 5)
3. **Notion pages** have Sources section with bold titles
4. **Inline citations** [1], [2] appear in content
5. **URLs** in Sources section are clickable

### ❌ Issues to Report:
1. No citations appearing
2. Wrong number of citations
3. Title generation failing
4. Notion page creation errors
5. Citations not appearing in Notion

## 🔧 Debug Commands

If you need to check logs:
```typescript
// Check edge function logs
mcp_supabase_get_logs({ service: "edge-function" })

// Check for security issues
mcp_supabase_get_advisors({ type: "security" })

// List current edge functions
mcp_supabase_list_edge_functions()
```

## 📝 Test Results Template

```
Test Date: ___________
Query: "What is OpenAI? Save to Notion"

Results:
- [ ] Auto-title generated: "What is OpenAI"
- [ ] Citations count: 1
- [ ] Inline citations: [1] in content
- [ ] Sources section: 1 source with bold title
- [ ] URL clickable: Yes/No
- [ ] Notion page created: Yes/No

Issues: ________________
```

---

**Ready to test?** Start with the simple query and work your way up to complex queries!
