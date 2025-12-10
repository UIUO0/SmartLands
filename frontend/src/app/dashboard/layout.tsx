// src/app/dashboard/layout.tsx

// 👇 هذا السطر هو الحل السحري: يجبر الصفحة على أن تكون ديناميكية بالكامل
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}