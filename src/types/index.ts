export type Difficulty = 'easy' | 'medium' | 'hard'
export type ProgressType = 'lesson' | 'challenge'
export type ContentBlockType = 'text' | 'code' | 'quiz' | 'callout'
export type CalloutType = 'info' | 'warning' | 'tip'

export interface Section {
  id: string
  slug: string
  title: string
  description: string | null
  order_index: number
}

export interface Course {
  id: string
  section_id: string
  slug: string
  title: string
  description: string
  order_index: number
  is_published: boolean
  section?: Section
}

export interface ContentBlock {
  type: ContentBlockType
  content: string
  language?: string
  quizId?: string
  calloutType?: CalloutType
}

export interface Lesson {
  id: string
  course_id: string
  slug: string
  title: string
  content: ContentBlock[]
  order_index: number
  is_published: boolean
}

export interface LessonQuiz {
  id: string
  lesson_id: string
  question: string
  options: string[]
  correct_option_index: number
  explanation: string | null
  order_index: number
}

export interface Challenge {
  id: string
  course_id: string
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  starter_code: string
  hints: string[]
  order_index: number
  is_published: boolean
}

export interface TestCase {
  id: string
  challenge_id: string
  description: string
  function_call: string
  expected_output: string
  is_hidden: boolean
  order_index: number
}

export interface TestCaseResult {
  testCase: TestCase
  passed: boolean
  actualOutput: string
  error: string | null
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string | null
  challenge_id: string | null
  type: ProgressType
  completed_at: string
}

export interface CourseWithProgress extends Course {
  lessons: (Lesson & { completed: boolean })[]
  challenges: (Challenge & { completed: boolean })[]
  totalItems: number
  completedItems: number
}

export interface DomChallenge {
  id: string
  course_id: string
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  html_template: string
  starter_js: string
  hints: string[]
  order_index: number
  is_published: boolean
}

export interface DomAssertion {
  id: string
  challenge_id: string
  description: string
  assertion: string
  order_index: number
}

export interface DomAssertionResult {
  assertion: DomAssertion
  passed: boolean
  error: string | null
}

