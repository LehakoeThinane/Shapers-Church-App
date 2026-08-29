import { createClient } from "npm:@supabase/supabase-js@2";
import { decryptToken, encryptToken } from "../_shared/tokenCrypto.ts";

interface OAuthConnectRequest {
    church_id: string;
    code: string;
    redirect_uri: string;
    connected_by_person_id?: string | null;
}

interface PlanningCenterTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
}

function getRequiredEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

function getAuthorizationHeader(clientId: string, clientSecret: string): string {
    return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

Deno.serve(async (req) => {
    try {
        const payload = (await req.json()) as OAuthConnectRequest;

        if (!payload?.church_id || !payload?.code || !payload?.redirect_uri) {
            return new Response(
                JSON.stringify({ error: "church_id, code, and redirect_uri are required" }),
                { status: 400, headers: { "content-type": "application/json" } }
            );
        }

        const supabase = createClient(
            getRequiredEnv("SUPABASE_URL"),
            getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
        );

        const clientId = getRequiredEnv("PLANNING_CENTER_CLIENT_ID");
        const clientSecret = getRequiredEnv("PLANNING_CENTER_CLIENT_SECRET");
        const tokenUrl = "https://api.planningcenteronline.com/oauth/token";

        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                Authorization: getAuthorizationHeader(clientId, clientSecret),
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: payload.code,
                redirect_uri: payload.redirect_uri,
            }),
        });

        const tokenText = await tokenResponse.text();
        if (!tokenResponse.ok) {
            return new Response(
                JSON.stringify({
                    error: "Planning Center OAuth exchange failed",
                    detail: tokenText,
                }),
                { status: 400, headers: { "content-type": "application/json" } }
            );
        }

        const tokenJson = JSON.parse(tokenText) as PlanningCenterTokenResponse;
        const encryptedToken = await encryptToken(tokenJson.access_token);

        const { data, error } = await supabase
            .from("church_integration")
            .upsert(
                {
                    church_id: payload.church_id,
                    provider: "planning_center",
                    encrypted_token: encryptedToken,
                    connected_by: payload.connected_by_person_id ?? null,
                    status: "active",
                },
                { onConflict: "church_id,provider" }
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "unknown_error",
            }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }
});
