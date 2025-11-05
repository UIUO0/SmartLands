export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // لاحقًا نضيف Sidebar + Topbar هنا
  return <div className="min-h-screen bg-white">{children}</div>;
}