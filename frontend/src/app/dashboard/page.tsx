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
      {/* DEBUG: اطبع حالة المصادقة */}
      <pre style={{fontSize:12, color:"#666", margin:"4px 0"}}>me = {JSON.stringify(me)}</pre>

      {/* HEADER (نسخة ديبَغ بدون تايلويند) */}
      <header
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: 8,
          border: "2px dashed #999",
          background: "#fafafa",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: "#666", margin: "4px 0 0" }}>الأراضي المتاحة الآن (Public)</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {/* ========== 1) STATIC GROUP: يجب أن تراها دائماً 6 أزرار ========== */}
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, border: "1px solid #ddd", padding: 6, background:"#fff" }}>
            <a href="/lands"   style={{ display:"inline-block", background:"#000", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>My Lands (static)</a>
            <a href="/profile" style={{ display:"inline-block", background:"#fff", color:"#000", padding:"8px 12px", border:"1px solid #000", borderRadius:8, textDecoration:"none" }}>My Account (static)</a>
            <a href="/login"   style={{ display:"inline-block", background:"#0ea5e9", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>Log in (static)</a>
            <a href="/signup"  style={{ display:"inline-block", background:"#22c55e", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>Sign up (static)</a>
            <a href="#"        style={{ display:"inline-block", background:"#f59e0b", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>Debug A</a>
            <a href="#"        style={{ display:"inline-block", background:"#a855f7", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>Debug B</a>
          </nav>

          {/* ========== 2) AUTH GROUP: المنطق الفعلي (٤ لغير المسجل، ٣ للمسجل) ========== */}
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, border: "1px solid #ddd", padding: 6, background:"#fff" }}>
            {/* دائمًا */}
            <a href="/lands"   style={{ display:"inline-block", background:"#111827", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}>My Lands</a>
            <a href="/profile" style={{ display:"inline-block", background:"#fff", color:"#111827", padding:"8px 12px", border:"1px solid #111827", borderRadius:8, textDecoration:"none" }}>My Account</a>

            {/* لغير المسجل */}
            <a href="/login"
              style={{ display: me ? "none" : "inline-block", background:"#111827", color:"#fff", padding:"8px 12px", borderRadius:8, textDecoration:"none" }}
              data-testid="login-auth"
            >
              Log in
            </a>
            <a href="/signup"
              style={{ display: me ? "none" : "inline-block", background:"#fff", color:"#111827", padding:"8px 12px", border:"1px solid #111827", borderRadius:8, textDecoration:"none" }}
              data-testid="signup-auth"
            >
              Sign up
            </a>

            {/* للمسجل */}
            <form action="/api/auth/logout" method="POST" style={{ display: me ? "inline-block" : "none" }}>
              <button type="submit" style={{ background:"#fff", color:"#b91c1c", padding:"8px 12px", border:"1px solid #b91c1c", borderRadius:8, cursor:"pointer" }}>
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Debug line - مؤقت لفحص الحالة */}
      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        auth state: <code>{String(!!me)}</code>
      </div>

    </main>
  );
}
