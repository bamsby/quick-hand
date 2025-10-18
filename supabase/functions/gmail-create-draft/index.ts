// @deno-types="npm:@types/node"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidGmailToken } from "../_shared/gmail-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  to: string;
  subject: string;
  body: string;
  citations?: Array<{
    id: number;
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface GmailDraftResponse {
  id: string;
  message: {
    id: string;
    threadId: string;
    labelIds: string[];
  };
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

    // Parse request body
    const body: RequestBody = await req.json();
    const { to, subject, body: bodyHTML, citations } = body;

    console.log("Gmail create draft request:", { to, subject, bodyLength: bodyHTML?.length, citationsCount: citations?.length });

    if (!to || !subject || !bodyHTML) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Creating Gmail draft for:", to);

    // Format body with citations if provided
    let finalBodyHTML = bodyHTML;
    if (citations && citations.length > 0) {
      const citationsHTML = citations.map(citation => 
        `<p><strong>[${citation.id}] ${citation.title}</strong><br>
        <a href="${citation.url}" target="_blank">${citation.url}</a></p>`
      ).join('');
      
      finalBodyHTML += `<br><br><hr><h3>Sources</h3>${citationsHTML}`;
    }

    // Get valid access token (auto-refreshes if needed)
    const tokenResult = await getValidGmailToken(supabase, user.id);
    if (!tokenResult.success) {
      console.error("Failed to get valid token:", tokenResult.error);
      return new Response(
        JSON.stringify({ error: tokenResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const accessToken = tokenResult.accessToken;

    // Build RFC 2822 email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      finalBodyHTML,
    ].join("\r\n");

    // Base64url encode (Gmail API requirement)
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const base64 = btoa(String.fromCharCode(...data));
    const base64url = base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    console.log("Sending draft to Gmail API...");

    // Create draft via Gmail API
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            raw: base64url,
          },
        }),
      }
    );

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error("Gmail API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create draft in Gmail" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const draftData: GmailDraftResponse = await gmailResponse.json();
    console.log("✓ Draft created:", draftData.id);

    // Construct Gmail draft URL
    const draftUrl = `https://mail.google.com/mail/u/0/#drafts?compose=${draftData.message.id}`;

    return new Response(
      JSON.stringify({
        draftUrl,
        messageId: draftData.message.id,
        threadId: draftData.message.threadId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gmail draft creation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

