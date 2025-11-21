import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { COOKIE_NAME } from "@/lib/config";

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

async function getMe(cookieHeader: string): Promise<UserOut | null> {
  // نستدعي API داخليتنا مع تمرير الكوكيز لضمان المصادقة
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/users/me`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load profile");

  const json = await res.json();
  return json?.user as UserOut;
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const me = await getMe(cookieHeader);

  // احتياط: لو أحد وصل هنا بدون توكن (الميدلوير يمنع أصلاً)
  if (!me) redirect("/login?next=/profile");

  const tokenPreview =
    token && token.length > 12 ? `${token.slice(0, 6)}...${token.slice(-4)}` : token;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>

      <Card className="p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-zinc-100 overflow-hidden grid place-items-center text-zinc-500 text-xl">
            {me.picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.picture_url}
                alt={`${me.full_name || me.email} avatar`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{me.full_name?.[0]?.toUpperCase() || me.email[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="text-lg font-medium">{me.full_name || "Unnamed"}</div>
            <div className="text-sm text-zinc-600">{me.email}</div>
          </div>
        </div>

        <section className="grid gap-2 text-sm">
          <div>
            <span className="font-medium">User ID:</span> {me.user_id}
          </div>
          <div>
            <span className="font-medium">Role:</span> {me.role}
          </div>
          <div className="text-zinc-500">
            Created: {new Date(me.created_at).toLocaleString()}
          </div>
          <div className="text-zinc-500">
            Updated: {new Date(me.updated_at).toLocaleString()}
          </div>
        </section>

        {token && (
          <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 space-y-2">
            <div className="text-sm font-semibold text-zinc-700">Active Token</div>
            <code className="block break-all rounded-md bg-white px-3 py-2 text-xs">
              {tokenPreview}
            </code>
            <div className="text-xs text-zinc-500">
              Length: {token.length} characters (stored in cookie &quot;{COOKIE_NAME}&quot;)
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <a
            href="/reset-password"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Reset Password
          </a>
        </div>
      </Card>
    </main>
  );
}
