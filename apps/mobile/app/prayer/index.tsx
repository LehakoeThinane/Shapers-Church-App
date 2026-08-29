import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, TextField, theme } from "@shapers/ui";
import { approvePrayerRequest, getCurrentUser, getPrayerRequests, submitPrayerRequest } from "@shapers/api-client";
import type { CurrentUser, PrayerRequestForDisplay } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function PrayerScreen() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [requests, setRequests] = useState<PrayerRequestForDisplay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function load() {
    const client = getSupabaseClient();
    const [currentUser, requestList] = await Promise.all([getCurrentUser(client), getPrayerRequests(client)]);
    setMe(currentUser);
    setRequests(requestList);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"));
  }, []);

  async function onSubmit() {
    if (!me) return;
    setError(null);
    setSubmitting(true);
    try {
      await submitPrayerRequest(getSupabaseClient(), me.person.church_id, me.person.id, requestText, isAnonymous);
      setRequestText("");
      setIsAnonymous(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function onApprove(requestId: string) {
    setError(null);
    setApprovingId(requestId);
    try {
      await approvePrayerRequest(getSupabaseClient(), requestId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setApprovingId(null);
    }
  }

  if (error) {
    return (
      <Screen logoSource={logoSource}>
        <Text style={{ color: theme.color.danger }}>{error}</Text>
      </Screen>
    );
  }

  if (!requests || !me) return <LoadingScreen logoSource={logoSource} />;

  const isAdmin = me.roleAssignments.some((ra) => ra.role === "admin");
  const myPending = requests.filter((r) => !r.request.is_approved && r.request.submitted_by === me.person.id);
  const othersPending = requests.filter(
    (r) => !r.request.is_approved && r.request.submitted_by !== me.person.id
  );
  const approved = requests.filter((r) => r.request.is_approved);

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
        Prayer wall
      </Text>

      <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Submit a request</Text>
      <TextField label="Your request" value={requestText} onChangeText={setRequestText} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing(4),
        }}
      >
        <Text
          onPress={() => setIsAnonymous((v) => !v)}
          style={{ color: isAnonymous ? theme.color.primary : theme.color.textMuted }}
        >
          {isAnonymous ? "☑" : "☐"} Submit anonymously
        </Text>
      </View>
      <Button title="Submit" onPress={onSubmit} loading={submitting} disabled={!requestText.trim()} />

      {myPending.length > 0 ? (
        <View style={{ marginTop: theme.spacing(8) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
            Your requests awaiting approval
          </Text>
          {myPending.map(({ request }) => (
            <View
              key={request.id}
              style={{
                paddingVertical: theme.spacing(3),
                borderBottomWidth: 1,
                borderBottomColor: theme.color.border,
              }}
            >
              <Text>{request.request_text}</Text>
              <Text style={{ color: theme.color.textMuted }}>Awaiting approval</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isAdmin && othersPending.length > 0 ? (
        <View style={{ marginTop: theme.spacing(8) }}>
          <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
            Pending approval ({othersPending.length})
          </Text>
          {othersPending.map(({ request, submitterName }) => (
            <View
              key={request.id}
              style={{
                paddingVertical: theme.spacing(3),
                borderBottomWidth: 1,
                borderBottomColor: theme.color.border,
              }}
            >
              <Text>{request.request_text}</Text>
              <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(2) }}>
                {request.is_anonymous ? "Anonymous" : submitterName ?? "Unknown"}
              </Text>
              <Button
                title="Approve"
                variant="secondary"
                loading={approvingId === request.id}
                onPress={() => onApprove(request.id)}
              />
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing(8) }}>
        <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Requests</Text>
        {approved.length === 0 ? (
          <Text style={{ color: theme.color.textMuted }}>No approved requests yet.</Text>
        ) : (
          approved.map(({ request, submitterName }) => (
            <View
              key={request.id}
              style={{
                paddingVertical: theme.spacing(3),
                borderBottomWidth: 1,
                borderBottomColor: theme.color.border,
              }}
            >
              <Text>{request.request_text}</Text>
              <Text style={{ color: theme.color.textMuted }}>
                {request.is_anonymous ? "Anonymous" : submitterName ?? "A church member"}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ marginTop: theme.spacing(6) }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </View>
    </Screen>
  );
}
