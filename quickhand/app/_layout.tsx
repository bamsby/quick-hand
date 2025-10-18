import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout() {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "QuickHand • Roles" }} />
        <Stack.Screen name="chat" options={{ title: "QuickHand • Chat" }} />
      </Stack>
    </QueryClientProvider>
  );
}

