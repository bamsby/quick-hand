# Citations in Notion Modal Preview Fix

## 🐛 Issue

When clicking "Save to Notion", the confirmation modal was showing:
- ✅ Auto-generated title
- ✅ Content preview
- ❌ **Missing citations** - No source links or citation references in the preview

**User Experience:** Users couldn't see what sources would be saved with the note before confirming.

---

## 🔍 Root Cause

The `NotionConfirmModal` component was only receiving the `content` prop, but not the `citations` prop. The citations were stored in `action.params?.citations` but weren't being:
1. Passed from `chat.tsx` to the modal
2. Formatted and displayed in the content preview

---

## ✅ Solution

### 1. Updated Modal Interface

Added citations as an optional prop:

```typescript
// lib/ui/notion-confirm-modal.tsx
import type { Citation } from "../types";

interface NotionConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (title: string) => void;
  initialTitle: string;
  content: string;
  citations?: Citation[];  // ← Added
}
```

### 2. Format Citations in Preview

Created a `useMemo` hook to format content with citations:

```typescript
const formattedContent = useMemo(() => {
  if (!citations || citations.length === 0) {
    return content;
  }

  let result = content + "\n\n";
  result += "───────────────────\n\n";
  result += "📚 Sources:\n\n";
  
  citations.forEach((citation) => {
    result += `[${citation.id}] ${citation.title}\n`;
    result += `🔗 ${citation.url}\n\n`;
  });
  
  return result;
}, [content, citations]);
```

### 3. Pass Citations from Chat

Updated the modal call to include citations:

```typescript
// app/chat.tsx
<NotionConfirmModal
  visible={notionModalVisible}
  onClose={...}
  onConfirm={confirmNotionAction}
  initialTitle={pendingAction?.action.params?.title || "Untitled"}
  content={pendingAction?.action.params?.content || ""}
  citations={pendingAction?.action.params?.citations || []}  // ← Added
/>
```

---

## 🎯 Expected Results (After Fix)

When clicking "Save to Notion", the modal will now show:

```
Content Preview:
───────────────────
AI agents are intelligent software programs that can perform 
tasks autonomously [1]. According to [1], Notion's new AI 
agents can research, write, and run your team's workflows...

───────────────────

📚 Sources:

[1] AI Agent: Scrape, Summarize & Save Articles to Notion
🔗 https://n8n.io/workflows/...

[2] Notion 3.0 Introduces AI Agents for Task Automation
🔗 https://www.reworked.co/events/webinar/...

[3] Notion launches agents for data analysis and task automation
🔗 https://www.simplemedia.com/impact-...
```

---

## 📊 Impact

### Before Fix:
- ❌ Citations not visible in preview
- ❌ Users couldn't verify sources before saving
- ❌ Unclear what would be saved to Notion

### After Fix:
- ✅ Citations visible with formatted titles
- ✅ URLs displayed with link emoji (🔗)
- ✅ Clear separator between content and sources
- ✅ Users can scroll to see all citations
- ✅ Complete preview of what will be saved

---

## 📝 Files Modified

1. **`lib/ui/notion-confirm-modal.tsx`**
   - Added `Citation` type import
   - Added `citations` prop to interface
   - Added `useMemo` to format content with citations
   - Imported `useMemo` from React

2. **`app/chat.tsx`**
   - Passed `citations` prop to `NotionConfirmModal`
   - Citations extracted from `pendingAction?.action.params?.citations`

---

## 🎨 UI Details

### Citation Formatting:
- **Separator:** `───────────────────` (visual divider)
- **Header:** `📚 Sources:` (emoji for visual appeal)
- **Each Citation:**
  - `[1] Title of the source`
  - `🔗 https://url-link`
  - Empty line between citations

### Scrollable Content:
- `maxHeight: 150` allows scrolling for long content
- Citations are at the bottom (scroll down to see)
- Maintains existing preview styling

---

## ✅ Testing Checklist

Test with a research query:

1. **Query:** "Research about AI agents and save to Notion"
2. **Click:** "Save to Notion" button
3. **Verify Modal Shows:**
   - ✅ Auto-generated title
   - ✅ Content with inline citations [1], [2]
   - ✅ Separator line
   - ✅ "📚 Sources:" header
   - ✅ Each source with [number], title, and 🔗 URL
4. **Scroll:** Can scroll to see all citations
5. **Create:** Citations are saved to Notion page

---

## 🔗 Related Fixes

This fix complements:
1. **Auto-title generation** - Working ✅
2. **Smart citation limiting** - Working ✅ (1, 3, or 5 based on complexity)
3. **LLM response quality** - Working ✅ (summaries not instructions)
4. **Citations in Notion** - Working ✅ (saved with page)
5. **Citations in modal preview** - **NOW FIXED** ✅

---

## 🎓 Key Learning

**React Best Practice:** When displaying derived/formatted data, use `useMemo` to:
1. Avoid recalculating on every render
2. Only recompute when dependencies change
3. Keep render function clean and readable

```typescript
// ✅ Good: Memoized formatting
const formattedContent = useMemo(() => {
  return formatContentWithCitations(content, citations);
}, [content, citations]);

// ❌ Bad: Recalculates every render
const formattedContent = formatContentWithCitations(content, citations);
```

