import { useRef, useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, GlassCard, Screen, TextField, theme } from "@shapers/ui";
import { scanCheckin } from "@shapers/api-client";
import type { CheckinScanResult } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function ScanCheckinScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinScanResult | null>(null);
  // onBarcodeScanned can fire multiple times for the same code before the
  // camera view unmounts — guard against submitting the same scan twice.
  const submittedRef = useRef(false);

  async function submitToken(token: string) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setScanning(false);
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const scan = await scanCheckin(getSupabaseClient(), token.trim());
      setResult(scan);
      setManualToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function startScanning() {
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) return;
    }
    submittedRef.current = false;
    setResult(null);
    setError(null);
    setScanning(true);
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        Check in
      </Text>

      {scanning && permission?.granted ? (
        <View
          style={{
            height: 260,
            borderRadius: theme.radius.md,
            overflow: "hidden",
            marginBottom: theme.spacing(4),
          }}
        >
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(event) => submitToken(event.data)}
          />
        </View>
      ) : (
        <View style={{ marginBottom: theme.spacing(4) }}>
          <Button title="Scan with camera" variant="secondary" onPress={startScanning} />
        </View>
      )}

      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
        Or type the code
      </Text>
      <TextField
        label="QR code"
        value={manualToken}
        onChangeText={setManualToken}
        autoCapitalize="none"
      />
      {error ? (
        <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>{error}</Text>
      ) : null}
      <Button
        title="Check in"
        onPress={() => {
          submittedRef.current = false;
          submitToken(manualToken);
        }}
        loading={loading}
        disabled={!manualToken.trim()}
      />

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
