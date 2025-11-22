import { NextRequest, NextResponse } from "next/server";
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

  return res;
}
