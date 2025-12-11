import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/config";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";

  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  // Defensive: ensure any existing cookie is cleared
  res.cookies.delete(COOKIE_NAME);

  return res;
}
