import { useEffect, useState } from "react";
import { useRouter, Link } from "expo-router";
import { View } from "react-native";
import { LoadingScreen, Screen, Text, theme } from "@shapers/ui";
import { getCurrentUser } from "@shapers/api-client";
import type { CurrentUser, Person } from "@shapers/types";
import { getSupabaseClient } from "@/lib/supabase";
import { logoSource } from "@/lib/logo";

export default function HouseholdScreen() {
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

    if (loading || !me) return <LoadingScreen logoSource={logoSource} />;

    return (
        <Screen logoSource={logoSource}>
            <Link href="/dashboard" style={{ marginBottom: theme.spacing(4) }}>
                ← Back
            </Link>

            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: theme.spacing(2) }}>
                {me.household?.name ?? "Your Household"}
            </Text>

            {error ? (
                <Text style={{ color: theme.color.danger, marginBottom: theme.spacing(4) }}>
                    {error}
                </Text>
            ) : null}

            {!me.household ? (
                <Text style={{ color: theme.color.textMuted }}>
                    No household information available. Contact your church staff to be added to a household.
                </Text>
            ) : members.length === 0 ? (
                <Text style={{ color: theme.color.textMuted }}>
                    Household has no members. This may indicate a syncing issue — contact your church.
                </Text>
            ) : (
                <>
                    <Text style={{ fontWeight: "600", marginBottom: theme.spacing(2) }}>
                        Members ({members.length})
                    </Text>
                    {members.map((member) => (
                        <View
                            key={member.id}
                            style={{
                                paddingVertical: theme.spacing(2),
                                borderBottomWidth: 1,
                                borderBottomColor: theme.color.border,
                            }}
                        >
                            <Text style={{ fontWeight: "500" }}>
                                {member.first_name} {member.last_name}
                            </Text>
                            <Text style={{ color: theme.color.textMuted, fontSize: 12 }}>
                                {member.is_minor ? "Child" : "Adult"}
                                {member.id === me.person.id ? " (You)" : ""}
                            </Text>
                        </View>
                    ))}
                </>
            )}

            <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(6), fontSize: 12 }}>
                Note: Household information is read-only, synced from your church's Planning Center account.
                To make changes, contact your church office.
            </Text>
        </Screen>
    );
}
