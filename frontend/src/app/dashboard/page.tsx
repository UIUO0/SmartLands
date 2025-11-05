// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-zinc-600">هذه الصفحة عامة. باقي الصفحات تتطلب تسجيل الدخول.</p>

      <div className="flex gap-3">
        <a href="/lands" className="rounded-xl bg-black text-white px-4 py-2 text-sm">   إدارة الأراضي  </a>
        <a href="/requests" className="rounded-xl bg-black text-white px-4 py-2 text-sm">  الطلبات  </a>
        <a href="/transactions" className="rounded-xl bg-black text-white px-4 py-2 text-sm">  المعاملات  </a>
        <a href="/assistant" className="rounded-xl bg-black text-white px-4 py-2 text-sm">  المساعد  </a>
      </div>

      <p className="text-sm text-zinc-500">
        عند محاولة فتح أي رابط فوق بدون تسجيل دخول، سيتم تحويلك تلقائيًا لصفحة <code>/login</code>.
      </p>
    </main>
  );
}
