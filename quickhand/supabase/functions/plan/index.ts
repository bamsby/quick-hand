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
    "hackathon", "event", "competition", "prize"
  ];
  const lowerQuery = query.toLowerCase();
  return searchKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Helper: Call Exa API for web search
async function searchExa(query: string, exaApiKey: string): Promise<Citation[]> {
  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": exaApiKey,
      },
      body: JSON.stringify({
        query,
        numResults: 5,
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
      citations = await searchExa(userQuery, exaApiKey);
      
      if (citations.length > 0) {
        contextPrompt = "\n\nWEB SEARCH RESULTS:\n" +
          citations.map(c => 
            `[${c.id}] ${c.title}\n${c.snippet}\nURL: ${c.url}`
          ).join("\n\n") +
          "\n\nInstructions: Use ONLY the above sources to answer the user's question. Include inline citations like [1], [2] in your response. Be concise and accurate.";
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

    // Simple heuristics for action suggestions
    if (lowerQuery.includes("save") || lowerQuery.includes("notion")) {
      plan = [{
        id: `action-${Date.now()}`,
        action: "notion",
        label: "Save to Notion",
        params: { title: userQuery, content: assistantReply },
      }];
    } else if (lowerQuery.includes("email") || lowerQuery.includes("draft") || lowerQuery.includes("gmail")) {
      plan = [{
        id: `action-${Date.now()}`,
        action: "gmail",
        label: "Create Gmail Draft",
        params: { subject: userQuery, body: assistantReply },
      }];
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
