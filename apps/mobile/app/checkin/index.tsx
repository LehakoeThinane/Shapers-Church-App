import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getMyCheckinTags } from "@shapers/api-client";
import type { MyCheckinTag } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function CheckinTagsScreen() {
  const [tags, setTags] = useState<MyCheckinTag[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyCheckinTags(getSupabaseClient())
      .then((result) => {
        if (!cancelled) setTags(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!tags) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        This week&apos;s check-in codes
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Show one of these to staff at drop-off. Each code stops working once the week rolls
        over.
      </Text>
      {tags.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>
          No check-in codes yet — these are generated weekly for children on file.
        </Text>
      ) : (
        tags.map(({ tag, child }) => (
          <View
            key={tag.id}
            style={{
              alignItems: "center",
              marginBottom: theme.spacing(8),
              paddingBottom: theme.spacing(6),
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: theme.spacing(3) }}>
              {child.first_name} {child.last_name}
            </Text>
            <QRCode value={tag.qr_token} size={200} />
            <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(3), fontSize: 12 }}>
              Expires {new Date(tag.expires_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
      <Link href="/dashboard">Back to dashboard</Link>
    </Screen>
  );
}
