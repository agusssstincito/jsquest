import { notFound } from 'next/navigation'
import { getLessonBySlug, getCourseBySlug } from '@/lib/supabase/queries'
import { InlineQuiz } from '@/components/lessons/InlineQuiz'
import { MarkCompleteButton } from '@/components/lessons/MarkCompleteButton'
import { CourseSidebar } from '@/components/layout/CourseSidebar'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentBlock } from '@/types'

interface PageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, lessonSlug } = await params

  const [lesson, course] = await Promise.all([
    getLessonBySlug(courseSlug, lessonSlug),
    getCourseBySlug(courseSlug),
  ])

  if (!lesson || !course) notFound()

  const lessons = course.lessons ?? []
  const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const firstChallenge = (course.challenges ?? [])[0]

  return (
    <div className="flex">
      <CourseSidebar
        courseSlug={courseSlug}
        courseTitle={course.title}
        lessons={course.lessons ?? []}
        challenges={course.challenges ?? []}
      />
      <div className="flex-1 lg:ml-56">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-surface-muted mb-8">
            <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
            <span>/</span>
            <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors capitalize">{course.title}</Link>
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
                const quiz = lesson.quizzes?.[
                  (lesson.content as ContentBlock[])
                    .filter((b) => b.type === 'quiz')
                    .findIndex((bId) => bId === block)
                ]
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
                href={`/learn/${courseSlug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-sm text-surface-muted hover:text-white transition-colors"
              >
                <ChevronLeft size={16} /> {prevLesson.title}
              </Link>
            ) : <div />}

            {nextLesson ? (
              <Link
                href={`/learn/${courseSlug}/${nextLesson.slug}`}
                className="flex items-center gap-2 text-sm text-surface-muted hover:text-white transition-colors"
              >
                {nextLesson.title} <ChevronRight size={16} />
              </Link>
            ) : firstChallenge ? (
              <Link
                href={`/challenge/${courseSlug}/${firstChallenge.slug}`}
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

