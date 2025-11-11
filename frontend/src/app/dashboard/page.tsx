"use client";

import { useEffect, useMemo, useState } from "react";

type Land = {
  land_id: number;
  title: string;
  description?: string;
  city?: string;
  region?: string;
  country?: string;
  price_amount?: number;
  area_sq_m?: number;
  status?: "available" | "reserved" | "sold" | "archived";
};

export default function DashboardPage() {
  const [items, setItems] = useState<Land[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // فلاتر بسيطة
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("status", "available");
    if (city.trim()) p.set("city", city.trim());
    if (q.trim()) p.set("q", q.trim());
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    return p.toString();
  }, [city, q, limit, offset]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/lands?${qs}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : []);
      setTotal(Number(j?.total ?? 0));
    } catch (e: any) {
      setErr(e.message || "Failed");
    }
    setLoading(false);
  }

  
  const [me, setMe] = useState<{ user_id: number; full_name?: string } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/users/me", {
        cache: "no-store",
        credentials: "include", // يضمن إرسال كوكي sl_token للـ API route
        });
        if (r.ok) {
          const j = await r.json();
          if (j?.authenticated && j?.user) setMe(j.user);
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      }
    })();
  }, []);
  return (
      <main className="p-6 space-y-5">
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: 8,
          border: "1px dashed #ccc",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#666", margin: "4px 0 0" }}>الأراضي المتاحة الآن (Public)</p>
        </div>

        {/* Actions (no Tailwind hiding) */}
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
          {/* ثابت دائمًا */}
          <a
            href="/lands"
            style={{
              display: "inline-block",
              padding: "8px 12px",
              background: "black",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              whiteSpace: "nowrap",
            }}
          >
            My Lands
          </a>

          <a
            href="/profile"
            style={{
              display: "inline-block",
              padding: "8px 12px",
              border: "1px solid #000",
              color: "#000",
              textDecoration: "none",
              borderRadius: 10,
              whiteSpace: "nowrap",
            }}
          >
            My Account
          </a>

          {/* لغير المسجّل */}
          <a
            href="/login"
            style={{
              display: me ? "none" : "inline-block",
              padding: "8px 12px",
              background: "black",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              whiteSpace: "nowrap",
            }}
            data-testid="btn-login"
          >
            Log in
          </a>

          <a
            href="/signup"
            style={{
              display: me ? "none" : "inline-block",
              padding: "8px 12px",
              border: "1px solid #000",
              color: "#000",
              textDecoration: "none",
              borderRadius: 10,
              whiteSpace: "nowrap",
            }}
            data-testid="btn-signup"
          >
            Sign up
          </a>

          {/* للمسجّل */}
          <form
            action="/api/auth/logout"
            method="POST"
            style={{ display: me ? "inline-block" : "none", whiteSpace: "nowrap" }}
            data-testid="btn-logout-form"
          >
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                border: "1px solid #000",
                color: "#000",
                background: "white",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </form>
        </nav>
      </header>

      {/* Debug line - مؤقت لفحص الحالة */}
      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        auth state: <code>{String(!!me)}</code>
      </div>

    </main>
  );
}
