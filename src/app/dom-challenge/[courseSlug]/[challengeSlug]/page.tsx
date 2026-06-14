import { notFound } from 'next/navigation'
import { getDomChallengeBySlug, getCourseBySlug } from '@/lib/supabase/queries'
import { DomChallengeClient } from '@/components/dom/DomChallengeClient'
import { CourseSidebar } from '@/components/layout/CourseSidebar'
import { Badge } from '@/components/ui/Badge'
import type { Difficulty, Challenge } from '@/types'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ courseSlug: string; challengeSlug: string }>
}

export default async function DomChallengePage({ params }: PageProps) {
  const { courseSlug, challengeSlug } = await params

  const [challenge, course] = await Promise.all([
    getDomChallengeBySlug(courseSlug, challengeSlug),
    getCourseBySlug(courseSlug),
  ])

  if (!challenge || !course) notFound()
  if (challenge) {
    challenge.hints = Array.isArray(challenge.hints)
      ? challenge.hints
      : JSON.parse(challenge.hints as unknown as string)
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <CourseSidebar
        courseSlug={courseSlug}
        courseTitle={course.title}
        lessons={course.lessons ?? []}
        challenges={(course.dom_challenges ?? []) as unknown as Challenge[]}
      />
      <div className="flex-1 lg:ml-56 flex flex-col md:flex-row overflow-hidden h-full">
        {/* Left panel — description */}
        <div className="w-full md:w-[35%] border-r border-surface-border overflow-y-auto flex-shrink-0 bg-surface">
          <div className="p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-xs text-surface-muted">
              <Link href={`/courses/${courseSlug}`} className="hover:text-white capitalize">
                {course.title}
              </Link>
              <span>/</span>
              <span className="text-white">{challenge.title}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-white">{challenge.title}</h1>
              <Badge variant="difficulty" difficulty={challenge.difficulty as Difficulty}>
                {challenge.difficulty}
              </Badge>
            </div>

            <div
              className="text-surface-muted text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: challenge.description
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-surface-border text-brand-500 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
                  .replace(/\n/g, '<br/>')
              }}
            />

            {/* Assertions list (visible descriptions only) */}
            <div>
              <p className="text-xs text-surface-muted uppercase tracking-wide font-medium mb-2">
                What your code should do
              </p>
              <div className="flex flex-col gap-2">
                {challenge.assertions.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm text-surface-muted">
                    <span className="text-brand-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                    {a.description}
                  </div>
                ))}
              </div>
            </div>

            {/* Hints */}
            {challenge.hints && challenge.hints.length > 0 && (
              <div className="mt-2 text-xs text-surface-muted border border-surface-border rounded-lg px-4 py-3">
                <p className="font-medium text-white mb-2">💡 Hints</p>
                {challenge.hints.map((h, i) => (
                  <p key={i} className="mb-1">{i + 1}. {h}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — interactive engine */}
        <div className="flex-1 overflow-hidden">
          <DomChallengeClient challenge={challenge} courseSlug={courseSlug} />
        </div>
      </div>
    </div>
  )
}

