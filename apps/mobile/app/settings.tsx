import { useEffect, useState } from "react";
import { useRouter, Link } from "expo-router";
import { View } from "react-native";
import { Button, LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCurrentUser, signOut } from "@shapers/api-client";
import type { CurrentUser } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function SettingsScreen() {
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

    return (
        <Screen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>
                ← Back
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(4) }}>
                Account Settings
            </Text>

            <View style={{ marginBottom: theme.spacing(4) }}>
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
            </View>

            {me.roleAssignments.length > 0 ? (
                <View style={{ marginBottom: theme.spacing(4) }}>
                    <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Your Roles</Text>
                    {me.roleAssignments.map((ra) => (
                        <Text key={ra.id} style={{ fontSize: 14, marginBottom: theme.spacing(1) }}>
                            • {ra.role}
                            {ra.scope_type ? ` (${ra.scope_type})` : ""}
                        </Text>
                    ))}
                </View>
            ) : null}

            <View style={{ marginBottom: theme.spacing(6) }}>
                <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>Sign Out</Text>
                <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4) }}>
                    You'll be logged out from this device. You can sign back in anytime.
                </Text>
                <Button
                    title="Sign out"
                    variant="secondary"
                    onPress={handleSignOut}
                    loading={signingOut}
                    disabled={signingOut}
                />
            </View>

            <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                Version 1.0 • Shapers Church App
            </Text>
        </Screen>
    );
}
