"use client";

import { useState } from "react";
import Link from "next/link";
import { View } from "react-native";
import { Button, GlassCard, Screen, Text, TextField, theme } from "@shapers/ui";
import { scanCheckin } from "@shapers/api-client";
import type { CheckinScanResult } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function ScanCheckinPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinScanResult | null>(null);

  async function onSubmit() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const scan = await scanCheckin(getSupabaseClient(), token.trim());
      setResult(scan);
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Check in
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        Scan or type the code from the parent&apos;s phone.
      </Text>
      <TextField
        label="QR code"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoFocus
      />
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      <Button title="Check in" onPress={onSubmit} loading={loading} disabled={!token.trim()} />

      {result ? (
        <GlassCard style={{ marginTop: theme.spacing(8), alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {result.firstName} {result.lastName} checked in
          </Text>
          <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(2) }}>
            Security code
          </Text>
          <Text style={{ fontSize: 40, fontWeight: "700", letterSpacing: 4 }}>
            {result.securityCode}
          </Text>
        </GlassCard>
      ) : null}

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/checkin/pickup">Go to pickup</Link>
      </View>
    </Screen>
  );
}
