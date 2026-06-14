import { createServerClient } from './server'
import type {
  Section, Course, Lesson, LessonQuiz,
  Challenge, TestCase, UserProgress,
  DomChallenge, DomAssertion
} from '@/types'

// Todas las secciones con sus cursos anidados
export async function getSectionsWithCourses(): Promise<(Section & { courses: Course[] })[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sections')
    .select(`
      *,
      courses (*)
    `)
    .order('order_index')
  
  if (error) { 
    console.error('Error fetching sections:', error)
    return [] 
  }
  
  // Sorting referenced table in JS as alternative if order referencedTable causes issues in some environments,
  // but strictly following prompt logic.
  return data ?? []
}

// Un curso por slug, con lecciones y challenges
export async function getCourseBySlug(slug: string): Promise<(Course & {
  lessons: Lesson[]
  challenges: Challenge[]
  dom_challenges: DomChallenge[]
}) | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons (*),
      challenges (*),
      dom_challenges (*)
    `)
    .eq('slug', slug)
    .single()
    
  if (error) { 
    console.error('Error fetching course:', error)
    return null 
  }
  return data
}

// Una lección por slug, con sus quizzes
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<(Lesson & { quizzes: LessonQuiz[] }) | null> {
  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
    
  if (!course) return null

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      quizzes: lesson_quizzes (*)
    `)
    .eq('course_id', course.id)
    .eq('slug', lessonSlug)
    .single()
    
  if (error) { 
    console.error('Error fetching lesson:', error)
    return null 
  }
  return data
}

// Un challenge por slug, con test cases visibles (is_hidden = false)
export async function getChallengeBySlug(
  courseSlug: string,
  challengeSlug: string
): Promise<(Challenge & { test_cases: TestCase[] }) | null> {
  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
    
  if (!course) return null

  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      test_cases (*)
    `)
    .eq('course_id', course.id)
    .eq('slug', challengeSlug)
    .eq('test_cases.is_hidden', false)
    .single()
    
  if (data) {
    data.hints = Array.isArray(data.hints)
      ? data.hints
      : JSON.parse(data.hints as unknown as string)
  }
  return data
}


// Todos los test cases de un challenge (incluyendo hidden) — solo para server
export async function getAllTestCasesForChallenge(challengeId: string): Promise<TestCase[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('test_cases')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('order_index')
    
  if (error) { 
    console.error('Error fetching test cases:', error)
    return [] 
  }
  return data ?? []
}

// Progreso de un usuario para un curso específico
export async function getUserProgressForCourse(
  userId: string,
  courseId: string
): Promise<UserProgress[]> {
  const supabase = createServerClient()
  
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
  
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id')
    .eq('course_id', courseId)

  const lessonIds = (lessons ?? []).map((l) => l.id)
  const challengeIds = (challenges ?? []).map((c) => c.id)

  if (lessonIds.length === 0 && challengeIds.length === 0) return []

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .or(
      `lesson_id.in.(${lessonIds.join(',')}),challenge_id.in.(${challengeIds.join(',')})`
    )
    
  if (error) { 
    console.error('Error fetching user progress:', error)
    return [] 
  }
  return data ?? []
}

// Marcar lección como completada
export async function markLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      challenge_id: null,
      type: 'lesson',
    }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true })
    
  if (error) { 
    console.error('Error marking lesson completed:', error)
    return false 
  }
  return true
}

// Marcar challenge como completado
export async function markChallengeCompleted(userId: string, challengeId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      lesson_id: null,
      type: 'challenge',
    }, { onConflict: 'user_id,challenge_id', ignoreDuplicates: true })
    
  if (error) { 
    console.error('Error marking challenge completed:', error)
    return false 
  }
  return true
}

export async function getDomChallengeBySlug(
  courseSlug: string,
  challengeSlug: string
): Promise<(DomChallenge & { assertions: DomAssertion[] }) | null> {
  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  if (!course) return null

  const { data, error } = await supabase
    .from('dom_challenges')
    .select('*, assertions: dom_assertions(*)')
    .eq('course_id', course.id)
    .eq('slug', challengeSlug)
    .order('order_index', { referencedTable: 'dom_assertions' })
    .single()
  if (data) {
    data.hints = Array.isArray(data.hints)
      ? data.hints
      : JSON.parse(data.hints as unknown as string)
  }
  return data
}


export async function getDomChallengesByCourse(courseId: string): Promise<DomChallenge[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('dom_challenges')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index')
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getDomChallengesByCourseSlug(courseSlug: string): Promise<DomChallenge[]> {
  const supabase = createServerClient()
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  if (!course) return []

  const { data, error } = await supabase
    .from('dom_challenges')
    .select('*')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('order_index')
  if (error) { console.error(error); return [] }
  return data ?? []
}

