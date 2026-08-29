"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser, getChurchInviteCode } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function AdminPage() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
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
                    const code = await getChurchInviteCode(client, result.person.church_id);
                    if (!cancelled) setInviteCode(code);
                } catch (err) {
                    if (!cancelled) {
                        setError(err instanceof Error ? err.message : "Failed to load invite code");
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
                        paddingVertical: theme.spacing(2),
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
                        paddingVertical: theme.spacing(2),
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
                <View style={{ paddingVertical: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(1) }}>
                        ⚠️ Sync status dashboard coming soon
                    </Text>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                        Monitor Planning Center sync health, failed syncs, and data consistency.
                    </Text>
                </View>
            </GlassCard>

            <GlassCard>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>Overview</Text>
                <View style={{ paddingVertical: theme.spacing(1), marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Church</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {me.person.church_id}
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
