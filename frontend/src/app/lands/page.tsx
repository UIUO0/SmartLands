"use client";
import { useEffect, useState } from "react";

export default function LandsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/lands", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(Array.isArray(j) ? j : j?.items ?? []);
    } catch (e:any) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Lands</h1>
      <div className="flex gap-2">
        <button onClick={load} className="rounded-xl bg-black text-white px-4 py-2 text-sm">Refresh</button>
        {/* لاحقًا نضيف Create/Edit/Delete */}
      </div>
      {loading && <div className="text-zinc-500">Loading…</div>}
      {err && <div className="text-red-600">Error: {err}</div>}
      <div className="grid gap-3">
        {data.map((x:any, i:number) => (
          <div key={x.id ?? i} className="rounded-2xl border p-4">
            <div className="font-medium">{x.title ?? x.name ?? `Land #${x.id ?? i}`}</div>
            <div className="text-sm text-zinc-600">id: {x.id ?? "—"}</div>
            <pre className="text-xs bg-zinc-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(x, null, 2)}</pre>
          </div>
        ))}
        {!loading && !err && data.length === 0 && <div className="text-zinc-600">No lands.</div>}
      </div>
    </main>
  );
}
