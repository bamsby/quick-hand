# Notion Page Selector Feature

## ✨ **New Feature: Choose Where to Save Notes**

Users can now **select which Notion page** to use as the parent when saving notes, instead of always creating pages under the last-created page.

---

## 🎯 **Problem Solved**

**Before:** Notes were always added under the most recently created page or a default page, which wasn't user-controlled.

**After:** Users can choose exactly where to place their new notes in their Notion workspace hierarchy.

---

## 🔧 **Implementation**

### 1. **New Edge Function: `notion-list-pages`**

Fetches all accessible pages from the user's Notion workspace:

```typescript
// Endpoint: /functions/v1/notion-list-pages
// Returns: { pages: [{ id, title, url }, ...] }
```

**Features:**
- Searches user's Notion workspace for all pages
- Returns up to 100 pages
- Handles both `title` and `Name` properties (different Notion page types)

### 2. **Updated `notion-create-page` Edge Function**

Now accepts an optional `parentPageId` parameter:

```typescript
interface RequestBody {
  title: string;
  content: string;
  parentPageId?: string;  // ← NEW
  citations?: Array<...>;
}
```

**Logic:**
- If `parentPageId` is provided → Use it as parent
- If not provided → Search for default parent (fallback behavior)

### 3. **Updated `NotionConfirmModal` Component**

Added interactive page selector UI:

**New Features:**
- Fetches available pages when modal opens
- Shows horizontal scrollable list of page chips
- Auto-selects first page
- Visual feedback for selected page (green highlight)
- Loading state while fetching pages

**UI Components:**
- Page Title input (existing)
- **→ "Save to Page" selector (NEW)**
- Content Preview (existing)
- Create/Cancel buttons (existing)

### 4. **Client API Updates**

**New Function:**
```typescript
export async function notionListPages(): Promise<Page[]>
```

**Updated Function:**
```typescript
export async function notionCreatePage(
  title: string,
  contentMD: string,
  citations?: Citation[],
  parentPageId?: string  // ← NEW
)
```

---

## 🎨 **User Experience**

### Flow:

1. **User clicks "Save to Notion"**
2. **Modal opens and fetches pages** (shows loading spinner)
3. **Page chips appear** - horizontally scrollable list
4. **User selects desired parent page** (tap chip, turns green)
5. **User confirms** - page created under selected parent

### UI Design:

```
┌──────────────────────────────────────┐
│ Save to Notion                    ✕ │
├──────────────────────────────────────┤
│ Page Title                           │
│ ┌──────────────────────────────────┐ │
│ │ AI Agents Research               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Save to Page                         │
│ ┌──────────────────────────────────┐ │
│ │ [Test Notes] [SaaS] [Projects]  ││ │
│ └──────────────────────────────────┘ │
│                                      │
│ Content Preview                      │
│ ┌──────────────────────────────────┐ │
│ │ AI agents are autonomous...      │ │
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
│                                      │
│  [ Cancel ]    [ Create Page ]       │
└──────────────────────────────────────┘
```

**Chips:**
- Grey: Unselected page
- Green: Selected page
- Horizontally scrollable if many pages

---

## 📦 **Deployed Functions**

### ✅ `notion-list-pages` (v1)
- **Status:** ACTIVE
- **Purpose:** Fetch user's Notion pages
- **Returns:** List of pages with id, title, url

### ✅ `notion-create-page` (v4)
- **Status:** ACTIVE  
- **New Feature:** Accepts `parentPageId` parameter
- **Maintains:** All existing functionality (citations, auto-title, etc.)

---

## 🧪 **Testing**

### Test Steps:

1. **Reload the app** to get the updated code
2. **Try a query:** "Research about AI agents and save to Notion"
3. **Click "Save to Notion"** button
4. **Observe:**
   - ✅ "Loading pages..." appears briefly
   - ✅ Your Notion pages appear as chips
   - ✅ First page is auto-selected (green)
5. **Tap different page chips** to select
6. **Click "Create Page"**
7. **Verify:** Page created under selected parent in Notion

### Expected Behavior:

- **Multiple pages:** Can scroll horizontally to see all
- **Selection persists:** Selected page stays highlighted
- **Default selection:** First page auto-selected on open
- **Page creation:** Successfully creates under chosen parent

---

## 💡 **Technical Details**

### Notion API Used:

**Search Endpoint:**
```
POST https://api.notion.com/v1/search
{
  "filter": { "property": "object", "value": "page" },
  "page_size": 100
}
```

**Create Page Endpoint:**
```
POST https://api.notion.com/v1/pages
{
  "parent": { "page_id": "<selected-parent-id>" },
  "properties": { ... },
  "children": [ ... ]
}
```

### Edge Cases Handled:

1. **No pages found:** Falls back to default behavior
2. **Network error:** Shows error, doesn't crash
3. **No parent selected:** Uses first page or default
4. **Long page titles:** Text truncates in chips

---

## 📝 **Files Modified**

1. **`supabase/functions/notion-list-pages/index.ts`** (NEW)
   - Fetches user's Notion pages

2. **`supabase/functions/notion-create-page/index.ts`**
   - Added `parentPageId` parameter
   - Uses provided parent or searches for default

3. **`lib/api.ts`**
   - Added `notionListPages()` function
   - Updated `notionCreatePage()` to accept `parentPageId`

4. **`lib/ui/notion-confirm-modal.tsx`**
   - Added page fetching logic
   - Added page selector UI with chips
   - Added loading state
   - Updated styles for chips and loading indicator

5. **`app/chat.tsx`**
   - Updated `confirmNotionAction` to accept `parentPageId`
   - Passes `parentPageId` to `notionCreatePage`

---

## 🎯 **Benefits**

### For Users:
- ✅ **Control:** Choose where notes are saved
- ✅ **Organization:** Maintain workspace structure
- ✅ **Flexibility:** Different topics in different sections
- ✅ **Visual:** See available pages before choosing

### For Product:
- ✅ **Better UX:** More intuitive than automatic placement
- ✅ **Scalability:** Works with any number of pages
- ✅ **Consistency:** Fits existing Notion mental model
- ✅ **Discoverability:** Shows users their workspace structure

---

## 🚀 **Future Enhancements** (Optional)

Potential improvements for later:

1. **Search/Filter:** For users with many pages
2. **Favorites:** Remember frequently used parent pages
3. **Recent:** Show recently used pages first
4. **Nested View:** Show page hierarchy/tree
5. **Create New Parent:** Option to create new container page

---

## ✅ **Status**

- ✅ Edge functions deployed
- ✅ Client code updated  
- ✅ UI implemented
- ✅ Ready for testing
- ✅ No linting errors

**User can now select where to save Notion pages!** 🎉

