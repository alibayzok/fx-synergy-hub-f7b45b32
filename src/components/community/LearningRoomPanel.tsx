import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, BookOpen, GraduationCap, TrendingUp,
  BarChart3, Shield, Zap, Clock, Star, ChevronLeft, ChevronRight,
  Play, Lock, CheckCircle2, Target, Layers, LineChart, CandlestickChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LearningRoomPanelProps {
  onBack: () => void;
}

type Category = {
  id: string;
  title_ar: string;
  title_en: string;
  icon: React.ElementType;
  color: string;
  courses_count: number;
};

type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

type Course = {
  id: string;
  category_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  level: CourseLevel;
  lessons_count: number;
  duration_minutes: number;
  is_vip: boolean;
  icon: React.ElementType;
};

type Lesson = {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  duration_minutes: number;
  order: number;
  is_vip: boolean;
  content_ar: string;
  content_en: string;
};

const categories: Category[] = [
  {
    id: 'basics',
    title_ar: 'أساسيات التداول',
    title_en: 'Trading Basics',
    icon: BookOpen,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    courses_count: 4,
  },
  {
    id: 'technical',
    title_ar: 'التحليل الفني',
    title_en: 'Technical Analysis',
    icon: CandlestickChart,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    courses_count: 5,
  },
  {
    id: 'fundamental',
    title_ar: 'التحليل الأساسي',
    title_en: 'Fundamental Analysis',
    icon: BarChart3,
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    courses_count: 3,
  },
  {
    id: 'risk',
    title_ar: 'إدارة المخاطر',
    title_en: 'Risk Management',
    icon: Shield,
    color: 'from-red-500/20 to-red-600/10 border-red-500/30',
    courses_count: 3,
  },
  {
    id: 'psychology',
    title_ar: 'سيكولوجية التداول',
    title_en: 'Trading Psychology',
    icon: Zap,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    courses_count: 2,
  },
  {
    id: 'strategies',
    title_ar: 'استراتيجيات متقدمة',
    title_en: 'Advanced Strategies',
    icon: Target,
    color: 'from-primary/20 to-primary/10 border-primary/30',
    courses_count: 4,
  },
];

