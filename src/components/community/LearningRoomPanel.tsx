import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, BookOpen, GraduationCap,
  Clock, Star, ChevronLeft, ChevronRight,
  Play, Lock, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LearningRoomPanelProps {
  onBack: () => void;
}

interface Category {
  id: string;
  title_ar: string;
  title_en: string;
  icon: string;
  color: string;
  sort_order: number;
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
  video_url?: string;
  content_type?: string;
}

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  return url;
};

const colorMap: Record<string, string> = {
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  red: 'from-red-500/20 to-red-600/10 border-red-500/30',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  primary: 'from-primary/20 to-primary/10 border-primary/30',
  cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
};

const levelConfig = {
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [catRes, courseRes] = await Promise.all([
      supabase.from('learning_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('learning_courses').select('*').eq('is_published', true).order('sort_order'),
    ]);
    setCategories(catRes.data as unknown as Category[] || []);
    setCourses(courseRes.data as unknown as Course[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchLessons = useCallback(async (courseId: string) => {
    const { data } = await supabase.from('learning_lessons')
      .select('*').eq('course_id', courseId).eq('is_published', true).order('sort_order');
    setLessons(data as unknown as Lesson[] || []);
  }, []);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    fetchLessons(course.id);
  };

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const filteredCourses = selectedCategory ? courses.filter(c => c.category_id === selectedCategory) : [];

  // Lesson view
  if (selectedLesson && selectedCourse) {
    const lessonIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLesson(null)}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{isArabic ? selectedCourse.title_ar : selectedCourse.title_en}</p>
            <h2 className="font-semibold text-foreground truncate">{isArabic ? selectedLesson.title_ar : selectedLesson.title_en}</h2>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            {selectedLesson.duration_minutes} {isArabic ? 'د' : 'min'}
          </Badge>
        </div>

        <div className="px-4 py-2 bg-muted/30 border-b border-border/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{isArabic ? 'الدرس' : 'Lesson'} {lessonIndex + 1} / {lessons.length}</span>
            <span>{Math.round(((lessonIndex + 1) / lessons.length) * 100)}%</span>
          </div>
          <Progress value={((lessonIndex + 1) / lessons.length) * 100} className="h-1.5" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5">
            {/* Video Player */}
            {selectedLesson.video_url && (selectedLesson.content_type === 'video' || selectedLesson.content_type === 'both') && (() => {
              const embedUrl = getEmbedUrl(selectedLesson.video_url);
              const isDirectVideo = selectedLesson.video_url.match(/\.(mp4|webm|ogg)(\?|$)/i);
              return (
                <div className="mb-5 rounded-xl overflow-hidden border border-border/30 bg-black aspect-video">
                  {isDirectVideo ? (
                    <video src={embedUrl || ''} controls className="w-full h-full" />
                  ) : (
                    <iframe
                      src={embedUrl || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              );
            })()}

            {/* Text Content */}
            {(selectedLesson.content_type !== 'video' || !selectedLesson.video_url) && (
              (isArabic ? selectedLesson.content_ar : selectedLesson.content_en).split('\n').map((line, i) => (
                <p key={i} className={cn(
                  "text-foreground leading-relaxed mb-2",
                  line.startsWith('•') && "ps-4 text-muted-foreground",
                  line.match(/^\d\./) && "ps-4 font-medium"
                )}>
                  {line}
                </p>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/30 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" disabled={!prevLesson} onClick={() => prevLesson && setSelectedLesson(prevLesson)} className="gap-1.5">
            {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isArabic ? 'السابق' : 'Previous'}
          </Button>
          <Button size="sm" className="gap-1.5" disabled={!nextLesson} onClick={() => nextLesson && setSelectedLesson(nextLesson)}>
            {isArabic ? 'التالي' : 'Next'}
            {isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // Course detail - lessons list
  if (selectedCourse) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
        <div className="p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(null); setLessons([]); }}>
              <BackArrow className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-foreground">{isArabic ? selectedCourse.title_ar : selectedCourse.title_en}</h2>
              <p className="text-sm text-muted-foreground">{isArabic ? selectedCourse.description_ar : selectedCourse.description_en}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={levelConfig[selectedCourse.level].color}>
              {isArabic ? levelConfig[selectedCourse.level].label_ar : levelConfig[selectedCourse.level].label_en}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {lessons.length} {isArabic ? 'درس' : 'lessons'}
            </span>
            {selectedCourse.is_vip && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">VIP</Badge>}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {lessons.length > 0 ? lessons.map((lesson, index) => {
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
                    isLocked ? "bg-muted/30 border-border/20 opacity-60 cursor-not-allowed"
                      : "bg-card/60 border-border/30 hover:bg-card hover:border-primary/30 hover:shadow-sm"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                    isLocked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                  )}>
                    {isLocked ? <Lock className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">{isArabic ? lesson.title_ar : lesson.title_en}</h4>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {lesson.duration_minutes} {isArabic ? 'د' : 'min'}
                    </span>
                  </div>
                  {!isLocked && (lesson.content_type === 'video' || lesson.content_type === 'both' ? <Video className="w-4 h-4 text-primary flex-shrink-0" /> : <Play className="w-4 h-4 text-primary flex-shrink-0" />)}
                </motion.button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{isArabic ? 'سيتم إضافة الدروس قريباً' : 'Lessons coming soon'}</p>
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
        <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="p-2 rounded-lg bg-primary/15">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-foreground">{isArabic ? currentCategory.title_ar : currentCategory.title_en}</h2>
            <p className="text-xs text-muted-foreground">{filteredCourses.length} {isArabic ? 'كورس' : 'courses'}</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
              const isLocked = course.is_vip && !isVipUser;
              return (
                <motion.button
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => !isLocked && handleSelectCourse(course)}
                  disabled={isLocked}
                  className={cn(
                    "w-full text-start p-4 rounded-xl border transition-all",
                    isLocked ? "bg-muted/30 border-border/20 opacity-70 cursor-not-allowed"
                      : "bg-card/60 border-border/30 hover:bg-card hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isLocked ? "bg-muted" : "bg-gradient-to-br from-primary/20 to-primary/5"
                    )}>
                      {isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <BookOpen className="w-6 h-6 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{isArabic ? course.title_ar : course.title_en}</h3>
                        {course.is_vip && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5">VIP</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{isArabic ? course.description_ar : course.description_en}</p>
                      <Badge variant="outline" className={cn("text-[10px]", levelConfig[course.level].color)}>
                        {isArabic ? levelConfig[course.level].label_ar : levelConfig[course.level].label_en}
                      </Badge>
                    </div>
                  </div>
                </motion.button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{isArabic ? 'لا توجد كورسات بعد' : 'No courses yet'}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Main categories view
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] pt-14 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] pt-14">
      <div className="p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <BackArrow className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-foreground">{isArabic ? 'أكاديمية التداول' : 'Trading Academy'}</h1>
            <p className="text-sm text-muted-foreground">{isArabic ? 'تعلم التداول من الصفر إلى الاحتراف' : 'Learn trading from zero to pro'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/20">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">{courses.length}</p>
            <p className="text-[10px] text-muted-foreground">{isArabic ? 'كورس' : 'Courses'}</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-foreground">{categories.length}</p>
            <p className="text-[10px] text-muted-foreground">{isArabic ? 'قسم' : 'Categories'}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category, index) => {
                const catCourses = courses.filter(c => c.category_id === category.id);
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.07 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "relative p-4 rounded-2xl border bg-gradient-to-br text-start transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                      colorMap[category.color] || colorMap.blue
                    )}
                  >
                    <div className="mb-3">
                      <BookOpen className="w-7 h-7 text-foreground" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{isArabic ? category.title_ar : category.title_en}</h3>
                    <div className="text-[10px] text-muted-foreground">
                      {catCourses.length} {isArabic ? 'كورس' : 'courses'}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">{isArabic ? 'لا توجد أقسام بعد' : 'No categories yet'}</p>
            </div>
          )}

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
                <h4 className="font-bold text-foreground">{isArabic ? 'كورسات VIP حصرية' : 'Exclusive VIP Courses'}</h4>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'اشترك في VIP للوصول إلى الاستراتيجيات المتقدمة' : 'Subscribe to VIP for advanced strategies'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
};
