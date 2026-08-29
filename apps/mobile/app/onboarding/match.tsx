import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text, TextField, theme } from "@shapers/ui";
import { becomeMember, getDefaultChurch, matchPerson } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { clearPendingInviteCode, getPendingInviteCode } from "@/lib/pendingInvite";

interface ErrorInfo {
  code: string;
  message: string;
  nextSteps?: string;
}

function parseError(err: unknown): ErrorInfo {
  const errorMessage = err instanceof Error ? err.message : "Something went wrong";

  if (
    errorMessage.includes("no matching Planning Center person") ||
    errorMessage.includes("No person found")
  ) {
    return {
      code: "PERSON_NOT_FOUND",
      message: "We couldn't find a matching record in Planning Center.",
      nextSteps:
        "Make sure your name matches exactly as it appears in Planning Center. Contact your church office if you're a new visitor or if there's a typo.",
    };
  }

  if (errorMessage.includes("pending manual review")) {
    return {
      code: "PENDING_REVIEW",
      message: "Your account is pending review by church staff.",
      nextSteps: "This usually takes 1-2 hours. You'll receive an email once approved.",
    };
  }

  if (errorMessage.includes("church") && errorMessage.includes("not found")) {
    return {
      code: "CHURCH_NOT_FOUND",
      message: "Couldn't find your church.",
      nextSteps: "Contact your church office to get started.",
    };
  }

  if (errorMessage.includes("permission") || errorMessage.includes("Permission denied")) {
    return {
      code: "PERMISSION_DENIED",
      message: "Permission denied. You may have been removed from this church.",
      nextSteps: "Contact your church office for assistance.",
    };
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: "Network connection issue.",
      nextSteps: "Check your internet connection and try again.",
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: errorMessage || "Something went wrong during onboarding.",
    nextSteps: "Please try again or contact your church office.",
  };
}

export default function MatchPersonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ churchId?: string; churchName?: string }>();
  const churchIdParam = params.churchId;

  const [churchName, setChurchName] = useState(params.churchName ?? "your church");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    if (params.churchName) return;
    // No church passed in via params (the normal case now that signup
    // doesn't need an invite code) — look up the one church that exists
    // just to show its real name instead of the generic fallback.
    getDefaultChurch(getSupabaseClient())
      .then((church) => church && setChurchName(church.name))
      .catch(() => { });
  }, [params.churchName]);

  async function onSubmit() {
    setErrorInfo(null);
    setLoading(true);
    try {
      const client = getSupabaseClient();
      const {
        data: { user },
      } = await client.auth.getUser();

      const church = churchIdParam ? { id: churchIdParam } : await getDefaultChurch(client);
      if (!church) {
        setErrorInfo({
          code: "NO_CHURCH",
          message: "Couldn't find your church.",
          nextSteps: "Contact your church admin.",
        });
        return;
      }

      await matchPerson(client, {
        churchId: church.id,
        firstName,
        lastName,
        phone: phone || undefined,
        email: user?.email ?? undefined,
      });

      // Arrived via a membership invite link (/join/[code]) — the code
      // sits in storage from before signup; redeem it now that onboarding
      // (this step) is done.
      const pendingCode = await getPendingInviteCode();
      if (pendingCode) {
        await becomeMember(client, pendingCode);
        await clearPendingInviteCode();
      }

      router.replace("/dashboard");
    } catch (err) {
      setErrorInfo(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen logoSource={logoSource}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
        You&apos;re joining {churchName}
      </Text>
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
        We&apos;ll try to match you to your existing record. If we can&apos;t, a staff member will
        review it.
      </Text>
      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {errorInfo ? (
        <View
          style={{
            marginBottom: theme.spacing(4),
            paddingHorizontal: theme.spacing(3),
            paddingVertical: theme.spacing(3),
            borderRadius: theme.radius.md,
            borderLeftWidth: 4,
            borderLeftColor: errorInfo.code === "PENDING_REVIEW" ? theme.color.warning : theme.color.danger,
            backgroundColor:
              errorInfo.code === "PENDING_REVIEW" ? `${theme.color.warning}20` : `${theme.color.danger}20`,
          }}
        >
          <Text
            style={{
              color: errorInfo.code === "PENDING_REVIEW" ? theme.color.warning : theme.color.danger,
              fontWeight: "600",
              marginBottom: theme.spacing(1),
            }}
          >
            {errorInfo.message}
          </Text>
          {errorInfo.nextSteps && (
            <Text
              style={{
                color: errorInfo.code === "PENDING_REVIEW" ? theme.color.warning : theme.color.danger,
                fontSize: 12,
              }}
            >
              {errorInfo.nextSteps}
            </Text>
          )}
        </View>
      ) : null}
      <Button
        title="Finish"
        onPress={onSubmit}
        loading={loading}
        disabled={!firstName.trim() || !lastName.trim() || loading}
      />
    </Screen>
  );
}
