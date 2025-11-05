"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();

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

    if (r.ok) router.push("/login");
    else alert("Signup failed");
  }

  return (
    <Card>
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

      <p className="text-sm mt-4">
        Already have an account?{" "}
        <a className="underline" href="/login">
          Login
        </a>
      </p>
    </Card>
  );
}
