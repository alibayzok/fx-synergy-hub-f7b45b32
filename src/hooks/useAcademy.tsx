import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AcademySchool = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  specialty: string;
  difficulty: string;
  estimated_hours: number;
  sort_order: number;
  is_published: boolean;
  review_status?: 'draft' | 'needs_review' | 'approved' | 'published';
  quality_score?: number;
  quality_notes?: string[];
  generated_from_source_id?: string | null;
  created_at: string;
  updated_at: string;
};

type AcademyLevel = {
  id: string;
  school_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  level_key: string;
  sort_order: number;
  is_published: boolean;
};

type AcademyModule = {
  id: string;
  level_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  sort_order: number;
  is_published: boolean;
};

export type AcademyLesson = {
  id: string;
  module_id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  summary_en: string;
  content_ar: string;
  content_en: string;
  examples_ar: string[];
  common_mistakes_ar: string[];
  key_points_ar: string[];
  exercise_ar: string;
  estimated_minutes: number;
  sort_order: number;
  is_published: boolean;
  xp_reward: number;
  chart_examples?: Array<{ example_id?: string; order?: number }> | null;
};

type AcademyQuiz = {
  id: string;
  lesson_id: string;
  title_ar: string;
  title_en: string;
  pass_percentage: number;
  is_required: boolean;
  xp_reward: number;
};

export type AcademyQuestion = {
  id: string;
  quiz_id: string;
  question_ar: string;
  question_en: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation_ar: string;
  points: number;
  sort_order: number;
};

export type AcademySource = {
  id: string;
  school_id: string | null;
  uploaded_by: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  processing_notes: string | null;
  error_message: string | null;
  chunks_count: number;
  examples_count: number;
  processed_at: string | null;
  academy_source_jobs?: Array<{ id: string; status: 'pending' | 'processing' | 'ready' | 'failed'; progress: number; error_message: string | null; created_at: string; updated_at: string }> | null;
  created_at: string;
  updated_at: string;
};

export type AcademyExtractedExample = {
  id: string;
  source_id: string;
  lesson_topic: string;
  title_ar: string;
  context_ar: string;
  steps_ar: string[];
  lesson_ar: string;
  common_mistake_ar: string | null;
  exercise_ar: string | null;
  difficulty: string;
  visual_image_url?: string | null;
  visual_prompt?: string | null;
  visual_summary_ar?: string | null;
  visual_type?: string | null;
  visual_status?: 'missing' | 'pending' | 'approved' | 'failed';
  visual_source?: 'internet' | 'generated' | 'source' | 'manual' | null;
  visual_quality_score?: number;
  visual_validation_issues?: string[];
  visual_source_url?: string | null;
  visual_license?: string | null;
  visual_attribution?: string | null;
  source_page_number?: number | null;
  relevance_score?: number;
};

export type AcademyImageCandidate = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  score: number;
  matchReason?: string;
  quality?: 'high' | 'medium' | 'low';
};

export type AcademyVisualGenerationResult = {
  exampleId: string;
  imageUrl: string;
  validationScore?: number;
  validationIssues?: string[];
};

export type AcademyCourseQualityResult = {
  courseId: string;
  qualityScore: number;
  reviewStatus: 'needs_review' | 'approved';
  qualityNotes: string[];
};

export type AcademyCourseEnhancementResult = AcademyCourseQualityResult & {
  improvedLessons: number;
  improvedQuestions: number;
  linkedVisuals: number;
  queuedVisuals: number;
};

export type AcademyCoursePublishResult = {
  courseId: string;
  qualityScore: number;
  levelsPublished: number;
  modulesPublished: number;
  lessonsPublished: number;
};

export type AcademyCoursePreview = {
  title_ar: string;
  description_ar: string;
  difficulty: string;
  specialty: string;
  lessons: Array<{
    title_ar: string;
    summary_ar: string;
    content_ar?: string;
    key_points_ar?: string[];
    examples_ar?: string[];
    common_mistakes_ar?: string[];
    exercise_ar?: string;
    questions?: Array<{ question_ar: string; options: string[]; correct_answer: number; explanation_ar: string }>;
  }>;
};

