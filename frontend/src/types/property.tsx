// src/types/property.ts

export interface Property {
  id: string | number;
  title: string;
  location: string;
  price: number;
  image: string;       // رابط الصورة
  beds: number;        // عدد الغرف (اختياري، نضع 0 لو غير موجود)
  baths: number;       // عدد الحمامات
  sqft: number;        // المساحة
  status: string;      // الحالة: Sale, Rent, New, etc.
}