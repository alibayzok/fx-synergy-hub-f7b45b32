import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Smartphone, Apple, Monitor, Share, PlusSquare, MoreVertical, Chrome, CheckCircle2, ArrowDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import logoClean from "@/assets/logo-clean.png";

type Platform = "android" | "ios" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [activePlatform, setActivePlatform] = useState<Platform>("android");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setActivePlatform("ios");
    } else if (/Android/.test(ua)) {
      setActivePlatform("android");
    } else {
      setActivePlatform("desktop");
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const platforms: { key: Platform; label: string; icon: React.ReactNode }[] = [
    { key: "android", label: "Android", icon: <Smartphone className="h-5 w-5" /> },
    { key: "ios", label: "iPhone / iPad", icon: <Apple className="h-5 w-5" /> },
    { key: "desktop", label: "سطح المكتب", icon: <Monitor className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-8 text-center">
          <motion.img
            src={logoClean}
            alt="ASSASSIN FX"
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h1
            className="text-3xl font-bold text-foreground mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            ثبّت ASSASSIN FX
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-lg mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            احصل على تجربة كاملة مثل التطبيقات الأصلية مباشرة على جهازك
          </motion.p>

          {isInstalled ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-profit/10 text-profit px-6 py-3 rounded-full font-bold"
            >
              <CheckCircle2 className="h-5 w-5" />
              التطبيق مثبت بالفعل!
            </motion.div>
          ) : deferredPrompt ? (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button size="lg" onClick={handleInstall} className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg">
                <Download className="h-5 w-5" />
                تثبيت التطبيق الآن
              </Button>
            </motion.div>
          ) : null}

          {/* Features */}
          <motion.div
            className="grid grid-cols-3 gap-3 mt-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[
              { icon: "⚡", text: "سرعة فائقة" },
              { icon: "📴", text: "يعمل بدون إنترنت" },
              { icon: "🔔", text: "إشعارات فورية" },
            ].map((f) => (
              <div key={f.text} className="bg-card border border-border rounded-xl p-3 text-center">
                <span className="text-2xl block mb-1">{f.icon}</span>
                <span className="text-xs font-medium text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 bg-muted rounded-xl p-1.5">
          {platforms.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePlatform(p.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                activePlatform === p.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {activePlatform === "android" && <AndroidSteps onInstall={deferredPrompt ? handleInstall : undefined} />}
            {activePlatform === "ios" && <IOSSteps />}
            {activePlatform === "desktop" && <DesktopSteps onInstall={deferredPrompt ? handleInstall : undefined} />}
          </motion.div>
        </AnimatePresence>

        {/* Back button */}
        <div className="text-center mt-8 pb-8">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            العودة للتطبيق
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Android Steps ── */
const AndroidSteps = ({ onInstall }: { onInstall?: () => void }) => (
  <div className="space-y-4">
    <StepHeader title="تثبيت على Android" badge="Chrome" />

    {onInstall && (
      <Card className="p-4 border-primary/30 bg-primary/5">
        <p className="text-sm text-foreground mb-3 font-medium">🎉 متصفحك يدعم التثبيت المباشر!</p>
        <Button onClick={onInstall} className="w-full gap-2">
          <Download className="h-4 w-4" />
          تثبيت بنقرة واحدة
        </Button>
      </Card>
    )}

    <p className="text-sm text-muted-foreground">أو يمكنك التثبيت يدوياً:</p>

    <Step number={1} title="افتح القائمة">
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <MoreVertical className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">اضغط على أيقونة <strong className="text-foreground">⋮</strong> (ثلاث نقاط) أعلى يمين المتصفح</p>
      </div>
    </Step>

    <Step number={2} title='اختر "إضافة إلى الشاشة الرئيسية"'>
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <PlusSquare className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">ابحث عن خيار <strong className="text-foreground">"إضافة إلى الشاشة الرئيسية"</strong> أو <strong className="text-foreground">"تثبيت التطبيق"</strong></p>
      </div>
    </Step>

    <Step number={3} title="أكّد التثبيت">
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <CheckCircle2 className="h-6 w-6 text-profit" />
        </div>
        <p className="text-sm text-muted-foreground">اضغط <strong className="text-foreground">"تثبيت"</strong> في النافذة المنبثقة. سيظهر التطبيق على شاشتك الرئيسية!</p>
      </div>
    </Step>
  </div>
);

/* ── iOS Steps ── */
const IOSSteps = () => (
  <div className="space-y-4">
    <StepHeader title="تثبيت على iPhone / iPad" badge="Safari" />

    <Card className="p-4 border-destructive/30 bg-destructive/5">
      <p className="text-sm text-foreground">
        ⚠️ <strong>مهم:</strong> يجب استخدام متصفح <strong>Safari</strong> فقط. المتصفحات الأخرى (Chrome, Firefox) لا تدعم التثبيت على iOS.
      </p>
    </Card>

    <Step number={1} title="افتح قائمة المشاركة">
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <Share className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">اضغط على أيقونة <strong className="text-foreground">المشاركة</strong> (المربع مع السهم للأعلى) أسفل الشاشة في Safari</p>
      </div>
    </Step>

    <Step number={2} title='اختر "إضافة إلى الشاشة الرئيسية"'>
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <PlusSquare className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">مرّر للأسفل واختر <strong className="text-foreground">"إضافة إلى الشاشة الرئيسية"</strong></p>
      </div>
    </Step>

    <Step number={3} title='اضغط "إضافة"'>
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <CheckCircle2 className="h-6 w-6 text-profit" />
        </div>
        <p className="text-sm text-muted-foreground">اضغط <strong className="text-foreground">"إضافة"</strong> أعلى يمين الشاشة. سيظهر التطبيق مثل أي تطبيق آخر!</p>
      </div>
    </Step>
  </div>
);

/* ── Desktop Steps ── */
const DesktopSteps = ({ onInstall }: { onInstall?: () => void }) => (
  <div className="space-y-4">
    <StepHeader title="تثبيت على سطح المكتب" badge="Chrome / Edge" />

    {onInstall && (
      <Card className="p-4 border-primary/30 bg-primary/5">
        <p className="text-sm text-foreground mb-3 font-medium">🎉 متصفحك يدعم التثبيت المباشر!</p>
        <Button onClick={onInstall} className="w-full gap-2">
          <Download className="h-4 w-4" />
          تثبيت بنقرة واحدة
        </Button>
      </Card>
    )}

    <Step number={1} title="ابحث عن أيقونة التثبيت">
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <ArrowDown className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">ستجد أيقونة <strong className="text-foreground">التثبيت</strong> في شريط العنوان (بجانب URL) أو من قائمة المتصفح</p>
      </div>
    </Step>

    <Step number={2} title="أكّد التثبيت">
      <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
        <div className="bg-card p-2 rounded-lg border border-border">
          <Chrome className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">اضغط <strong className="text-foreground">"تثبيت"</strong>. سيُفتح التطبيق في نافذة مستقلة بدون شريط عنوان!</p>
      </div>
    </Step>
  </div>
);

/* ── Shared Components ── */
const StepHeader = ({ title, badge }: { title: string; badge: string }) => (
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <Badge variant="secondary" className="gap-1">
      <ExternalLink className="h-3 w-3" />
      {badge}
    </Badge>
  </div>
);

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <Card className="p-4">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        {children}
      </div>
    </div>
  </Card>
);

export default InstallPage;
