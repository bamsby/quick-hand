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
}

interface NotionBlock {
  object: "block";
  type: string;
  [key: string]: any;
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
          rich_text: [{ type: "text", text: { content: para.substring(2) } }],
        },
      });
    } else if (para.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: para.substring(3) } }],
        },
      });
    } else if (para.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: para.substring(4) } }],
        },
      });
    } else {
      // Regular paragraph
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: para } }],
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
    const { title, content } = body;

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Creating Notion page:", title);

    // Convert content to Notion blocks
    const blocks = contentToNotionBlocks(content || "");

    // First, search for a page to use as parent (find user's top-level pages)
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

    let parentId = null;
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.results && searchData.results.length > 0) {
        parentId = searchData.results[0].id;
        console.log("Found parent page:", parentId);
      }
    }

    // Prepare the page creation payload
    const pagePayload: any = {
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: blocks.slice(0, 100), // Notion API has a limit of 100 blocks per request
    };

    // Set parent - use found page or create as standalone
    if (parentId) {
      pagePayload.parent = { page_id: parentId };
    } else {
      // Create as a standalone page in the workspace
      pagePayload.parent = { type: "page_id", page_id: null };
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

