import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAppLaunch } from "../lib/use-app-launch";
import { SplashScreen } from "../lib/ui/splash-screen";

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  const isReady = useAppLaunch(1500); // Show splash for minimum 1.5 seconds

  // Show splash screen while app is initializing
  if (!isReady) {
    return <SplashScreen />;
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