const coursesData: Course[] = [
  // Basics
  { id: 'b1', category_id: 'basics', title_ar: 'مقدمة في الفوركس', title_en: 'Introduction to Forex', description_ar: 'تعرف على سوق العملات الأجنبية وكيفية عمله', description_en: 'Learn about the foreign exchange market', level: 'beginner', lessons_count: 8, duration_minutes: 45, is_vip: false, icon: BookOpen },
  { id: 'b2', category_id: 'basics', title_ar: 'أنواع الأوامر', title_en: 'Order Types', description_ar: 'تعلم الفرق بين أوامر السوق والأوامر المعلقة', description_en: 'Learn about market and pending orders', level: 'beginner', lessons_count: 6, duration_minutes: 30, is_vip: false, icon: Layers },
  { id: 'b3', category_id: 'basics', title_ar: 'قراءة الشموع اليابانية', title_en: 'Candlestick Patterns', description_ar: 'فهم أنماط الشموع وإشاراتها', description_en: 'Understanding candlestick patterns', level: 'beginner', lessons_count: 12, duration_minutes: 60, is_vip: false, icon: CandlestickChart },
  { id: 'b4', category_id: 'basics', title_ar: 'منصات التداول', title_en: 'Trading Platforms', description_ar: 'كيفية استخدام MetaTrader وأدوات التداول', description_en: 'How to use MetaTrader and trading tools', level: 'beginner', lessons_count: 5, duration_minutes: 25, is_vip: false, icon: LineChart },
  // Technical
  { id: 't1', category_id: 'technical', title_ar: 'الدعم والمقاومة', title_en: 'Support & Resistance', description_ar: 'تحديد مستويات الدعم والمقاومة الرئيسية', description_en: 'Identify key support and resistance levels', level: 'intermediate', lessons_count: 10, duration_minutes: 55, is_vip: false, icon: TrendingUp },
  { id: 't2', category_id: 'technical', title_ar: 'المؤشرات الفنية', title_en: 'Technical Indicators', description_ar: 'RSI, MACD, Moving Averages وغيرها', description_en: 'RSI, MACD, Moving Averages and more', level: 'intermediate', lessons_count: 15, duration_minutes: 90, is_vip: false, icon: BarChart3 },
  { id: 't3', category_id: 'technical', title_ar: 'نظرية موجات إليوت', title_en: 'Elliott Wave Theory', description_ar: 'فهم وتطبيق نظرية الموجات', description_en: 'Understanding and applying wave theory', level: 'advanced', lessons_count: 8, duration_minutes: 50, is_vip: true, icon: LineChart },
  { id: 't4', category_id: 'technical', title_ar: 'هارمونيك باترن', title_en: 'Harmonic Patterns', description_ar: 'أنماط جارتلي، الفراشة، والخفاش', description_en: 'Gartley, Butterfly, and Bat patterns', level: 'advanced', lessons_count: 10, duration_minutes: 65, is_vip: true, icon: Target },
  { id: 't5', category_id: 'technical', title_ar: 'Smart Money Concepts', title_en: 'Smart Money Concepts', description_ar: 'تعلم مفاهيم الأموال الذكية SMC', description_en: 'Learn Smart Money Concepts', level: 'advanced', lessons_count: 12, duration_minutes: 80, is_vip: true, icon: Zap },
  // Fundamental
  { id: 'f1', category_id: 'fundamental', title_ar: 'الأخبار الاقتصادية', title_en: 'Economic News', description_ar: 'كيفية قراءة وتفسير الأخبار الاقتصادية', description_en: 'How to read economic news', level: 'beginner', lessons_count: 7, duration_minutes: 35, is_vip: false, icon: BarChart3 },
  { id: 'f2', category_id: 'fundamental', title_ar: 'التقويم الاقتصادي', title_en: 'Economic Calendar', description_ar: 'استخدام التقويم الاقتصادي في التداول', description_en: 'Using economic calendar in trading', level: 'intermediate', lessons_count: 5, duration_minutes: 25, is_vip: false, icon: Clock },
  { id: 'f3', category_id: 'fundamental', title_ar: 'تحليل البيانات المالية', title_en: 'Financial Data Analysis', description_ar: 'تحليل متعمق للبيانات والتقارير المالية', description_en: 'In-depth analysis of financial data', level: 'advanced', lessons_count: 8, duration_minutes: 50, is_vip: true, icon: TrendingUp },
  // Risk
  { id: 'r1', category_id: 'risk', title_ar: 'أساسيات إدارة المخاطر', title_en: 'Risk Management Basics', description_ar: 'حجم اللوت والرافعة المالية', description_en: 'Lot sizing and leverage', level: 'beginner', lessons_count: 6, duration_minutes: 30, is_vip: false, icon: Shield },
  { id: 'r2', category_id: 'risk', title_ar: 'خطة التداول', title_en: 'Trading Plan', description_ar: 'كيفية بناء خطة تداول فعالة', description_en: 'Building an effective trading plan', level: 'intermediate', lessons_count: 8, duration_minutes: 40, is_vip: false, icon: Target },
  { id: 'r3', category_id: 'risk', title_ar: 'إدارة رأس المال المتقدمة', title_en: 'Advanced Capital Management', description_ar: 'استراتيجيات متقدمة لحماية رأس المال', description_en: 'Advanced capital protection strategies', level: 'advanced', lessons_count: 6, duration_minutes: 35, is_vip: true, icon: Layers },
  // Psychology
  { id: 'p1', category_id: 'psychology', title_ar: 'التحكم بالعواطف', title_en: 'Emotion Control', description_ar: 'كيف تتحكم بمشاعرك أثناء التداول', description_en: 'How to control emotions while trading', level: 'beginner', lessons_count: 5, duration_minutes: 25, is_vip: false, icon: Zap },
  { id: 'p2', category_id: 'psychology', title_ar: 'عقلية المتداول الناجح', title_en: 'Successful Trader Mindset', description_ar: 'بناء عقلية تداول احترافية', description_en: 'Build a professional trading mindset', level: 'intermediate', lessons_count: 7, duration_minutes: 35, is_vip: false, icon: Star },
  // Strategies
  { id: 's1', category_id: 'strategies', title_ar: 'استراتيجية السكالبينج', title_en: 'Scalping Strategy', description_ar: 'التداول السريع على فريمات صغيرة', description_en: 'Fast trading on small timeframes', level: 'advanced', lessons_count: 10, duration_minutes: 60, is_vip: true, icon: Zap },
  { id: 's2', category_id: 'strategies', title_ar: 'التداول اليومي', title_en: 'Day Trading', description_ar: 'استراتيجيات التداول خلال اليوم', description_en: 'Intraday trading strategies', level: 'intermediate', lessons_count: 8, duration_minutes: 45, is_vip: false, icon: TrendingUp },
  { id: 's3', category_id: 'strategies', title_ar: 'السوينج تريد', title_en: 'Swing Trading', description_ar: 'التداول على المدى المتوسط', description_en: 'Medium-term trading strategies', level: 'intermediate', lessons_count: 9, duration_minutes: 50, is_vip: false, icon: LineChart },
  { id: 's4', category_id: 'strategies', title_ar: 'استراتيجية ICT', title_en: 'ICT Strategy', description_ar: 'Inner Circle Trader methodology', description_en: 'Inner Circle Trader methodology', level: 'advanced', lessons_count: 15, duration_minutes: 100, is_vip: true, icon: Target },
];

