"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (r.ok) router.push(next);
    else alert("Invalid email or password");
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      <form onSubmit={handleLogin} className="grid gap-4">
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
          Login
        </Button>
      </form>

      <p className="text-sm mt-4">
        Don't have an account?{" "}
        <a className="underline" href="/signup">
          Sign up
        </a>
      </p>
    </Card>
  );
}
