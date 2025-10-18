import { useEffect, useState } from "react";
import { ROLE_PRESETS } from "./roles";
import { supabase } from "./supabase";
import { isAuthenticated } from "./auth-helpers";

/**
 * Hook to manage app launch state and authentication.
 * Returns { isReady, isAuthenticated } when app is ready to show content.
 */
export function useAppLaunch(minSplashDuration: number = 1500, authTrigger: number = 0): { 
  isReady: boolean; 
  isAuthenticated: boolean; 
} {
  const [isReady, setIsReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    async function prepare() {
      const startTime = Date.now();
      
      try {
        // Preload role presets (validation check)
        const roleCount = Object.keys(ROLE_PRESETS).length;
        if (roleCount === 0) {
          console.warn("No role presets found!");
        } else {
          console.log(`✓ Loaded ${roleCount} role presets`);
        }

        // Check authentication status
        const authenticated = await isAuthenticated();
        setIsAuth(authenticated);
        
        if (authenticated) {
          console.log("✓ User is authenticated");
        } else {
          console.log("User needs to authenticate");
        }

        // You can add more preload tasks here:
        // - Fetch remote config
        // - Initialize analytics
        // - Cache critical assets

        // Ensure minimum splash duration for better UX
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minSplashDuration - elapsed);
        
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      } catch (error) {
        console.error("App launch preparation error:", error);
        // Still mark as ready even if preload fails
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [minSplashDuration, authTrigger]);

  return { isReady, isAuthenticated: isAuth };
}

