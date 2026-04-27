import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, BookOpen, Bot, CheckCircle2, ClipboardCheck, Database, Edit3, Eye, FileText, GraduationCap, ImagePlus, Layers3, Loader2, Search, Sparkles, Trash2, TrendingUp, Upload, Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { AcademyImageCandidate } from '@/hooks/useAcademy';
import type { AcademyCoursePreview } from '@/hooks/useAcademy';
import type { AcademyExtractedExample, AcademyLesson, AcademyQuestion } from '@/hooks/useAcademy';
import { useAcademyAdminCourses, useAcademyAdminProgress, useAcademyQualityReports, useAcademySourceExamples, useAcademySources, useCreateAcademyCourseFromPreview, useEnhanceAcademyCourse, useGenerateAcademyVisualExample, usePreviewAcademyCourse, usePublishAcademyCourse, useReviewAcademyCourseQuality, useSaveAcademyVisualImage, useSearchAcademyVisualImage, useUpdateAcademyLesson } from '@/hooks/useAcademy';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const getSafeStoragePath = (userId: string, fileName: string) => {
  const extension = fileName.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() || 'bin';
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${randomId}.${extension}`;
};

const renderPdfPageImages = async (pdf: any) => {
  const pageNumbers = Array.from({ length: Math.min(pdf.numPages, 12) }, (_, index) => index + 1);
  const images: string[] = [];

  for (const pageNumber of pageNumbers) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.9 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.68));
  }

  return images;
};

const extractSourceDataFromFile = async (file: File) => {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
      const page = await pdf.getPage(index + 1);
      const textContent = await page.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    }));
    const pageImages = await renderPdfPageImages(pdf);
    return { extractedText: pages.join('\n\n'), pageImages };
  }

  if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) {
    return { extractedText: await file.text(), pageImages: [] };
  }

  return { extractedText: '', pageImages: [] };
};

export const AcademyManagement = () => {
  const [courseTitle, setCourseTitle] = useState('');
  const [lessonsCount, setLessonsCount] = useState(6);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [imageMatches, setImageMatches] = useState<Record<string, AcademyImageCandidate[]>>({});
  const [activeImageExampleId, setActiveImageExampleId] = useState<string | null>(null);
  const [coursePreview, setCoursePreview] = useState<AcademyCoursePreview | null>(null);
  const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
  const [lessonDraft, setLessonDraft] = useState({ title_ar: '', summary_ar: '', content_ar: '', estimated_minutes: 20, examples_ar: [] as string[], exercise_ar: '', chart_examples: [] as Array<{ example_id: string; order: number }>, questions: [] as Array<Pick<AcademyQuestion, 'id' | 'question_ar' | 'options' | 'correct_answer' | 'explanation_ar' | 'points' | 'sort_order'>> });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: courses = [], isLoading } = useAcademyAdminCourses();
  const { data: academyProgress = [] } = useAcademyAdminProgress();
  const { data: qualityReports = [] } = useAcademyQualityReports();
  const { data: sources = [] } = useAcademySources();
  const { data: selectedExamples = [] } = useAcademySourceExamples(selectedSourceId || undefined);
  const visualExampleGenerator = useGenerateAcademyVisualExample();
  const searchVisualImage = useSearchAcademyVisualImage();
  const saveVisualImage = useSaveAcademyVisualImage();
  const publishCourse = usePublishAcademyCourse();
  const reviewCourseQuality = useReviewAcademyCourseQuality();
  const enhanceCourse = useEnhanceAcademyCourse();
  const previewCourse = usePreviewAcademyCourse();
  const createCourseFromPreview = useCreateAcademyCourseFromPreview();
  const updateLesson = useUpdateAcademyLesson();
  const previewExamples = useMemo(() => [...selectedExamples]
    .sort((a, b) => Number(Boolean(b.visual_image_url)) - Number(Boolean(a.visual_image_url)) || (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, 8), [selectedExamples]);

  const generateCoursePreview = () => {
    const title = courseTitle.trim();
    if (!title) {
      toast({ title: 'اكتب اسم الكورس أولاً', description: 'المخطط يحتاج عنوان واضح قبل التوليد.' });
      return;
    }
    previewCourse.mutate({ courseTitle: title, lessonsCount, sourceId: selectedSourceId || undefined }, {
      onSuccess: (preview) => {
        setCoursePreview(preview);
        toast({ title: 'تم توليد مخطط الكورس', description: 'راجع التسلسل والدروس قبل إنشاء المسودة.' });
      },
      onError: (error) => toast({ title: 'فشل توليد المخطط', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
    });
  };

  const approveCoursePreview = () => {
    if (!coursePreview) return;
    createCourseFromPreview.mutate({ preview: coursePreview, sourceId: selectedSourceId || undefined }, {
      onSuccess: (data) => {
        toast({ title: 'تم إنشاء مسودة الكورس', description: `${data.title} — ${data.lessonsCount} دروس بانتظار فحص الجودة.` });
        setCoursePreview(null);
        setCourseTitle('');
      },
      onError: (error) => toast({ title: 'فشل إنشاء المسودة', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
    });
  };

  const processSource = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('لازم تكون مسجّل دخول');
      const { extractedText, pageImages } = await extractSourceDataFromFile(file);
      if ((!extractedText || extractedText.length < 500) && pageImages.length === 0) throw new Error('ما قدرنا نستخرج نص أو صفحات مرئية من الملف. استخدم PDF واضح أو TXT/MD.');

      const filePath = getSafeStoragePath(user.id, file.name);
      const { error: uploadError } = await supabase.storage.from('academy-sources').upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: source, error: sourceError } = await (supabase as any)
        .from('academy_sources')
        .insert({
          uploaded_by: user.id,
          title: file.name.replace(/\.[^.]+$/, ''),
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          status: 'uploaded',
        })
        .select('id')
        .single();
      if (sourceError) throw sourceError;

      const { data, error } = await supabase.functions.invoke('process-academy-source', {
        body: { sourceId: source.id, extractedText, pageImages },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { sourceId: source.id, ...(data as any) };
    },
    onSuccess: (data) => {
      toast({ title: 'المصدر صار جاهز', description: `استخرجنا ${data.chunksCount} مقاطع و ${data.examplesCount} أمثلة.` });
      setSelectedSourceId(data.sourceId);
      queryClient.invalidateQueries({ queryKey: ['academy-sources'] });
    },
    onError: (error) => {
      toast({ title: 'فشل معالجة المصدر', description: error instanceof Error ? error.message : 'جرب ملف تاني.', variant: 'destructive' });
    },
  });

  const reprocessSource = useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke('process-academy-source', {
        body: { sourceId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { sourceId, ...(data as any) };
    },
    onSuccess: (data) => {
      toast({ title: 'تمت إعادة التحليل', description: `استخرجنا ${data.examplesCount} أمثلة من المصدر.` });
      queryClient.invalidateQueries({ queryKey: ['academy-sources'] });
    },
    onError: (error) => {
      toast({ title: 'فشلت إعادة التحليل', description: error instanceof Error ? error.message : 'ارفع المصدر من جديد ليتم تحليل الصور.', variant: 'destructive' });
    },
  });

  const generateVisualExample = (exampleId: string) => visualExampleGenerator.mutate(exampleId, {
    onSuccess: (result) => toast({ title: 'تم توليد الصورة', description: `الصورة اجتازت فحص الجودة${result.validationScore ? ` بنسبة ${result.validationScore}%` : ''} وصارت جاهزة داخل المثال.` }),
    onError: (error) => toast({ title: 'فشل توليد الصورة', description: error instanceof Error ? error.message : 'جرب مرة تانية.', variant: 'destructive' }),
  });

  const searchInternetImage = (exampleId: string) => searchVisualImage.mutate(exampleId, {
    onSuccess: ({ candidates }) => {
      setImageMatches(prev => ({ ...prev, [exampleId]: candidates }));
      setActiveImageExampleId(exampleId);
      toast({ title: candidates.length ? 'لقينا صور مناسبة' : 'ما لقينا صورة مناسبة', description: candidates.length ? 'اختار صورة لحفظها بالمثال.' : 'استخدم التوليد إذا ما في نتيجة مناسبة.' });
    },
    onError: (error) => toast({ title: 'فشل البحث عن صورة', description: error instanceof Error ? error.message : 'جرب مرة تانية.', variant: 'destructive' }),
  });

  const saveInternetImage = (exampleId: string, candidate: AcademyImageCandidate) => saveVisualImage.mutate({ exampleId, candidate }, {
    onSuccess: () => {
      setActiveImageExampleId(null);
      toast({ title: 'تم حفظ الصورة', description: 'الصورة المختارة صارت جاهزة داخل المثال.' });
    },
    onError: (error) => toast({ title: 'فشل حفظ الصورة', description: error instanceof Error ? error.message : 'جرب صورة تانية.', variant: 'destructive' }),
  });

  const getQualityLabel = (quality?: AcademyImageCandidate['quality']) => quality === 'high' ? 'مطابقة قوية' : quality === 'medium' ? 'مطابقة مقبولة' : 'مطابقة ضعيفة';
  const visualStats = useMemo(() => {
    const examples = selectedExamples || [];
    const approved = examples.filter(example => example.visual_status === 'approved' || example.visual_image_url).length;
    const failed = examples.filter(example => example.visual_status === 'failed').length;
    return { total: examples.length, approved, failed, missing: Math.max(0, examples.length - approved - failed) };
  }, [selectedExamples]);
  const draftCourses = courses.filter(course => !course.is_published);
  const roadmapSteps = [
    { title: 'تنظيم الإدارة', status: 'done', detail: 'تبويبات واضحة للمصادر، الصور، البناء، والمراجعة.' },
    { title: 'مسودات قبل النشر', status: 'done', detail: 'الكورس لا يظهر للطلاب قبل فحص الجودة والنشر اليدوي.' },
    { title: 'فحص الصور', status: 'done', detail: 'حالة وجودة ومصدر الصورة محفوظة لكل مثال.' },
    { title: 'مخطط قبل الإنشاء', status: 'done', detail: 'الأدمن يراجع هيكل الكورس قبل إنشاء المسودة.' },
    { title: 'جودة قبل النشر', status: 'done', detail: 'منع النشر تحت 75% مع ملاحظات إصلاح.' },
    { title: 'تجربة الطالب', status: 'done', detail: 'تحسين عرض المسار، الدرس، الأمثلة، والتقدم الفعلي.' },
    { title: 'تحرير المحتوى', status: 'done', detail: 'تعديل الدروس والأسئلة وربط الأمثلة البصرية قبل النشر.' },
    { title: 'تحليلات الأكاديمية', status: 'done', detail: 'قياس الإكمال، التعثر، أفضل الدروس، وجودة كل كورس.' },
    { title: 'تقارير الجودة', status: 'done', detail: 'حفظ تاريخ فحوصات الجودة لكل كورس للمقارنة والتحسين.' },
  ];
  const analytics = useMemo(() => {
    const allLessons = courses.flatMap(course => (course.academy_levels || []).flatMap(level => (level.academy_modules || []).flatMap(module => module.academy_lessons || []).map(lesson => ({ ...lesson, courseTitle: course.title_ar, schoolId: course.id }))));
    const completed = academyProgress.filter((item: any) => item.status === 'completed');
    const activeUsers = new Set(academyProgress.map((item: any) => item.user_id)).size;
    const completedLessons = new Set(completed.map((item: any) => `${item.user_id}:${item.lesson_id}`)).size;
    const coursePerformance = courses.map(course => {
      const lessons = (course.academy_levels || []).flatMap(level => (level.academy_modules || []).flatMap(module => module.academy_lessons || []));
      const lessonIds = new Set(lessons.map(lesson => lesson.id));
      const courseProgress = academyProgress.filter((item: any) => item.school_id === course.id || lessonIds.has(item.lesson_id));
      const users = new Set(courseProgress.map((item: any) => item.user_id)).size;
      const done = courseProgress.filter((item: any) => item.status === 'completed').length;
      const possible = Math.max(1, users * Math.max(1, lessons.length));
      return { id: course.id, title: course.title_ar, users, lessons: lessons.length, completion: Math.round((done / possible) * 100), quality: course.quality_score || 0 };
    }).sort((a, b) => b.users - a.users || b.completion - a.completion).slice(0, 5);
    const lessonCompletion = allLessons.map(lesson => {
      const rows = academyProgress.filter((item: any) => item.lesson_id === lesson.id);
      const users = new Set(rows.map((item: any) => item.user_id)).size;
      const done = rows.filter((item: any) => item.status === 'completed').length;
      return { id: lesson.id, title: lesson.title_ar, courseTitle: lesson.courseTitle, users, completion: users ? Math.round((done / users) * 100) : 0 };
    }).filter(item => item.users > 0).sort((a, b) => a.completion - b.completion || b.users - a.users).slice(0, 5);

    return { activeUsers, completedLessons, totalLessons: allLessons.length, completionRate: academyProgress.length ? Math.round((completed.length / academyProgress.length) * 100) : 0, coursePerformance, lessonCompletion };
  }, [academyProgress, courses]);
  const reviewCourse = (courseId: string) => reviewCourseQuality.mutate(courseId, {
    onSuccess: (result) => toast({ title: result.reviewStatus === 'approved' ? 'الكورس جاهز للنشر' : 'الكورس يحتاج مراجعة', description: `درجة الجودة ${result.qualityScore}%` }),
    onError: (error) => toast({ title: 'فشل فحص الجودة', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
  });
  const autoEnhanceCourse = (courseId: string) => enhanceCourse.mutate(courseId, {
    onSuccess: (result) => toast({ title: 'تم تحسين الكورس تلقائياً', description: `تحسّن ${result.improvedLessons} دروس و ${result.improvedQuestions} أسئلة. الجودة الآن ${result.qualityScore || 0}%` }),
    onError: (error) => toast({ title: 'فشل التحسين التلقائي', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
  });
  const publishReviewedCourse = (courseId: string, qualityScore?: number) => {
    if ((qualityScore || 0) < 75) {
      toast({ title: 'راجع الكورس قبل النشر', description: 'لازم تكون جودة الكورس 75% أو أكثر قبل نشره للطلاب.', variant: 'destructive' });
      return;
    }
    publishCourse.mutate(courseId, {
      onSuccess: (result) => toast({ title: 'تم نشر الكورس', description: `صار ظاهر للطلاب داخل الأكاديمية — ${result.lessonsPublished} دروس بجودة ${result.qualityScore}%.` }),
      onError: (error) => toast({ title: 'فشل النشر', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
    });
  };
  const openLessonEditor = (lesson: AcademyLesson & { academy_quizzes?: Array<{ academy_questions?: AcademyQuestion[] }> }) => {
    setEditingLesson(lesson);
    const questions = [...(lesson.academy_quizzes?.[0]?.academy_questions || [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((question) => ({ id: question.id, question_ar: question.question_ar, options: Array.isArray(question.options) ? question.options : [], correct_answer: question.correct_answer, explanation_ar: question.explanation_ar, points: question.points, sort_order: question.sort_order }));
    setLessonDraft({ title_ar: lesson.title_ar, summary_ar: lesson.summary_ar, content_ar: lesson.content_ar, estimated_minutes: lesson.estimated_minutes, examples_ar: lesson.examples_ar || [], exercise_ar: lesson.exercise_ar || '', chart_examples: (lesson.chart_examples || []).filter(item => item.example_id).map((item, index) => ({ example_id: item.example_id!, order: item.order ?? index + 1 })), questions });
  };
  const moveLinkedExample = (index: number, direction: -1 | 1) => setLessonDraft(prev => {
    const items = [...prev.chart_examples];
    const target = index + direction;
    if (target < 0 || target >= items.length) return prev;
    [items[index], items[target]] = [items[target], items[index]];
    return { ...prev, chart_examples: items.map((item, order) => ({ ...item, order: order + 1 })) };
  });
  const addLinkedExample = (exampleId: string) => setLessonDraft(prev => prev.chart_examples.some(item => item.example_id === exampleId) ? prev : { ...prev, chart_examples: [...prev.chart_examples, { example_id: exampleId, order: prev.chart_examples.length + 1 }] });
  const removeLinkedExample = (exampleId: string) => setLessonDraft(prev => ({ ...prev, chart_examples: prev.chart_examples.filter(item => item.example_id !== exampleId).map((item, order) => ({ ...item, order: order + 1 })) }));
  const saveLessonDraft = () => {
    if (!editingLesson) return;
    if (!lessonDraft.title_ar.trim() || !lessonDraft.content_ar.trim()) {
      toast({ title: 'المراجعة ناقصة', description: 'عنوان الدرس والمحتوى مطلوبان قبل الحفظ.', variant: 'destructive' });
      return;
    }
    updateLesson.mutate({ lessonId: editingLesson.id, ...lessonDraft, chart_examples: lessonDraft.chart_examples.map((item, index) => ({ example_id: item.example_id, order: index + 1 })), questions: lessonDraft.questions.map((question, index) => ({ ...question, sort_order: index })), estimated_minutes: Math.max(1, Number(lessonDraft.estimated_minutes) || 20) }, {
      onSuccess: () => {
        toast({ title: 'تم حفظ تعديل الدرس', description: 'أعد فحص الجودة قبل النشر إذا عدّلت المحتوى.' });
        setEditingLesson(null);
      },
      onError: (error) => toast({ title: 'فشل حفظ الدرس', description: error instanceof Error ? error.message : 'جرب مرة ثانية.', variant: 'destructive' }),
    });
  };

  return (
    <div dir="rtl" className="space-y-5">
      <section className="rounded-xl border border-border/50 bg-card p-5 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Academy Studio</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground">إدارة الأكاديمية</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">ارفع المصادر، استخرج الأمثلة، ثم ولّد مسارات تعليمية كاملة جاهزة للطلاب.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs md:w-[360px]">
            <div className="rounded-lg border border-border/40 bg-background/45 p-3"><GraduationCap className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="font-bold text-foreground">{courses.length}</p><p className="text-muted-foreground">كورسات</p></div>
            <div className="rounded-lg border border-border/40 bg-background/45 p-3"><Database className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="font-bold text-foreground">{sources.length}</p><p className="text-muted-foreground">مصادر</p></div>
            <div className="rounded-lg border border-border/40 bg-background/45 p-3"><Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="font-bold text-foreground">{sources.reduce((sum, s) => sum + s.examples_count, 0)}</p><p className="text-muted-foreground">أمثلة</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">خارطة تطوير الأكاديمية</h3>
            <p className="mt-1 text-sm text-muted-foreground">المنجز حالياً وما تبقّى للوصول لتجربة تعليمية احترافية كاملة.</p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">9/9 مراحل منجزة</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roadmapSteps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-border/40 bg-background/45 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
                <Badge variant={step.status === 'done' ? 'default' : 'secondary'}>{step.status === 'done' ? 'منجز' : 'متبقّي'}</Badge>
              </div>
              <p className="mt-3 font-semibold text-foreground">{step.title}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>
      <Tabs defaultValue="sources" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/35 p-1 md:grid-cols-5">
          <TabsTrigger value="sources">1. المصادر</TabsTrigger>
          <TabsTrigger value="visuals">2. الأمثلة البصرية</TabsTrigger>
          <TabsTrigger value="build">3. بناء المسودة</TabsTrigger>
          <TabsTrigger value="review">4. المراجعة والنشر</TabsTrigger>
          <TabsTrigger value="analytics">5. التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="space-y-5">
      <Card className="overflow-hidden border-border/50 bg-card shadow-xl">
        <CardHeader className="relative border-b border-border/50 bg-muted/25">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">ابنِ مخطط الكورس أولاً</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">ولّد مخطط قابل للمراجعة، وبعد اعتماده يتم إنشاء المسودة بدون نشر تلقائي.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_180px_220px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="course-title">اسم الكورس</Label>
            <Input id="course-title" value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} placeholder="مثلاً: احتراف موجات إليوت من الصفر" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lessons-count">عدد الدروس</Label>
            <Input id="lessons-count" type="number" min={1} max={20} value={lessonsCount} onChange={(event) => setLessonsCount(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-id">مصدر الكورس</Label>
            <select id="source-id" value={selectedSourceId} onChange={(event) => setSelectedSourceId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">بدون مصدر</option>
              {sources.filter(source => source.status === 'ready').map(source => <option key={source.id} value={source.id}>{source.title}</option>)}
            </select>
          </div>
          <Button onClick={generateCoursePreview} disabled={previewCourse.isPending || createCourseFromPreview.isPending} className="gap-2">
            {previewCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            ولّد المخطط
          </Button>
        </CardContent>
      </Card>
      {coursePreview && (
        <Card className="overflow-hidden border-primary/25 bg-card shadow-xl">
          <CardHeader className="border-b border-border/40 bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-primary" />مخطط بانتظار الاعتماد</CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">{coursePreview.title_ar} • {coursePreview.lessons.length} دروس • {coursePreview.difficulty}</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm leading-7 text-muted-foreground">{coursePreview.description_ar}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {coursePreview.lessons.map((lesson, index) => (
                <div key={`${lesson.title_ar}-${index}`} className="rounded-lg border border-border/40 bg-background/45 p-3">
                  <p className="text-xs font-bold text-primary">الدرس {index + 1}</p>
                  <h3 className="mt-1 font-semibold leading-7 text-foreground">{lesson.title_ar}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">{lesson.summary_ar}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={approveCoursePreview} disabled={createCourseFromPreview.isPending} className="gap-2">
                {createCourseFromPreview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                اعتماد وإنشاء المسودة
              </Button>
              <Button variant="outline" onClick={() => setCoursePreview(null)} disabled={createCourseFromPreview.isPending}>إلغاء المخطط</Button>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="sources" className="space-y-5">
      <Card className="overflow-hidden border-border/50 bg-card shadow-xl">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-lg"><Upload className="h-5 w-5 text-primary" />مصادر المعرفة والأمثلة</CardTitle>
          <p className="text-sm text-muted-foreground">ارفع كتاب PDF أو ملف TXT/MD، والنظام بيستخرج منه النص وأمثلة الشارتات والشموع والرسومات.</p>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="rounded-xl border border-dashed border-primary/35 bg-primary/5 p-5">
            <Label htmlFor="academy-source-file" className="mb-3 block">رفع مصدر جديد</Label>
            <Input id="academy-source-file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" disabled={processSource.isPending} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) processSource.mutate(file);
              event.currentTarget.value = '';
            }} />
            {processSource.isPending && <p className="mt-3 flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />عم نقرأ الملف ونحلّل الرسومات والشارتات...</p>}
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {sources.length === 0 ? <p className="text-sm text-muted-foreground">ما في مصادر مرفوعة بعد.</p> : sources.map((source) => (
              <div key={source.id} className="rounded-lg border border-border/50 bg-background/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold"><FileText className="h-4 w-4 text-primary" />{source.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{source.chunks_count} مقاطع • {source.examples_count} أمثلة • {Math.round(source.file_size / 1024)} KB</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="ghost" disabled={source.status !== 'ready'} onClick={() => setSelectedSourceId(source.id)} className="h-8 gap-1 text-xs">
                      <Eye className="h-3 w-3" /> معاينة
                    </Button>
                    <Button size="sm" variant="outline" disabled={reprocessSource.isPending || !source.file_type.includes('text')} onClick={() => reprocessSource.mutate(source.id)} className="h-8 gap-1 text-xs">
                      {reprocessSource.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {source.file_type.includes('text') ? 'إعادة تحليل' : 'ارفعه من جديد للصور'}
                    </Button>
                    <span className={`rounded-full px-2 py-1 text-xs ${source.status === 'ready' ? 'bg-profit/10 text-profit' : source.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {source.status === 'ready' ? <CheckCircle2 className="inline h-3 w-3" /> : source.status === 'failed' ? <AlertTriangle className="inline h-3 w-3" /> : null} {source.status}
                    </span>
                  </div>
                </div>
                {source.error_message && <p className="mt-2 text-xs text-destructive">{source.error_message}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="visuals" className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="border-border/40 bg-card/70"><CardContent className="p-4"><p className="text-2xl font-bold">{visualStats.total}</p><p className="text-xs text-muted-foreground">أمثلة المصدر</p></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="p-4"><p className="text-2xl font-bold text-profit">{visualStats.approved}</p><p className="text-xs text-muted-foreground">صور معتمدة</p></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="p-4"><p className="text-2xl font-bold text-destructive">{visualStats.failed}</p><p className="text-xs text-muted-foreground">فشلت الفحص</p></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="p-4"><p className="text-2xl font-bold text-primary">{visualStats.missing}</p><p className="text-xs text-muted-foreground">تحتاج صورة</p></CardContent></Card>
          </div>
      {selectedSourceId && selectedExamples.length > 0 && (
        <Card className="overflow-hidden border-border/50 bg-card shadow-xl">
          <CardHeader className="border-b border-border/50 bg-muted/25">
            <CardTitle className="flex items-center gap-2 text-lg"><ImagePlus className="h-5 w-5 text-primary" />الأمثلة البصرية المستخرجة</CardTitle>
            <p className="text-sm text-muted-foreground">راجع أفضل الأمثلة من المصدر، وولّد صورة تعليمية واضحة لكل مثال مهم.</p>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
            {previewExamples.map((example) => (
              <div key={example.id} className="overflow-hidden rounded-lg border border-border/50 bg-background/45">
                {example.visual_image_url ? (
                  <img src={example.visual_image_url} alt={example.title_ar} className="h-48 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-muted/40 text-sm text-muted-foreground">لا توجد صورة تعليمية بعد</div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{example.visual_type || 'text_only'}</span>
                    {example.source_page_number && <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">صفحة {example.source_page_number}</span>}
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">تطابق {example.relevance_score || 0}%</span>
                  </div>
                  <h3 className="line-clamp-2 font-bold leading-7 text-foreground">{example.title_ar}</h3>
                  <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{example.visual_summary_ar || example.context_ar}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button size="sm" variant="outline" onClick={() => searchInternetImage(example.id)} disabled={searchVisualImage.isPending || saveVisualImage.isPending} className="gap-2">
                      {searchVisualImage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      ابحث بالإنترنت
                    </Button>
                    <Button size="sm" onClick={() => generateVisualExample(example.id)} disabled={visualExampleGenerator.isPending} className="gap-2">
                      {visualExampleGenerator.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      {example.visual_image_url ? 'إعادة توليد' : 'ولّد صورة'}
                    </Button>
                  </div>
                  {imageMatches[example.id]?.length > 0 && <Button size="sm" variant="secondary" onClick={() => setActiveImageExampleId(example.id)}>عرض {imageMatches[example.id].length} نتائج</Button>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="review" className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><GraduationCap className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{courses.filter(course => course.is_published).length}</p><p className="text-xs text-muted-foreground">كورسات منشورة</p></div></CardContent></Card>
        <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{courses.reduce((sum, course) => sum + (course.academy_levels?.flatMap(level => level.academy_modules?.flatMap(module => module.academy_lessons || []) || []) || []).length, 0)}</p><p className="text-xs text-muted-foreground">دروس جاهزة</p></div></CardContent></Card>
        <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><Layers3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{draftCourses.length}</p><p className="text-xs text-muted-foreground">مسودات للمراجعة</p></div></CardContent></Card>
      </div>

      <Card className="border-border/40 bg-card/70">
        <CardHeader><CardTitle className="text-lg">الكورسات الحالية</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">عم نحمّل الكورسات...</p> : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">ما في كورسات بعد. ولّد أول كورس من فوق.</p>
          ) : courses.map((course) => {
            const lessons = course.academy_levels?.flatMap(level => level.academy_modules?.flatMap(module => module.academy_lessons || []) || []) || [];
            return (
              <div key={course.id} className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{course.title_ar}</p>
                  <p className="text-xs text-muted-foreground">{lessons.length} دروس • {course.difficulty} • جودة {course.quality_score || 0}%</p>
                  {course.quality_notes?.length ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{course.quality_notes[0]}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={course.is_published ? 'default' : 'secondary'}>{course.is_published ? 'منشور' : 'مسودة'}</Badge>
                  {!course.is_published && <Button size="sm" variant="outline" disabled={reviewCourseQuality.isPending} onClick={() => reviewCourse(course.id)}>{reviewCourseQuality.isPending ? 'جار الفحص...' : 'فحص الجودة'}</Button>}
                  {!course.is_published && (course.quality_score || 0) < 75 && (
                    <Button size="sm" variant="outline" disabled={enhanceCourse.isPending} onClick={() => autoEnhanceCourse(course.id)} className="gap-1 border-primary/35 bg-primary/10 text-primary hover:bg-primary/15">
                      {enhanceCourse.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      تحسين تلقائي
                    </Button>
                  )}
                  {!course.is_published && <Button size="sm" disabled={publishCourse.isPending} onClick={() => publishReviewedCourse(course.id, course.quality_score)}>{publishCourse.isPending ? 'جار النشر...' : 'نشر'}</Button>}
                </div>
                </div>
                {!course.is_published && lessons.length > 0 && (
                  <div className="grid gap-2 border-t border-border/35 pt-3 md:grid-cols-2 xl:grid-cols-3">
                    {lessons.slice(0, 6).map((lesson) => (
                      <button key={lesson.id} type="button" onClick={() => openLessonEditor(lesson)} className="rounded-lg border border-border/40 bg-card/55 p-3 text-start transition hover:border-primary/35 hover:bg-primary/5">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><Edit3 className="h-4 w-4 text-primary" />{lesson.title_ar}</span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{lesson.summary_ar}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/70">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck className="h-5 w-5 text-primary" />سجل تقارير الجودة</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {qualityReports.length === 0 ? <p className="text-sm text-muted-foreground">ما في تقارير جودة محفوظة بعد. شغّل فحص الجودة لأي مسودة ليتم حفظ تقرير.</p> : qualityReports.slice(0, 6).map((report) => {
            const course = courses.find(item => item.id === report.course_id);
            return (
              <div key={report.id} className="rounded-lg border border-border/40 bg-background/45 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{course?.title_ar || 'كورس محذوف أو غير معروف'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString('en-GB')} • {report.lesson_count} دروس • صور {report.visual_coverage}% • اختبارات {report.quiz_coverage}%</p>
                  </div>
                  <Badge variant={report.review_status === 'approved' ? 'default' : 'secondary'}>جودة {report.quality_score}%</Badge>
                </div>
                {report.quality_notes?.[0] && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{report.quality_notes[0]}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{analytics.activeUsers}</p><p className="text-xs text-muted-foreground">طلاب نشطون</p></div></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{analytics.completedLessons}</p><p className="text-xs text-muted-foreground">إكمال درس</p></div></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{analytics.totalLessons}</p><p className="text-xs text-muted-foreground">دروس بالنظام</p></div></CardContent></Card>
            <Card className="border-border/40 bg-card/70"><CardContent className="flex items-center gap-3 p-4"><TrendingUp className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{analytics.completionRate}%</p><p className="text-xs text-muted-foreground">معدل الإكمال</p></div></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/40 bg-card/70">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" />أداء الكورسات</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.coursePerformance.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات تقدم بعد.</p> : analytics.coursePerformance.map(course => (
                  <div key={course.id} className="rounded-lg border border-border/40 bg-background/45 p-3">
                    <div className="flex items-center justify-between gap-3"><p className="line-clamp-1 font-semibold text-foreground">{course.title}</p><Badge variant="secondary">{course.users} طلاب</Badge></div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground"><span>{course.lessons} دروس</span><span>إكمال {course.completion}%</span><span>جودة {course.quality}%</span></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/70">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-primary" />دروس تحتاج تحسين</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {analytics.lessonCompletion.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد دروس متعثرة حالياً.</p> : analytics.lessonCompletion.map(lesson => (
                  <div key={lesson.id} className="rounded-lg border border-border/40 bg-background/45 p-3">
                    <p className="line-clamp-1 font-semibold text-foreground">{lesson.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{lesson.courseTitle}</p>
                    <div className="mt-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{lesson.users} طلاب وصلوا لهذا الدرس</span><span className="font-bold text-primary">إكمال {lesson.completion}%</span></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={Boolean(activeImageExampleId)} onOpenChange={(open) => !open && setActiveImageExampleId(null)}>
        <DialogContent dir="rtl" className="max-w-4xl">
          <DialogHeader><DialogTitle>اختيار صورة تعليمية مناسبة</DialogTitle></DialogHeader>
          {activeImageExampleId && imageMatches[activeImageExampleId]?.every(candidate => candidate.quality === 'low') && <p className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm leading-6 text-destructive">كل النتائج ضعيفة لهذا المثال، الأفضل استخدام التوليد إذا لم تجد صورة دقيقة.</p>}
          <div className="grid max-h-[62vh] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
            {(activeImageExampleId ? imageMatches[activeImageExampleId] || [] : []).map((candidate) => (
              <button key={candidate.imageUrl} type="button" disabled={saveVisualImage.isPending || !activeImageExampleId} onClick={() => activeImageExampleId && saveInternetImage(activeImageExampleId, candidate)} className="overflow-hidden rounded-lg border border-border/50 bg-card text-start transition hover:border-primary/40 disabled:opacity-60">
                <img src={candidate.thumbnailUrl} alt={candidate.title} className="h-36 w-full object-cover" loading="lazy" />
                <span className="block space-y-1 p-3">
                  <span className="line-clamp-2 block text-sm leading-6 text-foreground">{candidate.title}</span>
                  <span className="block text-xs text-primary">{candidate.matchReason || 'شارت تعليمي'} • {getQualityLabel(candidate.quality)}</span>
                  <span className="line-clamp-1 block text-xs text-muted-foreground">{candidate.license}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editingLesson)} onOpenChange={(open) => !open && setEditingLesson(null)}>
        <DialogContent dir="rtl" className="max-w-3xl">
          <DialogHeader><DialogTitle>مراجعة وتعديل الدرس</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
            <div className="space-y-2">
              <Label>عنوان الدرس</Label>
              <Input value={lessonDraft.title_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, title_ar: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>الملخص</Label>
              <Textarea value={lessonDraft.summary_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, summary_ar: event.target.value }))} className="min-h-24" />
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <Textarea value={lessonDraft.content_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, content_ar: event.target.value }))} className="min-h-64 font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>أمثلة الدرس النصية</Label>
              <Textarea value={lessonDraft.examples_ar.join('\n')} onChange={(event) => setLessonDraft(prev => ({ ...prev, examples_ar: event.target.value.split('\n').map(item => item.trim()).filter(Boolean) }))} className="min-h-24" />
            </div>
            <div className="space-y-2">
              <Label>التمرين التطبيقي</Label>
              <Textarea value={lessonDraft.exercise_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, exercise_ar: event.target.value }))} className="min-h-20" />
            </div>
            <div className="space-y-3 rounded-lg border border-border/40 bg-background/45 p-3">
              <Label>الأمثلة البصرية المرتبطة</Label>
              {lessonDraft.chart_examples.length === 0 ? <p className="text-xs text-muted-foreground">لا توجد أمثلة بصرية مختارة لهذا الدرس.</p> : lessonDraft.chart_examples.map((item, index) => {
                const example = selectedExamples.find(candidate => candidate.id === item.example_id);
                return (
                  <div key={item.example_id} className="flex items-center gap-2 rounded-md border border-border/35 bg-card/60 p-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                    <p className="min-w-0 flex-1 truncate text-sm text-foreground">{example?.title_ar || item.example_id}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveLinkedExample(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveLinkedExample(index, 1)} disabled={index === lessonDraft.chart_examples.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeLinkedExample(item.example_id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              {selectedExamples.length > 0 && (
                <select value="" onChange={(event) => event.target.value && addLinkedExample(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">إضافة مثال بصري من المصدر</option>
                  {selectedExamples.filter(example => !lessonDraft.chart_examples.some(item => item.example_id === example.id)).map(example => <option key={example.id} value={example.id}>{example.title_ar}</option>)}
                </select>
              )}
            </div>
            {lessonDraft.questions.length > 0 && <div className="space-y-3 rounded-lg border border-border/40 bg-background/45 p-3">
              <Label>أسئلة الاختبار</Label>
              {lessonDraft.questions.map((question, index) => (
                <div key={question.id} className="space-y-2 rounded-md border border-border/35 bg-card/60 p-3">
                  <Input value={question.question_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, questions: prev.questions.map((item, itemIndex) => itemIndex === index ? { ...item, question_ar: event.target.value } : item) }))} />
                  <Textarea value={question.options.join('\n')} onChange={(event) => setLessonDraft(prev => ({ ...prev, questions: prev.questions.map((item, itemIndex) => itemIndex === index ? { ...item, options: event.target.value.split('\n').map(option => option.trim()).filter(Boolean) } : item) }))} className="min-h-20" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={question.correct_answer} onChange={(event) => setLessonDraft(prev => ({ ...prev, questions: prev.questions.map((item, itemIndex) => itemIndex === index ? { ...item, correct_answer: event.target.value } : item) }))} placeholder="الإجابة الصحيحة" />
                    <Input value={question.explanation_ar} onChange={(event) => setLessonDraft(prev => ({ ...prev, questions: prev.questions.map((item, itemIndex) => itemIndex === index ? { ...item, explanation_ar: event.target.value } : item) }))} placeholder="شرح الإجابة" />
                  </div>
                </div>
              ))}
            </div>}
            <div className="space-y-2">
              <Label>مدة الدرس بالدقائق</Label>
              <Input type="number" min={1} value={lessonDraft.estimated_minutes} onChange={(event) => setLessonDraft(prev => ({ ...prev, estimated_minutes: Number(event.target.value) }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveLessonDraft} disabled={updateLesson.isPending} className="gap-2">
                {updateLesson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                حفظ التعديل
              </Button>
              <Button variant="outline" onClick={() => setEditingLesson(null)} disabled={updateLesson.isPending}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
