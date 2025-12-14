# 🌍 Smart Lands - Next-Gen Real Estate Platform

![Project Status](https://img.shields.io/badge/Status-Under%20Development-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

**Smart Lands** هي منصة عقارية ذكية تهدف إلى رقمنة وتسهيل عمليات بيع وشراء الأراضي بالكامل. توفر المنصة بيئة آمنة للتواصل بين البائع والمشتري، مع دمج تقنيات الذكاء الاصطناعي (AI) للمساعدة الشخصية والرقابة على المحتوى.

---

## 🚀 المميزات الرئيسية (Key Features)

* **🛒 دورة شراء ذكية:** تحول تلقائي لحالة الأرض (`Available` → `Reserved` → `Sold`) بناءً على سير العمل.
* **🤖 مساعد ذكي (AI Agent):** مساعد شخصي مدمج (يعتمد على Llama 3 عبر Groq) يتحدث باللهجة السعودية ويجيب على استفسارات المستخدمين بناءً على بيانات النظام.
* **💬 نظام محادثة فوري:** قناة تواصل آمنة بين البائع والمشتري تُفتح تلقائياً عند قبول العرض، مع أزرار لإتمام الصفقة (Agree) أو إلغائها.
* **🛡️ نظام رقابة آلي:** تحليل المحادثات باستخدام الذكاء الاصطناعي لكشف الاحتيال أو الإساءة واتخاذ إجراءات تلقائية.
* **📝 عقود رقمية:** إنشاء عقود مبدئية (Agreements) تلقائياً لضمان جدية الأطراف.
* **🔐 أمان عالي:** نظام مصادقة قوي يدعم البريد الإلكتروني و Google OAuth مع تخزين آمن للبيانات.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Backend (الخلفية)
* **Framework:** FastAPI
* **Database:** MySQL with SQLAlchemy ORM
* **Migration:** Alembic
* **AI & LLM:** Groq API (Llama 3 Model)
* **Image Storage:** Cloudinary
* **Email Service:** SendGrid
* **Authentication:** PyJWT & Passlib (OAuth2)

### Frontend (الواجهة الأمامية)
* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Auth:** @react-oauth/google

---

## 🏗️ هيكلية النظام (Architecture)

يعتمد النظام على معمارية **Client-Server** مفصولة:
1.  **إدارة المستخدمين:** تسجيل دخول آمن، استعادة كلمة المرور، وإدارة البروفايل.
2.  **إدارة الأراضي:** عمليات CRUD كاملة، رفع صور، وتحديد المواقع.
3.  **محرك الطلبات:** إدارة طلبات الشراء وقبولها أو رفضها من قبل المالك.
4.  **نظام التقارير:** تقديم بلاغات يتم فحصها بواسطة الـ AI لتحديد صحتها (Valid/Invalid).

---

## ⚙️ دليل التثبيت والتشغيل (Installation Guide)

تأكد من وجود **Python 3.9+** و **Node.js 18+** و **MySQL** مثبتة على جهازك.

### 1️⃣ إعداد وتشغيل الخلفية (Backend)

```bash
cd backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة (Windows)
venv\Scripts\activate
# تفعيل البيئة (Mac/Linux)
source venv/bin/activate

# تثبيت المكتبات المطلوبة
pip install -r requirements.txt

# إعداد متغيرات البيئة (أنشئ ملف .env بناءً على المثال أدناه)
# ثم شغل السيرفر
uvicorn app.main:app --reload

👥 فريق العمل (The Team)
سعد عبدالعزيز الشهري (Saad Abdulaziz Al-shehri)

فيصل عبدالله الشهري (Faisal Abdullah Al-shehri)

عباس عبدالعزيز الثنيان (Abbas Abdulaziz Al-thunayan)

محمد سمير العجلان (Mohammed Sameer Al-ajlan)

نواف ربيع شحبل (Nawaf Rabea Shahbal)
