# نظام الترقيات العسكرية — GitHub + Supabase + Netlify

هذا المشروع يحول النسخة القديمة التي كانت تعتمد على `localStorage` فقط إلى بنية أكثر مناسبة للنشر:

- **GitHub** لحفظ الكود وإدارة الإصدارات
- **Supabase** كقاعدة بيانات PostgreSQL
- **Netlify** لاستضافة الواجهة وتشغيل Serverless Functions

## هيكل المشروع

```text
military-promotion-netlify/
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ netlify/
│  └─ functions/
│     ├─ _lib/
│     │  ├─ requirements.js
│     │  └─ supabase.js
│     ├─ login.js
│     ├─ save-progress.js
│     ├─ submit-survey.js
│     ├─ admin-login.js
│     ├─ admin-dashboard.js
│     ├─ admin-create-code.js
│     ├─ admin-create-discount.js
│     └─ admin-add-note.js
├─ supabase/
│  └─ schema.sql
├─ package.json
└─ netlify.toml
```

## لماذا هذا التحويل أفضل؟

النسخة الأصلية كانت تحفظ الأكواد والخصومات والملاحظات والاستبيانات محليًا داخل متصفح واحد. هذا يعني:

- أي مستخدم آخر لن يرى نفس البيانات
- حذف بيانات المتصفح يضيع كل شيء
- كلمة مرور الإدارة كانت مكشوفة داخل JavaScript

في النسخة الجديدة:

- كل البيانات في **Supabase**
- الواجهة ثابتة وسهلة النشر على **Netlify**
- الوصول إلى Supabase يتم عبر **Netlify Functions** وليس مباشرة من المتصفح
- مفتاح `service_role` يبقى في **متغيرات البيئة** ولا يظهر للمستخدم

## تجهيز Supabase

1. أنشئ مشروعًا جديدًا في Supabase.
2. افتح **SQL Editor**.
3. نفذ ملف `supabase/schema.sql`.
4. من **Project Settings > API** انسخ:
   - `SUPABASE_URL`
   - `service_role key`

> لا تضع `service_role key` في الواجهة الأمامية أو داخل ملفات `public`.

## تجهيز GitHub

1. أنشئ مستودعًا جديدًا على GitHub.
2. ارفع جميع الملفات داخل هذا المجلد.
3. مثال أوامر:

```bash
git init
git add .
git commit -m "Initial migration to Netlify + Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## تجهيز Netlify

1. في Netlify اختر **Deploy from repository**.
2. اربط مستودع GitHub.
3. سيقرأ Netlify ملف `netlify.toml` تلقائيًا.
4. أضف متغيرات البيئة التالية في Netlify:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
```

## تشغيل محلي

```bash
npm install
npm run dev
```

ثم افتح الرابط الذي يعطيك إياه Netlify CLI.

## ما الذي تم نقله من النسخة الأصلية؟

- شاشة دخول المستخدم بالرمز
- فترة الحسبة
- خصومات تقلل المتطلبات الرقمية
- تتبع التقدم
- استبيان الدورة العسكرية
- لوحة إدارة لإضافة الأكواد والخصومات والملاحظات ومراجعة الاستبيانات

## ملاحظات مهمة

- هذه النسخة تستخدم **كلمة مرور إدارة واحدة** من Netlify env. إذا أردت لاحقًا، يمكن تطويرها إلى **Supabase Auth** بحسابات إدارة فعلية.
- لأن الملف الأصلي المرسل كان **مقطوعًا في آخره**، تمت إعادة بناء جزء من منطق التسليم والإدارة بصيغة عملية مكافئة.
- لو أردت لاحقًا رفع المرفقات أو ملفات الدورة، يمكن إضافة **Supabase Storage** بسهولة.
