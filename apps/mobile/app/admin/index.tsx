import { useEffect, useState } from "react";
import { useRouter, Link } from "expo-router";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getSyncFailures, retrySyncFailure, type SyncFailure } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function AdminScreen() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncFailures, setSyncFailures] = useState<SyncFailure[]>([]);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const client = getSupabaseClient();
        getCurrentUser(client)
            .then(async (result) => {
                if (cancelled) return;
                if (!result) {
                    router.replace("/onboarding/match");
                    return;
                }

                const isAdmin = result.roleAssignments.some((ra) => ra.role === "admin");
                if (!isAdmin) {
                    router.replace("/dashboard");
                    return;
                }

                setMe(result);
                const failures = await getSyncFailures(client, result.person.church_id);
                if (!cancelled) setSyncFailures(failures);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Something went wrong");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function retry(failure: SyncFailure) {
        setRetryingId(failure.id); setError(null);
        try { await retrySyncFailure(getSupabaseClient(), failure.kind, failure.id, failure.church_id); setSyncFailures((current) => current.filter((item) => item.id !== failure.id)); }
        catch (err) { setError(err instanceof Error ? err.message : "Failed to retry sync."); }
        finally { setRetryingId(null); }
    }

    if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

    if (error) {
        return (
            <Screen logoSource={logoSource}>
                <Text style={{ color: theme.color.danger }}>{error}</Text>
            </Screen>
        );
    }

    return (
        <Screen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>
                ← Back
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
                Admin Dashboard
            </Text>

            <View style={{ marginBottom: theme.spacing(4) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Quick Actions</Text>

                <Link href="/admin/invite" style={{ marginBottom: theme.spacing(2) }}>
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>
                        Invite a member →
                    </Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                        Share invite link for new members
                    </Text>
                </Link>

                <View
                    style={{
                        marginTop: theme.spacing(3),
                        borderTopWidth: 1,
                        borderTopColor: theme.color.border,
                        paddingTop: theme.spacing(2),
                    }}
                >
                    <Link href="/admin/integrations">
                        <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>
                            Church integrations →
                        </Text>
                        <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                            Connect Planning Center, manage syncs
                        </Text>
                    </Link>
                </View>
                <Link href="/admin/new-here" style={{ marginTop: theme.spacing(3) }}>
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>New Here content →</Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Edit the public welcome page</Text>
                </Link>
                <Link href="/admin/sermons" style={{ marginTop: theme.spacing(3) }}>
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>Sermon library →</Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Add drafts and publish sermon media</Text>
                </Link>
                <Link href="/admin/growth-track" style={{ marginTop: theme.spacing(3) }}>
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>Growth Track →</Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Build stages and add journey lessons</Text>
                </Link>
                <Link href="/admin/assessment" style={{ marginTop: theme.spacing(3) }}>
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>Purpose assessment →</Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Create weighted gift questions</Text>
                </Link>
            </View>

            <View style={{ marginBottom: theme.spacing(4) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Sync Status</Text>
                {syncFailures.length === 0 ? <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>✓ No failed syncs right now</Text> : syncFailures.map((failure) => <View key={failure.id} style={{ marginBottom: theme.spacing(3) }}><Text style={{ fontWeight: "500", marginBottom: 3 }}>{failure.title}</Text><Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: 8 }}>{failure.detail}</Text><Button title={retryingId === failure.id ? "Retrying…" : "Retry sync"} variant="secondary" disabled={retryingId === failure.id} onPress={() => retry(failure)} /></View>)}
            </View>

            <View>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Overview</Text>
                <View style={{ marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Church</Text>
                    <Text style={{ fontSize: 14, fontWeight: "500" }}>
                        {me.person.church_id}
                    </Text>
                </View>
                <View>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Your role</Text>
                    <Text style={{ fontSize: 14, fontWeight: "500" }}>
                        {me.roleAssignments.filter((ra) => ra.role === "admin").length > 0
                            ? "Administrator"
                            : "Unknown"}
                    </Text>
                </View>
            </View>
        </Screen>
    );
}
