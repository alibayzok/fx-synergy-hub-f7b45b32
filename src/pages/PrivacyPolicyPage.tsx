import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Lock, Eye, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Eye,
      titleAr: "جمع البيانات",
      titleEn: "Data Collection",
      contentAr: "نقوم بجمع المعلومات التالية عند إنشاء حسابك واستخدام التطبيق:",
      items: [
        "الاسم وعنوان البريد الإلكتروني",
        "رقم الهاتف (اختياري)",
        "صورة الملف الشخصي (اختياري)",
        "بيانات التحقق من الهوية (KYC) عند الطلب",
        "تفضيلات التداول والإعدادات",
        "سجل النشاط داخل التطبيق",
      ],
    },
    {
      icon: Shield,
      titleAr: "استخدام البيانات",
      titleEn: "Data Usage",
      contentAr: "نستخدم بياناتك للأغراض التالية:",
      items: [
        "تقديم خدمات التطبيق وتحسينها",
        "إرسال إشعارات حول الإشارات والتحليلات",
        "التواصل معك بخصوص حسابك",
        "ضمان أمان التطبيق ومنع الاحتيال",
        "تخصيص تجربة المستخدم",
      ],
    },
    {
      icon: Lock,
      titleAr: "حماية البيانات",
      titleEn: "Data Protection",
      contentAr: "نلتزم بأعلى معايير الأمان لحماية بياناتك:",
      items: [
        "تشفير البيانات أثناء النقل والتخزين (SSL/TLS)",
        "مصادقة آمنة متعددة الطبقات",
        "عدم مشاركة بياناتك مع أطراف ثالثة دون إذنك",
        "خوادم محمية بأحدث تقنيات الأمان",
        "مراجعات أمنية دورية",
      ],
    },
    {
      icon: Trash2,
      titleAr: "حقوقك",
      titleEn: "Your Rights",
      contentAr: "لديك الحقوق التالية فيما يتعلق ببياناتك:",
      items: [
        "الوصول إلى بياناتك الشخصية في أي وقت",
        "تعديل أو تحديث معلوماتك",
        "طلب حذف حسابك وبياناتك بالكامل",
        "سحب موافقتك على معالجة البيانات",
        "تقديم شكوى إلى الجهات المختصة",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">سياسة الخصوصية</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold">ASSASSIN FX</h2>
                <p className="text-sm text-muted-foreground">Privacy Policy</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نحن في ASSASSIN FX نقدّر خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="h-5 w-5 text-primary" />
                <h3 className="font-bold">{section.titleAr}</h3>
                <span className="text-xs text-muted-foreground">({section.titleEn})</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{section.contentAr}</p>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {/* Cookie Policy */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">ملفات تعريف الارتباط (Cookies)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نستخدم ملفات تعريف الارتباط وتقنيات التخزين المحلي لتحسين تجربتك، وحفظ تفضيلاتك، والحفاظ على جلسة تسجيل الدخول. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-bold">تواصل معنا</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية أو كيفية التعامل مع بياناتك، يرجى التواصل معنا عبر صفحة الدعم الفني في التطبيق.
            </p>
          </CardContent>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
