import { NextResponse } from "next/server";

// هذا ملف مؤقت لتمثيل الطلبات الواردة حتى يتم إصلاح الباك-إند
export async function GET() {
  // بيانات وهمية لطلبين واردين
  const mockRequests = [
    {
      request_id: 901,
      land_id: 5,       // تأكد أن هذا الرقم يطابق أرضاً موجودة لديك لظهور التفاصيل إن أمكن
      from_user_id: 99, // مستخدم وهمي
      to_user_id: 17,   // مفترض أنه أنت
      amount: 450000,
      status: "pending",
      created_at: new Date().toISOString()
    },
    {
      request_id: 902,
      land_id: 8,
      from_user_id: 102,
      to_user_id: 17,
      amount: 120000,
      status: "pending",
      created_at: new Date(Date.now() - 86400000).toISOString() // أمس
    }
  ];

  return NextResponse.json(mockRequests, { status: 200 });
}