import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserDashboardData } from '@/lib/supabase/queries'
import { BookOpen, Code, ChevronRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/courses')

  const sections = await getUserDashboardData(userId)
  const totalItems = sections.reduce((acc, s) => acc + s.total, 0)
  const totalCompleted = sections.reduce((acc, s) => acc + s.completed, 0)
  const overallPercent = totalItems > 0
    ? Math.round((totalCompleted / totalItems) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400">Track your JavaScript learning progress.</p>
      </div>

      {/* Overall progress card */}
      <div className="bg-[#0d1424] border border-white/5 rounded-2xl p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Overall progress</p>
            <p className="text-4xl font-bold text-white">{overallPercent}%</p>
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl">
            <Trophy size={28} className="text-brand-400" />
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs">
          {totalCompleted} of {totalItems} lessons and challenges completed
        </p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {sections.map(section => (
          <div key={section.id} className="bg-[#0d1424] border border-white/5 rounded-2xl p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-2">
              <Link
                href={`/${section.slug}`}
                className="text-white font-semibold hover:text-brand-400 transition-colors"
              >
                {section.title}
              </Link>
              <span className="text-brand-400 font-bold text-sm">{section.percent}%</span>
            </div>

            {/* Section progress bar */}
            <div className="w-full bg-white/5 rounded-full h-1.5 mb-5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${section.percent}%` }}
              />
            </div>

            {/* Courses grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {section.courses.map((course: any) => (
                <Link
                  key={course.id}
                  href={`/${section.slug}/${course.slug}`}
                  className="group flex items-center justify-between bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-brand-500/20 rounded-xl px-4 py-3 transition-all"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-white text-sm font-medium capitalize truncate group-hover:text-brand-300 transition-colors">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-white/5 rounded-full h-1">
                        <div
                          className={cn(
                            'h-1 rounded-full transition-all duration-300',
                            course.percent === 100 ? 'bg-green-400' : 'bg-brand-500'
                          )}
                          style={{ width: `${course.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">
                        {course.completed}/{course.total}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
