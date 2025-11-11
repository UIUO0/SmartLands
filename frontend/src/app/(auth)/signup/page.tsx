"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: any) {
    e.preventDefault();
    setLoading(true);

    const r = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (r.ok) {
      // لو عاملين auto-login في route.ts تقدر توديه مباشرة next
      router.push(`/login?next=${encodeURIComponent(next)}`);
      // أو: router.push(next);
    } else {
      alert("Signup failed");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <form onSubmit={handleSignup} className="grid gap-4">
          <div>
            <label className="text-sm">Name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button loading={loading} type="submit">
            Sign up
          </Button>
        </form>

        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <a className="underline" href={`/login?next=${encodeURIComponent(next)}`}>
            Login
          </a>
        </p>
      </Card>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-600">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