export type AcademyQualityReport = {
  id: string;
  course_id: string;
  quality_score: number;
  review_status: 'needs_review' | 'approved' | string;
  quality_notes: string[];
  lesson_count: number;
  visual_coverage: number;
  quiz_coverage: number;
  created_at: string;
};

export type AcademyCourse = AcademySchool & {
  academy_levels?: Array<AcademyLevel & {
    academy_modules?: Array<AcademyModule & {
      academy_lessons?: AcademyLesson[];
    }>;
  }>;
};

export type AcademyLessonDetails = AcademyLesson & {
  academy_modules?: AcademyModule & {
    academy_levels?: AcademyLevel & {
      academy_schools?: AcademySchool;
    };
  };
  academy_quizzes?: Array<AcademyQuiz & { academy_questions?: AcademyQuestion[] }>;
};

const academySelect = `
  *,
  academy_levels(
    *,
    academy_modules(
      *,
      academy_lessons(
        *,
        academy_quizzes(
          *,
          academy_questions(*)
        )
      )
    )
  )
`;

const lessonSelect = `
  *,
  academy_modules(
    *,
    academy_levels(
      *,
      academy_schools(*)
    )
  ),
  academy_quizzes(
    *,
    academy_questions(*)
  )
`;

export const useAcademyCourses = () => useQuery({
  queryKey: ['academy-courses'],
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_schools')
      .select(academySelect)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AcademyCourse[];
  },
});

export const useAcademyAdminCourses = () => useQuery({
  queryKey: ['academy-admin-courses'],
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_schools')
      .select(academySelect)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AcademyCourse[];
  },
});

export const useAcademyLesson = (lessonId?: string) => useQuery({
  queryKey: ['academy-lesson', lessonId],
  enabled: Boolean(lessonId),
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_lessons')
      .select(lessonSelect)
      .eq('id', lessonId)
      .single();

    if (error) throw error;
    return data as AcademyLessonDetails;
  },
});

export const useAcademyCourseLessons = (schoolId?: string) => useQuery({
  queryKey: ['academy-course-lessons', schoolId],
  enabled: Boolean(schoolId),
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_schools')
      .select(academySelect)
      .eq('id', schoolId)
      .single();

    if (error) throw error;
    const course = data as AcademyCourse;
    return (course.academy_levels || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap(level => (level.academy_modules || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap(module => (module.academy_lessons || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(lesson => ({ ...lesson, school_id: course.id }))));
  },
});

export const useAcademySources = () => useQuery({
  queryKey: ['academy-sources'],
  refetchInterval: 8000,
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const sources = (data || []) as AcademySource[];
    const sourceIds = sources.map(source => source.id);
    if (sourceIds.length === 0) return sources;

    const { data: jobs } = await (supabase as any)
      .from('academy_source_jobs')
      .select('id, source_id, status, progress, error_message, created_at, updated_at')
      .in('source_id', sourceIds)
      .order('created_at', { ascending: false });

    const jobsBySource = new Map<string, AcademySource['academy_source_jobs']>();
    (jobs || []).forEach((job: any) => {
      const current = jobsBySource.get(job.source_id) || [];
      current.push({ id: job.id, status: job.status, progress: job.progress, error_message: job.error_message, created_at: job.created_at, updated_at: job.updated_at });
      jobsBySource.set(job.source_id, current);
    });

    return sources.map(source => ({ ...source, academy_source_jobs: jobsBySource.get(source.id) || [] }));
  },
});

export const usePreviewAcademyCourse = () => useMutation({
  mutationFn: async ({ courseTitle, lessonsCount, sourceId }: { courseTitle: string; lessonsCount: number; sourceId?: string }) => {
    const { data, error } = await supabase.functions.invoke('generate-academy-course', {
      body: { courseTitle, lessonsCount, sourceId, mode: 'preview' },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any).preview as AcademyCoursePreview;
  },
});

export const useCreateAcademyCourseFromPreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preview, sourceId }: { preview: AcademyCoursePreview; sourceId?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-academy-course', {
        body: { courseTitle: preview.title_ar, lessonsCount: preview.lessons.length, sourceId, approvedCourse: preview },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { title: string; lessonsCount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-quality-reports'] });
    },
  });
};

