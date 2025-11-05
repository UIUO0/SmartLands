"use client";
import { useEffect, useState } from "react";

export default function RequestsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const r = await fetch("/api/requests", { cache: "no-store" });
    setItems(r.ok ? await r.json() : []);
    setLoading(false);
  })(); }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Requests</h1>
      {loading ? <div className="text-zinc-500">Loading…</div> : (
        <div className="grid gap-3">
          {items.map((x:any, i:number) => (
            <div key={x.id ?? i} className="rounded-2xl border p-4">
              <div className="font-medium">Request #{x.id ?? i}</div>
              <pre className="text-xs bg-zinc-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(x,null,2)}</pre>
            </div>
          ))}
          {items.length === 0 && <div className="text-zinc-600">No requests.</div>}
        </div>
      )}
    </main>
  );
}
