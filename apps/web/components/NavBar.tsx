"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { View } from "react-native";
import { GlassCard, theme } from "@shapers/ui";
import { signOut } from "@shapers/api-client";
import { getSupabaseClient } from "@/lib/supabase";

const ITEMS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/courses", label: "Courses" },
  { href: "/prayer", label: "Prayer" },
];

// Persistent navigation across every authenticated page — previously the
// only way to move between sections was returning to /dashboard, since
// BrandHeader is logo-only. Reuses GlassCard rather than inventing new
// chrome, so this reads as part of the same design system, not a bolted-on
// bar. See AuthenticatedScreen, which renders this once instead of every
// page repeating it.
export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    await signOut(getSupabaseClient());
    router.replace("/login");
  }

  return (
    <GlassCard style={{ marginBottom: theme.spacing(4) }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing(2) }}>
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                paddingTop: theme.spacing(1),
                paddingBottom: theme.spacing(1),
                paddingLeft: theme.spacing(3),
                paddingRight: theme.spacing(3),
                borderRadius: theme.radius.sm,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                backgroundColor: active ? theme.glass.backgroundElevated : "transparent",
                color: active ? theme.color.text : theme.color.textMuted,
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={onSignOut}
          style={{
            paddingTop: theme.spacing(1),
            paddingBottom: theme.spacing(1),
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
            borderRadius: theme.radius.sm,
            fontSize: 14,
            background: "transparent",
            border: "none",
            color: theme.color.textMuted,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </View>
    </GlassCard>
  );
}
