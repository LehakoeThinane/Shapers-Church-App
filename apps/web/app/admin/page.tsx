"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import {
    getCurrentUser,
    getChurchInviteCode,
    getSyncFailures,
    retrySyncFailure,
    type SyncFailure,
} from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function AdminPage() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [syncFailures, setSyncFailures] = useState<SyncFailure[]>([]);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                try {
                    const [code, failures] = await Promise.all([
                        getChurchInviteCode(client, result.person.church_id),
                        getSyncFailures(client, result.person.church_id),
                    ]);

                    if (!cancelled) {
                        setInviteCode(code);
                        setSyncFailures(failures);
                    }
                } catch (err) {
                    if (!cancelled) {
                        setError(err instanceof Error ? err.message : "Failed to load admin data");
                    }
                }
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

    const handleRetry = async (failure: SyncFailure) => {
        try {
            setRetryingId(failure.id);
            await retrySyncFailure(getSupabaseClient(), failure.kind, failure.id, failure.church_id);
            setSyncFailures((current) => current.filter((item) => item.id !== failure.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to retry sync");
        } finally {
            setRetryingId(null);
        }
    };

    if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

    if (error) {
        return (
            <AuthenticatedScreen logoSource={logoSource}>
                <Text style={{ color: theme.color.danger }}>{error}</Text>
            </AuthenticatedScreen>
        );
    }

    return (
        <AuthenticatedScreen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4), display: "block" }}>
                ← Back to dashboard
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
                Admin Dashboard
            </Text>

            <GlassCard style={{ marginBottom: theme.spacing(4) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Quick Actions</Text>

                <Link
                    href="/admin/invite"
                    style={{
                        display: "block",
                        paddingTop: theme.spacing(2),
                        paddingBottom: theme.spacing(2),
                        borderBottomWidth: 1,
                        borderBottomColor: theme.color.border,
                    }}
                >
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>
                        Invite a member →
                    </Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                        Share invite link for new members
                    </Text>
                </Link>

                <Link
                    href="/admin/integrations"
                    style={{
                        display: "block",
                        paddingTop: theme.spacing(2),
                        paddingBottom: theme.spacing(2),
                    }}
                >
                    <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>
                        Church integrations →
                    </Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                        Connect Planning Center, manage syncs
                    </Text>
                </Link>
            </GlassCard>

            <GlassCard style={{ marginBottom: theme.spacing(4) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Sync Status</Text>

                {syncFailures.length === 0 ? (
                    <View style={{ paddingVertical: theme.spacing(2) }}>
                        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(1) }}>
                            ✓ No failed syncs right now
                        </Text>
                        <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                            Monitoring Planning Center sync health, failed writes, and data consistency.
                        </Text>
                    </View>
                ) : (
                    syncFailures.map((failure) => (
                        <View
                            key={failure.id}
                            style={{
                                paddingVertical: theme.spacing(2),
                                borderTopWidth: 1,
                                borderTopColor: theme.color.border,
                            }}
                        >
                            <Text style={{ fontWeight: "500", marginBottom: theme.spacing(1) }}>
                                {failure.title}
                            </Text>
                            <Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: theme.spacing(2) }}>
                                {failure.detail}
                            </Text>
                            <Button
                                title={retryingId === failure.id ? "Retrying…" : "Retry sync"}
                                variant="secondary"
                                disabled={retryingId === failure.id}
                                onPress={() => handleRetry(failure)}
                            />
                        </View>
                    ))
                )}
            </GlassCard>

            <GlassCard>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Overview</Text>
                <View style={{ paddingVertical: theme.spacing(1), marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Church</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {me.person.church_id}
                    </Text>
                </View>
                <View style={{ paddingVertical: theme.spacing(1), marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Invite code</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {inviteCode ?? "Unavailable"}
                    </Text>
                </View>
                <View style={{ paddingVertical: theme.spacing(1) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Your role</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {me.roleAssignments.filter((ra) => ra.role === "admin").length > 0 ? "Administrator" : "Unknown"}
                    </Text>
                </View>
            </GlassCard>
        </AuthenticatedScreen>
    );
}
