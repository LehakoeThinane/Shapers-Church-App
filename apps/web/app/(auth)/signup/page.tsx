"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Screen, Text, TextField } from "@shapers/ui";
import { signUpCustom } from "../../../lib/customAuth";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await signUpCustom({ email, password, churchInviteCode: inviteCode, firstName, lastName });
      router.replace("/api-dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3">
        <Text as="p" variant="eyebrow">Shapers Church</Text>
        <Text as="h1" variant="display">Join your church</Text>
        <Text tone="muted">Use the invite code supplied by your church administrator to create an account.</Text>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
          <TextField label="Last name" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
        </div>
        <TextField
          label="Church invite code"
          onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          required
          value={inviteCode}
        />
        <TextField
          autoComplete="email"
          label="Email address"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <TextField
          autoComplete="new-password"
          helperText="Use at least 12 characters."
          label="Password"
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {message ? <Text role="alert" tone="danger">{message}</Text> : null}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <Text tone="muted">
        Already have an account? <Link className="text-brand-600 underline" href="/login">Sign in.</Link>
      </Text>
    </Screen>
  );
}