const lessonsData: Record<string, Lesson[]> = {
  b1: [
    { id: 'b1-1', course_id: 'b1', title_ar: 'ما هو سوق الفوركس؟', title_en: 'What is Forex?', duration_minutes: 5, order: 1, is_vip: false, content_ar: 'سوق الفوركس هو أكبر سوق مالي في العالم حيث يتم تداول العملات الأجنبية. يبلغ حجم التداول اليومي أكثر من 6 تريليون دولار.\n\n• السوق مفتوح 24 ساعة / 5 أيام في الأسبوع\n• يتم التداول بأزواج العملات مثل EUR/USD\n• يمكنك الربح من ارتفاع وانخفاض الأسعار\n• الرافعة المالية تتيح التداول بمبالغ أكبر من رأس مالك', content_en: 'Forex is the largest financial market in the world...' },
    { id: 'b1-2', course_id: 'b1', title_ar: 'أزواج العملات الرئيسية', title_en: 'Major Currency Pairs', duration_minutes: 6, order: 2, is_vip: false, content_ar: 'تنقسم أزواج العملات إلى ثلاث فئات:\n\n1. الأزواج الرئيسية: EUR/USD, GBP/USD, USD/JPY\n2. الأزواج المتقاطعة: EUR/GBP, EUR/JPY\n3. الأزواج النادرة: USD/TRY, USD/ZAR\n\nالأزواج الرئيسية هي الأكثر سيولة وتداولاً.', content_en: 'Currency pairs are divided into three categories...' },
    { id: 'b1-3', course_id: 'b1', title_ar: 'فهم السبريد', title_en: 'Understanding Spread', duration_minutes: 5, order: 3, is_vip: false, content_ar: 'السبريد هو الفرق بين سعر الشراء (Ask) وسعر البيع (Bid).\n\n• السبريد هو تكلفة التداول الرئيسية\n• كلما قل السبريد، كانت تكلفة التداول أقل\n• الأزواج الرئيسية لديها سبريد أقل\n• السبريد يتغير حسب ظروف السوق', content_en: 'Spread is the difference between Ask and Bid price...' },
    { id: 'b1-4', course_id: 'b1', title_ar: 'الرافعة المالية والهامش', title_en: 'Leverage & Margin', duration_minutes: 6, order: 4, is_vip: false, content_ar: 'الرافعة المالية تمكنك من التداول بمبالغ أكبر من رأس مالك.\n\n• رافعة 1:100 تعني أن كل $1 يتيح لك التداول بـ $100\n• الهامش هو المبلغ المحجوز كضمان\n• الرافعة العالية = مخاطر عالية\n• ابدأ دائماً برافعة منخفضة', content_en: 'Leverage allows you to trade larger amounts...' },
    { id: 'b1-5', course_id: 'b1', title_ar: 'حساب النقاط (Pips)', title_en: 'Calculating Pips', duration_minutes: 5, order: 5, is_vip: false, content_ar: 'النقطة (Pip) هي أصغر وحدة تغيير في سعر زوج العملات.\n\n• في معظم الأزواج: 1 pip = 0.0001\n• في أزواج الين: 1 pip = 0.01\n• قيمة النقطة تعتمد على حجم اللوت\n• لوت قياسي: 1 pip = $10', content_en: 'A pip is the smallest unit of price change...' },
    { id: 'b1-6', course_id: 'b1', title_ar: 'أحجام اللوت', title_en: 'Lot Sizes', duration_minutes: 6, order: 6, is_vip: false, content_ar: 'اللوت هو وحدة قياس حجم الصفقة:\n\n• لوت قياسي = 100,000 وحدة\n• لوت مصغر (Mini) = 10,000 وحدة\n• لوت ميكرو = 1,000 وحدة\n• لوت نانو = 100 وحدة\n\nابدأ بأحجام صغيرة حتى تكتسب الخبرة.', content_en: 'A lot is a unit measuring trade size...' },
    { id: 'b1-7', course_id: 'b1', title_ar: 'جلسات التداول', title_en: 'Trading Sessions', duration_minutes: 6, order: 7, is_vip: false, content_ar: 'سوق الفوركس ينقسم إلى 3 جلسات رئيسية:\n\n1. الجلسة الآسيوية (طوكيو): 00:00 - 09:00 GMT\n2. الجلسة الأوروبية (لندن): 07:00 - 16:00 GMT\n3. الجلسة الأمريكية (نيويورك): 12:00 - 21:00 GMT\n\nأفضل أوقات التداول هي عند تداخل الجلسات.', content_en: 'The forex market is divided into 3 sessions...' },
    { id: 'b1-8', course_id: 'b1', title_ar: 'نصائح للمبتدئين', title_en: 'Tips for Beginners', duration_minutes: 6, order: 8, is_vip: false, content_ar: 'نصائح ذهبية لبدء التداول:\n\n1. ابدأ بحساب تجريبي (Demo)\n2. تعلم إدارة المخاطر أولاً\n3. لا تخاطر بأكثر من 1-2% من رأس مالك\n4. ضع خطة تداول والتزم بها\n5. سجل صفقاتك في دفتر يومي\n6. تحلى بالصبر ولا تتعجل\n7. استمر في التعلم دائماً', content_en: 'Golden tips for trading...' },
  ],
};

