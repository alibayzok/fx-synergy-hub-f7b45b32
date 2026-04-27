import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Dumbbell, ExternalLink, FileText, ImageIcon, ImagePlus, Lightbulb, ListChecks, Loader2, Map, Search, Sparkles, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { AcademyImageCandidate } from '@/hooks/useAcademy';
import { useAcademyCourseLessons, useAcademyLesson, useAcademyLessonExamples, useCompleteAcademyLesson, useGenerateAcademyVisualExample, useSaveAcademyVisualImage, useSearchAcademyVisualImage } from '@/hooks/useAcademy';

const SOURCE_EXAMPLES_LIMIT = 4;

const normalizeText = (value: string) => value
  .toLowerCase()
  .replace(/[إأآا]/g, 'ا')
  .replace(/[ة]/g, 'ه')
  .replace(/[ى]/g, 'ي')
  .replace(/[ؤئ]/g, 'ء')
  .replace(/[ًٌٍَُِّْـ]/g, '')
  .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getTokens = (value: string) => normalizeText(value).split(' ').filter(token => token.length > 2);

const toDisplayText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.text ?? record.label ?? record.title ?? record.value ?? '');
  }
  return String(value);
};

const getOptionValue = (option: unknown, index: number) => {
  if (option && typeof option === 'object') {
    const record = option as Record<string, unknown>;
    return String(record.id ?? record.value ?? index);
  }
  return String(index);
};

const AcademyLessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator } = useAuth();
  const { data: lesson, isLoading } = useAcademyLesson(lessonId);
  const completeLesson = useCompleteAcademyLesson();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [imageMatches, setImageMatches] = useState<Record<string, AcademyImageCandidate[]>>({});

  const school = lesson?.academy_modules?.academy_levels?.academy_schools;
  const { data: courseLessons = [] } = useAcademyCourseLessons(school?.id);
  const { data: sourceExamples = [] } = useAcademyLessonExamples(school?.generated_from_source_id || undefined);
  const generateVisualExample = useGenerateAcademyVisualExample();
  const searchVisualImage = useSearchAcademyVisualImage();
  const saveVisualImage = useSaveAcademyVisualImage();
  const quiz = lesson?.academy_quizzes?.[0];
  const questions = useMemo(() => [...(quiz?.academy_questions || [])].sort((a, b) => a.sort_order - b.sort_order), [quiz]);
  const currentLessonIndex = courseLessons.findIndex(courseLesson => courseLesson.id === lesson?.id);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : undefined;
  const nextLesson = currentLessonIndex >= 0 ? courseLessons[currentLessonIndex + 1] : undefined;
  const courseProgress = courseLessons.length && currentLessonIndex >= 0 ? Math.round(((currentLessonIndex + 1) / courseLessons.length) * 100) : 0;
  const canGenerateVisualExamples = isAdmin || isModerator;

  const sourceExamplesForLesson = useMemo(() => {
    if (!lesson) return [];
    const title = normalizeText(lesson.title_ar);
    const summary = normalizeText(lesson.summary_ar || '');
    const titleTokens = new Set([...getTokens(lesson.title_ar), ...getTokens(lesson.summary_ar || '')]);

    const linkedExampleIds = Array.isArray(lesson.chart_examples)
      ? lesson.chart_examples.map((item) => item?.example_id).filter(Boolean)
      : [];

    const orderedLinkedExamples = linkedExampleIds
      .map((exampleId) => sourceExamples.find((example) => example.id === exampleId))
      .filter(Boolean);

    if (orderedLinkedExamples.length) return orderedLinkedExamples;

    return sourceExamples
      .map(example => {
        const topic = normalizeText(example.lesson_topic || '');
        const exampleTitle = normalizeText(example.title_ar || '');
        const context = normalizeText(example.context_ar || '');
        const lessonText = normalizeText(example.lesson_ar || '');
        const steps = normalizeText((example.steps_ar || []).join(' '));
        const haystack = `${topic} ${exampleTitle} ${context} ${lessonText} ${steps}`;
        const tokenHits = [...titleTokens].filter(token => haystack.includes(token)).length;
        const visualBoost = /(شارت|شموع|شمعة|رسم|نموذج|ترند|دعم|مقاوم|كسر|اختراق|قاع|قمة|chart|candle|trend|support|resistance)/i.test(haystack) ? 25 : 0;
        const score =
          (example.relevance_score || 0) +
          (example.visual_image_url ? 35 : 0) +
          (example.visual_type && example.visual_type !== 'text_only' ? 20 : 0) +
          (topic === title ? 140 : 0) +
          (topic.includes(title) || title.includes(topic) ? 80 : 0) +
          (exampleTitle.includes(title) || title.includes(exampleTitle) ? 55 : 0) +
          (summary && haystack.includes(summary.slice(0, 45)) ? 25 : 0) +
          (tokenHits * 14) +
          (context.includes(title) ? 25 : 0) +
          (lessonText.includes(title) ? 20 : 0) +
          visualBoost;
        return { example, score };
      })
      .sort((a, b) => b.score - a.score || (a.example.source_page_number || 9999) - (b.example.source_page_number || 9999))
      .slice(0, SOURCE_EXAMPLES_LIMIT)
      .sort((a, b) => (a.example.source_page_number || 9999) - (b.example.source_page_number || 9999))
      .map(item => item.example);
  }, [lesson, sourceExamples]);
  const visualExamplesReady = sourceExamplesForLesson.filter(example => example.visual_image_url).length;

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [lessonId]);

  const result = useMemo(() => {
    if (!questions.length) return { score: 0, max: 0, percent: 100, passed: true };
    const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.correct_answer ? question.points : 0), 0);
    const max = questions.reduce((sum, question) => sum + question.points, 0);
    const percent = max ? Math.round((score / max) * 100) : 100;
    return { score, max, percent, passed: percent >= (quiz?.pass_percentage || 70) };
  }, [answers, questions, quiz?.pass_percentage]);

  const finishLesson = async () => {
    if (!lesson || !school) return;
    await completeLesson.mutateAsync({ schoolId: school.id, lessonId: lesson.id, passed: true });
    toast({ title: 'تم حفظ تقدمك', description: nextLesson ? 'جاهز للدرس التالي.' : 'أنهيت آخر درس في المسار.' });
    if (nextLesson) navigate(`/academy/lesson/${nextLesson.id}`);
  };

  const submitQuiz = async () => {
    if (!lesson || !school) return;
    if (questions.some(q => !answers[q.id])) {
      toast({ title: 'كمّل الاختبار', description: 'جاوب على كل الأسئلة قبل التسليم.' });
      return;
    }
    setSubmitted(true);
    if (result.passed) {
      await completeLesson.mutateAsync({ schoolId: school.id, lessonId: lesson.id, passed: true });
      toast({ title: 'نتيجة ممتازة', description: `نجحت بالاختبار ونتيجتك ${result.percent}%` });
    } else {
      toast({ title: 'بدها مراجعة شوي', description: `نتيجتك ${result.percent}%، راجع الدرس وجرب كمان مرة.` });
    }
  };

  const handleGenerateVisualExample = (exampleId: string) => {
    generateVisualExample.mutate(exampleId, {
      onSuccess: (result) => toast({ title: 'تم توليد الصورة', description: `اجتازت فحص المطابقة${result.validationScore ? ` بنسبة ${result.validationScore}%` : ''} وصارت ظاهرة داخل الدرس.` }),
      onError: (error) => toast({ title: 'فشل توليد الصورة', description: error instanceof Error ? error.message : 'جرب مرة تانية.', variant: 'destructive' }),
    });
  };

  const handleSearchVisualImage = (exampleId: string) => {
    searchVisualImage.mutate(exampleId, {
      onSuccess: ({ candidates }) => {
        setImageMatches(prev => ({ ...prev, [exampleId]: candidates }));
        toast({ title: candidates.length ? 'لقينا صور مناسبة' : 'ما لقينا صورة مناسبة', description: candidates.length ? 'اختار الصورة الأقرب للمثال.' : 'جرّب توليد صورة خاصة للمثال.' });
      },
      onError: (error) => toast({ title: 'فشل البحث عن صورة', description: error instanceof Error ? error.message : 'جرب مرة تانية.', variant: 'destructive' }),
    });
  };

  const handleSaveVisualImage = (exampleId: string, candidate: AcademyImageCandidate) => {
    saveVisualImage.mutate({ exampleId, candidate }, {
      onSuccess: () => toast({ title: 'تم حفظ الصورة', description: 'الصورة المختارة صارت ظاهرة داخل الدرس.' }),
      onError: (error) => toast({ title: 'فشل حفظ الصورة', description: error instanceof Error ? error.message : 'جرب صورة تانية.', variant: 'destructive' }),
    });
  };

  const getQualityLabel = (quality?: AcademyImageCandidate['quality']) => quality === 'high' ? 'مطابقة قوية' : quality === 'medium' ? 'مطابقة مقبولة' : 'مطابقة ضعيفة';

  if (isLoading) {
    return <AppLayout><div className="space-y-4"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div></AppLayout>;
  }

  if (!lesson) {
    return <AppLayout><div className="rounded-xl border border-border/40 bg-card p-8 text-center">الدرس مش موجود.</div></AppLayout>;
  }

  return (
    <AppLayout>
      <main dir="rtl" className="mx-auto grid w-full max-w-7xl gap-5 pb-10 lg:grid-cols-[300px_1fr]">
        <aside className="order-2 space-y-4 lg:order-1">
          <div className="sticky top-5 space-y-4">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate('/academy')}>
              <ArrowRight className="h-4 w-4" /> رجوع للأكاديمية
            </Button>

            <section className="rounded-xl border border-border/50 bg-card p-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Map className="h-4 w-4 text-primary" />موقعك بالمسار</span>
                <span className="font-bold text-primary">{Math.max(currentLessonIndex + 1, 1)}/{courseLessons.length || 1}</span>
              </div>
              <Progress value={courseProgress} className="mt-3 h-2" />
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg border border-border/40 bg-background/45 p-3"><p className="font-bold text-foreground">{courseLessons.length}</p><p className="text-muted-foreground">دروس</p></div>
                <div className="rounded-lg border border-border/40 bg-background/45 p-3"><p className="font-bold text-foreground">{courseProgress}%</p><p className="text-muted-foreground">تقدم</p></div>
              </div>
              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pe-1">
                {courseLessons.map((courseLesson, index) => {
                  const active = courseLesson.id === lesson.id;
                  return (
                    <button key={courseLesson.id} onClick={() => navigate(`/academy/lesson/${courseLesson.id}`)} className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-start text-sm transition hover:translate-x-[-2px]', active ? 'border-primary/45 bg-primary/10 text-primary shadow-sm shadow-primary/10' : 'border-border/40 bg-background/35 text-muted-foreground hover:border-primary/30 hover:text-foreground')}>
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold', active ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{index + 1}</span>
                      <span className="line-clamp-2 flex-1">{courseLesson.title_ar}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </aside>

        <div className="order-1 space-y-5 lg:order-2">
          <header className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl animate-fade-in">
            <div className="relative border-b border-border/50 bg-muted/25 p-5 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,hsl(var(--primary)/0.14),transparent_34%),radial-gradient(circle_at_80%_20%,hsl(var(--profit)/0.08),transparent_30%)]" />
              <div className="relative grid gap-5 lg:grid-cols-[1fr_220px] lg:items-end">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">{school?.title_ar || 'الأكاديمية'}</Badge>
                  <h1 className="text-2xl font-bold leading-10 text-foreground md:text-4xl">{lesson.title_ar}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{lesson.summary_ar}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border/40 bg-background/60 px-3 py-1"><BookOpen className="me-1 inline h-3.5 w-3.5 text-primary" />{lesson.estimated_minutes} دقيقة</span>
                    <span className="rounded-md border border-border/40 bg-background/60 px-3 py-1"><Sparkles className="me-1 inline h-3.5 w-3.5 text-primary" />{lesson.xp_reward} XP</span>
                    <span className="rounded-md border border-border/40 bg-background/60 px-3 py-1"><FileText className="me-1 inline h-3.5 w-3.5 text-primary" />{sourceExamplesForLesson.length} أمثلة مصدر</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/55 p-4">
                  <p className="text-xs text-muted-foreground">جاهزية الدرس</p>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between"><span>الأمثلة البصرية</span><span className="font-bold text-primary">{visualExamplesReady}/{sourceExamplesForLesson.length}</span></div>
                    <div className="flex justify-between"><span>الاختبار</span><span className="font-bold text-primary">{questions.length ? `${questions.length} أسئلة` : 'بدون اختبار'}</span></div>
                    <div className="flex justify-between"><span>الموقع</span><span className="font-bold text-primary">{Math.max(currentLessonIndex + 1, 1)}/{courseLessons.length || 1}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <article className="rounded-xl border border-border/50 bg-card p-5 shadow-xl md:p-8 animate-fade-in">
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:leading-10 prose-p:leading-9 prose-p:text-muted-foreground prose-strong:text-primary prose-li:leading-8 prose-li:text-muted-foreground md:prose-base" dir="rtl">
              <ReactMarkdown>{lesson.content_ar}</ReactMarkdown>
            </div>
          </article>

          <section className="grid gap-4 xl:grid-cols-2">
            {lesson.key_points_ar?.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5 shadow-sm animate-fade-in">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-primary"><Lightbulb className="h-5 w-5" />الخلاصة المهمة</h2>
                <ul className="space-y-3 text-sm leading-7 text-foreground">
                  {lesson.key_points_ar.map((point, index) => <li key={index} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />{point}</li>)}
                </ul>
              </div>
            )}

            {lesson.common_mistakes_ar?.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 shadow-sm animate-fade-in">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-destructive"><XCircle className="h-5 w-5" />أخطاء انتبه منها</h2>
                <ul className="space-y-3 text-sm leading-7 text-foreground">
                  {lesson.common_mistakes_ar.map((mistake, index) => <li key={index}>• {mistake}</li>)}
                </ul>
              </div>
            )}
          </section>

          {(lesson.examples_ar?.length > 0 || sourceExamplesForLesson.length > 0) && (
            <section className="rounded-xl border border-border/50 bg-card p-5 shadow-xl md:p-7 animate-fade-in">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><Sparkles className="h-5 w-5 text-primary" />أمثلة وتطبيقات</h2>
                  {sourceExamplesForLesson.length > 0 && <p className="mt-2 text-sm leading-7 text-muted-foreground">تسلسل بصري مرتب حسب صفحات المصدر ومرتبط بموضوع الدرس.</p>}
                </div>
                {sourceExamplesForLesson.length > 0 && <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary"><ImageIcon className="me-1 h-3.5 w-3.5" />{sourceExamplesForLesson.length} أمثلة بصرية</Badge>}
              </div>
              <div className="grid gap-5">
                {sourceExamplesForLesson.map((example, index) => (
                  <div key={example.id} className="overflow-hidden rounded-xl border border-primary/25 bg-primary/5 shadow-sm transition hover:border-primary/40">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                      <div className="relative flex min-h-[260px] items-center justify-center border-b border-border/40 bg-background/40 lg:border-b-0 lg:border-e">
                        {example.visual_image_url ? (
                          <img src={example.visual_image_url} alt={example.title_ar} className="h-full min-h-[260px] max-h-[520px] w-full object-contain p-3" loading="lazy" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 p-6 text-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">الصورة التعليمية قيد التحضير.</p>
                            {canGenerateVisualExamples && (
                              <div className="flex flex-wrap justify-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSearchVisualImage(example.id)} disabled={searchVisualImage.isPending || saveVisualImage.isPending} className="gap-2">
                                  {searchVisualImage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                  ابحث عن صورة
                                </Button>
                                <Button size="sm" onClick={() => handleGenerateVisualExample(example.id)} disabled={generateVisualExample.isPending} className="gap-2">
                                  {generateVisualExample.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                                  ولّد صورة
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-md bg-primary text-primary-foreground">المثال {index + 1}</Badge>
                          {example.source_page_number && <span className="rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground">صفحة {example.source_page_number}</span>}
                          {example.visual_type && <span className="rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground">{example.visual_type}</span>}
                        </div>
                        <h3 className="text-lg font-bold leading-8 text-foreground">{example.title_ar}</h3>
                        {example.visual_summary_ar && <p className="mt-3 rounded-lg bg-background/60 p-3 text-sm leading-7 text-foreground">{example.visual_summary_ar}</p>}
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{example.context_ar}</p>
                        {example.steps_ar?.length > 0 && <ol className="mt-4 space-y-2 text-sm leading-7 text-foreground">{example.steps_ar.slice(0, 4).map((step, stepIndex) => <li key={stepIndex} className="flex gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">{stepIndex + 1}</span><span>{step}</span></li>)}</ol>}
                        <p className="mt-4 rounded-lg border border-primary/20 bg-background/65 p-3 text-sm font-medium leading-7 text-primary">{example.lesson_ar}</p>
                        {canGenerateVisualExamples && imageMatches[example.id]?.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {imageMatches[example.id].every(candidate => candidate.quality === 'low') && <p className="rounded-md border border-destructive/25 bg-destructive/10 p-2 text-xs leading-5 text-destructive">النتائج غير دقيقة كفاية، الأفضل توليد صورة خاصة إذا ما وجدت خيار مناسب.</p>}
                            <div className="grid gap-3 sm:grid-cols-2">
                              {imageMatches[example.id].slice(0, 4).map((candidate) => (
                                <div key={candidate.imageUrl} className="overflow-hidden rounded-lg border border-border/50 bg-background/55">
                                  <img src={candidate.thumbnailUrl} alt={candidate.title} className="h-28 w-full object-cover" loading="lazy" />
                                  <div className="space-y-2 p-3">
                                    <p className="line-clamp-2 text-xs font-medium leading-5 text-foreground">{candidate.title}</p>
                                    <p className="text-[11px] text-primary">{candidate.matchReason || 'شارت تعليمي'} • {getQualityLabel(candidate.quality)}</p>
                                    <p className="line-clamp-1 text-[11px] text-muted-foreground">{candidate.license}</p>
                                    <div className="flex gap-2">
                                      <Button size="sm" className="h-8 flex-1 text-xs" disabled={saveVisualImage.isPending} onClick={() => handleSaveVisualImage(example.id, candidate)}>
                                        {saveVisualImage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'استخدمها'}
                                      </Button>
                                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                                        <a href={candidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {lesson.examples_ar.map((example, index) => (
                  <div key={index} className="rounded-lg border border-border/40 bg-background/45 p-4 text-sm leading-7 text-foreground transition hover:border-primary/30">
                    <span className="mb-2 block text-xs font-bold text-primary">مثال الدرس {index + 1}</span>
                    {example}
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.exercise_ar && (
            <section className="rounded-xl border border-border/50 bg-card p-5 shadow-xl animate-fade-in">
              <h2 className="mb-3 flex items-center gap-2 font-bold"><Dumbbell className="h-5 w-5 text-primary" />تمرين تطبيقي</h2>
              <p className="text-sm leading-7 text-muted-foreground">{lesson.exercise_ar}</p>
            </section>
          )}

          <section className="rounded-xl border border-border/50 bg-card p-5 shadow-xl md:p-7 animate-fade-in">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold"><ListChecks className="h-5 w-5 text-primary" />اختبار الدرس</h2>
            {questions.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">ما في اختبار لهالدرس حالياً. فيك تحفظ التقدم وتنتقل للدرس التالي.</p>
                <Button onClick={finishLesson} disabled={completeLesson.isPending} className="gap-2"><CheckCircle2 className="h-4 w-4" />أنهي الدرس</Button>
              </div>
            ) : (
              <div className="space-y-5">
                {questions.map((question, qIndex) => (
                  <div key={question.id} className="rounded-lg border border-border/40 bg-background/40 p-4">
                    <p className="mb-3 font-semibold leading-7">{qIndex + 1}. {question.question_ar}</p>
                    <div className="grid gap-2">
                      {(Array.isArray(question.options) ? question.options : []).map((option, index) => {
                        const value = getOptionValue(option, index);
                        const label = toDisplayText(option) || `الخيار ${index + 1}`;
                        const selected = answers[question.id] === value;
                        const correct = submitted && question.correct_answer === value;
                        const wrong = submitted && selected && question.correct_answer !== value;
                        return (
                          <button key={index} type="button" disabled={submitted} onClick={() => setAnswers(prev => ({ ...prev, [question.id]: value }))} className={cn('flex items-center justify-between rounded-lg border px-3 py-3 text-start text-sm transition-all hover:translate-x-[-2px]', selected ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 bg-card/50 text-foreground hover:border-primary/30', correct && 'border-profit bg-profit/10 text-profit', wrong && 'border-destructive bg-destructive/10 text-destructive')}>
                            <span>{label}</span>
                            {correct && <CheckCircle2 className="h-4 w-4" />}
                            {wrong && <XCircle className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && question.explanation_ar && <p className="mt-3 text-xs leading-6 text-muted-foreground">{question.explanation_ar}</p>}
                  </div>
                ))}

                {submitted && (
                  <div className={cn('rounded-lg border p-4', result.passed ? 'border-profit/30 bg-profit/10' : 'border-destructive/30 bg-destructive/10')}>
                    <p className="font-bold">نتيجتك: {result.score}/{result.max} — {result.percent}%</p>
                    <p className="mt-1 text-sm text-muted-foreground">{result.passed ? (nextLesson ? 'ممتاز، انتقل للدرس التالي لما تكون جاهز.' : 'ممتاز، خلصت آخر درس بهالكورس.') : 'راجع النقاط المهمة وجرب مرة تانية.'}</p>
                  </div>
                )}

                <Button className="w-full" disabled={completeLesson.isPending || submitted} onClick={submitQuiz}>سلّم الاختبار</Button>
              </div>
            )}
          </section>

          <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" disabled={!previousLesson} onClick={() => previousLesson && navigate(`/academy/lesson/${previousLesson.id}`)} className="gap-2"><ArrowRight className="h-4 w-4" />الدرس السابق</Button>
            <Button disabled={!nextLesson || (questions.length > 0 && !submitted)} onClick={() => nextLesson && navigate(`/academy/lesson/${nextLesson.id}`)} className="gap-2">الدرس التالي <ArrowLeft className="h-4 w-4" /></Button>
          </nav>
        </div>
      </main>
    </AppLayout>
  );
};

export default AcademyLessonPage;
