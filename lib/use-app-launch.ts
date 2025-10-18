import { useEffect, useState } from "react";
import { ROLE_PRESETS } from "./roles";
import { supabase } from "./supabase";

/**
 * Hook to manage app launch state and preload role presets.
 * Returns true when app is ready to show main content.
 */
export function useAppLaunch(minSplashDuration: number = 1500): boolean {
  const [isReady, setIsReady] = useState(false);

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

        // Initialize anonymous authentication if no session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No session found, signing in anonymously...");
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.error("Anonymous sign-in error:", error);
          } else {
            console.log("✓ Anonymous user created:", data.user?.id);
          }
        } else {
          console.log("✓ Existing session found:", session.user.id);
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
  }, [minSplashDuration]);

  return isReady;
}