export const useAcademySourceExamples = (sourceId?: string) => useQuery({
  queryKey: ['academy-source-examples', sourceId],
  enabled: Boolean(sourceId),
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_extracted_examples')
      .select('*')
      .eq('source_id', sourceId)
      .order('relevance_score', { ascending: false })
      .limit(24);

    if (error) throw error;
    return (data || []) as AcademyExtractedExample[];
  },
});

export const useAcademyVisualExamples = (sourceId?: string) => useQuery({
  queryKey: ['academy-visual-examples', sourceId],
  enabled: Boolean(sourceId),
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_extracted_examples')
      .select('*')
      .eq('source_id', sourceId)
      .not('visual_image_url', 'is', null)
      .order('source_page_number', { ascending: true, nullsFirst: false })
      .order('relevance_score', { ascending: false })
      .limit(120);

    if (error) throw error;
    return (data || []) as AcademyExtractedExample[];
  },
});

export const useAcademyLessonExamples = (sourceId?: string) => useQuery({
  queryKey: ['academy-lesson-examples', sourceId],
  enabled: Boolean(sourceId),
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_extracted_examples')
      .select('*')
      .eq('source_id', sourceId)
      .order('source_page_number', { ascending: true, nullsFirst: false })
      .order('relevance_score', { ascending: false })
      .limit(120);

    if (error) throw error;
    return (data || []) as AcademyExtractedExample[];
  },
});

export const useGenerateAcademyVisualExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exampleId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-academy-visual-example', {
        body: { exampleId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return {
        exampleId,
        imageUrl: (data as { imageUrl: string }).imageUrl,
        validationScore: (data as any)?.validationScore,
        validationIssues: (data as any)?.validationIssues || [],
      } as AcademyVisualGenerationResult;
    },
    onSuccess: ({ exampleId, imageUrl }) => {
      const patchExample = (current: unknown) => Array.isArray(current)
        ? current.map((example) => example.id === exampleId ? { ...example, visual_image_url: imageUrl, visual_status: 'approved', visual_source: 'generated' } : example)
        : current;

      queryClient.setQueriesData({ queryKey: ['academy-source-examples'] }, patchExample);
      queryClient.setQueriesData({ queryKey: ['academy-lesson-examples'] }, patchExample);
      queryClient.setQueriesData({ queryKey: ['academy-visual-examples'] }, patchExample);
      queryClient.invalidateQueries({ queryKey: ['academy-source-examples'] });
      queryClient.invalidateQueries({ queryKey: ['academy-lesson-examples'] });
      queryClient.invalidateQueries({ queryKey: ['academy-visual-examples'] });
    },
  });
};

export const useSearchAcademyVisualImage = () => useMutation({
  mutationFn: async (exampleId: string) => {
    const { data, error } = await supabase.functions.invoke('search-academy-visual-image', {
      body: { exampleId, action: 'search' },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return { exampleId, candidates: ((data as any)?.candidates || []) as AcademyImageCandidate[] };
  },
});

export const useSaveAcademyVisualImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exampleId, candidate }: { exampleId: string; candidate: AcademyImageCandidate }) => {
      const { data, error } = await supabase.functions.invoke('search-academy-visual-image', {
        body: {
          exampleId,
          action: 'save',
          selectedUrl: candidate.imageUrl,
          sourceUrl: candidate.sourceUrl,
          attribution: candidate.attribution,
          license: candidate.license,
          qualityScore: candidate.score,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { exampleId, imageUrl: (data as { imageUrl: string }).imageUrl };
    },
    onSuccess: ({ exampleId, imageUrl }) => {
      const patchExample = (current: unknown) => Array.isArray(current)
        ? current.map((example) => example.id === exampleId ? { ...example, visual_image_url: imageUrl, visual_status: 'approved', visual_source: 'internet' } : example)
        : current;

      queryClient.setQueriesData({ queryKey: ['academy-source-examples'] }, patchExample);
      queryClient.setQueriesData({ queryKey: ['academy-lesson-examples'] }, patchExample);
      queryClient.setQueriesData({ queryKey: ['academy-visual-examples'] }, patchExample);
      queryClient.invalidateQueries({ queryKey: ['academy-source-examples'] });
      queryClient.invalidateQueries({ queryKey: ['academy-lesson-examples'] });
      queryClient.invalidateQueries({ queryKey: ['academy-visual-examples'] });
    },
  });
};

