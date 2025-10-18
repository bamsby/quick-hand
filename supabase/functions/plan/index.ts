// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ROLE_PRESETS, type RoleKey } from "./_shared/roles.ts";

// Type definitions
interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

interface Citation {
  id: number;
  title: string;
  url: string;
  snippet: string;
}

interface ActionPlan {
  id: string;
  action: "summarize" | "notion" | "gmail";
  label: string;
  params?: any;
  status?: "pending" | "running" | "done" | "error";
  result?: string;
}

interface NextAction {
  tool: string;
  params: Record<string, any>;
}

interface StructuredAnswer {
  answer: string;
  bullets: string[];
  citations: Citation[];
  followups: string[];
  next_actions: NextAction[];
}

interface RequestBody {
  role: string;
  history: Message[];
}

interface ResponseBody {
  id: string;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
  structured?: StructuredAnswer;
  metadata?: {
    intent?: string;
    topic?: string;
    toolCalls?: string[];
  };
}

// CORS headers for client requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// Tool registry - single source of truth for all tools
const TOOL_DEFINITIONS = [
  {
    name: "exa_search",
    description: "Search the web for information using Exa API. Use when user needs current information or facts. IMPORTANT: For recent events, include terms like '2024', '2025', 'latest', 'upcoming', 'recent' in your search query to get the most current information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - include terms like '2024', '2025', 'latest', 'upcoming', 'recent' for current information"
        },
        num_results: {
          type: "number",
          description: "Number of results to return (default: 3)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "notion_create_page",
    description: "Create a new page in Notion. Use when user wants to save information to Notion.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Page title"
        },
        content_md: {
          type: "string",
          description: "Page content in markdown"
        }
      },
      required: ["title", "content_md"]
    }
  },
  {
    name: "gmail_create_draft",
    description: "Draft an email in Gmail. Use when user wants to compose or send an email.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Recipient emails"
        },
        subject: {
          type: "string",
          description: "Email subject"
        },
        body_text: {
          type: "string",
          description: "Email body text"
        }
      },
      required: ["to", "subject", "body_text"]
    }
  }
];


// Helper: Add memory to mem0.ai
async function addMemory(userId: string, role: string, messages: Array<{role: string, content: string}>, mem0ApiKey: string): Promise<void> {
  try {
    const response = await fetch("https://api.mem0.ai/v1/memories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mem0ApiKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: role,
        messages: messages,
        metadata: {
          role: role,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error("Mem0 add memory error:", await response.text());
    }
  } catch (error) {
    console.error("Mem0 add memory failed:", error);
  }
}

// Helper: Search memories from mem0.ai
async function searchMemories(userId: string, role: string, query: string, mem0ApiKey: string): Promise<string[]> {
  try {
    const response = await fetch("https://api.mem0.ai/v1/memories/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mem0ApiKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        agent_id: role,
        query: query,
        limit: 5,
      }),
    });

    if (!response.ok) {
      console.error("Mem0 search error:", await response.text());
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((result: any) => result.memory || result.content || "");
  } catch (error) {
    console.error("Mem0 search failed:", error);
    return [];
  }
}

// Helper: Call Exa API for web search
async function searchExa(query: string, exaApiKey: string, limit: number): Promise<Citation[]> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      console.log("Exa API timeout - aborting request");
      controller.abort();
    }, 8000); // Reduced to 8 seconds for faster failure
    
    // Get yesterday's date to avoid searching for today's content that might not exist
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = yesterday.toISOString().split('T')[0];
    
    console.log("Exa API request:", { query, limit, endDate });
    
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": exaApiKey,
      },
      body: JSON.stringify({
        query,
        numResults: limit,
        type: "auto",
        useAutoprompt: false, // Disable autoprompt to reduce processing time
        contents: {
          text: { maxCharacters: 500 },
        },
        // Use a more conservative date range
        startCrawlDate: "2023-01-01",
        endCrawlDate: endDate,
      }),
      signal: controller.signal,
    });
    
    // Clear timeout immediately after response
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Exa API error:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    console.log("Exa API success:", { resultCount: data.results?.length || 0 });
    
    return (data.results || []).map((result: any, idx: number) => ({
      id: idx + 1,
      title: result.title || "Untitled",
      url: result.url || "",
      snippet: result.text || result.snippet || "",
    }));
  } catch (error: any) {
    // Clear timeout in catch block too
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (error?.name === 'AbortError') {
      console.error("Exa search timed out after 8 seconds");
    } else {
      console.error("Exa search failed:", error);
    }
    return [];
  }
}

