import { Button } from '@/components/ui/button';
import { Download, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectDocsPage = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Print controls - hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-black">
          <ArrowRight className="w-4 h-4 me-2" />
          العودة
        </Button>
        <Button onClick={handlePrint} className="bg-black text-white hover:bg-black/80">
          <Download className="w-4 h-4 me-2" />
          تحميل PDF
        </Button>
      </div>

      {/* Document content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4 text-right" dir="rtl" style={{ fontFamily: 'Arial, Tahoma, sans-serif' }}>
        
        {/* Header */}
        <div className="text-center mb-12 border-b-2 border-black pb-8">
          <h1 className="text-4xl font-bold mb-2">ASSASSIN FX COMMUNITY</h1>
          <p className="text-lg text-gray-600">توثيق شامل للمشروع</p>
          <p className="text-sm text-gray-400 mt-2">تاريخ التوثيق: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {/* Section: App Type */}
        <Section title="🎯 نوع التطبيق">
          <p>منصة تداول مجتمعية احترافية مصممة لاستبدال مجموعات التليغرام غير المنظمة بنظام متكامل يشمل إشارات تداول، تحليلات، تعليم، وخدمات مالية رقمية.</p>
        </Section>

        {/* Section: Tech Stack */}
        <Section title="🏗️ البنية التقنية">
          <Table headers={['العنصر', 'التقنية']} rows={[
            ['Frontend', 'React + TypeScript + Vite'],
            ['التصميم', 'Tailwind CSS + shadcn/ui'],
            ['Backend', 'Lovable Cloud (Supabase مدار)'],
            ['Edge Functions', 'Deno (ذكاء اصطناعي، أخبار، بيانات سوق)'],
            ['الرسوم المتحركة', 'Framer Motion'],
            ['اللغات', 'i18next (عربي RTL + إنجليزي LTR)'],
            ['التطبيق المحمول', 'Capacitor (Android)'],
            ['الإشعارات', 'Firebase Cloud Messaging (FCM)'],
          ]} />
        </Section>

        {/* Section: Roles */}
        <Section title="👥 نظام الأدوار والصلاحيات">
          <Table headers={['الرتبة', 'الصلاحيات']} rows={[
            ['Admin', 'صلاحيات كاملة للنظام بالكامل'],
            ['Moderator', 'إدارة المحتوى والمجتمع (بدون إعدادات النظام)'],
            ['Support', 'إدارة تذاكر الدعم الفني فقط'],
            ['VIP', 'وصول للمحتوى المدفوع والغرف الخاصة'],
            ['Free', 'وصول أساسي للمحتوى المجاني'],
          ]} />
          <ul className="list-disc pr-6 mt-3 space-y-1 text-sm">
            <li>الأدوار مخزنة في جدول <code>user_roles</code> منفصل (لمنع هجمات رفع الصلاحيات)</li>
            <li>التحقق عبر وظائف أمان: <code>is_admin()</code>, <code>is_moderator()</code>, <code>is_vip()</code></li>
            <li>تحديث الصلاحيات لحظي (Real-time) بدون إعادة تحميل</li>
          </ul>
        </Section>

        {/* Section: Features */}
        <Section title="📱 الميزات الرئيسية">
          
          <SubSection title="🏠 الصفحة الرئيسية">
            <BulletList items={[
              'شريط أسعار متحرك (Ticker) لأسعار الفوركس والمعادن والعملات الرقمية',
              'بطاقة الأداء والإحصائيات',
              'إجراءات سريعة (Quick Actions)',
              'أحدث الأخبار',
            ]} />
          </SubSection>

          <SubSection title="📊 الإشارات (Signals)">
            <BulletList items={[
              'إشارات تداول من الإدارة',
              'تصنيف حسب نوع الأصل (فوركس، معادن، كريبتو)',
              'فلترة حسب الإطار الزمني (M5, M15, H1, H4, D1)',
              'نظام إعجابات ومشاهدات',
              'محتوى مجاني و VIP',
            ]} />
          </SubSection>

          <SubSection title="📈 التحليلات (Analyses)">
            <BulletList items={[
              'تحليلات فنية مفصلة مع مرفقات وصور',
              'نظام رؤية (مجاني/VIP)',
              'إعجابات ومشاهدات',
            ]} />
          </SubSection>

          <SubSection title="📰 الأخبار والمقالات">
            <BulletList items={[
              'الأخبار: جلب آلي من RSS مع ترجمة عبر Gemini AI',
              'التقويم الاقتصادي: أحداث من Investing.com مع تصنيف أهمية',
              'المقالات: محتوى حصري من الإدارة',
              'قراءة داخل التطبيق (In-app reading)',
              'روابط وصول مباشر (Deep Links): /news/article/:id',
            ]} />
          </SubSection>

          <SubSection title="👥 المجتمع (Community)">
            <BulletList items={[
              'غرف متعددة: عامة، تعليمية، VIP، USDT، أخبار',
              'نظام طلبات انضمام إلزامي مع موافقة المشرفين',
              'محادثات لحظية (Real-time chat)',
              'مواضيع ونقاشات (Threads) مع ردود وإعجابات',
              'حظر دائم أو مؤقت بمدد محددة',
              'كتم (Mute) زمني مع سبب ومدة',
              'حذف رسائل وتثبيت مواضيع',
              'بحث عن الأعضاء',
              'إجراءات جماعية (قبول/رفض الكل)',
              'حماية من الروابط للأعضاء العاديين',
              'فقاعة عائمة (FAB) قابلة للسحب للوصول للوحة الإدارة',
            ]} />
          </SubSection>

          <SubSection title="💬 الرسائل الخاصة (Messages)">
            <BulletList items={[
              'محادثات مباشرة (Direct) وجماعية (Group)',
              'قراءة/غير مقروءة',
              'إعدادات خصوصية المراسلة',
            ]} />
          </SubSection>

          <SubSection title="👤 الملف الشخصي (Profile)">
            <BulletList items={[
              'منشورات المستخدم مع مرفقات',
              'تعليقات وإعجابات على المنشورات',
              'نظام أصدقاء (طلبات صداقة، قبول/رفض)',
              'نظام متابعة (Follow/Unfollow)',
              'إعدادات الخصوصية',
              'حظر المستخدمين',
            ]} />
          </SubSection>

          <SubSection title="🎮 نظام النقاط والإنجازات">
            <BulletList items={[
              'نقاط لكل تفاعل (تعليق، إعجاب، نشر)',
              'مستويات وألقاب (عربي + إنجليزي) - 10 مستويات',
              'شارات (Badges) متنوعة',
              'سلسلة إنجازات (Streaks)',
            ]} />
          </SubSection>

          <SubSection title="🛎️ الخدمات (Services)">
            <BulletList items={[
              'خدمة USDT: شراء/بيع بأسعار ديناميكية وطرق دفع مرنة',
              'الوسطاء: بطاقات وسطاء مع روابط تسجيل وميزات',
              'طلبات الخدمات: إيداع/سحب، شراء/بيع USDT، فتح حساب',
              'بطاقة تحميل تطبيق: App Store, Play Store, APK',
              'سوق USDT P2P: إعلانات بيع وشراء من المستخدمين',
            ]} />
          </SubSection>

          <SubSection title="🌟 اشتراكات VIP">
            <BulletList items={[
              'خطط اشتراك متعددة',
              'طلب اشتراك → موافقة الأدمن → تفعيل مع تاريخ انتهاء',
              'محادثة بين المشترك والأدمن',
              'تحديث الصلاحيات لحظياً عند التفعيل/الإلغاء',
            ]} />
          </SubSection>

          <SubSection title="🤖 مساعد ذكاء اصطناعي">
            <BulletList items={[
              'محادثة مع AI عبر Edge Function',
              'المزود والموديل قابلين للتعديل من لوحة التحكم',
              'اسم المساعد وتعليماته من CMS',
              'زر عائم للوصول السريع',
            ]} />
          </SubSection>

          <SubSection title="🎓 الأكاديمية (Learning)">
            <BulletList items={[
              'تصنيفات وكورسات ودروس',
              'محتوى نصي وفيديو',
              'مستويات: مبتدئ، متوسط، متقدم',
              'محتوى مجاني و VIP',
            ]} />
          </SubSection>

          <SubSection title="🔔 الإشعارات">
            <BulletList items={[
              'إشعارات داخل التطبيق (User Notifications)',
              'إشعارات الأدمن (Admin Notifications)',
              'إشعارات Push عبر FCM',
              'إشعارات تسجيل المستخدمين الجدد',
              'إعدادات الإشعارات',
            ]} />
          </SubSection>

          <SubSection title="🎫 الدعم الفني (Support)">
            <BulletList items={[
              'نظام تذاكر دعم كامل مع أولويات وحالات',
              'تصعيد وتحويل التذاكر',
              'وكلاء دعم مخصصين',
              'إغلاق تلقائي للتذاكر القديمة',
              'لوحة إحصائيات الدعم',
            ]} />
          </SubSection>
        </Section>

        {/* Admin Panel */}
        <Section title="⚙️ لوحة تحكم الأدمن">
          <Table headers={['القسم', 'الوصف']} rows={[
            ['إحصائيات عامة', 'عدادات لحظية لكل شيء'],
            ['إدارة المستخدمين', 'تعيين أدوار متعددة، فلاتر، بحث'],
            ['إدارة الإشارات', 'إضافة/تعديل/حذف إشارات التداول'],
            ['إدارة التحليلات', 'إضافة/تعديل/حذف التحليلات'],
            ['إدارة المقالات', 'كتابة ونشر مقالات'],
            ['إدارة الكورسات', 'تصنيفات، كورسات، دروس'],
            ['إدارة الاشتراكات', 'موافقة/رفض/تفعيل/إلغاء VIP'],
            ['إدارة الخدمات', 'خدمات، وسطاء، طلبات'],
            ['المحتوى المبلّغ', 'مراجعة المحتوى المخالف'],
            ['CMS', 'نصوص، روابط، إعدادات AI، خدمات'],
            ['تصدير البيانات', 'JSON و SQL مع اكتشاف ديناميكي'],
            ['سجل النشاطات', 'آخر الأحداث في المنصة'],
          ]} />
          <p className="text-sm mt-2 text-gray-600">* المشرفون يرون فقط أقسام المحتوى، بينما الأدمن يرى كل شيء (Scoping حسب الرتبة)</p>
        </Section>

        {/* Security */}
        <Section title="🔒 الأمان">
          <BulletList items={[
            'RLS Policies على جميع الجداول',
            'وظائف أمان SECURITY DEFINER لمنع التكرار',
            'فصل الأدوار عن جدول البروفايل',
            'حماية من الروابط في المجتمع',
            'فحص محتوى الصور (Image Moderation) عبر Edge Function',
            'فحص محتوى النصوص (Content Moderation)',
            'profiles_admin_view للوصول الآمن لبيانات الإدارة',
          ]} />
        </Section>

        {/* Edge Functions */}
        <Section title="⚡ Edge Functions (8 وظائف)">
          <Table headers={['الوظيفة', 'الغرض']} rows={[
            ['chat', 'محادثة AI'],
            ['market-data', 'بيانات الأسواق'],
            ['fetch-news', 'جلب الأخبار من RSS'],
            ['fetch-article', 'جلب محتوى مقال'],
            ['fetch-calendar', 'التقويم الاقتصادي'],
            ['moderate-image', 'فحص الصور'],
            ['send-push-notification', 'إشعارات Push'],
            ['marqeta-cards', '(معطّل حالياً)'],
          ]} />
        </Section>

        {/* Database */}
        <Section title="🗄️ جداول قاعدة البيانات (35+ جدول)">
          <div className="text-sm leading-relaxed">
            <code className="text-xs">
              profiles · user_roles · user_points · user_streaks · user_badges · badges · daily_quests · user_daily_progress · point_transactions · signals · signal_likes · analyses · analysis_likes · articles · community_rooms · room_members · room_messages · room_join_requests · threads · replies · reply_likes · conversations · conversation_participants · direct_messages · user_posts · post_likes · post_comments · follows · friend_requests · user_blocks · user_privacy_settings · user_notifications · admin_notifications · fcm_tokens · service_requests · services · brokers · usdt_listings · vip_subscriptions · subscription_messages · support_tickets · support_messages · support_agents · flagged_content · app_settings · learning_categories · learning_courses · learning_lessons · live_sessions · live_session_messages · virtual_cards
            </code>
          </div>
        </Section>

        {/* Storage */}
        <Section title="📦 حاويات التخزين (Storage Buckets)">
          <BulletList items={[
            'avatars - صور الملفات الشخصية (عام)',
            'post-attachments - مرفقات المنشورات (عام)',
            'analysis-attachments - مرفقات التحليلات (عام)',
            'article-images - صور المقالات (عام)',
            'lesson-videos - فيديوهات الدروس (عام)',
            'cms-assets - أصول CMS (عام)',
            'support-attachments - مرفقات الدعم (عام)',
          ]} />
        </Section>

        {/* Localization */}
        <Section title="🌍 التوطين">
          <BulletList items={[
            'عربي (RTL) كلغة افتراضية + إنجليزي (LTR)',
            'تبديل فوري بدون إعادة تحميل',
            'أرقام لاتينية حصرياً للأسعار والأرقام',
          ]} />
        </Section>

        {/* Portability */}
        <Section title="📦 قابلية النقل">
          <BulletList items={[
            'ملف environment.ts مركزي لكل المتغيرات',
            'دليل ترحيل MIGRATION_GUIDE.md بالعربية',
            'سكريبت SQL موحد export-schema.sql',
            'أدوات تصدير ديناميكية من لوحة التحكم',
          ]} />
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t-2 border-black text-center text-sm text-gray-500">
          <p>ASSASSIN FX COMMUNITY - توثيق المشروع</p>
          <p>تم إنشاؤه بواسطة Lovable</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:p-4 { padding: 1rem !important; }
          @page { margin: 1.5cm; size: A4; }
          h2 { break-after: avoid; }
          table { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8 break-inside-avoid">
    <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-300">{title}</h2>
    {children}
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4 break-inside-avoid">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="list-disc pr-6 space-y-1 text-sm">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <table className="w-full border-collapse text-sm mb-3">
    <thead>
      <tr>{headers.map((h, i) => <th key={i} className="border border-gray-300 bg-gray-100 p-2 text-right font-semibold">{h}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i}>{row.map((cell, j) => <td key={j} className="border border-gray-300 p-2">{cell}</td>)}</tr>
      ))}
    </tbody>
  </table>
);

export default ProjectDocsPage;
