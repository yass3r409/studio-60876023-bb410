# 🚀 نشر تطبيق نظرة على Firebase Hosting

## 📋 الخطوات المطلوبة

### 1. إنشاء Service Account في Firebase

1. افتح [Google Cloud Console](https://console.cloud.google.com)
2. اختر مشروعك: `studio-60876023-bb410`
3. اذهب إلى **IAM & Admin** → **Service Accounts**
4. اضغط **Create Service Account**
5. أدخل الاسم: `github-actions`
6. اضغط **Create and Continue**
7. أضف الدور: **Firebase Hosting Admin**
8. اضغط **Continue** ثم **Done**
9. اضغط على Service Account الذي أنشأته
10. اذهب إلى **Keys** → **Add Key** → **Create new key**
11. اختر **JSON** واضغط **Create**
12. سيتم تحميل ملف JSON - احتفظ به!

### 2. إضافة Secret في GitHub

1. افتح مستودع GitHub الخاص بك
2. اذهب إلى **Settings** → **Secrets and variables** → **Actions**
3. اضغط **New repository secret**
4. الاسم: `FIREBASE_SERVICE_ACCOUNT`
5. القيمة: محتوى ملف JSON كاملاً (انسخ والصق)
6. اضغط **Add secret**

### 3. دفع الكود إلى GitHub

```bash
git init
git add .
git commit -m "Initial commit - Nazrah App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 4. النشر التلقائي

- عند دفع أي تغيير إلى فرع `main`، سيتم النشر تلقائياً
- يمكنك مراقبة العملية في تبويب **Actions** في GitHub

---

## 🔗 الرابط النهائي

```
https://studio-60876023-bb410.web.app/
```

---

## 📁 هيكل الملفات

```
.github/
└── workflows/
    └── firebase-deploy.yml  # GitHub Actions workflow

out/                         # ملفات البناء
├── index.html
├── _next/
├── nazrah-logo.png
└── ...

firebase.json               # إعدادات Firebase Hosting
.firebaserc                 # معرف المشروع
```

---

## ✅ إعدادات مطلوبة في Firebase Console

1. **Authentication** → تفعيل:
   - Google
   - Email/Password
   - Phone

2. **Authentication** → Settings → Authorized domains:
   - `studio-60876023-bb410.web.app` ✓

3. **Firestore Database** → Create database

4. **Storage** → Get started

---

## 🛠️ أوامر مفيدة

```bash
# بناء محلي
bun run build

# معاينة محلية
bun run dev

# نشر يدوي
firebase deploy --only hosting
```

---

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. GitHub Actions logs
2. Firebase Console → Hosting
3. Firebase Service Account permissions
