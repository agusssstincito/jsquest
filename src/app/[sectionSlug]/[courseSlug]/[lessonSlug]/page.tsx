import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { 
  getLessonBySlug, 
  getChallengeBySlug, 
  getDomChallengeBySlug, 
  getCourseBySlug,
  getUserProgressForCourse 
} from '@/lib/supabase/queries'
import { InlineQuiz } from '@/components/lessons/InlineQuiz'
import { MarkCompleteButton } from '@/components/lessons/MarkCompleteButton'
import { ChallengeClient } from '@/components/challenges/ChallengeClient'
import { DomChallengeClient } from '@/components/dom/DomChallengeClient'
import { CourseSidebar } from '@/components/layout/CourseSidebar'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentBlock, Difficulty } from '@/types'

interface PageProps {
  params: Promise<{ sectionSlug: string; courseSlug: string; lessonSlug: string }>
}

export default async function CatchAllSlugPage({ params }: PageProps) {
  const { sectionSlug, courseSlug, lessonSlug } = await params

  // Fetch course first to have context
  const courseBuffer = await getCourseBySlug(courseSlug)
  if (!courseBuffer) notFound()
  
  // Cast to help with typed lessons/challenges if needed, but our queries return what we need
  const course = courseBuffer

  const { userId } = await auth()
  const progress = (userId && course)
    ? await getUserProgressForCourse(userId, course.id)
    : { completedLessonIds: [], completedChallengeIds: [] }

  // Try to find what this slug is (parallel for performance)
  const actualDomSlug = lessonSlug.startsWith('dom-') ? lessonSlug.replace('dom-', '') : lessonSlug
  
  const [lesson, challenge, domChallenge] = await Promise.all([
    getLessonBySlug(courseSlug, lessonSlug),
    getChallengeBySlug(courseSlug, lessonSlug),
    getDomChallengeBySlug(courseSlug, actualDomSlug)
  ])

  // 1. Handle Lesson
  if (lesson) {
    const lessons = course.lessons ?? []
    const currentIndex = lessons.findIndex((l: any) => l.slug === lessonSlug)
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
    const firstChallenge = (course.challenges ?? [])[0]

    return (
      <div className="flex">
        <CourseSidebar
          courseSlug={courseSlug}
          courseTitle={course.title}
          sectionSlug={sectionSlug}
          lessons={course.lessons ?? []}
          challenges={course.challenges ?? []}
          completedLessonIds={progress.completedLessonIds}
          completedChallengeIds={progress.completedChallengeIds}
          activeSlug={lessonSlug}
        />
        <div className="flex-1 lg:ml-56">
          <div className="max-w-3xl mx-auto px-4 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-surface-muted mb-8">
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <span>/</span>
              <Link href={`/${sectionSlug}/${courseSlug}`} className="hover:text-white transition-colors capitalize">{course.title}</Link>
              <span>/</span>
              <span className="text-white">{lesson.title}</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-8">{lesson.title}</h1>

            {/* Content blocks */}
            <div className="flex flex-col gap-4">
              {(Array.isArray(lesson.content) ? lesson.content : JSON.parse(lesson.content as unknown as string) as ContentBlock[]).map((block, i) => {
                if (block.type === 'text') {
                  return (
                    <p
                      key={i}
                      className="text-surface-muted leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: block.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/`(.*?)`/g, '<code class="bg-surface-border text-brand-500 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
                      }}
                    />
                  )
                }

                if (block.type === 'code') {
                  return (
                    <pre
                      key={i}
                      className="bg-[#0d1117] border border-surface-border rounded-lg p-5 overflow-x-auto text-sm font-mono text-green-300 leading-relaxed"
                    >
                      <code>{block.content}</code>
                    </pre>
                  )
                }

                if (block.type === 'callout') {
                  const colors = {
                    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
                    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
                    tip: 'border-green-500/30 bg-green-500/10 text-green-300',
                  }
                  const labels = { info: 'Info', warning: 'Warning', tip: '💡 Tip' }
                  const colorClass = colors[block.calloutType ?? 'info']
                  const label = labels[block.calloutType ?? 'info']

                  return (
                    <div key={i} className={`border rounded-lg p-4 text-sm ${colorClass}`}>
                      <span className="font-semibold">{label}: </span>
                      <span dangerouslySetInnerHTML={{ __html: block.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code class="font-mono">$1</code>')
                      }} />
                    </div>
                  )
                }

                if (block.type === 'quiz' && block.quizId) {
                  const quiz = (lesson.quizzes ?? [])[(lesson.content as ContentBlock[])
                    .filter((b) => b.type === 'quiz')
                    .findIndex((bId) => bId === block)]
                  if (!quiz) return null
                  return <InlineQuiz key={i} quiz={quiz} />
                }

                return null
              })}
            </div>

            {/* Mark complete button */}
            <div className="mt-10 pt-8 border-t border-surface-border">
              <MarkCompleteButton lessonId={lesson.id} />
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              {prevLesson ? (
                <Link
                  href={`/${sectionSlug}/${courseSlug}/${prevLesson.slug}`}
                  className="flex items-center gap-2 text-sm text-surface-muted hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} /> {prevLesson.title}
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  href={`/${sectionSlug}/${courseSlug}/${nextLesson.slug}`}
                  className="flex items-center gap-2 text-sm text-surface-muted hover:text-white transition-colors"
                >
                  {nextLesson.title} <ChevronRight size={16} />
                </Link>
              ) : firstChallenge ? (
                <Link
                  href={`/${sectionSlug}/${courseSlug}/${firstChallenge.slug}`}
                  className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-400 transition-colors"
                >
                  Start challenges <ChevronRight size={16} />
                </Link>
              ) : <div />}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Handle Challenge
  if (challenge) {
    return (
      <div className="flex h-[calc(100vh-56px)]">
        <CourseSidebar
          courseSlug={courseSlug}
          courseTitle={course.title}
          sectionSlug={sectionSlug}
          lessons={course.lessons ?? []}
          challenges={course.challenges ?? []}
          completedLessonIds={progress.completedLessonIds}
          completedChallengeIds={progress.completedChallengeIds}
          activeSlug={lessonSlug}
        />
        <div className="flex-1 lg:ml-56 flex flex-col md:flex-row overflow-hidden h-full bg-surface">
          <div className="w-full md:w-[400px] lg:w-[450px] border-r border-surface-border overflow-y-auto flex-shrink-0 bg-surface">
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-[10px] text-surface-muted uppercase tracking-widest font-semibold">
                <Link href={`/${sectionSlug}/${courseSlug}`} className="hover:text-white transition-colors">
                  {course.title}
                </Link>
                <span className="opacity-30">/</span>
                <span className="text-white">{challenge.title}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none">{challenge.title}</h1>
                <Badge variant="difficulty" difficulty={challenge.difficulty as Difficulty}>
                  {challenge.difficulty}
                </Badge>
              </div>

              <div
                className="text-surface-muted text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: challenge.description
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="bg-surface-card border border-surface-border text-brand-500 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
                    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-[#0d1117] border border-surface-border rounded-lg p-5 overflow-x-auto text-green-300 font-mono text-[11px] leading-relaxed mt-4 mb-4">$1</pre>')
                    .replace(/\n/g, '<br/>')
                }}
              />

              {challenge.test_cases && challenge.test_cases.length > 0 && (
                <div className="pt-4 border-t border-surface-border">
                  <p className="text-[10px] text-surface-muted uppercase tracking-widest font-bold mb-3">Expected Behavior</p>
                  <div className="flex flex-col gap-2">
                    {challenge.test_cases.map((tc) => (
                      <div key={tc.id} className="bg-[#0d1117]/50 border border-surface-border rounded-lg px-4 py-3 font-mono text-[11px] flex items-center justify-between group">
                        <span className="text-surface-muted group-hover:text-white transition-colors">{tc.function_call}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-surface-muted opacity-30">→</span>
                          <span className="text-green-400 font-medium">{tc.expected_output}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
          <ChallengeClient
            challenge={challenge}
            courseSlug={courseSlug}
            sectionSlug={sectionSlug}
            nextChallengeSlug={
              (course.challenges ?? []).find((c: any, i: number) => {
                const current = (course.challenges ?? []).findIndex((ch: any) => ch.slug === lessonSlug)
                return i === current + 1
              })?.slug ?? null
            }
          />
          </div>
        </div>
      </div>
    )
  }

  // 3. Handle DOM Challenge
  if (domChallenge) {
    return (
      <div className="flex h-[calc(100vh-56px)]">
        <CourseSidebar
          courseSlug={courseSlug}
          courseTitle={course.title}
          sectionSlug={sectionSlug}
          lessons={course.lessons ?? []}
          challenges={course.challenges ?? []}
          completedLessonIds={progress.completedLessonIds}
          completedChallengeIds={progress.completedChallengeIds}
          activeSlug={lessonSlug}
        />
        <div className="flex-1 lg:ml-56 flex flex-col md:flex-row overflow-hidden h-full">
          <div className="w-full md:w-[35%] border-r border-surface-border overflow-y-auto flex-shrink-0 bg-surface">
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-xs text-surface-muted">
                <Link href={`/${sectionSlug}/${courseSlug}`} className="hover:text-white capitalize">
                  {course.title}
                </Link>
                <span>/</span>
                <span className="text-white">{domChallenge.title}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-white">{domChallenge.title}</h1>
                <Badge variant="difficulty" difficulty={domChallenge.difficulty as Difficulty}>
                  {domChallenge.difficulty}
                </Badge>
              </div>

              <div
                className="text-surface-muted text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: domChallenge.description
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/`(.*?)`/g, '<code class="bg-surface-border text-brand-500 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
                    .replace(/\n/g, '<br/>')
                }}
              />

              <div>
                <p className="text-xs text-surface-muted uppercase tracking-wide font-medium mb-2">
                  What your code should do
                </p>
                <div className="flex flex-col gap-2">
                  {domChallenge.assertions.map((a, i) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm text-surface-muted">
                      <span className="text-brand-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                      {a.description}
                    </div>
                  ))}
                </div>
              </div>

              {domChallenge.hints && domChallenge.hints.length > 0 && (
                <div className="mt-2 text-xs text-surface-muted border border-surface-border rounded-lg px-4 py-3">
                  <p className="font-medium text-white mb-2">💡 Hints</p>
                  {domChallenge.hints.map((h, i) => (
                    <p key={i} className="mb-1">{i + 1}. {h}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <DomChallengeClient challenge={domChallenge} courseSlug={courseSlug} />
          </div>
        </div>
      </div>
    )
  }

  notFound()
}
