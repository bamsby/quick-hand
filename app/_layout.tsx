import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAppLaunch } from "../lib/use-app-launch";
import { SplashScreen } from "../lib/ui/splash-screen";
import { AuthModal } from "../lib/ui/auth-modal";

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  const [authTrigger, setAuthTrigger] = useState(0);
  const { isReady, isAuthenticated } = useAppLaunch(1500, authTrigger); // Show splash for minimum 1.5 seconds

  // Reset auth success state when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      setAuthTrigger(0);
    }
  }, [isAuthenticated]);

  // Show splash screen while app is initializing
  if (!isReady) {
    return <SplashScreen />;
  }

  // Show authentication modal if user is not authenticated
  if (!isAuthenticated) {
    return (
      <AuthModal 
        onAuthSuccess={() => {
          setAuthTrigger(prev => prev + 1);
        }} 
      />
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "QuickHand • Roles" }} />
        <Stack.Screen name="chat" options={{ title: "QuickHand • Chat" }} />
      </Stack>
    </QueryClientProvider>
  );
}

