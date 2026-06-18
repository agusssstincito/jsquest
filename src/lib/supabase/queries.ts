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
export async function getCourseBySlug(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons (*),
      challenges (*),
      dom_challenges (*),
      section:sections(slug, title)
    `)
    .eq('slug', slug)
    .order('order_index', { referencedTable: 'lessons' })
    .order('order_index', { referencedTable: 'challenges' })
    .order('order_index', { referencedTable: 'dom_challenges' })
    .single()
    
  if (error) { 
    console.error('Error fetching course:', error)
    return null 
  }
  return data
}

export async function getSectionWithCourses(sectionSlug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sections')
    .select(`
      *,
      courses (*)
    `)
    .eq('slug', sectionSlug)
    .order('order_index', { referencedTable: 'courses' })
    .single()
    
  if (error) { 
    console.error('Error fetching section:', error)
    return null 
  }
  return data
}

// Una lección por slug, con sus quizzes
export async function getLessonBySlug(courseSlug: string, lessonSlug: string) {
  const supabase = createServerClient()
  
  // First get the course id by slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  
  if (courseError || !course) {
    if (courseError && courseError.code !== 'PGRST116') {
      console.error('Course lookup failed:', courseSlug, courseError)
    }
    return null
  }

  // Then get the lesson
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      quizzes: lesson_quizzes (*)
    `)
    .eq('course_id', course.id)
    .eq('slug', lessonSlug)
    .order('order_index', { referencedTable: 'lesson_quizzes' })
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching lesson:', error)
    }
    return null
  }
  return data as (Lesson & { quizzes: LessonQuiz[] })
}

// Un challenge por slug, con test cases visibles (is_hidden = false)
export async function getChallengeBySlug(courseSlug: string, challengeSlug: string) {
  const supabase = createServerClient()
  
  // First get the course id by slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  
  if (courseError || !course) {
    if (courseError && courseError.code !== 'PGRST116') {
      console.error('Course lookup failed for challenge:', courseSlug, courseError)
    }
    return null
  }

  // Then get the challenge
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
    
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching challenge:', error)
    }
    return null
  }

  if (data) {
    data.hints = Array.isArray(data.hints)
      ? data.hints
      : JSON.parse(data.hints as unknown as string)
  }
  return data as (Challenge & { test_cases: TestCase[] })
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
): Promise<{ completedLessonIds: string[]; completedChallengeIds: string[] }> {
  const supabase = createServerClient()
  
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
  
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id')
    .eq('course_id', courseId)
  
  const { data: domChallenges } = await supabase
    .from('dom_challenges')
    .select('id')
    .eq('course_id', courseId)

  const lessonIds = (lessons ?? []).map((l) => l.id)
  const challengeIds = (challenges ?? []).map((c) => c.id)
  const domChallengeIds = (domChallenges ?? []).map((c) => c.id)

  const allRelevantChallengeIds = [...challengeIds, ...domChallengeIds]

  if (lessonIds.length === 0 && allRelevantChallengeIds.length === 0) {
    return { completedLessonIds: [], completedChallengeIds: [] }
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .or(
      `lesson_id.in.(${lessonIds.join(',')}),challenge_id.in.(${allRelevantChallengeIds.join(',')})`
    )
    
  if (error) { 
    console.error('Error fetching user progress:', error)
    return { completedLessonIds: [], completedChallengeIds: [] }
  }

  const completedLessonIds = (data ?? [])
    .filter(p => p.lesson_id)
    .map(p => p.lesson_id as string)
  
  const completedChallengeIds = (data ?? [])
    .filter(p => p.challenge_id)
    .map(p => p.challenge_id as string)

  return { completedLessonIds, completedChallengeIds }
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

export async function getDomChallengeBySlug(courseSlug: string, challengeSlug: string) {
  const supabase = createServerClient()
  
  // First get the course id by slug
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', courseSlug)
    .single()
  
  if (courseError || !course) {
    if (courseError && courseError.code !== 'PGRST116') {
      console.error('Course lookup failed for DOM challenge:', courseSlug, courseError)
    }
    return null
  }

  // Then get the DOM challenge
  const { data, error } = await supabase
    .from('dom_challenges')
    .select('*, assertions: dom_assertions(*)')
    .eq('course_id', course.id)
    .eq('slug', challengeSlug)
    .order('order_index', { referencedTable: 'dom_assertions' })
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching DOM challenge:', error)
    }
    return null
  }

  if (data) {
    data.hints = Array.isArray(data.hints)
      ? data.hints
      : JSON.parse(data.hints as unknown as string)
  }
  return data as (DomChallenge & { assertions: DomAssertion[] })
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



export async function getUserDashboardData(userId: string) {
  const supabase = createServerClient()

  // Get all sections with their courses
  const { data: sections } = await supabase
    .from('sections')
    .select(`
      id, slug, title, order_index,
      courses (
        id, slug, title,
        lessons (id),
        challenges (id)
      )
    `)
    .order('order_index')

  if (!sections) return []

  // Get all user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lesson_id, challenge_id, type')
    .eq('user_id', userId)

  const completedLessonIds = new Set(
    (progress ?? []).filter(p => p.type === 'lesson').map(p => p.lesson_id)
  )
  const completedChallengeIds = new Set(
    (progress ?? []).filter(p => p.type === 'challenge').map(p => p.challenge_id)
  )

  return sections.map(section => {
    const courses = (section.courses ?? []).map(course => {
      const totalLessons = course.lessons?.length ?? 0
      const totalChallenges = course.challenges?.length ?? 0
      const total = totalLessons + totalChallenges

      const completedLessons = (course.lessons ?? [])
        .filter(l => completedLessonIds.has(l.id)).length
      const completedChallenges = (course.challenges ?? [])
        .filter(c => completedChallengeIds.has(c.id)).length
      const completed = completedLessons + completedChallenges

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })

    const sectionTotal = courses.reduce((acc, c) => acc + c.total, 0)
    const sectionCompleted = courses.reduce((acc, c) => acc + c.completed, 0)
    const sectionPercent = sectionTotal > 0
      ? Math.round((sectionCompleted / sectionTotal) * 100)
      : 0

    return {
      id: section.id,
      slug: section.slug,
      title: section.title,
      courses,
      total: sectionTotal,
      completed: sectionCompleted,
      percent: sectionPercent,
    }
  })
}