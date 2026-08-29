"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import {
    getCurrentUser,
    getChurchIntegrations,
    type ChurchIntegration,
} from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function IntegrationsPage() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [integrations, setIntegrations] = useState<ChurchIntegration[]>([]);
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
                    const integs = await getChurchIntegrations(client, result.person.church_id);
                    if (!cancelled) setIntegrations(integs);
                } catch (err) {
                    if (!cancelled) {
                        setError(err instanceof Error ? err.message : "Failed to load integrations");
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

    const pcIntegration = integrations.find((i) => i.provider === "planning_center");

    return (
        <AuthenticatedScreen logoSource={logoSource}>
            <Link href="/admin" style={{ marginBottom: theme.spacing(4), display: "block" }}>
                ← Back to admin
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(6) }}>
                Church Integrations
            </Text>

            <GlassCard
                style={{
                    marginBottom: theme.spacing(4),
                    borderLeftWidth: 4,
                    borderLeftColor: pcIntegration?.status === "active" ? theme.color.success : theme.color.warning,
                }}
            >
                <View style={{ marginBottom: theme.spacing(3) }}>
                    <Text style={{ fontWeight: "600", marginBottom: theme.spacing(1) }}>
                        Planning Center
                    </Text>
                    <Text style={{ fontSize: 12, marginBottom: theme.spacing(2) }}>
                        Syncs people, households, and check-ins with Planning Center
                    </Text>

                    {pcIntegration ? (
                        <>
                            <View style={{ marginBottom: theme.spacing(2) }}>
                                <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Status</Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "500",
                                        color:
                                            pcIntegration.status === "active"
                                                ? theme.color.success
                                                : pcIntegration.status === "token_expired"
                                                    ? theme.color.warning
                                                    : theme.color.danger,
                                    }}
                                >
                                    {pcIntegration.status === "active"
                                        ? "✓ Connected"
                                        : pcIntegration.status === "token_expired"
                                            ? "⚠ Token expired"
                                            : "✕ Error"}
                                </Text>
                            </View>

                            {pcIntegration.last_synced_at ? (
                                <View style={{ marginBottom: theme.spacing(2) }}>
                                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                                        Last synced
                                    </Text>
                                    <Text style={{ fontSize: 14 }}>
                                        {new Date(pcIntegration.last_synced_at).toLocaleString()}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ marginBottom: theme.spacing(2) }}>
                                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                                        Never synced yet
                                    </Text>
                                </View>
                            )}

                            <Button
                                title={pcIntegration.status === "token_expired" ? "Re-authorize Planning Center" : "Manage connection"}
                                variant="secondary"
                                onPress={() => {
                                    // In production, this would initiate OAuth flow
                                    alert(
                                        "Planning Center OAuth setup would be handled by a backend endpoint.\n\nSteps:\n1. Redirect to PC OAuth\n2. User authorizes\n3. Backend exchanges code for token\n4. Token stored encrypted"
                                    );
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(3) }}>
                                Connect your Planning Center account to sync people, households, and check-in data.
                                Your PC login information is never stored—only an OAuth access token (encrypted).
                            </Text>
                            <Button
                                title="Connect Planning Center"
                                onPress={() => {
                                    // In production, this would initiate OAuth flow
                                    alert(
                                        "Planning Center OAuth setup would be initiated here.\n\nThis would:\n1. Redirect to Planning Center OAuth\n2. Request admin permissions\n3. Exchange auth code for access token\n4. Store token encrypted in database"
                                    );
                                }}
                            />
                        </>
                    )}
                </View>
            </GlassCard>

            <GlassCard>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>
                    How it works
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: theme.spacing(2) }}>
                    • <Text style={{ fontWeight: "500" }}>Initial sync:</Text> Pulls all people, households,
                    and groups from Planning Center
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: theme.spacing(2) }}>
                    • <Text style={{ fontWeight: "500" }}>Check-in write-back:</Text> When staff use the app
                    to check in a child, that&apos;s sent to Planning Center
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: 12, marginBottom: theme.spacing(2) }}>
                    • <Text style={{ fontWeight: "500" }}>Sync monitor:</Text> Automatic jobs keep data in
                    sync; failures are logged
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                    • <Text style={{ fontWeight: "500" }}>Data stays in sync:</Text> The app never edits
                    person/household data directly—that stays in Planning Center
                </Text>
            </GlassCard>
        </AuthenticatedScreen>
    );
}
