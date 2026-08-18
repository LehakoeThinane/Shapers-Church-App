"use client";

import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getEvents, rsvpToEvent } from "@shapers/api-client";
import type { CurrentUser, EventWithRsvp } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

const STATUSES: { key: "going" | "maybe" | "declined"; label: string }[] = [
  { key: "going", label: "Going" },
  { key: "maybe", label: "Maybe" },
  { key: "declined", label: "Can't go" },
];

// Hardcoded poster-per-event, matched by title — event has no image
// column (neither does announcement), and adding real image management
// is a bigger piece than this needs right now. Swap for a real
// event.poster_url column once there's an admin screen to upload one;
// same stopgap approach as the dashboard's series banner. aspectRatio is
// each poster's real dimensions (they're not uniform — one's a square
// Instagram post, the other's a 4:5 portrait flyer).
const EVENT_POSTERS: Record<string, { uri: string; aspectRatio: number }> = {
  "Expository Preaching Academy 2026": { uri: "/epa-poster.jpg", aspectRatio: 1254 / 1254 },
  "Shapers 2026 Conference": { uri: "/conference-poster.jpg", aspectRatio: 1281 / 1600 },
};

export default function EventsPage() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<EventWithRsvp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const client = getSupabaseClient();
    const [currentUser, eventList] = await Promise.all([getCurrentUser(client), getEvents(client)]);
    setMe(currentUser);
    setEvents(eventList);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  async function onRsvp(eventId: string, status: "going" | "maybe" | "declined") {
    if (!me) return;
    setError(null);
    setSavingId(eventId);
    try {
      await rsvpToEvent(getSupabaseClient(), me.person.church_id, eventId, me.person.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingId(null);
    }
  }

  if (error) {
    return (
      <AuthenticatedScreen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </AuthenticatedScreen>
    );
  }

  if (!events || !me) return <LoadingScreen logoSource={logoSource} />;

  return (
    <AuthenticatedScreen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Upcoming events
      </Text>
      {events.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No upcoming events.</Text>
      ) : (
        events.map(({ event, myRsvp }) => {
          const poster = EVENT_POSTERS[event.title];
          return (
          <GlassCard key={event.id} style={{ marginBottom: theme.spacing(4) }}>
            {poster ? (
              // react-native's Image type has no `alt` prop (only RN-Web's runtime does, via accessibilityLabel) — see components/QrCode.tsx
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                source={{ uri: poster.uri }}
                accessibilityLabel={`${event.title} poster`}
                resizeMode="cover"
                style={{
                  width: "100%",
                  aspectRatio: poster.aspectRatio,
                  borderRadius: theme.radius.md,
                  marginBottom: theme.spacing(3),
                }}
              />
            ) : null}
            <Text style={{ fontWeight: "600" }}>{event.title}</Text>
            <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
              {new Date(event.starts_at).toLocaleString()}
              {event.location ? ` · ${event.location}` : ""}
            </Text>
            {event.description ? <Text style={{ marginBottom: theme.spacing(2) }}>{event.description}</Text> : null}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {STATUSES.map((s) => (
                <Button
                  key={s.key}
                  title={s.label}
                  variant={myRsvp?.status === s.key ? "primary" : "secondary"}
                  loading={savingId === event.id}
                  onPress={() => onRsvp(event.id, s.key)}
                />
              ))}
            </View>
          </GlassCard>
          );
        })
      )}
    </AuthenticatedScreen>
  );
}
