// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  code: string;
  redirectUri: string;
}

interface NotionTokenResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string;
  owner: {
    type: string;
    user?: {
      id: string;
      name: string;
      avatar_url: string;
      type: string;
      person: {
        email: string;
      };
    };
  };
  duplicated_template_id?: string;
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
        JSON.stringify({ success: false, error: "No authorization header" }),
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
        JSON.stringify({ success: false, error: "Invalid user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing code or redirectUri" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get Notion OAuth credentials
    const clientId = Deno.env.get("NOTION_CLIENT_ID");
    const clientSecret = Deno.env.get("NOTION_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Notion OAuth credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OAuth not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Exchanging code for access token...");

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Notion token exchange error:", errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to exchange code for token" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const tokenData: NotionTokenResponse = await tokenResponse.json();

    console.log("✓ Got access token for workspace:", tokenData.workspace_name);

    // Store token in user_integrations table
    const { error: insertError } = await supabase
      .from("user_integrations")
      .upsert({
        user_id: user.id,
        integration_type: "notion",
        access_token: tokenData.access_token,
        workspace_id: tokenData.workspace_id,
        workspace_name: tokenData.workspace_name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,integration_type",
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to store integration" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("✓ Notion integration stored successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        workspaceName: tokenData.workspace_name,
        workspaceId: tokenData.workspace_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

