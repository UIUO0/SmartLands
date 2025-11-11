import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

type UserOut = {
  user_id: number;
  email: string;
  full_name: string | null;
  role: string;
  picture_url: string | null;
  created_at: string;
  updated_at: string;
};

async function getMe(): Promise<UserOut | null> {
  // نستدعي API داخليتنا مع تمرير الكوكيز لضمان المصادقة
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/users/me`, {
    cache: "no-store",
    headers: { Cookie: cookies().toString() },
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load profile");

  const json = await res.json();
  return json?.user as UserOut;
}

export default async function ProfilePage() {
  const me = await getMe();

  // احتياط: لو أحد وصل هنا بدون توكن (الميدلوير يمنع أصلاً)
  if (!me) redirect("/login?next=/profile");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Account</h1>

      <Card className="p-6 max-w-xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-zinc-100 grid place-items-center text-zinc-500">
            {me.full_name?.[0]?.toUpperCase() || me.email[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-medium">{me.full_name || "Unnamed"}</div>
            <div className="text-sm text-zinc-600">{me.email}</div>
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <div><span className="font-medium">User ID:</span> {me.user_id}</div>
          <div><span className="font-medium">Role:</span> {me.role}</div>
          {me.picture_url && (
            <div className="truncate">
              <span className="font-medium">Avatar URL:</span> {me.picture_url}
            </div>
          )}
          <div className="text-zinc-500">
            Created: {new Date(me.created_at).toLocaleString()}
          </div>
          <div className="text-zinc-500">
            Updated: {new Date(me.updated_at).toLocaleString()}
          </div>
        </div>
      </Card>
    </main>
  );
}
