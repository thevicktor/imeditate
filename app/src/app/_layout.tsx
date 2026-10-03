import { Stack } from "expo-router";
import { SessionProvider } from "../session";
import { C } from "../theme";

export default function Layout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.navy },
        }}
      />
    </SessionProvider>
  );
}