export const usePublishAcademyCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase.functions.invoke('publish-academy-course', { body: { courseId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { courseId, ...(data as any) } as AcademyCoursePublishResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-admin-courses'] });
    },
  });
};

export const useReviewAcademyCourseQuality = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase.functions.invoke('review-academy-course-quality', { body: { courseId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return {
        courseId,
        qualityScore: Number((data as any).qualityScore || 0),
        reviewStatus: (data as any).reviewStatus,
        qualityNotes: (data as any).qualityNotes || [],
      } as AcademyCourseQualityResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-admin-courses'] });
    },
  });
};

export const useEnhanceAcademyCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await supabase.functions.invoke('enhance-academy-course', { body: { courseId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return {
        courseId,
        improvedLessons: Number((data as any).improvedLessons || 0),
        improvedQuestions: Number((data as any).improvedQuestions || 0),
        linkedVisuals: Number((data as any).linkedVisuals || 0),
        queuedVisuals: Number((data as any).queuedVisuals || 0),
        qualityScore: Number((data as any).qualityScore || 0),
        reviewStatus: (data as any).reviewStatus || 'needs_review',
        qualityNotes: (data as any).qualityNotes || [],
      } as AcademyCourseEnhancementResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-quality-reports'] });
      queryClient.invalidateQueries({ queryKey: ['academy-visual-examples'] });
      queryClient.invalidateQueries({ queryKey: ['academy-source-examples'] });
    },
  });
};

export const useUpdateAcademyLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, title_ar, summary_ar, content_ar, estimated_minutes, examples_ar, exercise_ar, chart_examples, questions }: { lessonId: string; title_ar: string; summary_ar: string; content_ar: string; estimated_minutes: number; examples_ar?: string[]; exercise_ar?: string; chart_examples?: Array<{ example_id: string; order: number }>; questions?: Array<Pick<AcademyQuestion, 'id' | 'question_ar' | 'options' | 'correct_answer' | 'explanation_ar' | 'points' | 'sort_order'>> }) => {
      const { error } = await (supabase as any)
        .from('academy_lessons')
        .update({ title_ar, summary_ar, content_ar, estimated_minutes, examples_ar, exercise_ar, chart_examples })
        .eq('id', lessonId);
      if (error) throw error;

      if (questions?.length) {
        const { error: questionsError } = await (supabase as any)
          .from('academy_questions')
          .upsert(questions, { onConflict: 'id' });
        if (questionsError) throw questionsError;
      }

      return { lessonId };
    },
    onSuccess: ({ lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['academy-admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      queryClient.invalidateQueries({ queryKey: ['academy-lesson', lessonId] });
    },
  });
};

export const useAcademyProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['academy-progress', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('academy_user_progress')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAcademyAdminProgress = () => useQuery({
  queryKey: ['academy-admin-progress'],
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_user_progress')
      .select('user_id, school_id, lesson_id, status, completed_at, updated_at');

    if (error) throw error;
    return data || [];
  },
});

export const useAcademyQualityReports = () => useQuery({
  queryKey: ['academy-quality-reports'],
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from('academy_quality_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);

    if (error) throw error;
    return (data || []) as AcademyQualityReport[];
  },
});

export const useCompleteAcademyLesson = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, lessonId, passed }: { schoolId: string; lessonId: string; passed: boolean }) => {
      if (!user) throw new Error('لازم تسجّل دخولك أول');
      const { error } = await (supabase as any)
        .from('academy_user_progress')
        .upsert({
          user_id: user.id,
          school_id: schoolId,
          lesson_id: lessonId,
          status: passed ? 'completed' : 'in_progress',
          completed_at: passed ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,lesson_id' });

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academy-progress'] }),
  });
};