// Helper: Call OpenAI with tool calling
async function callOpenAIWithTools(
  userQuery: string,
  intent: string,
  conversationHistory: Message[],
  openAiKey: string
): Promise<{ toolCalls: any[], response?: string }> {
  // Skip tools for chitchat
  const shouldOfferTools = intent !== "chitchat";
  
  const messages = conversationHistory.map(m => ({
    role: m.role === "system" ? "system" : m.role,
    content: m.content
  }));
  
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      console.log("OpenAI API timeout - aborting request");
      controller.abort();
    }, 12000); // Reduced to 12 seconds for faster failure
    
    console.log("OpenAI API request:", { shouldOfferTools, messageCount: messages.length });
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        tools: shouldOfferTools ? TOOL_DEFINITIONS.map(t => ({ type: "function", function: t })) : undefined,
        tool_choice: shouldOfferTools ? "auto" : undefined,
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    
    // Clear timeout immediately after response
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    const toolCalls = data.choices[0]?.message?.tool_calls || [];
    
    console.log("OpenAI API success:", { toolCallCount: toolCalls.length });
    
    return { toolCalls };
  } catch (error: any) {
    // Clear timeout in catch block too
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (error?.name === 'AbortError') {
      console.error("OpenAI API timed out after 12 seconds");
      throw new Error("OpenAI API request timed out");
    } else {
      console.error("OpenAI API failed:", error);
      throw error;
    }
  }
}

// Helper: Call Gemini 2.5 Pro (simplified - no JSON mode)
async function callGemini(
  prompt: string,
  geminiApiKey: string
): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      console.log("Gemini API timeout - aborting request");
      controller.abort();
    }, 15000); // 15 second timeout for Gemini
    
    console.log("Gemini API request:", { promptLength: prompt.length });
    
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
        signal: controller.signal,
      }
    );
    
    // Clear timeout immediately after response
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    
    console.log("Gemini API success:", { resultLength: result.length });
    
    return result;
  } catch (error: any) {
    // Clear timeout in catch block too
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (error?.name === 'AbortError') {
      console.error("Gemini API timed out after 15 seconds");
      throw new Error("Gemini API request timed out");
    } else {
      console.error("Gemini API failed:", error);
      throw error;
    }
  }
}

// Helper: Call classify-intent function
async function classifyIntent(
  query: string,
  role: string,
  supabaseUrl: string,
  authHeader?: string
): Promise<{ intent: string; slots: { topic: string; needs: { location: boolean; email: boolean } } }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/classify-intent`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, role }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Intent classification error: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Intent classification error:', error);
    // Fallback to info_lookup intent
    return { intent: 'info_lookup', slots: { topic: query, needs: { location: false, email: false } } };
  }
}

// Helper: Generate a concise title for Notion using OpenAI
async function generateTitle(content: string, openAiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You generate concise, descriptive titles (max 60 characters) for notes. Return ONLY the title, no quotes or extra text."
        },
        {
          role: "user",
          content: `Generate a title for this note:\n\n${content.substring(0, 500)}`
        }
      ],
      temperature: 0.5,
      max_tokens: 20,
    }),
  });

  if (!response.ok) {
    console.error("Title generation failed:", await response.text());
    return "Note";
  }

  const data = await response.json();
  const title = data.choices[0]?.message?.content?.trim() || "Note";
  // Remove quotes if present
  return title.replace(/^["']|["']$/g, "");
}

// Helper: Format plain text email body to HTML
function formatEmailBody(text: string): string {
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  // Format each paragraph, preserving single line breaks
  const formatted = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
p { margin: 0 0 1em 0; }
</style>
</head>
<body>
${formatted}
</body>
</html>`;
}