const levelConfig: Record<CourseLevel, { label_ar: string; label_en: string; color: string }> = {
  beginner: { label_ar: 'مبتدئ', label_en: 'Beginner', color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  intermediate: { label_ar: 'متوسط', label_en: 'Intermediate', color: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  advanced: { label_ar: 'متقدم', label_en: 'Advanced', color: 'bg-red-500/15 text-red-500 border-red-500/30' },
};

export const LearningRoomPanel = ({ onBack }: LearningRoomPanelProps) => {
  const { t, i18n } = useTranslation();
  const { isVip, isAdmin } = useAuth();
  const isArabic = i18n.language === 'ar';
  const isVipUser = isVip || isAdmin;
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const filteredCourses = selectedCategory
    ? coursesData.filter(c => c.category_id === selectedCategory)
    : [];

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const currentLessons = selectedCourse ? (lessonsData[selectedCourse.id] || []) : [];

  // Lesson view
  if (selectedLesson && selectedCourse) {
    const lessonIndex = currentLessons.findIndex(l => l.id === selectedLesson.id);
    const prevLesson = lessonIndex > 0 ? currentLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex < currentLessons.length - 1 ? currentLessons[lessonIndex + 1] : null;

    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
        {/* Lesson Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLesson(null)}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {isArabic ? selectedCourse.title_ar : selectedCourse.title_en}
            </p>
            <h2 className="font-semibold text-foreground truncate">
              {isArabic ? selectedLesson.title_ar : selectedLesson.title_en}
            </h2>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            {selectedLesson.duration_minutes} {isArabic ? 'د' : 'min'}
          </Badge>
        </div>

        {/* Lesson Progress */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{isArabic ? 'الدرس' : 'Lesson'} {selectedLesson.order} / {currentLessons.length}</span>
            <span>{Math.round((selectedLesson.order / currentLessons.length) * 100)}%</span>
          </div>
          <Progress value={(selectedLesson.order / currentLessons.length) * 100} className="h-1.5" />
        </div>

        {/* Lesson Content */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {(isArabic ? selectedLesson.content_ar : selectedLesson.content_en).split('\n').map((line, i) => (
                <p key={i} className={cn(
                  "text-foreground leading-relaxed",
                  line.startsWith('•') && "ps-4 text-muted-foreground",
                  line.match(/^\d\./) && "ps-4 font-medium"
                )}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Lesson Navigation */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={() => prevLesson && setSelectedLesson(prevLesson)}
            className="gap-1.5"
          >
            {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isArabic ? 'السابق' : 'Previous'}
          </Button>
          
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!nextLesson}
            onClick={() => nextLesson && setSelectedLesson(nextLesson)}
          >
            {isArabic ? 'التالي' : 'Next'}
            {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Course detail view - list of lessons
  if (selectedCourse) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
        {/* Course Header */}
        <div className="p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCourse(null)}>
              <BackArrow className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">
                {isArabic ? selectedCourse.title_ar : selectedCourse.title_en}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isArabic ? selectedCourse.description_ar : selectedCourse.description_en}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={levelConfig[selectedCourse.level].color}>
              {isArabic ? levelConfig[selectedCourse.level].label_ar : levelConfig[selectedCourse.level].label_en}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {selectedCourse.lessons_count} {isArabic ? 'درس' : 'lessons'}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {selectedCourse.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
            </span>
            {selectedCourse.is_vip && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">VIP</Badge>
            )}
          </div>
        </div>

        {/* Lessons List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {currentLessons.length > 0 ? currentLessons.map((lesson, index) => {
              const isLocked = lesson.is_vip && !isVipUser;
              return (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !isLocked && setSelectedLesson(lesson)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-start",
                    isLocked
                      ? "bg-muted/30 border-border/20 opacity-60 cursor-not-allowed"
                      : "bg-card/60 border-border/30 hover:bg-card hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                    isLocked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                  )}>
                    {isLocked ? <Lock className="w-4 h-4" /> : lesson.order}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {isArabic ? lesson.title_ar : lesson.title_en}
                    </h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_minutes} {isArabic ? 'د' : 'min'}
                    </span>
                  </div>

                  {!isLocked && (
                    <Play className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </motion.button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {isArabic ? 'سيتم إضافة الدروس قريباً' : 'Lessons coming soon'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Category courses view
  if (selectedCategory && currentCategory) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
        {/* Category Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="p-2 rounded-lg bg-primary/15">
            <currentCategory.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-foreground">
              {isArabic ? currentCategory.title_ar : currentCategory.title_en}
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredCourses.length} {isArabic ? 'كورس' : 'courses'}
            </p>
          </div>
        </div>

        {/* Courses List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredCourses.map((course, index) => {
              const isLocked = course.is_vip && !isVipUser;
              const CourseIcon = course.icon;
              return (
                <motion.button
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => !isLocked && setSelectedCourse(course)}
                  disabled={isLocked}
                  className={cn(
                    "w-full text-start p-4 rounded-xl border transition-all",
                    isLocked
                      ? "bg-muted/30 border-border/20 opacity-70 cursor-not-allowed"
                      : "bg-card/60 border-border/30 hover:bg-card hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isLocked ? "bg-muted" : "bg-gradient-to-br from-primary/20 to-primary/5"
                    )}>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <CourseIcon className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {isArabic ? course.title_ar : course.title_en}
                        </h3>
                        {course.is_vip && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5">VIP</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {isArabic ? course.description_ar : course.description_en}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px]", levelConfig[course.level].color)}>
                          {isArabic ? levelConfig[course.level].label_ar : levelConfig[course.level].label_en}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {course.lessons_count} {isArabic ? 'درس' : 'lessons'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration_minutes} {isArabic ? 'د' : 'min'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Main categories view
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-foreground">
              {isArabic ? 'أكاديمية التداول' : 'Trading Academy'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'تعلم التداول من الصفر إلى الاحتراف' : 'Learn trading from zero to pro'}
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/20">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">{coursesData.length}</p>
            <p className="text-[10px] text-muted-foreground">{isArabic ? 'كورس' : 'Courses'}</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">{categories.length}</p>
            <p className="text-[10px] text-muted-foreground">{isArabic ? 'قسم' : 'Categories'}</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-primary">
              {coursesData.reduce((acc, c) => acc + c.lessons_count, 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">{isArabic ? 'درس' : 'Lessons'}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category, index) => {
              const CategoryIcon = category.icon;
              const catCourses = coursesData.filter(c => c.category_id === category.id);
              const totalLessons = catCourses.reduce((acc, c) => acc + c.lessons_count, 0);

              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.07 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "relative p-4 rounded-2xl border bg-gradient-to-br text-start transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                    category.color
                  )}
                >
                  <div className="mb-3">
                    <CategoryIcon className="w-7 h-7 text-foreground" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1">
                    {isArabic ? category.title_ar : category.title_en}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{catCourses.length} {isArabic ? 'كورس' : 'courses'}</span>
                    <span>•</span>
                    <span>{totalLessons} {isArabic ? 'درس' : 'lessons'}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Featured VIP Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">
                  {isArabic ? 'كورسات VIP حصرية' : 'Exclusive VIP Courses'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? 'اشترك في VIP للوصول إلى الاستراتيجيات المتقدمة والتحليلات الحصرية'
                    : 'Subscribe to VIP for advanced strategies and exclusive analysis'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};
