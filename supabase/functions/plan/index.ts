// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for client requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  role: string;
  history: Message[];
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
}

interface ResponseBody {
  id: string;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
}

// Helper: Check if query needs web search
function needsWebSearch(query: string): boolean {
  const searchKeywords = [
    "latest", "recent", "current", "today", "news", "what is", "who is",
    "search", "find", "look up", "when did", "how much", "price", "cost",
    "hackathon", "event", "competition", "prize", "research", "about"
  ];
  const lowerQuery = query.toLowerCase();
  return searchKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Helper: Extract main topic from query (remove action phrases)
function extractMainTopic(query: string): string {
  // Remove action phrases that might confuse the LLM
  const actionPhrases = [
    /save\s+(?:to|into|in)\s+notion/gi,
    /save\s+(?:to|into|in)\s+my\s+notion/gi,
    /save\s+(?:this|it|that)/gi,
    /draft\s+(?:an?\s+)?email/gi,
    /send\s+(?:an?\s+)?email/gi,
    /create\s+(?:a\s+)?notion\s+page/gi,
    /and\s+save/gi,
    /then\s+save/gi,
  ];
  
  let cleanedQuery = query;
  actionPhrases.forEach(phrase => {
    cleanedQuery = cleanedQuery.replace(phrase, '');
  });
  
  return cleanedQuery.trim();
}

// Helper: Determine query complexity and return citation limit
function getCitationLimit(query: string): number {
  const lowerQuery = query.toLowerCase();
  
  // Complex queries (5 citations): multiple questions, comparisons, detailed analysis
  const complexIndicators = [
    "compare", "difference", "versus", "vs", "analyze", "explain in detail",
    "comprehensive", "all about", "everything", "complete guide"
  ];
  
  // Simple queries (1 citation): direct facts, definitions
  const simpleIndicators = [
    "what is", "who is", "when is", "where is", "define", "meaning of"
  ];
  
  if (complexIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 5;
  }
  
  if (simpleIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 1;
  }
  
  // Default: 3 citations for most queries
  return 3;
}

// Helper: Call Exa API for web search
async function searchExa(query: string, exaApiKey: string, limit: number): Promise<Citation[]> {
  try {
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
        contents: {
          text: { maxCharacters: 500 },
        },
      }),
    });

    if (!response.ok) {
      console.error("Exa API error:", await response.text());
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((result: any, idx: number) => ({
      id: idx + 1,
      title: result.title || "Untitled",
      url: result.url || "",
      snippet: result.text || result.snippet || "",
    }));
  } catch (error) {
    console.error("Exa search failed:", error);
    return [];
  }
}

// Helper: Call OpenAI Chat Completions
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
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
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "No response generated.";
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

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const exaApiKey = Deno.env.get("EXA_API_KEY");

    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY not set in Supabase secrets");
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
    let citations: Citation[] | undefined;
    let contextPrompt = "";

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

    // Prepare messages for OpenAI
    const openAiMessages = history
      .filter(m => m.role !== "system" || m.id === "sys") // Keep only the first system message
      .map(m => ({
        role: m.role,
        content: m.role === "system" && contextPrompt 
          ? m.content + contextPrompt 
          : m.content,
      }));

    // Call OpenAI
    const assistantReply = await callOpenAI(openAiMessages, openAiKey);

    // Detect if we should suggest actions
    let plan: ActionPlan[] | undefined;
    const lowerReply = assistantReply.toLowerCase();
    const lowerQuery = userQuery.toLowerCase();

    // Enhanced heuristics for action suggestions - can detect MULTIPLE actions
    const actions: ActionPlan[] = [];
    
    // Check for Notion action
    if (lowerQuery.includes("save") || lowerQuery.includes("notion")) {
      // Auto-generate title using OpenAI
      const generatedTitle = await generateTitle(assistantReply, openAiKey);
      
      actions.push({
        id: `action-notion-${Date.now()}`,
        action: "notion",
        label: "Save to Notion",
        params: { 
          title: generatedTitle, 
          content: assistantReply,
          citations: citations || [] // Include citations in params
        },
      });
    }
    
    // Check for Gmail action (independent check, not else-if)
    if (lowerQuery.includes("email") || lowerQuery.includes("draft") || lowerQuery.includes("gmail") || lowerQuery.includes("send")) {
      actions.push({
        id: `action-gmail-${Date.now()}`,
        action: "gmail",
        label: "Draft Email",
        params: { 
          to: "", // User will fill this in the checkpoint modal
          subject: `Re: ${userQuery.substring(0, 50)}`,
          body: assistantReply 
        },
      });
    }
    
    // Only assign plan if we have actions
    if (actions.length > 0) {
      plan = actions;
    }

    // Build response
    const response: ResponseBody = {
      id: `msg-${Date.now()}`,
      content: assistantReply,
      citations: citations && citations.length > 0 ? citations : undefined,
      plan,
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
