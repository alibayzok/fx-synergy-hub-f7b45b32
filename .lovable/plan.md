

## خطة نظام OTP - جاهز للربط مع Supabase

### الوضع الحالي
الكود جاهز لنظام OTP بـ **8 أرقام**. يحتاج فقط تعديل email template في Supabase Dashboard.

### التعديلات المنجزة ✅
- `src/pages/AuthPage.tsx` - نظام OTP بـ 8 خانات
- `src/hooks/useAuth.tsx` - دالة `verifyOtp` جاهزة
- `src/components/ui/input-otp.tsx` - مكون الإدخال جاهز

### عند ربط Supabase الخاص بك:

#### 1. تعديل Email Template
في Supabase Dashboard → Authentication → Email Templates → **Confirm signup**:

```html
<h2>رمز التحقق الخاص بك</h2>
<p>مرحباً،</p>
<p>رمز التحقق الخاص بك هو:</p>
<h1 style="text-align:center; font-size:32px; letter-spacing:8px; color:#4F46E5;">{{ .Token }}</h1>
<p>هذا الرمز صالح لمدة ساعة واحدة.</p>
```

#### 2. ضبط إعدادات OTP
في Supabase Dashboard → Authentication → Settings:
- **Email OTP Length**: `8`
- **Email OTP Expiry**: `3600` (ساعة واحدة)

#### 3. ملاحظات
- الكود يستخدم `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
- طول OTP مضبوط على 8 أرقام في الفرونت
