"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { Button, GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser, signOut } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function SettingsPage() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const client = getSupabaseClient();
        getCurrentUser(client)
            .then((result) => {
                if (cancelled) return;
                if (!result) {
                    router.replace("/onboarding/match");
                    return;
                }
                setMe(result);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function handleSignOut() {
        setSigningOut(true);
        try {
            await signOut(getSupabaseClient());
            router.replace("/(auth)/login");
        } catch (err) {
            console.error("Sign out error:", err);
            setSigningOut(false);
        }
    }

    if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

    const authUser = getSupabaseClient().auth.getUser().then((res) => res.data.user);

    return (
        <AuthenticatedScreen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4), display: "block" }}>
                ← Back to dashboard
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(4) }}>
                Account Settings
            </Text>

            <GlassCard style={{ marginBottom: theme.spacing(4) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Profile</Text>
                <View style={{ marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Name</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {me.person.first_name} {me.person.last_name}
                    </Text>
                </View>
                <View style={{ marginBottom: theme.spacing(2) }}>
                    <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Household</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        {me.household?.name ?? "Not assigned"}
                    </Text>
                </View>
                {me.person.phone ? (
                    <View>
                        <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>Phone</Text>
                        <Text style={{ fontSize: 16, fontWeight: "500" }}>{me.person.phone}</Text>
                    </View>
                ) : null}
            </GlassCard>

            {me.roleAssignments.length > 0 ? (
                <GlassCard style={{ marginBottom: theme.spacing(4) }}>
                    <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Your Roles</Text>
                    {me.roleAssignments.map((ra) => (
                        <View key={ra.id} style={{ marginBottom: theme.spacing(1) }}>
                            <Text style={{ fontSize: 14 }}>
                                • {ra.role}
                                {ra.scope_type ? ` (${ra.scope_type})` : ""}
                            </Text>
                        </View>
                    ))}
                </GlassCard>
            ) : null}

            <GlassCard style={{ marginBottom: theme.spacing(6) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Sign Out</Text>
                <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
                    You&apos;ll be logged out from this device. You can sign back in anytime.
                </Text>
                <Button
                    title="Sign out"
                    variant="secondary"
                    onPress={handleSignOut}
                    loading={signingOut}
                    disabled={signingOut}
                />
            </GlassCard>

            <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                Version 1.0 • Shapers Church App
            </Text>
        </AuthenticatedScreen>
    );
}
