import { NextRequest, NextResponse } from "next/server";
import { API_URL, COOKIE_NAME } from "@/lib/config";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return NextResponse.json([], { status: 401 });

  // سنحاول طلب endpoint مخصص للطلبات الواردة
  // ملاحظة: إذا لم يكن هذا الرابط موجوداً في الباك-إند، سيحتاج مبرمج الباك-إند لإضافته
  const res = await fetch(`${API_URL}/lands/requests/received`, { 
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
     // في حال فشل الرابط، نرجع مصفوفة فارغة لتجنب تحطيم الصفحة
     return NextResponse.json([], { status: 200 }); 
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}