"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, TextField, theme } from "@shapers/ui";
import { confirmPickup, getOpenCheckins } from "@shapers/api-client";
import type { OpenCheckin } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function PickupPage() {
  const [open, setOpen] = useState<OpenCheckin[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const result = await getOpenCheckins(getSupabaseClient());
    setOpen(result);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  async function onConfirm(checkinId: string) {
    setError(null);
    setLoading(true);
    try {
      await confirmPickup(getSupabaseClient(), checkinId, token.trim());
      setActiveId(null);
      setToken("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return <LoadingScreen logoSource={logoSource} />;

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Pickup
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Currently checked in.
      </Text>
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      {open.length === 0 ? (
        <Text style={{ color: theme.color.textMuted }}>No one is currently checked in.</Text>
      ) : (
        open.map(({ checkin, child }) => (
          <View
            key={checkin.id}
            style={{
              paddingVertical: theme.spacing(4),
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {child.first_name} {child.last_name}
            </Text>
            <Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: theme.spacing(2) }}>
              Checked in {new Date(checkin.checked_in_at).toLocaleTimeString()}
            </Text>

            {activeId === checkin.id ? (
              <View>
                <TextField
                  label="Scan or type their QR code to confirm"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoFocus
                />
                <Button
                  title="Confirm pickup"
                  onPress={() => onConfirm(checkin.id)}
                  loading={loading}
                  disabled={!token.trim()}
                />
              </View>
            ) : (
              <Button
                title="Release"
                variant="secondary"
                onPress={() => {
                  setActiveId(checkin.id);
                  setToken("");
                  setError(null);
                }}
              />
            )}
          </View>
        ))
      )}
      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/checkin/scan">Go to check-in</Link>
      </View>
    </Screen>
  );
}
