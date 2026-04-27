import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronLeft, Clock, Compass, GraduationCap, Layers3, Lock, PlayCircle, Search, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAcademyCourses, useAcademyProgress } from '@/hooks/useAcademy';
import { useAuth } from '@/hooks/useAuth';

type CourseLesson = NonNullable<NonNullable<ReturnType<typeof useAcademyCourses>['data']>[number]['academy_levels']>[number]['academy_modules'] extends infer M
  ? any
  : never;

const flattenLessons = (course: any) => (course.academy_levels || [])
  .slice()
  .sort((a: any, b: any) => a.sort_order - b.sort_order)
  .flatMap((level: any) => (level.academy_modules || [])
    .slice()
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .flatMap((module: any) => (module.academy_lessons || [])
      .slice()
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((lesson: CourseLesson) => ({ ...lesson, levelTitle: level.title_ar, moduleTitle: module.title_ar }))));

const AcademyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useAcademyCourses();
  const { data: progress = [] } = useAcademyProgress();
  const [query, setQuery] = useState('');

  const completedLessons = useMemo(() => new Set(progress.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id)), [progress]);
  const stats = useMemo(() => {
    const lessonsCount = courses.reduce((sum, course) => sum + flattenLessons(course).length, 0);
    return {
      courses: courses.length,
      lessons: lessonsCount,
      completed: completedLessons.size,
      percent: lessonsCount ? Math.round((completedLessons.size / lessonsCount) * 100) : 0,
    };
  }, [courses, completedLessons]);

  const filteredCourses = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return courses;
    return courses.filter(course => `${course.title_ar} ${course.description_ar} ${course.specialty}`.toLowerCase().includes(value));
  }, [courses, query]);

  return (
    <AppLayout>
      <main dir="rtl" className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl animate-fade-in">
            <div className="relative border-b border-border/50 bg-muted/25 p-5 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,hsl(var(--primary)/0.16),transparent_34%),radial-gradient(circle_at_85%_10%,hsl(var(--profit)/0.10),transparent_28%)]" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">ASSASSIN FX ACADEMY</Badge>
                  <div>
                    <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">أكاديمية التداول</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground md:text-base">
                      تجربة تعليمية مرتبة مثل خريطة طريق: كورسات قصيرة، أمثلة بصرية، واختبارات خفيفة تساعد الطالب ينتقل خطوة بخطوة بثقة.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border/40 bg-background/55 px-3 py-1"><Compass className="me-1 inline h-3.5 w-3.5 text-primary" />مسار واضح</span>
                    <span className="rounded-md border border-border/40 bg-background/55 px-3 py-1"><Sparkles className="me-1 inline h-3.5 w-3.5 text-primary" />أمثلة بصرية</span>
                    <span className="rounded-md border border-border/40 bg-background/55 px-3 py-1"><CheckCircle2 className="me-1 inline h-3.5 w-3.5 text-profit" />تقدم محفوظ</span>
                  </div>
                </div>
                <Button disabled={!user || !filteredCourses[0]} onClick={() => {
                  const first = filteredCourses[0] ? flattenLessons(filteredCourses[0]).find((lesson: any) => !completedLessons.has(lesson.id)) || flattenLessons(filteredCourses[0])[0] : undefined;
                  if (first) navigate(`/academy/lesson/${first.id}`);
                }} className="h-11 shrink-0 gap-2 shadow-lg shadow-primary/20">
                  {!user ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  ابدأ التعلم
                </Button>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: GraduationCap, label: 'المسارات', value: stats.courses },
                { icon: BookOpen, label: 'الدروس', value: stats.lessons },
                { icon: Trophy, label: 'المكتمل', value: stats.completed },
                { icon: CheckCircle2, label: 'التقدم', value: `${stats.percent}%` },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-border/40 bg-background/50 p-4 transition hover:border-primary/30 hover:bg-primary/5">
                    <Icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-border/50 bg-card p-5 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers3 className="h-5 w-5 text-primary" /> لوحة التقدم
            </div>
            <Progress value={stats.percent} className="mt-5 h-2" />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">إجمالي الإنجاز</span>
              <span className="font-bold text-primary">{stats.percent}%</span>
            </div>
            <div className="mt-5 space-y-3 rounded-lg border border-border/40 bg-background/45 p-4">
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">الكورسات المتاحة</span><span className="font-bold text-foreground">{stats.courses}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">دروسك المكتملة</span><span className="font-bold text-foreground">{stats.completed}/{stats.lessons}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">الخطوة التالية</span><span className="font-bold text-primary">{stats.percent >= 100 ? 'مراجعة' : 'متابعة'}</span></div>
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              {user ? 'تقدمك محفوظ تلقائياً بعد اجتياز الاختبارات أو إنهاء الدروس.' : 'سجّل دخولك لتفتح الدروس وتحفظ تقدمك.'}
            </p>
          </aside>
        </section>

        <div className="relative max-w-xl animate-fade-in">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن كورس أو موضوع..." className="h-11 pe-9" />
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />) : filteredCourses.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border/50 bg-card p-10 text-center shadow-xl">
              <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h2 className="text-lg font-bold text-foreground">ما في كورسات مطابقة حالياً</h2>
              <p className="mt-2 text-sm text-muted-foreground">جرّب بحث مختلف أو أنشئ كورس جديد من لوحة الإدارة.</p>
            </div>
          ) : filteredCourses.map((course, index) => {
            const lessons = flattenLessons(course);
            const done = lessons.filter((lesson: any) => completedLessons.has(lesson.id)).length;
            const nextLesson = lessons.find((lesson: any) => !completedLessons.has(lesson.id)) || lessons[0];
            const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
            const levelsCount = course.academy_levels?.length || 0;

            return (
              <motion.article
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group flex min-h-[340px] flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="relative border-b border-border/50 bg-muted/25 p-5">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="rounded-md">{course.difficulty}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-4 w-4 text-primary" />{course.estimated_hours} ساعات</span>
                  </div>
                  <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-8 text-foreground">{course.title_ar}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.description_ar}</p>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-border/30 bg-muted/35 p-3"><p className="font-bold text-foreground">{levelsCount}</p><p className="text-muted-foreground">مستويات</p></div>
                    <div className="rounded-lg border border-border/30 bg-muted/35 p-3"><p className="font-bold text-foreground">{lessons.length}</p><p className="text-muted-foreground">دروس</p></div>
                    <div className="rounded-lg border border-border/30 bg-muted/35 p-3"><p className="font-bold text-foreground">{done}</p><p className="text-muted-foreground">منجز</p></div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>تقدم الكورس</span><span>{percent}%</span></div>
                    <Progress value={percent} className="h-2" />
                  </div>

                  <div className="mt-auto space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">أول دروس المسار</p>
                    {lessons.slice(0, 3).map((lesson: any) => (
                      <button key={lesson.id} onClick={() => user && navigate(`/academy/lesson/${lesson.id}`)} disabled={!user} className={cn('flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-start text-sm transition hover:border-primary/35', !user && 'cursor-not-allowed opacity-60')}>
                        <span className="line-clamp-1">{lesson.title_ar}</span>
                        {completedLessons.has(lesson.id) ? <CheckCircle2 className="h-4 w-4 text-profit" /> : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    ))}
                  </div>

                  <Button className="w-full gap-2" disabled={!user || !nextLesson} onClick={() => nextLesson && navigate(`/academy/lesson/${nextLesson.id}`)}>
                    {!user ? <Lock className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    {done > 0 ? 'كمّل المسار' : 'ابدأ المسار'}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </section>
      </main>
    </AppLayout>
  );
};

export default AcademyPage;
