import { supabase } from "./supabase";
import type { IntegrationStatus } from "./types";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting current session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Sign in error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign up error:", error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      user: data.user,
      needsEmailConfirmation: !data.session
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Sign out and clear session
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Reset password for email
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'quickhand://reset-password',
    });
    
    if (error) {
      console.error("Password reset error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Check integration status for current user
 */
export async function getIntegrationStatus(type: 'notion' | 'gmail'): Promise<IntegrationStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<IntegrationStatus>(
      `${type}-auth-status`
    );

    if (error) {
      console.error(`Check ${type} connection error:`, error);
      return { connected: false };
    }

    return data || { connected: false };
  } catch (error) {
    console.error(`Check ${type} connection failed:`, error);
    return { connected: false };
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session;
}
