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
  // ---------- State ----------
  const [items, setItems] = useState<Land[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filters
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  // Auth (فقط لمعرفة إن كان مسجّل)
  const [me, setMe] = useState<{ user_id: number; full_name?: string } | null>(null);

  // ---------- QueryString ----------
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("status", "available"); // الداشبورد يعرض العامة فقط
    if (city.trim()) p.set("city", city.trim());
    if (q.trim()) p.set("q", q.trim());
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    return p.toString();
  }, [city, q, limit, offset]);

  // ---------- Data Loader ----------
    async function load() {
    setLoading(true);
    setErr(null);
    try {
      // نقرأ الـ BASE من env العامة (لازم تكون موجودة عندك)
      const BASE = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";
      const url = `${BASE}/lands?${qs}`;
      console.log("[Dashboard] direct fetch:", url);

      const r = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        // مهم للتشخيص: لا كاش
        cache: "no-store",
      });

      const raw = await r.text();
      console.log("[Dashboard] status:", r.status, "raw:", raw);

      if (!r.ok) {
        // حاول نحوله JSON وإلا خليه نص
        try {
          const j = JSON.parse(raw);
          throw new Error(j?.detail || j?.message || raw || `HTTP ${r.status}`);
        } catch {
          throw new Error(raw || `HTTP ${r.status}`);
        }
      }

      const j = JSON.parse(raw);
      setItems(Array.isArray(j?.items) ? j.items : []);
      setTotal(Number(j?.total ?? 0));
    } catch (e: any) {
      console.error("[Dashboard] load error:", e);
      setErr(e?.message || "Failed");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }


  // ---------- Effects ----------
  // جلب حالة المستخدم (للهيدر فقط)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/users/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!r.ok) {
          setMe(null);
          return;
        }
        const j = await r.json();
        if (j?.authenticated && j?.user) setMe(j.user);
        else setMe(null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // تحميل الأراضي عند تغيّر الفلاتر/الـqs
  useEffect(() => {
    load();
  }, [qs]); // لا تضف load هنا كـ dep

  // ---------- Render ----------
  return (
    <main className="p-6 space-y-5">
      {/* DEBUG auth state */}
      <pre style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>
        me = {JSON.stringify(me)}
      </pre>

      {/* HEADER */}
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
          <p style={{ color: "#666", margin: "4px 0 0" }}>
            الأراضي المتاحة الآن (Public)
          </p>
        </div>

        {/* Actions */}
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
          {/* دائمًا */}
          <a
            href="/mylands"
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
            href="/Profile"
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
            My Profile
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
          >
            Sign up
          </a>

          {/* للمسجّل */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/logout", {
                    method: "POST",
                    cache: "no-store",
                    credentials: "include",
                  });
                } finally {
                  setMe(null);
                  window.location.href = "/login";
                }
              }}
            style={{
              display: me ? "inline-block" : "none",
              padding: "8px 12px",
              border: "1px solid #000",
              color: "#000",
              background: "white",
              borderRadius: 10,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* FILTERS */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          load();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          placeholder="مدينة (مثال: Riyadh)"
          className="border rounded-xl px-3 py-2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          placeholder="بحث في العنوان/الوصف"
          className="border rounded-xl px-3 py-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="rounded-xl bg-black text-white px-4 py-2">
          بحث
        </button>
      </form>

      {/* Messages */}
      {loading && <div className="text-zinc-500 mt-3">…جارِ التحميل</div>}

      {err && (
        <div className="mt-3 p-3 rounded-xl border border-red-300 text-red-700 bg-red-50">
          خطأ أثناء جلب الأراضي: {err}
        </div>
      )}

      {/* Results */}
      {!loading && !err && (
        <>
          <div className="text-sm text-zinc-600 mt-1">النتائج: {total}</div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
            {items.map((x) => (
              <article key={x.land_id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{x.title}</h3>
                  {x.price_amount != null && (
                    <div className="text-sm font-medium">
                      {Intl.NumberFormat("ar-SA", {
                        maximumFractionDigits: 0,
                      }).format(x.price_amount)}{" "}
                      ر.س
                    </div>
                  )}
                </div>

                <div className="text-sm text-zinc-600 mt-1">
                  {x.city || "—"} {x.region ? `• ${x.region}` : ""}{" "}
                  {x.country ? `• ${x.country}` : ""}
                </div>

                {x.area_sq_m != null && (
                  <div className="text-sm mt-1">المساحة: {x.area_sq_m} م²</div>
                )}

                <div className="text-xs text-zinc-500 mt-2 line-clamp-2">
                  {x.description || "—"}
                </div>

                <div className="mt-3 flex gap-2">
                  <a href={`/lands/${x.land_id}`} className="text-sm underline">
                    تفاصيل
                  </a>
                  <a
                    href={`/lands?status=available&city=${encodeURIComponent(
                      x.city || ""
                    )}`}
                    className="text-sm text-zinc-600"
                  >
                    مشابهة في {x.city || "—"}
                  </a>
                </div>
              </article>
            ))}
          </section>

          {items.length === 0 && (
            <div className="text-zinc-600 mt-2">
              لا توجد أراضٍ متاحة بهذه الفلاتر.
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-2 mt-3">
            <button
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              className="rounded-xl border px-3 py-1 disabled:opacity-50"
            >
              السابق
            </button>
            <button
              disabled={offset + limit >= total}
              onClick={() => setOffset((o) => o + limit)}
              className="rounded-xl border px-3 py-1 disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </>
      )}
    </main>
  );
}
