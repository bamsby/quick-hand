# Chat UI Features Guide

## 🎨 Visual Components

### 1. Basic Chat Message

```
┌─────────────────────────────────────┐
│ User Message                        │
│ ┌─────────────────────────────┐    │
│ │ What is React Native?       │    │
│ └─────────────────────────────┘    │
│                                     │
│ Assistant Message                   │
│ ┌─────────────────────────────────┐│
│ │ React Native is a framework for ││
│ │ building native mobile apps using││
│ │ React and JavaScript.           ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 2. Message with Citations

```
┌─────────────────────────────────────┐
│ Assistant Message                   │
│ ┌─────────────────────────────────┐│
│ │ The latest AI hackathon by      ││
│ │ Google offers $50,000 [1] and   ││
│ │ includes prizes for creative    ││
│ │ applications [2].               ││
│ └─────────────────────────────────┘│
│                                     │
│ Sources:                            │
│ ┌─────────────────────────────────┐│
│ │ [1] Google AI Hackathon 2024    ││
│ │ Top prize includes $50k and...  ││
│ │ 👆 Tap to open                  ││
│ ├─────────────────────────────────┤│
│ │ [2] Creative AI Applications    ││
│ │ Special category for creative...││
│ │ 👆 Tap to open                  ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 3. Message with Action Proposals

```
┌─────────────────────────────────────┐
│ Assistant Message                   │
│ ┌─────────────────────────────────┐│
│ │ Here's a summary of the event:  ││
│ │ - Theme: Generative AI          ││
│ │ - Prize: $50,000                ││
│ │ - Deadline: Nov 30, 2024        ││
│ └─────────────────────────────────┘│
│                                     │
│ Proposed Actions:                   │
│ ┌─────────────────────────────────┐│
│ │  [  Save to Notion  ]           ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 4. Action States

**Pending (default):**
```
┌───────────────────────┐
│  Save to Notion       │  ← Tappable, green background
└───────────────────────┘
```

**Running:**
```
┌───────────────────────┐
│  ⏳ Save to Notion    │  ← Spinner animation, disabled
└───────────────────────┘
```

**Done:**
```
┌───────────────────────┐
│  ✓ Save to Notion     │  ← Checkmark, darker green
└───────────────────────┘  Open → (link appears)
```

**Error:**
```
┌───────────────────────┐
│  Save to Notion       │  ← Red background
└───────────────────────┘  Failed (error text)
```

### 5. Loading State

```
┌─────────────────────────────────────┐
│ User Message                        │
│ ┌─────────────────────────────┐    │
│ │ Latest AI news?             │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ ⏳ Thinking...              │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Ask QuickHand...            │    │
│ │ [     Send (disabled)      ]│    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 6. Error State

```
┌─────────────────────────────────────┐
│ User Message                        │
│ ┌─────────────────────────────┐    │
│ │ What is AI?                 │    │
│ └─────────────────────────────┘    │
│                                     │
│ Assistant Message (Error)           │
│ ┌─────────────────────────────────┐│
│ │ Couldn't reach the server.      ││
│ │ Check your connection and try   ││
│ │ again.                          ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 🎯 Interaction Patterns

### Tapping a Citation

1. User sees inline citation: `[1]`
2. User scrolls to "Sources" section
3. User taps citation card
4. Browser opens to URL

### Executing an Action

1. User sees "Proposed Actions" card
2. User taps "Save to Notion" button
3. Button shows spinner (running state)
4. On success:
   - Button shows checkmark (✓ Save to Notion)
   - "Open →" link appears
   - User can tap link to view created page
5. On failure:
   - Button turns red
   - "Failed" text appears below

### Sending a Message

1. User types in input field
2. User taps "Send" or presses Enter
3. Message appears in chat (right-aligned, light green)
4. Input clears and disables
5. Loading indicator appears ("Thinking...")
6. AI response appears (left-aligned, gray)
7. If web search was triggered:
   - Citations appear inline `[1]`, `[2]`
   - "Sources" section expands below
8. If actions are suggested:
   - "Proposed Actions" card appears

## 🎨 Color Scheme

- **User messages:** Light mint green (#def7f1)
- **Assistant messages:** Light gray (#f7f7f7)
- **Primary accent:** QuickHand green (#16E0B4)
- **Success:** Green (#10b981)
- **Error:** Red (#ef4444)
- **Citations:** Light blue background (#f0f9ff)
- **Borders:** Light gray (#e0e0e0)

## 📐 Spacing & Layout

- Message bubbles: 12px padding, 12px border radius
- Citations card: 12px padding, 8px border radius
- Action buttons: 10px vertical, 16px horizontal padding
- Between elements: 8-12px margins
- Input bar: 12px padding, fixed to bottom

## 🔤 Typography

- Message text: System default (14-16px)
- Citations title: 12px, semi-bold
- Citation content: 13px title, 12px snippet
- Action buttons: 14px, semi-bold
- Loading text: 14px

## 🎭 Animations

- **Auto-scroll:** Smooth scroll to bottom on new messages
- **Loading spinner:** Rotating indicator in "Thinking..." bubble
- **Action spinner:** Small spinner in button during execution
- **Button states:** Instant color changes (no fade)

## 📱 Mobile Considerations

- Single-hand use optimized
- Tappable areas: 40px minimum height
- Scrollable message area with fixed input bar
- Text wraps naturally in message bubbles
- URLs open in external browser (not in-app)

## 🎪 Demo Scenarios

### Scenario 1: General Question
```
User: "What is machine learning?"
AI: [General explanation, no citations]
```

### Scenario 2: Web Search
```
User: "Latest AI hackathon prizes"
AI: [Response with [1], [2] citations]
    Sources:
    [1] Google AI Hackathon...
    [2] Creative AI Awards...
```

### Scenario 3: Action Trigger
```
User: "Summarize this and save to Notion"
AI: [Summary]
    Proposed Actions:
    [Save to Notion]
```

### Scenario 4: Combined (Search + Action)
```
User: "Find latest React Native updates and save to Notion"
AI: [Response with [1], [2] citations]
    Sources:
    [1] React Native 0.73 Release...
    [2] New Architecture Updates...
    
    Proposed Actions:
    [Save to Notion]
```

## 🧪 Test Queries

Copy these to test features:

1. **No search:** "Explain React Native"
2. **Web search:** "Latest AI news 2024"
3. **Notion action:** "Create a summary and save to Notion"
4. **Gmail action:** "Draft an email about this"
5. **Search + action:** "Find AI hackathon prizes and save to Notion"

---

**UI Status:** ✅ Fully implemented  
**Responsive:** ✅ Mobile-first  
**Accessible:** ✅ Tappable areas optimized  
**Polished:** ✅ Loading states, error handling, smooth animations

