import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseBySlug, getDomChallengesByCourseSlug } from '@/lib/supabase/queries'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Code, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types'

interface PageProps {
  params: Promise<{ courseSlug: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseSlug } = await params
  const [course, domChallenges] = await Promise.all([
    getCourseBySlug(courseSlug),
    getDomChallengesByCourseSlug(courseSlug),
  ])
  if (!course) notFound()

  const lessons = course.lessons ?? []
  const challenges = course.challenges ?? []

  // Build unified timeline sorted by order_index
  const timelineItems = [
    ...lessons.map(l => ({ type: 'lesson' as const, ...l })),
    ...challenges.map(c => ({ type: 'challenge' as const, ...c })),
    ...domChallenges.map(c => ({ type: 'dom' as const, ...c, difficulty: c.difficulty as Difficulty })),
  ].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10">
        <Link href="/courses" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3 inline-block">
          ← All courses
        </Link>
        <h1 className="text-4xl font-bold text-white capitalize mb-2">{course.title}</h1>
        <p className="text-slate-400">{course.description}</p>

        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-brand-400" />
            {lessons.length} lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Code size={14} className="text-brand-400" />
            {challenges.length + domChallenges.length} challenges
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-white/5" />

        <div className="flex flex-col gap-1">
          {timelineItems.map((item, index) => {
            const href = item.type === 'lesson'
              ? `/learn/${courseSlug}/${item.slug}`
              : item.type === 'dom'
              ? `/dom-challenge/${courseSlug}/${item.slug}`
              : `/challenge/${courseSlug}/${item.slug}`

            const isLesson = item.type === 'lesson'
            const isDom = item.type === 'dom'

            return (
              <Link key={item.id} href={href} className="group flex items-center gap-4 py-2 relative">
                {/* Circle */}
                <div className={cn(
                  'w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all',
                  isLesson
                    ? 'border-brand-500/30 bg-brand-500/5 group-hover:border-brand-500/60 group-hover:bg-brand-500/10'
                    : isDom
                    ? 'border-purple-500/30 bg-purple-500/5 group-hover:border-purple-500/60'
                    : 'border-white/10 bg-white/5 group-hover:border-white/20 group-hover:bg-white/10'
                )}>
                  {isLesson
                    ? <BookOpen size={16} className="text-brand-400" />
                    : <Code size={16} className={isDom ? 'text-purple-400' : 'text-slate-400'} />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider',
                        isLesson ? 'text-brand-400' : isDom ? 'text-purple-400' : 'text-slate-500'
                      )}>
                        {isLesson ? 'Lesson' : isDom ? 'DOM' : 'Challenge'}
                      </span>
                      {!isLesson && (item as any).difficulty && (
                        <Badge variant="difficulty" difficulty={(item as any).difficulty}>
                          {(item as any).difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium truncate group-hover:text-brand-300 transition-colors">
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 ml-2" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
