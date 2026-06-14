import { notFound } from 'next/navigation'
import { getChallengeBySlug, getCourseBySlug } from '@/lib/supabase/queries'
import { ChallengeClient } from '@/components/challenges/ChallengeClient'
import { CourseSidebar } from '@/components/layout/CourseSidebar'
import { Badge } from '@/components/ui/Badge'
import type { Difficulty } from '@/types'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ courseSlug: string; challengeSlug: string }>
}

export default async function ChallengePage({ params }: PageProps) {
  const { courseSlug, challengeSlug } = await params

  const [challenge, course] = await Promise.all([
    getChallengeBySlug(courseSlug, challengeSlug),
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
        challenges={course.challenges ?? []}
      />
      <div className="flex-1 lg:ml-56 flex flex-col md:flex-row overflow-hidden h-full bg-surface">
        {/* Left Panel — Description & Info */}
        <div className="w-full md:w-[400px] lg:w-[450px] border-r border-surface-border overflow-y-auto flex-shrink-0 bg-surface">
          <div className="p-6 flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] text-surface-muted uppercase tracking-widest font-semibold">
              <Link href={`/courses/${courseSlug}`} className="hover:text-white transition-colors">
                {course.title}
              </Link>
              <span className="opacity-30">/</span>
              <span className="text-white">{challenge.title}</span>
            </div>

            {/* Title & Difficulty */}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none">{challenge.title}</h1>
              <Badge variant="difficulty" difficulty={challenge.difficulty as Difficulty}>
                {challenge.difficulty}
              </Badge>
            </div>

            {/* Description */}
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

            {/* Test cases as examples */}
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

        {/* Right Panel — Interactive Code Engine */}
        <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
          <ChallengeClient
            challenge={challenge}
            courseSlug={courseSlug}
            nextChallengeSlug={
              (course.challenges ?? []).find((c, i) => {
                const current = (course.challenges ?? []).findIndex((ch) => ch.slug === challengeSlug)
                return i === current + 1
              })?.slug ?? null
            }
          />
        </div>
      </div>
    </div>
  )
}

