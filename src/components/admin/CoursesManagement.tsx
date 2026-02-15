import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  BookOpen, GraduationCap, Save, X, ArrowUp, ArrowDown, Crown, Video, FileText, Upload, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  title_ar: string;
  title_en: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

interface Course {
  id: string;
  category_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  is_vip: boolean;
  is_published: boolean;
  sort_order: number;
  channel_url?: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  duration_minutes: number;
  sort_order: number;
  is_vip: boolean;
  is_published: boolean;
}

const iconOptions = ['BookOpen', 'CandlestickChart', 'BarChart3', 'Shield', 'Zap', 'Target', 'TrendingUp', 'LineChart', 'Layers', 'Star'];
const colorOptions = ['blue', 'emerald', 'amber', 'red', 'purple', 'primary', 'cyan', 'orange'];

export const CoursesManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Expanded states
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Dialogs
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [courseDialog, setCourseDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);


  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Form states
  const [catForm, setCatForm] = useState({ title_ar: '', title_en: '', icon: 'BookOpen', color: 'blue' });
  const [courseForm, setCourseForm] = useState<{
    title_ar: string; title_en: string; description_ar: string; description_en: string;
    icon: string; level: 'beginner' | 'intermediate' | 'advanced'; is_vip: boolean; is_published: boolean;
    channel_url: string;
  }>({
    title_ar: '', title_en: '', description_ar: '', description_en: '',
    icon: 'BookOpen', level: 'beginner', is_vip: false, is_published: false, channel_url: ''
  });
  const [lessonForm, setLessonForm] = useState({
    title_ar: '', title_en: '', content_ar: '', content_en: '',
    duration_minutes: 5, is_vip: false, is_published: false,
    video_url: '', content_type: 'text' as string
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catRes, courseRes, lessonRes] = await Promise.all([
      supabase.from('learning_categories').select('*').order('sort_order'),
      supabase.from('learning_courses').select('*').order('sort_order'),
      supabase.from('learning_lessons').select('*').order('sort_order'),
    ]);
    setCategories(catRes.data as unknown as Category[] || []);
    setCourses(courseRes.data as unknown as Course[] || []);
    setLessons(lessonRes.data as unknown as Lesson[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Category CRUD ---
  const openCategoryDialog = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({ title_ar: cat.title_ar, title_en: cat.title_en, icon: cat.icon, color: cat.color });
    } else {
      setEditingCategory(null);
      setCatForm({ title_ar: '', title_en: '', icon: 'BookOpen', color: 'blue' });
    }
    setCategoryDialog(true);
  };

  const saveCategory = async () => {
    if (!catForm.title_ar.trim() || !catForm.title_en.trim()) return;
    if (editingCategory) {
      const { error } = await supabase.from('learning_categories')
        .update({ ...catForm }).eq('id', editingCategory.id);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1;
      const { error } = await supabase.from('learning_categories')
        .insert({ ...catForm, sort_order: maxOrder });
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    }
    setCategoryDialog(false);
    fetchAll();
    toast({ title: editingCategory ? 'تم التحديث' : 'تمت الإضافة' });
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(isArabic ? 'حذف القسم وجميع كورساته؟' : 'Delete category and all its courses?')) return;
    const { error } = await supabase.from('learning_categories').delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    fetchAll();
    toast({ title: 'تم الحذف' });
  };

  const toggleCategoryActive = async (cat: Category) => {
    await supabase.from('learning_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    fetchAll();
  };

  // --- Course CRUD ---
  const openCourseDialog = (categoryId: string, course?: Course) => {
    setSelectedCategoryId(categoryId);
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title_ar: course.title_ar, title_en: course.title_en,
        description_ar: course.description_ar, description_en: course.description_en,
        icon: course.icon, level: course.level, is_vip: course.is_vip, is_published: course.is_published,
        channel_url: course.channel_url || ''
      });
    } else {
      setEditingCourse(null);
      setCourseForm({ title_ar: '', title_en: '', description_ar: '', description_en: '', icon: 'BookOpen', level: 'beginner', is_vip: false, is_published: false, channel_url: '' });
    }
    setCourseDialog(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title_ar.trim() || !courseForm.title_en.trim()) return;
    if (editingCourse) {
      const { error } = await supabase.from('learning_courses')
        .update({ ...courseForm }).eq('id', editingCourse.id);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    } else {
      const catCourses = courses.filter(c => c.category_id === selectedCategoryId);
      const maxOrder = catCourses.length > 0 ? Math.max(...catCourses.map(c => c.sort_order)) + 1 : 1;
      const { error } = await supabase.from('learning_courses')
        .insert({ ...courseForm, category_id: selectedCategoryId, sort_order: maxOrder });
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    }
    setCourseDialog(false);
    fetchAll();
    toast({ title: editingCourse ? 'تم التحديث' : 'تمت الإضافة' });
  };

  const deleteCourse = async (id: string) => {
    if (!confirm(isArabic ? 'حذف الكورس وجميع دروسه؟' : 'Delete course and all its lessons?')) return;
    const { error } = await supabase.from('learning_courses').delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    fetchAll();
    toast({ title: 'تم الحذف' });
  };

  const toggleCoursePublished = async (course: Course) => {
    await supabase.from('learning_courses').update({ is_published: !course.is_published }).eq('id', course.id);
    fetchAll();
  };

  // --- Lesson CRUD ---
  const openLessonDialog = (courseId: string, lesson?: Lesson) => {
    setSelectedCourseId(courseId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title_ar: lesson.title_ar, title_en: lesson.title_en,
        content_ar: lesson.content_ar, content_en: lesson.content_en,
        duration_minutes: lesson.duration_minutes, is_vip: lesson.is_vip, is_published: lesson.is_published,
        video_url: (lesson as any).video_url || '', content_type: (lesson as any).content_type || 'text'
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title_ar: '', title_en: '', content_ar: '', content_en: '', duration_minutes: 5, is_vip: false, is_published: false, video_url: '', content_type: 'text' });
    }
    setLessonDialog(true);
  };

  const saveLesson = async () => {
    if (!lessonForm.title_ar.trim() || !lessonForm.title_en.trim()) return;
    if (editingLesson) {
      const { error } = await supabase.from('learning_lessons')
        .update({ ...lessonForm }).eq('id', editingLesson.id);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    } else {
      const courseLessons = lessons.filter(l => l.course_id === selectedCourseId);
      const maxOrder = courseLessons.length > 0 ? Math.max(...courseLessons.map(l => l.sort_order)) + 1 : 1;
      const { error } = await supabase.from('learning_lessons')
        .insert({ ...lessonForm, course_id: selectedCourseId, sort_order: maxOrder });
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    }
    setLessonDialog(false);
    fetchAll();
    toast({ title: editingLesson ? 'تم التحديث' : 'تمت الإضافة' });
  };

  const deleteLesson = async (id: string) => {
    if (!confirm(isArabic ? 'حذف الدرس؟' : 'Delete lesson?')) return;
    const { error } = await supabase.from('learning_lessons').delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    fetchAll();
    toast({ title: 'تم الحذف' });
  };

  const toggleLessonPublished = async (lesson: Lesson) => {
    await supabase.from('learning_lessons').update({ is_published: !lesson.is_published }).eq('id', lesson.id);
    fetchAll();
  };

  const levelLabel = (level: string) => {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      beginner: { ar: 'مبتدئ', en: 'Beginner', color: 'bg-emerald-500/15 text-emerald-500' },
      intermediate: { ar: 'متوسط', en: 'Intermediate', color: 'bg-amber-500/15 text-amber-500' },
      advanced: { ar: 'متقدم', en: 'Advanced', color: 'bg-red-500/15 text-red-500' },
    };
    const l = map[level] || map.beginner;
    return <Badge variant="outline" className={cn("text-[10px]", l.color)}>{isArabic ? l.ar : l.en}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-cyan-500/15 via-cyan-600/5 to-transparent border border-cyan-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/20">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{isArabic ? 'إدارة الكورسات' : 'Courses Management'}</h2>
              <p className="text-xs text-muted-foreground/70">{categories.length} {isArabic ? 'قسم' : 'categories'} • {courses.length} {isArabic ? 'كورس' : 'courses'}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => openCategoryDialog()} className="gap-1.5 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            {isArabic ? 'قسم جديد' : 'New Category'}
          </Button>
        </div>
      </motion.div>

      {/* Categories Accordion */}
      <div className="space-y-2">
        {categories.map((cat) => {
          const catCourses = courses.filter(c => c.category_id === cat.id);
          const isExpanded = expandedCategory === cat.id;

          return (
            <div key={cat.id} className="rounded-2xl border border-border/25 overflow-hidden backdrop-blur-sm">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full flex items-center justify-between p-3 bg-card/60 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{isArabic ? cat.title_ar : cat.title_en}</span>
                  <Badge variant="secondary" className="text-[10px]">{catCourses.length} {isArabic ? 'كورس' : 'courses'}</Badge>
                  {!cat.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">معطل</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openCategoryDialog(cat); }}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleCategoryActive(cat); }}>
                    {cat.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Category Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-muted/20 space-y-2 border-t border-border/20">
                      <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => openCourseDialog(cat.id)}>
                        <Plus className="w-3.5 h-3.5" />
                        {isArabic ? 'كورس جديد' : 'New Course'}
                      </Button>

                      {catCourses.map((course) => {
                        const courseLessons = lessons.filter(l => l.course_id === course.id);
                        const isCourseExpanded = expandedCourse === course.id;

                        return (
                          <div key={course.id} className="rounded-lg border border-border/20 overflow-hidden">
                            <button
                              onClick={() => setExpandedCourse(isCourseExpanded ? null : course.id)}
                              className="w-full flex items-center justify-between p-2.5 bg-card/40 hover:bg-card/60 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{isArabic ? course.title_ar : course.title_en}</span>
                                {levelLabel(course.level)}
                                {course.is_vip && <Badge className="bg-primary/20 text-primary text-[10px]">VIP</Badge>}
                                <Badge variant={course.is_published ? 'default' : 'secondary'} className="text-[10px]">
                                  {course.is_published ? (isArabic ? 'منشور' : 'Published') : (isArabic ? 'مسودة' : 'Draft')}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{courseLessons.length} {isArabic ? 'درس' : 'lessons'}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openCourseDialog(cat.id, course); }}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleCoursePublished(course); }}>
                                  {course.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                {isCourseExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {isCourseExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-2.5 bg-muted/10 space-y-1.5 border-t border-border/10">
                                    <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs h-8" onClick={() => openLessonDialog(course.id)}>
                                      <Plus className="w-3 h-3" />
                                      {isArabic ? 'درس جديد' : 'New Lesson'}
                                    </Button>

                                    {courseLessons.map((lesson, idx) => (
                                      <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg bg-card/30 border border-border/10">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                                          <span className="text-sm">{isArabic ? lesson.title_ar : lesson.title_en}</span>
                                          <span className="text-[10px] text-muted-foreground">{lesson.duration_minutes}{isArabic ? 'د' : 'm'}</span>
                                          {(lesson as any).content_type === 'video' && <Badge variant="outline" className="text-[8px] px-1 gap-0.5"><Video className="w-2.5 h-2.5" />فيديو</Badge>}
                                          {(lesson as any).content_type === 'both' && <Badge variant="outline" className="text-[8px] px-1 gap-0.5"><Video className="w-2.5 h-2.5" />نص+فيديو</Badge>}
                                          {lesson.is_vip && <Crown className="w-3 h-3 text-primary" />}
                                          {!lesson.is_published && <Badge variant="secondary" className="text-[8px] px-1">مسودة</Badge>}
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openLessonDialog(course.id, lesson)}>
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleLessonPublished(lesson)}>
                                            {lesson.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                          </Button>
                                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteLesson(lesson.id)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? (isArabic ? 'تعديل القسم' : 'Edit Category') : (isArabic ? 'قسم جديد' : 'New Category')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={isArabic ? 'العنوان بالعربي' : 'Arabic title'} value={catForm.title_ar} onChange={e => setCatForm(p => ({ ...p, title_ar: e.target.value }))} />
            <Input placeholder={isArabic ? 'العنوان بالإنجليزي' : 'English title'} value={catForm.title_en} onChange={e => setCatForm(p => ({ ...p, title_en: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={catForm.icon} onValueChange={v => setCatForm(p => ({ ...p, icon: v }))}>
                <SelectTrigger><SelectValue placeholder="Icon" /></SelectTrigger>
                <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={catForm.color} onValueChange={v => setCatForm(p => ({ ...p, color: v }))}>
                <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                <SelectContent>{colorOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={saveCategory} className="w-full gap-1.5"><Save className="w-4 h-4" />{isArabic ? 'حفظ' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourse ? (isArabic ? 'تعديل الكورس' : 'Edit Course') : (isArabic ? 'كورس جديد' : 'New Course')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pe-2">
              <Input placeholder={isArabic ? 'عنوان الكورس بالعربي' : 'Arabic course title'} value={courseForm.title_ar} onChange={e => setCourseForm(p => ({ ...p, title_ar: e.target.value }))} />
              <Input placeholder={isArabic ? 'عنوان الكورس بالإنجليزي' : 'English course title'} value={courseForm.title_en} onChange={e => setCourseForm(p => ({ ...p, title_en: e.target.value }))} />
              <Textarea placeholder={isArabic ? 'الوصف بالعربي' : 'Arabic description'} value={courseForm.description_ar} onChange={e => setCourseForm(p => ({ ...p, description_ar: e.target.value }))} rows={2} />
              <Textarea placeholder={isArabic ? 'الوصف بالإنجليزي' : 'English description'} value={courseForm.description_en} onChange={e => setCourseForm(p => ({ ...p, description_en: e.target.value }))} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={courseForm.level} onValueChange={(v: 'beginner' | 'intermediate' | 'advanced') => setCourseForm(p => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{isArabic ? 'مبتدئ' : 'Beginner'}</SelectItem>
                    <SelectItem value="intermediate">{isArabic ? 'متوسط' : 'Intermediate'}</SelectItem>
                    <SelectItem value="advanced">{isArabic ? 'متقدم' : 'Advanced'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={courseForm.icon} onValueChange={v => setCourseForm(p => ({ ...p, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">{isArabic ? 'محتوى VIP' : 'VIP Content'}</label>
                <Switch checked={courseForm.is_vip} onCheckedChange={v => setCourseForm(p => ({ ...p, is_vip: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">{isArabic ? 'منشور' : 'Published'}</label>
                <Switch checked={courseForm.is_published} onCheckedChange={v => setCourseForm(p => ({ ...p, is_published: v }))} />
              </div>
              <Input 
                placeholder={isArabic ? 'رابط القناة التعليمية (تلغرام/يوتيوب)' : 'Educational channel URL (Telegram/YouTube)'} 
                value={courseForm.channel_url} 
                onChange={e => setCourseForm(p => ({ ...p, channel_url: e.target.value }))} 
                dir="ltr"
              />
              <Button onClick={saveCourse} className="w-full gap-1.5"><Save className="w-4 h-4" />{isArabic ? 'حفظ' : 'Save'}</Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingLesson ? (isArabic ? 'تعديل الدرس' : 'Edit Lesson') : (isArabic ? 'درس جديد' : 'New Lesson')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            <div className="space-y-4 pb-2">
              {/* Title Inputs */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{isArabic ? 'العنوان' : 'Title'}</label>
                <Input placeholder={isArabic ? 'عنوان الدرس بالعربي' : 'Arabic lesson title'} value={lessonForm.title_ar} onChange={e => setLessonForm(p => ({ ...p, title_ar: e.target.value }))} />
                <Input placeholder={isArabic ? 'عنوان الدرس بالإنجليزي' : 'English lesson title'} value={lessonForm.title_en} onChange={e => setLessonForm(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              
              {/* Content Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{isArabic ? 'نوع المحتوى' : 'Content Type'}</label>
                <div className="flex gap-2">
                  {[
                    { value: 'text', label: isArabic ? 'نص' : 'Text', icon: FileText },
                    { value: 'video', label: isArabic ? 'فيديو' : 'Video', icon: Video },
                    { value: 'both', label: isArabic ? 'نص + فيديو' : 'Text + Video', icon: BookOpen },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={lessonForm.content_type === value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => setLessonForm(p => ({ ...p, content_type: value }))}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Video URL or Upload */}
              {(lessonForm.content_type === 'video' || lessonForm.content_type === 'both') && (
                <div className="space-y-3 rounded-lg border border-border/30 bg-muted/10 p-3">
                  <label className="text-sm font-medium">{isArabic ? 'الفيديو' : 'Video'}</label>
                  
                  {!lessonForm.video_url ? (
                    <>
                      {/* Upload Button */}
                      <label className={cn(
                        "flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                        uploadingVideo ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
                      )}>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          className="hidden"
                          disabled={uploadingVideo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 100 * 1024 * 1024) {
                              toast({ title: isArabic ? 'خطأ' : 'Error', description: isArabic ? 'الحد الأقصى 100 ميجا' : 'Max 100MB', variant: 'destructive' });
                              return;
                            }
                            setUploadingVideo(true);
                            const ext = file.name.split('.').pop();
                            const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                            const { error } = await supabase.storage.from('lesson-videos').upload(path, file);
                            if (error) {
                              toast({ title: isArabic ? 'خطأ بالرفع' : 'Upload error', description: error.message, variant: 'destructive' });
                              setUploadingVideo(false);
                              return;
                            }
                            const { data: urlData } = supabase.storage.from('lesson-videos').getPublicUrl(path);
                            setLessonForm(p => ({ ...p, video_url: urlData.publicUrl }));
                            setUploadingVideo(false);
                            toast({ title: isArabic ? 'تم رفع الفيديو ✅' : 'Video uploaded ✅' });
                          }}
                        />
                        {uploadingVideo ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{isArabic ? 'جاري الرفع...' : 'Uploading...'}</span></>
                        ) : (
                          <><Upload className="w-4 h-4" /><span className="text-sm">{isArabic ? 'رفع فيديو' : 'Upload Video'}</span></>
                        )}
                      </label>

                      {/* Or paste URL */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-border/30" />
                        {isArabic ? 'أو أدخل رابط' : 'or paste URL'}
                        <div className="flex-1 h-px bg-border/30" />
                      </div>
                      <Input 
                        placeholder={isArabic ? 'رابط يوتيوب أو فيميو أو رابط مباشر' : 'YouTube, Vimeo, or direct video URL'} 
                        value={lessonForm.video_url} 
                        onChange={e => setLessonForm(p => ({ ...p, video_url: e.target.value }))} 
                      />
                    </>
                  ) : (
                    /* Video Set - Show Preview */
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                      <Video className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground truncate flex-1 max-w-[280px]" dir="ltr">{lessonForm.video_url}</p>
                      <Button size="sm" variant="ghost" className="text-xs text-destructive h-7 px-2 flex-shrink-0" onClick={() => setLessonForm(p => ({ ...p, video_url: '' }))}>
                        {isArabic ? 'إزالة' : 'Remove'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Text Content */}
              {(lessonForm.content_type === 'text' || lessonForm.content_type === 'both') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isArabic ? 'المحتوى النصي' : 'Text Content'}</label>
                  <Textarea placeholder={isArabic ? 'محتوى الدرس بالعربي' : 'Arabic lesson content'} value={lessonForm.content_ar} onChange={e => setLessonForm(p => ({ ...p, content_ar: e.target.value }))} rows={4} />
                  <Textarea placeholder={isArabic ? 'محتوى الدرس بالإنجليزي' : 'English lesson content'} value={lessonForm.content_en} onChange={e => setLessonForm(p => ({ ...p, content_en: e.target.value }))} rows={4} />
                </div>
              )}

              {/* Settings */}
              <div className="space-y-3 rounded-lg border border-border/30 bg-muted/10 p-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm whitespace-nowrap">{isArabic ? 'المدة (دقائق)' : 'Duration (min)'}</label>
                  <Input type="number" min={1} value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 5 }))} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">{isArabic ? 'محتوى VIP' : 'VIP Content'}</label>
                  <Switch checked={lessonForm.is_vip} onCheckedChange={v => setLessonForm(p => ({ ...p, is_vip: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">{isArabic ? 'منشور' : 'Published'}</label>
                  <Switch checked={lessonForm.is_published} onCheckedChange={v => setLessonForm(p => ({ ...p, is_published: v }))} />
                </div>
              </div>

              <Button onClick={saveLesson} className="w-full gap-1.5"><Save className="w-4 h-4" />{isArabic ? 'حفظ' : 'Save'}</Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