// Helper function to generate structured answer
async function generateStructuredAnswer(userQuery: string, assistantReply: string, citations: Citation[], openAiKey: string): Promise<StructuredAnswer> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate a structured response with:
1. A concise answer (2-3 sentences)
2. 3-5 bullet points with key insights
3. Follow-up questions the user might ask
4. Next actions they might want to take

Format as JSON with keys: answer, bullets, followups, next_actions`
          },
          {
            role: "user",
            content: `Query: ${userQuery}\n\nResponse: ${assistantReply}\n\nCitations: ${JSON.stringify(citations)}`
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    try {
      const parsed = JSON.parse(content);
      // Ensure all required fields are present and properly typed
      return {
        answer: parsed.answer || assistantReply,
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [assistantReply],
        citations: citations || [],
        followups: Array.isArray(parsed.followups) ? parsed.followups : ["Tell me more about this", "What are the next steps?"],
        next_actions: Array.isArray(parsed.next_actions) ? parsed.next_actions.map((action: any) => ({
          tool: typeof action === 'string' ? action : (action.tool || 'unknown'),
          params: typeof action === 'object' && action.params ? action.params : {}
        })) : []
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        answer: assistantReply,
        bullets: [assistantReply],
        citations: citations || [],
        followups: ["Tell me more about this", "What are the next steps?"],
        next_actions: []
      };
    }
  } catch (error) {
    console.error("Error generating structured answer:", error);
    return {
      answer: assistantReply,
      bullets: [assistantReply],
      citations: citations || [],
      followups: ["Tell me more about this", "What are the next steps?"],
      next_actions: []
    };
  }
}

// Helper: Generate email content using OpenAI
async function generateEmailContent(
  userQuery: string,
  researchContent: string,
  openAiKey: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at writing professional emails. Write ONLY the email body content - do NOT include a subject line. Start with a greeting and end with an appropriate closing. Keep it concise and well-structured."
        },
        {
          role: "user",
          content: `User's request: "${userQuery}"\n\nResearch content to include:\n${researchContent}\n\nWrite a professional email body that addresses the user's request and includes the relevant information. Do NOT include "Subject:" - just the email body.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("Email content generation failed:", await response.text());
    return "I wanted to share some information with you based on your request. Please let me know if you need any further details.";
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || "I wanted to share some information with you based on your request. Please let me know if you need any further details.";
}

