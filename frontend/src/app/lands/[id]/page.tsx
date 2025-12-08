import { notFound } from "next/navigation";

// رابط الباك-إند المباشر (لأننا في Server Component)
const BACKEND_URL = "https://smartlands-production.up.railway.app";

// دالة لجلب تفاصيل الأرض
async function getLandDetails(id: string) {
  const res = await fetch(`${BACKEND_URL}/lands/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// دالة لجلب صور الأرض
async function getLandImages(id: string) {
  const res = await fetch(`${BACKEND_URL}/lands/${id}/images`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function LandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. انتظار الـ params (مهم في Next.js 15)
  const { id } = await params;

  // 2. جلب البيانات بالتوازي
  const [land, images] = await Promise.all([
    getLandDetails(id),
    getLandImages(id)
  ]);

  // إذا لم توجد الأرض، نعرض صفحة 404
  if (!land) return notFound();

  // تحديد صورة الغلاف
  const coverImage = images.find((img: any) => img.is_cover) || images[0];

  return (
    <main className="min-h-screen bg-[#F1F3E0] font-sans text-black pb-20">
      
      {/* --- قسم الصور --- */}
      <div className="max-w-4xl mx-auto pt-6 px-4">
         {/* زر الرجوع */}
         <a href="/mylands" className="inline-block mb-4 px-4 py-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 font-bold transition">
           ← العودة لقائمتي
         </a>

         {/* الصورة الكبيرة */}
         <div className="w-full h-80 md:h-[400px] bg-[#D2DCB6] rounded-3xl overflow-hidden shadow-md relative border border-[#A1BC98]">
            {coverImage ? (
               <img src={coverImage.file_url} alt={land.title} className="w-full h-full object-cover" />
            ) : (
               <div className="flex items-center justify-center h-full text-4xl opacity-20">🏠</div>
            )}
            
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl font-bold shadow-sm">
               {land.price_amount?.toLocaleString()} ر.س
            </div>
         </div>

         {/* معرض الصور المصغرة */}
         {images.length > 0 && (
           <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img: any) => (
                <div key={img.image_id} className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 border-[#A1BC98]/50 cursor-pointer hover:border-[#A1BC98] transition">
                   <img src={img.file_url} alt="land img" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
         )}
      </div>

      {/* --- تفاصيل الأرض --- */}
      <div className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white/50 p-6 rounded-3xl border border-[#A1BC98]/30">
               <h1 className="text-3xl font-bold mb-2">{land.title}</h1>
               <p className="text-[#3a4430] flex items-center gap-2">
                 📍 {land.city}، {land.address_line || "عنوان غير محدد"}
               </p>
               <hr className="my-4 border-black/10" />
               <h3 className="font-bold text-lg mb-2">الوصف</h3>
               <p className="leading-relaxed text-gray-700 whitespace-pre-line">
                 {land.description || "لا يوجد وصف متاح لهذا العقار."}
               </p>
            </div>
         </div>

         <div className="space-y-4">
            <div className="bg-[#D2DCB6] p-6 rounded-3xl shadow-sm border border-[#A1BC98]/50">
               <h3 className="font-bold text-xl mb-4">تفاصيل سريعة</h3>
               <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span className="opacity-70">المساحة</span>
                    <span className="font-bold">{land.area_sq_m} م²</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="opacity-70">الحالة</span>
                    <span className="font-bold">
                      {land.status === 'sold' ? 'مباع ❌' : 'متاح ✅'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="opacity-70">المنطقة</span>
                    <span className="font-bold">{land.region || "-"}</span>
                  </li>
               </ul>
            </div>
         </div>
      </div>
    </main>
  );
}