import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCustomMe } from "@/lib/customAuth";
import { logoSource } from "@/lib/logo";

export default function Index() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function route() {
      const me = await getCustomMe();
      if (!me) {
        router.replace("/(auth)/login");
        return;
      }
      if (cancelled) return;
      router.replace("/dashboard");
    }

    route().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  return <LoadingScreen logoSource={logoSource} />;
}
