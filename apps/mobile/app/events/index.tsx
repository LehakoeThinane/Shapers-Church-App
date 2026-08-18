import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getEvents, rsvpToEvent } from "@shapers/api-client";
import type { CurrentUser, EventWithRsvp } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

const STATUSES: { key: "going" | "maybe" | "declined"; label: string }[] = [
  { key: "going", label: "Going" },
  { key: "maybe", label: "Maybe" },
  { key: "declined", label: "Can't go" },
];

export default function EventsScreen() {
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
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!events || !me) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Upcoming events
      </Text>
      {events.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No upcoming events.</Text>
      ) : (
        events.map(({ event, myRsvp }) => (
          <View
            key={event.id}
            style={{
              paddingVertical: theme.spacing(4),
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
            }}
          >
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
          </View>
        ))
      )}
      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </View>
    </Screen>
  );
}
