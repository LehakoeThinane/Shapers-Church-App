"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Screen, Text, TextField } from "@shapers/ui";
import { signInCustom } from "../../../lib/customAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await signInCustom(email, password);
      router.replace("/api-dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <Text as="p" variant="eyebrow">Shapers Church</Text>
        <Text as="h1" variant="display">Welcome back</Text>
        <Text tone="muted">Sign in with the email and password you created for your church.</Text>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <TextField
          autoComplete="email"
          label="Email address"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <TextField
          autoComplete="current-password"
          label="Password"
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {message ? <Text role="alert" tone="danger">{message}</Text> : null}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Text tone="muted">
        New here? <Link className="text-brand-600 underline" href="/signup">Create an account with your church invite code.</Link>
      </Text>
    </Screen>
  );
}
