// Shared helper for Gmail token management
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface GmailTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

/**
 * Get a valid Gmail access token for a user
 * Automatically refreshes if expired
 */
export async function getValidGmailToken(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: true; accessToken: string } | { success: false; error: string }> {
  try {
    // Fetch user's Gmail integration from database
    const { data: integration, error: fetchError } = await supabase
      .from("user_integrations")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .eq("integration_type", "gmail")
      .single();

    if (fetchError || !integration) {
      console.error("No Gmail integration found:", fetchError);
      return { success: false, error: "Gmail not connected" };
    }

    const { access_token, refresh_token, token_expires_at } = integration;

    if (!refresh_token) {
      return { success: false, error: "No refresh token available" };
    }

    // Check if token is still valid (with 5 min buffer)
    const expiresAt = new Date(token_expires_at);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() > now.getTime() + bufferMs) {
      // Token is still valid
      console.log("✓ Using existing access token");
      return { success: true, accessToken: access_token };
    }

    // Token expired or expiring soon, refresh it
    console.log("Token expired or expiring, refreshing...");

    const clientId = Deno.env.get("GMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Gmail OAuth credentials not configured");
      return { success: false, error: "OAuth not configured" };
    }

    // Refresh the token
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("Token refresh failed:", errorText);
      return { success: false, error: "Failed to refresh token" };
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600; // Default 1 hour

    // Calculate new expiry time
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Update database with new token
    const { error: updateError } = await supabase
      .from("user_integrations")
      .update({
        access_token: newAccessToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("integration_type", "gmail");

    if (updateError) {
      console.error("Failed to update token:", updateError);
      return { success: false, error: "Failed to store refreshed token" };
    }

    console.log("✓ Token refreshed successfully");
    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

