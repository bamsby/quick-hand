# QuickHand Edge Functions

This document describes the contract and implementation of QuickHand's edge functions for AI-powered task completion.

## Architecture Overview

The system consists of two main edge functions:

1. **`classify-intent`** - Routes user queries to appropriate handlers
2. **`plan`** - Main orchestration function that executes tasks

## API Contracts

### classify-intent

**Endpoint:** `/functions/v1/classify-intent`

**Request:**
```json
{
  "query": "string",
  "role": "string"
}
```

**Response (Normal):**
```json
{
  "intent": "info_lookup|summarize|email_draft|action_request|chitchat",
  "slots": {
    "topic": "string",
    "needs": {
      "location": boolean,
      "email": boolean
    }
  }
}
```

**Response (Needs Info):**
```json
{
  "needs_info": true,
  "missing": ["email", "location"],
  "question": "Who should receive the email?"
}
```

### plan

**Endpoint:** `/functions/v1/plan`

**Request:**
```json
{
  "role": "string",
  "history": [
    {
      "id": "string",
      "role": "system|user|assistant",
      "content": "string"
    }
  ]
}
```

**Response:**
```json
{
  "id": "string",
  "content": "string",
  "citations": [
    {
      "id": number,
      "title": "string",
      "url": "string",
      "snippet": "string"
    }
  ],
  "plan": [
    {
      "id": "string",
      "action": "notion|gmail|summarize",
      "label": "string",
      "params": {}
    }
  ],
  "structured": {
    "answer": "string",
    "bullets": ["string"],
    "citations": [
      {
        "id": number,
        "url": "string",
        "title": "string",
        "snippet": "string"
      }
    ],
    "followups": ["string"],
    "next_actions": [
      {
        "tool": "string",
        "params": {}
      }
    ]
  },
  "metadata": {
    "intent": "string",
    "topic": "string",
    "toolCalls": ["string"]
  }
}
```

## Tool Registry

The system supports three main tools:

### exa_search
```json
{
  "name": "exa_search",
  "description": "Search the web for information using Exa API",
  "parameters": {
    "query": "string",
    "num_results": "number (optional, default: 3)"
  }
}
```

### notion_create_page
```json
{
  "name": "notion_create_page",
  "description": "Create a new page in Notion",
  "parameters": {
    "title": "string",
    "content_md": "string"
  }
}
```

### gmail_create_draft
```json
{
  "name": "gmail_create_draft",
  "description": "Draft an email in Gmail",
  "parameters": {
    "to": ["string"],
    "subject": "string",
    "body_text": "string"
  }
}
```

## Features

### 1. Intent Routing
- Classifies user queries into specific intents
- Returns `needs_info` when missing required context
- Supports role-based routing

### 2. Tool Calling
- OpenAI tool calling for intelligent action selection
- Parameter validation before execution
- Deduplication of actions

### 3. Structured Output
- JSON-only responses from Gemini 2.5 Pro
- Fallback to GPT-4 on Gemini failures
- Strict schema validation

### 4. Streaming Support
- Optional streaming responses with `?stream=true`
- Preview messages for immediate feedback
- Final structured response

### 5. Memory Management
- Conversation history summarization
- Mem0.ai integration for persistent memory
- Context-aware responses

### 6. Search Grounding
- Exa API integration with reranking
- Citation requirements for factual claims
- Cache with 15-minute TTL

### 7. Email Pipeline
- Dedicated email generation with tone control
- HTML formatting for Gmail API
- Subject line generation

### 8. Observability
- Run metrics logging to Supabase
- Latency and token estimation
- Cache hit tracking

### 9. Safety & Validation
- URL sanitization for citations
- Parameter validation for tools
- Content length limits

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional
EXA_API_KEY=...
MEM0_API_KEY=...
```

## Database Schema

### runs table
```sql
CREATE TABLE runs (
  run_id TEXT PRIMARY KEY,
  intent TEXT,
  tools_used TEXT[],
  model TEXT,
  token_estimate INTEGER,
  latency_ms INTEGER,
  cache_hit BOOLEAN,
  created_at TIMESTAMP
);
```

### exa_cache table
```sql
CREATE TABLE exa_cache (
  query_hash TEXT PRIMARY KEY,
  query TEXT,
  limit INTEGER,
  results JSONB,
  created_at TIMESTAMP
);
```

## Testing

Run the evaluation script:

```bash
npm run eval
```

This tests:
- JSON validity
- Citation presence
- Word count bounds
- Latency requirements

## Error Handling

The system includes comprehensive error handling:

1. **Intent Classification Failures** - Fallback to `info_lookup`
2. **Model Failures** - GPT-4 fallback for Gemini
3. **Tool Validation** - Skip invalid tool calls
4. **Cache Failures** - Continue without caching
5. **Memory Failures** - Continue without memory context

## Performance

- **Target Latency:** <2s for most queries
- **Cache Hit Rate:** ~60% for repeated queries
- **Token Efficiency:** History summarization reduces context
- **Streaming:** <1s for preview, full response when ready

## Security

- URL sanitization for all citations
- Parameter validation for all tools
- Content length limits
- Protocol restrictions (HTTP/HTTPS only)

## Monitoring

Check the `runs` table for:
- Success rates by intent
- Average latency
- Tool usage patterns
- Cache effectiveness

## Troubleshooting

### Common Issues

1. **JSON Parse Errors** - Check Gemini response format
2. **Tool Validation Failures** - Verify parameter types
3. **Cache Misses** - Check Supabase connection
4. **Memory Errors** - Verify Mem0 API key

### Debug Logs

Enable detailed logging by checking the edge function logs in Supabase dashboard.

## Future Improvements

- [ ] Rate limiting per user
- [ ] Advanced caching strategies
- [ ] Multi-modal support
- [ ] Custom tool definitions
- [ ] A/B testing framework
