// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Search for pages in the user's workspace
    const searchResponse = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${integration.access_token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: { 
          property: "object", 
          value: "page" 
        },
        page_size: 100,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Notion API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Notion pages" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const searchData = await searchResponse.json();
    
    // Extract page info with parent information and creation time
    const pages = searchData.results.map((page: any) => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.text?.content || 
             page.properties?.Name?.title?.[0]?.text?.content || 
             "Untitled",
      url: page.url,
      created_time: page.created_time,
      parent_type: page.parent?.type, // 'workspace', 'page_id', 'database_id', etc.
    }));

    // Sort pages: workspace-level pages first (oldest first), then child pages
    const sortedPages = pages.sort((a: any, b: any) => {
      // First priority: workspace-level pages come before child pages
      const aIsWorkspace = a.parent_type === 'workspace';
      const bIsWorkspace = b.parent_type === 'workspace';
      
      if (aIsWorkspace && !bIsWorkspace) return -1;
      if (!aIsWorkspace && bIsWorkspace) return 1;
      
      // Second priority: sort by creation time (oldest first)
      return new Date(a.created_time).getTime() - new Date(b.created_time).getTime();
    });

    // Remove metadata fields before sending to client
    const cleanedPages = sortedPages.map((page: any) => ({
      id: page.id,
      title: page.title,
      url: page.url,
    }));

    console.log(`Found ${cleanedPages.length} pages (sorted by workspace-level first, then by creation time)`);

    return new Response(
      JSON.stringify({ pages: cleanedPages }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("List pages error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

