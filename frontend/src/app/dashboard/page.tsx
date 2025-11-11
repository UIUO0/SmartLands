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
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-zinc-600">الأراضي المتاحة الآن (Public)</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:ml-auto">
          <a href="/lands" className="rounded-xl bg-black text-white px-4 py-2">
            My Lands
            </a>
            <a href="/profile" className="rounded-xl border px-4 py-2">
              My Account
          </a>
        </div>
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

      {loading && <div className="text-zinc-500">…جارِ التحميل</div>}
      {err && <div className="text-red-600">خطأ: {err}</div>}

      {!loading && !err && (
        <>
          <div className="text-sm text-zinc-600">النتائج: {total}</div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((x) => (
              <article key={x.land_id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{x.title}</h3>
                  {x.price_amount != null && (
                    <div className="text-sm font-medium">
                      {Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(
                        x.price_amount
                      )} ر.س
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
                  <a
                    href={`/lands/${x.land_id}`}
                    className="text-sm underline"
                  >
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
            <div className="text-zinc-600">لا توجد أراضٍ متاحة بهذه الفلاتر.</div>
          )}

          {/* تنقّل بسيط */}
          <div className="flex items-center gap-2">
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
