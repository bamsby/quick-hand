import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "./supabase";
import type { IntegrationStatus } from "./types";

// Enable this for better UX on iOS
WebBrowser.maybeCompleteAuthSession();

const NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize";

/**
 * Check if the current user has a valid Notion connection
 */
export async function checkNotionConnection(): Promise<IntegrationStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<IntegrationStatus>(
      "notion-auth-status"
    );

    if (error) {
      console.error("Check Notion connection error:", error);
      return { connected: false };
    }

    return data || { connected: false };
  } catch (error) {
    console.error("Check Notion connection failed:", error);
    return { connected: false };
  }
}

/**
 * Initiate Notion OAuth flow
 * Opens browser for user to authorize, then exchanges code for token
 */
export async function initiateNotionOAuth(): Promise<{
  success: boolean;
  workspaceName?: string;
  error?: string;
}> {
  try {
    // Get the current session to pass user context
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "No user session found" };
    }

    // Create redirect URI based on environment
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "quickhand",
      path: "oauth/notion",
    });

    console.log("Redirect URI:", redirectUri);

    // Get Notion client ID from environment (public key is safe)
    const clientId = process.env.EXPO_PUBLIC_NOTION_CLIENT_ID;
    if (!clientId) {
      console.error("EXPO_PUBLIC_NOTION_CLIENT_ID not set");
      return { success: false, error: "OAuth not configured" };
    }

    // Build authorization URL
    const authUrl = `${NOTION_AUTH_URL}?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    console.log("Opening Notion OAuth URL...");

    // Open browser for authorization
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success") {
      console.log("OAuth cancelled or failed:", result.type);
      return { success: false, error: "Authorization cancelled" };
    }

    // Extract authorization code from redirect URL
    const url = result.url;
    const params = new URL(url).searchParams;
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error from Notion:", error);
      return { success: false, error: `Notion error: ${error}` };
    }

    if (!code) {
      console.error("No authorization code received");
      return { success: false, error: "No authorization code received" };
    }

    console.log("Got authorization code, exchanging for token...");

    // Exchange code for access token via Edge Function
    const { data, error: exchangeError } = await supabase.functions.invoke<{
      success: boolean;
      workspaceName?: string;
      error?: string;
    }>("notion-oauth-callback", {
      body: { code, redirectUri },
    });

    if (exchangeError || !data?.success) {
      console.error("Token exchange error:", exchangeError || data?.error);
      return {
        success: false,
        error: data?.error || "Failed to connect to Notion",
      };
    }

    console.log("✓ Notion connected successfully:", data.workspaceName);
    return {
      success: true,
      workspaceName: data.workspaceName,
    };
  } catch (error) {
    console.error("Notion OAuth error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

