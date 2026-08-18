"use client";

import { useEffect, useState } from "react";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getAnnouncements } from "@shapers/api-client";
import type { Announcement } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements(getSupabaseClient())
      .then((result) => {
        if (!cancelled) setAnnouncements(result);
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
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!announcements) return <LoadingScreen logoSource={logoSource} />;

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Announcements
      </Text>
      {announcements.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No announcements yet.</Text>
      ) : (
        announcements.map((a) => (
          <GlassCard key={a.id} style={{ marginBottom: theme.spacing(3) }}>
            <Text style={{ fontWeight: "600", marginBottom: theme.spacing(1) }}>{a.title}</Text>
            <Text>{a.body}</Text>
          </GlassCard>
        ))
      )}
    </AuthenticatedScreen>
  );
}
