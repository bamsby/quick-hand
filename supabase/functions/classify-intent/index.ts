// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for client requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

interface RequestBody {
  query: string;
  role: string;
  history?: Array<{ role: string; content: string }>;
}

interface IntentResponse {
  intent: "info_lookup" | "summarize" | "email_draft" | "action_request" | "chitchat";
  slots: {
    topic: string;
    needs: {
      location: boolean;
      email: boolean;
    };
  };
}

interface NeedsInfoResponse {
  needs_info: true;
  missing: string[];
  question: string;
}

// Helper: Call OpenAI for intent classification
async function classifyIntent(
  query: string,
  role: string,
  openAiKey: string,
  history?: Array<{ role: string; content: string }>
): Promise<IntentResponse> {
  // Build conversation context from history
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content: "You are an intent classifier. Analyze the user's query and classify it into one of these intents: info_lookup (seeking information), summarize (asking for summary), email_draft (wanting to draft email), action_request (asking to perform action), chitchat (casual conversation). Extract the main topic and determine if location or email context is needed. IMPORTANT RULES: 1) If the user mentions a specific location in their query (like 'Singapore', 'New York', 'London', etc.), set needs_location to false since the location is already provided. 2) If the conversation history shows the user already provided an email address (like 'alan@gmail.com'), set needs_email to false. 3) If the user refers to 'this hackathon', 'this event', 'this conference', etc., and the conversation history contains information about a specific event, set needs_location to false since the context is already established. 4) If the user is asking to save, email, or perform actions on previously discussed topics, classify as action_request with needs_location: false."
    }
  ];
  
  // Add recent conversation history for context (last 4 messages)
  if (history && history.length > 0) {
    const recentHistory = history.slice(-4);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role === "system" ? "system" : msg.role,
      content: msg.content
    })));
  }
  
  // Add the current query
  messages.push({
    role: "user",
    content: `Query: "${query}"\nRole: ${role}`
  });
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      functions: [
        {
          name: "classify_intent",
          description: "Classify user intent and extract relevant information",
          parameters: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: ["info_lookup", "summarize", "email_draft", "action_request", "chitchat"],
                description: "The classified intent of the user's query"
              },
              topic: {
                type: "string",
                description: "The main topic or subject of the query (empty for chitchat)"
              },
              needs_location: {
                type: "boolean",
                description: "Whether the query requires location context (weather, local events, etc.). Set to false if the user refers to previously discussed events or if location is already mentioned in the query."
              },
              needs_email: {
                type: "boolean",
                description: "Whether the query requires email context (drafting emails, sending messages)"
              }
            },
            required: ["intent", "topic", "needs_location", "needs_email"]
          }
        }
      ],
      function_call: { name: "classify_intent" },
      temperature: 0.1,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const functionCall = data.choices[0]?.message?.function_call;
  
  if (!functionCall || functionCall.name !== "classify_intent") {
    throw new Error("Failed to get intent classification");
  }

  const args = JSON.parse(functionCall.arguments);
  
  return {
    intent: args.intent,
    slots: {
      topic: args.topic || "",
      needs: {
        location: args.needs_location || false,
        email: args.needs_email || false,
      },
    },
  };
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

    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY not set in Supabase secrets");
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { query, role, history } = body;

    if (!query || !role) {
      throw new Error("Query and role are required");
    }

    // Classify intent with conversation history
    const intentResult = await classifyIntent(query, role, openAiKey, history);

    console.log("Intent classification:", {
      query: query.substring(0, 100),
      intent: intentResult.intent,
      topic: intentResult.slots.topic,
      needs: intentResult.slots.needs,
    });

    // Check if we need additional information
    const missing = [];
    if (intentResult.slots.needs.location) missing.push("location");
    if (intentResult.slots.needs.email) missing.push("email");

    if (missing.length > 0) {
      const needsInfoResponse: NeedsInfoResponse = {
        needs_info: true,
        missing,
        question: missing.includes("email") ? "Who should receive the email?" : "What location are you interested in?"
      };
      
      return new Response(
        JSON.stringify(needsInfoResponse),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify(intentResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Intent classification error:", error);
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