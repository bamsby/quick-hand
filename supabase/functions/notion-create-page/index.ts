// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  title: string;
  content: string;
  parentPageId?: string;
  citations?: Array<{
    id: number;
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface NotionBlock {
  object: "block";
  type: string;
  [key: string]: any;
}

// Helper: Parse markdown bold (**text**) into Notion rich_text
function parseRichText(text: string): Array<any> {
  const richText: Array<any> = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      richText.push({
        type: "text",
        text: { content: text.substring(lastIndex, match.index) }
      });
    }
    // Add bold text
    richText.push({
      type: "text",
      text: { content: match[1] },
      annotations: { bold: true }
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    richText.push({
      type: "text",
      text: { content: text.substring(lastIndex) }
    });
  }

  return richText.length > 0 ? richText : [{ type: "text", text: { content: text } }];
}

// Helper: Convert markdown-like content to Notion blocks
function contentToNotionBlocks(content: string): NotionBlock[] {
  const blocks: NotionBlock[] = [];
  const paragraphs = content.split("\n\n");

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    // Handle headers
    if (para.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: parseRichText(para.substring(2)),
        },
      });
    } else if (para.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: parseRichText(para.substring(3)),
        },
      });
    } else if (para.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: parseRichText(para.substring(4)),
        },
      });
    } else {
      // Regular paragraph - parse rich text for bold formatting
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: parseRichText(para),
        },
      });
    }
  }

  return blocks;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Get user error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Get user's Notion token
    const { data: integration, error: integrationError } = await supabase
      .from("user_integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("integration_type", "notion")
      .single();

    if (integrationError || !integration) {
      console.error("No Notion integration found:", integrationError);
      return new Response(
        JSON.stringify({ error: "Notion not connected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { title, content, parentPageId, citations } = body;

    console.log("Notion create page request:", { title, contentLength: content?.length, citationsCount: citations?.length });

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Creating Notion page:", title, "Parent:", parentPageId || "workspace root");

    // Format content with citations appended
    let fullContent = content || "";
    if (citations && citations.length > 0) {
      fullContent += "\n\n## Sources\n\n";
      citations.forEach((citation) => {
        fullContent += `**[${citation.id}] ${citation.title}**\n`;
        fullContent += `${citation.url}\n\n`;
      });
    }

    // Convert content to Notion blocks
    const blocks = contentToNotionBlocks(fullContent);

    // Prepare the page creation payload
    const pagePayload: any = {
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: blocks.slice(0, 100), // Notion API has a limit of 100 blocks per request
    };

    // Set parent - use provided parent page ID or workspace root
    if (parentPageId) {
      pagePayload.parent = { page_id: parentPageId };
    } else {
      // If no parent specified, search for a default parent
      const searchResponse = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${integration.access_token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: { property: "object", value: "page" },
          page_size: 1,
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          pagePayload.parent = { page_id: searchData.results[0].id };
          console.log("Using default parent page:", searchData.results[0].id);
        }
      }
    }

    // Create page in Notion
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${integration.access_token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(pagePayload),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("Notion API error:", errorText);
      
      // Parse error for better user feedback
      let errorMessage = "Failed to create Notion page";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Use default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const pageData = await notionResponse.json();
    console.log("✓ Notion page created:", pageData.id);

    return new Response(
      JSON.stringify({ pageUrl: pageData.url, pageId: pageData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Create page error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

