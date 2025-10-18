import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "./supabase";
import type { IntegrationStatus } from "./types";

// Enable this for better UX on iOS
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Check if the current user has a valid Gmail connection
 */
export async function checkGmailConnection(): Promise<IntegrationStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<IntegrationStatus>(
      "gmail-auth-status"
    );

    if (error) {
      console.error("Check Gmail connection error:", error);
      return { connected: false };
    }

    return data || { connected: false };
  } catch (error) {
    console.error("Check Gmail connection failed:", error);
    return { connected: false };
  }
}

/**
 * Initiate Gmail OAuth flow
 * Opens browser for user to authorize, then exchanges code for token
 */
export async function initiateGmailOAuth(): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  try {
    // Get the current session to pass user context
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "No user session found" };
    }

    // Use Expo's auth proxy for redirect
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
      path: "oauth/gmail",
    });

    console.log("Redirect URI:", redirectUri);

    // Get Gmail client ID from environment (public key is safe)
    const clientId = process.env.EXPO_PUBLIC_GMAIL_CLIENT_ID;
    if (!clientId) {
      console.error("EXPO_PUBLIC_GMAIL_CLIENT_ID not set");
      return { success: false, error: "OAuth not configured" };
    }

    // Build authorization URL with required parameters for refresh token
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline", // Required for refresh token
      prompt: "consent", // Force consent to ensure refresh token
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${authParams.toString()}`;

    console.log("Opening Gmail OAuth URL...");

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
      console.error("OAuth error from Google:", error);
      return { success: false, error: `Google error: ${error}` };
    }

    if (!code) {
      console.error("No authorization code received");
      return { success: false, error: "No authorization code received" };
    }

    console.log("Got authorization code, exchanging for token...");

    // Exchange code for access token via Edge Function
    const { data, error: exchangeError } = await supabase.functions.invoke<{
      success: boolean;
      email?: string;
      error?: string;
    }>("gmail-oauth-callback", {
      body: { code, redirectUri },
    });

    if (exchangeError || !data?.success) {
      console.error("Token exchange error:", exchangeError || data?.error);
      return {
        success: false,
        error: data?.error || "Failed to connect to Gmail",
      };
    }

    console.log("✓ Gmail connected successfully:", data.email);
    return {
      success: true,
      email: data.email,
    };
  } catch (error) {
    console.error("Gmail OAuth error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