// Helper: Generate email subject line using OpenAI
async function generateEmailSubject(
  userQuery: string,
  emailBody: string,
  openAiKey: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at writing clear, professional email subject lines. Generate a concise, specific subject line (max 60 characters) that accurately describes the email content."
        },
        {
          role: "user",
          content: `User's request: "${userQuery}"\n\nEmail content:\n${emailBody.substring(0, 500)}\n\nGenerate ONLY the subject line, no quotes or extra text.`
        }
      ],
      max_tokens: 30,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || "Message from QuickHand";
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const exaApiKey = Deno.env.get("EXA_API_KEY");
    const mem0ApiKey = Deno.env.get("MEM0_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY not set in Supabase secrets");
    }

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not set in Supabase secrets");
    }

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL not set in Supabase secrets");
    }

    // Get user from JWT for memory
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader && mem0ApiKey) {
      try {
        // Create Supabase client with user's JWT
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          global: {
            headers: { Authorization: authHeader },
          },
        });

        // Get user from JWT
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          userId = user.id;
        }
      } catch (error) {
        console.error("User authentication error:", error);
        // Continue without memory if auth fails
      }
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { role, history } = body;

    if (!history || history.length === 0) {
      throw new Error("History is required");
    }

    // Get last user message
    const lastUserMessage = history.filter(m => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

    const userQuery = lastUserMessage.content;
    
    // Classify intent first
    let intentResult;
    try {
      const intentResponse = await classifyIntent(userQuery, role, supabaseUrl, authHeader);
      
      // Check if we need additional information
      if ('needs_info' in intentResponse && intentResponse.needs_info) {
        return new Response(
          JSON.stringify({
            needs_info: true,
            missing: intentResponse.missing,
            question: intentResponse.question
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      intentResult = intentResponse;
      console.log("Intent classification:", {
        intent: intentResult.intent,
        topic: intentResult.slots.topic,
        needs: intentResult.slots.needs,
      });
    } catch (error) {
      console.error("Intent classification failed:", error);
      // Fallback to default behavior if classification fails
      intentResult = {
        intent: "info_lookup",
        slots: { topic: userQuery, needs: { location: false, email: false } }
      };
    }
    
    let citations: Citation[] | undefined;
    let contextPrompt = "";
    
    // Search for relevant memories if user is authenticated and mem0 is available
    let memoryContext = "";
    if (userId && mem0ApiKey) {
      try {
        const memories = await searchMemories(userId, role, userQuery, mem0ApiKey);
        if (memories.length > 0) {
          memoryContext = "\n\nPREVIOUS CONVERSATION CONTEXT:\n" +
            memories.map((memory, index) => `${index + 1}. ${memory}`).join("\n") +
            "\n\nUse this context to provide more personalized and relevant responses. Reference previous conversations naturally when appropriate.";
        }
      } catch (error) {
        console.error("Memory search failed:", error);
        // Continue without memory context
      }
    }
    
    // Use OpenAI tool calling to decide on actions
    let toolCalls: any[] = [];
    let toolCallNames: string[] = [];
    
    try {
      const openAiResult = await callOpenAIWithTools(userQuery, intentResult.intent, history, openAiKey);
      toolCalls = openAiResult.toolCalls;
      toolCallNames = toolCalls.map(tc => tc.function.name);
      
      console.log("OpenAI tool calls:", toolCallNames);
    } catch (error) {
      console.error("OpenAI tool calling failed:", error);
      // Continue without tool calls
    }
    
    // Process tool calls
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        if (name === "exa_search" && exaApiKey) {
          console.log("Executing Exa search:", parsedArgs.query);
          const searchResults = await searchExa(parsedArgs.query, exaApiKey, parsedArgs.num_results || 3);
          citations = searchResults;
          
          if (citations.length > 0) {
            contextPrompt = "\n\nWEB SEARCH RESULTS:\n" +
              citations.map(c => 
                `[${c.id}] ${c.title}\n${c.snippet}\nURL: ${c.url}`
              ).join("\n\n") +
              `\n\nIMPORTANT INSTRUCTIONS:\n` +
              `User wants to know about: "${parsedArgs.query}"\n` +
              `1. Use ONLY the above sources to provide information about this topic\n` +
              `2. Provide a clear, informative summary based on the sources\n` +
              `3. Include inline citations like [1], [2] to reference specific information\n` +
              `4. Be concise and accurate\n` +
              `5. Do NOT give instructions on how to save/email - just provide the information itself\n` +
              `6. Do NOT add context or assumptions beyond what's in the sources\n` +
              `7. The user's actions (save to Notion, draft email, etc.) will be handled automatically with action buttons`;
          }
        }
      }
    }
    
    // For email requests, we want the LLM to provide a summary, not write the email directly
    // The email content will be generated separately for the modal preview

    // Prepare prompt for Gemini
    const systemMessage = history.find(m => m.role === "system" && m.id === "sys");
    const userMessages = history.filter(m => m.role === "user");
    const assistantMessages = history.filter(m => m.role === "assistant");
    
    // Build conversation context for Gemini
    let conversationContext = "";
    if (systemMessage) {
      conversationContext += systemMessage.content;
      
      // Add today's date to the system prompt
      const today = new Date();
      const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      conversationContext += `\n\nToday's date is ${dateString}. Use this information to provide contextually appropriate responses when the user asks about dates, schedules, or time-sensitive information.`;
      
      // Add few-shot examples based on role
      const rolePreset = ROLE_PRESETS[role as RoleKey];
      if (rolePreset && rolePreset.fewShots) {
        conversationContext += "\n\nEXAMPLES:\n\n";
        conversationContext += `User: ${rolePreset.fewShots.searchWithCitations.user}\n`;
        conversationContext += `Assistant: ${rolePreset.fewShots.searchWithCitations.assistant}\n\n`;
        conversationContext += `User: ${rolePreset.fewShots.emailDraft.user}\n`;
        conversationContext += `Assistant: ${rolePreset.fewShots.emailDraft.assistant}\n\n`;
      }
      
      if (contextPrompt || memoryContext) {
        conversationContext += contextPrompt + memoryContext;
      }
      conversationContext += "\n\n";
    }
    
    // Add conversation history
    for (let i = 0; i < Math.max(userMessages.length, assistantMessages.length); i++) {
      if (userMessages[i]) {
        conversationContext += `User: ${userMessages[i].content}\n`;
      }
      if (assistantMessages[i]) {
        conversationContext += `Assistant: ${assistantMessages[i].content}\n`;
      }
    }
    
    // Add current user message
    conversationContext += `User: ${userQuery}\nAssistant:`;

    // Call Gemini
    const assistantReply = await callGemini(conversationContext, geminiApiKey);

    // Generate action plans based on tool calls
    let plan: ActionPlan[] | undefined;
    const actions: ActionPlan[] = [];
    
    // Process tool calls for action plans
    for (const toolCall of toolCalls) {
      const { name, arguments: args } = toolCall.function;
      const parsedArgs = JSON.parse(args);
      
      if (name === "notion_create_page") {
        // Use provided content_md or fallback to assistant reply
        const content = parsedArgs.content_md || assistantReply;
        
        // Auto-generate title using OpenAI if not provided
        const title = parsedArgs.title || await generateTitle(content, openAiKey);
        
        actions.push({
          id: `action-notion-${Date.now()}`,
          action: "notion",
          label: "Save to Notion",
          params: { 
            title: title, 
            content: content,
            citations: citations || [] // Include citations in params
          },
        });
      }
      
      if (name === "gmail_create_draft") {
        // Generate email content specifically for the email draft
        const emailContent = await generateEmailContent(userQuery, assistantReply, openAiKey);
        
        // Generate subject line using LLM
        const generatedSubject = await generateEmailSubject(userQuery, emailContent, openAiKey);
        
        // Format email body as HTML for Gmail API
        const formattedBodyHTML = formatEmailBody(emailContent);
        
        actions.push({
          id: `action-gmail-${Date.now()}`,
          action: "gmail",
          label: "Draft Email",
          params: { 
            to: parsedArgs.to || [], // Use tool call params or default
            subject: parsedArgs.subject || generatedSubject,
            bodyText: parsedArgs.body_text || emailContent, // Plain text for preview
            bodyHTML: formattedBodyHTML // HTML for Gmail API
          },
        });
      }
    }
    
    // Only assign plan if we have actions
    if (actions.length > 0) {
      plan = actions;
    }

    // Generate structured answer if we have citations or actions
    let structured: StructuredAnswer | undefined;
    if ((citations && citations.length > 0) || actions.length > 0) {
      structured = await generateStructuredAnswer(userQuery, assistantReply, citations || [], openAiKey);
    }

    // Store conversation in memory if user is authenticated and mem0 is available
    if (userId && mem0ApiKey) {
      try {
        await addMemory(userId, role, [
          { role: "user", content: userQuery },
          { role: "assistant", content: assistantReply }
        ], mem0ApiKey);
      } catch (error) {
        console.error("Memory storage failed:", error);
        // Continue without storing memory
      }
    }

    // Build response
    const response: ResponseBody = {
      id: `msg-${Date.now()}`,
      content: assistantReply,
      citations: citations && citations.length > 0 ? citations : undefined,
      plan,
      structured,
      metadata: {
        intent: intentResult.intent,
        topic: intentResult.slots.topic,
        toolCalls: toolCallNames
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});