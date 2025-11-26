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

  // Auth
  const [me, setMe] = useState<{ user_id: number; full_name?: string } | null>(null);

  // ---------- QueryString ----------
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("status", "available");
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
      const BASE = process.env.NEXT_PUBLIC_API_URL || "https://smartlands-production.up.railway.app";
      const url = `${BASE}/lands?${qs}`;

      const r = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const raw = await r.text();
      if (!r.ok) {
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

  useEffect(() => {
    load();
  }, [qs]);

  // ---------- Render ----------
  return (
    // الخلفية الأساسية (F1F3E0) والنصوص سوداء
    <main className="min-h-screen w-full bg-[#F1F3E0] text-black font-sans">
      
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* --- HEADER --- */}
        {/* خلفية الهيدر بلون البطاقات (D2DCB6) ليعطي تباين مع الخلفية */}
        <header className="rounded-3xl bg-[#D2DCB6] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#A1BC98]/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Smart Lands
            </h1>
            <p className="text-[#3a4430] mt-1 font-medium">
              استكشف الأراضي المتاحة بسهولة
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            <a
              href="/mylands"
              className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-[#3a3a3a] transition shadow-md font-medium"
            >
              My Lands
            </a>
            <a
              href="/profile"
              className="px-5 py-2.5 rounded-xl bg-[#F1F3E0] text-black border border-black/10 hover:bg-white transition shadow-sm font-medium"
            >
              My Profile
            </a>

            {!me ? (
              <>
                <a
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-[#3a3a3a] transition shadow-md font-medium"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="px-5 py-2.5 rounded-xl bg-[#F1F3E0] text-black border border-black/10 hover:bg-white transition font-medium"
                >
                  Sign up
                </a>
              </>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      cache: "no-store",
                      credentials: "include",
                    });
                  } finally {
                    setMe(null);
                    window.location.href = "/login";
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition font-medium"
              >
                Logout
              </button>
            )}
          </nav>
        </header>

        {/* --- SEARCH / FILTERS --- */}
        <div className="flex flex-col md:flex-row gap-3">
          <input
            placeholder="المدينة (مثال: Riyadh)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            // حقول البحث خلفيتها بيضاء لسهولة القراءة، والحدود بلون التمييز
            className="flex-1 rounded-2xl border-2 border-[#D2DCB6] bg-white px-4 py-3 outline-none focus:border-[#A1BC98] transition shadow-sm placeholder:text-gray-400"
          />
          <input
            placeholder="بحث في العنوان أو الوصف..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-[2] rounded-2xl border-2 border-[#D2DCB6] bg-white px-4 py-3 outline-none focus:border-[#A1BC98] transition shadow-sm placeholder:text-gray-400"
          />
          <button 
            // زر البحث بلون التمييز (A1BC98)
            className="rounded-2xl bg-[#A1BC98] px-8 py-3 font-bold text-black shadow-md hover:bg-[#8ea885] transition"
          >
            بحث
          </button>
        </div>

        {/* --- MESSAGES --- */}
        {loading && (
          <div className="text-center py-10 text-[#556b4d] animate-pulse font-medium">
            …جارِ تحميل الأراضي
          </div>
        )}

        {err && (
          <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700 text-center">
            خطأ: {err}
          </div>
        )}

        {/* --- RESULTS --- */}
        {!loading && !err && (
          <>
            <div className="mb-2 text-sm font-semibold text-[#556b4d] px-1">
              عدد النتائج: {total}
            </div>

            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((x) => (
                // --- CARD ---
                // لون البطاقة: D2DCB6
                <article
                  key={x.land_id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#D2DCB6] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[#A1BC98]/30"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-black line-clamp-1 group-hover:underline decoration-2 underline-offset-4">
                        {x.title}
                      </h3>
                      {x.price_amount != null && (
                        // شارة السعر بلون الخلفية الفاتح لتبرز
                        <span className="shrink-0 rounded-full bg-[#F1F3E0] px-3 py-1 text-sm font-bold text-black shadow-sm">
                          {Intl.NumberFormat("ar-SA", {
                            maximumFractionDigits: 0,
                          }).format(x.price_amount)}{" "}
                          ر.س
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#3a4430] font-medium mb-3">
                      <span>📍 {x.city || "غير محدد"}</span>
                      {x.area_sq_m && (
                        <span>• 📐 {x.area_sq_m} م²</span>
                      )}
                    </div>

                    <p className="text-sm text-black/70 line-clamp-3 leading-relaxed mb-4">
                      {x.description || "لا يوجد وصف متاح."}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <a
                      href={`/lands/${x.land_id}`}
                      className="flex items-center justify-center rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:bg-[#333]"
                    >
                      تفاصيل
                    </a>
                    <a
                      href={`/lands?status=available&city=${encodeURIComponent(x.city || "")}`}
                      // زر "مشابهة" بلون التمييز (A1BC98)
                      className="flex items-center justify-center rounded-xl bg-[#A1BC98] py-2.5 text-sm font-bold text-black transition hover:bg-[#8ea885]"
                    >
                      مشابهة
                    </a>
                  </div>
                </article>
              ))}
            </section>

            {items.length === 0 && (
              <div className="flex h-40 items-center justify-center rounded-3xl bg-[#D2DCB6]/50 text-[#3a4430] font-medium">
                لا توجد أراضٍ مطابقة لبحثك حالياً.
              </div>
            )}

            {/* --- PAGINATION --- */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                className="rounded-xl bg-[#D2DCB6] border border-[#A1BC98] px-6 py-2 text-black font-medium hover:bg-[#A1BC98] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                السابق
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset((o) => o + limit)}
                className="rounded-xl bg-[#D2DCB6] border border-[#A1BC98] px-6 py-2 text-black font-medium hover:bg-[#A1BC98] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                التالي
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}