"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { View } from "react-native";
import { GlassCard, LoadingScreen, Text, theme } from "@shapers/ui";
import { getCurrentUser } from "@shapers/api-client";
import type { CurrentUser, Person } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";
import { AuthenticatedScreen } from "@/components/AuthenticatedScreen";

export default function HouseholdPage() {
    const router = useRouter();
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [members, setMembers] = useState<Person[]>([]);
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
                setMe(result);

                // Load household members if person has a household
                if (result.household) {
                    try {
                        const { data: householdMembers, error: membersError } = await client
                            .from("person")
                            .select("*")
                            .eq("household_id", result.household.id)
                            .order("first_name");

                        if (membersError) throw membersError;
                        if (!cancelled) setMembers(householdMembers ?? []);
                    } catch (err) {
                        if (!cancelled) {
                            setError(err instanceof Error ? err.message : "Failed to load household members");
                        }
                    }
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load household data");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (loading) return <LoadingScreen logoSource={logoSource} />;
    if (!me) return <LoadingScreen logoSource={logoSource} />;

    return (
        <AuthenticatedScreen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4), display: "block" }}>
                ← Back to dashboard
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
                {me.household?.name ?? "Your Household"}
            </Text>

            {error ? (
                <GlassCard style={{ marginBottom: theme.spacing(4), borderLeftWidth: 4, borderLeftColor: theme.color.danger }}>
                    <Text style={{ color: theme.color.danger }}>{error}</Text>
                </GlassCard>
            ) : null}

            {!me.household ? (
                <GlassCard>
                    <Text style={{ color: theme.color.textMuted }}>
                        No household information available. Contact your church staff to be added to a household.
                    </Text>
                </GlassCard>
            ) : members.length === 0 ? (
                <GlassCard>
                    <Text style={{ color: theme.color.textMuted }}>
                        Household has no members. This may indicate a syncing issue — contact your church.
                    </Text>
                </GlassCard>
            ) : (
                <GlassCard>
                    <Text style={{ fontWeight: "600", marginBottom: theme.spacing(3) }}>
                        Members ({members.length})
                    </Text>
                    {members.map((member) => (
                        <View
                            key={member.id}
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingVertical: theme.spacing(2),
                                borderBottomWidth: 1,
                                borderBottomColor: theme.color.border,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: "500" }}>
                                    {member.first_name} {member.last_name}
                                </Text>
                                <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                                    {member.is_minor ? "Child" : "Adult"}
                                </Text>
                            </View>
                            {member.id === me.person.id ? (
                                <Text style={{ color: theme.color.primary, fontSize: 12, fontWeight: "500" }}>
                                    You
                                </Text>
                            ) : null}
                        </View>
                    ))}
                </GlassCard>
            )}

            <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(6), fontSize: 12 }}>
                Note: Household information is read-only, synced from your church&apos;s Planning Center account.
                To make changes, contact your church office.
            </Text>
        </AuthenticatedScreen>
    );
}
