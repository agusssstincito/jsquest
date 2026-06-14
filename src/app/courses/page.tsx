import { getSectionsWithCourses } from '@/lib/supabase/queries'
import { CourseCard } from '@/components/courses/CourseCard'

const sectionColors: Record<string, { gradient: string; border: string; label: string }> = {
  'javascript-basics': { gradient: 'from-blue-500/5 to-cyan-500/5', border: 'border-blue-500/10', label: 'text-blue-400' },
  'intermediate-javascript': { gradient: 'from-purple-500/5 to-pink-500/5', border: 'border-purple-500/10', label: 'text-purple-400' },
  'javascript-dom': { gradient: 'from-green-500/5 to-emerald-500/5', border: 'border-green-500/10', label: 'text-green-400' },
  'javascript-practice': { gradient: 'from-orange-500/5 to-yellow-500/5', border: 'border-orange-500/10', label: 'text-orange-400' },
}

export default async function CoursesPage() {
  const sections = await getSectionsWithCourses()

  return (
    <div className="max-w-6xl mx-auto px-4 pt-12 pb-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">All Courses</h1>
        <p className="text-slate-400 text-lg">
          Pick a topic and start learning with lessons and coding challenges.
        </p>
      </div>

      {sections.length === 0 && (
        <p className="text-slate-400">No courses available yet.</p>
      )}

      <div className="flex flex-col gap-16">
        {sections.map((section) => {
          const colors = sectionColors[section.slug] ?? { gradient: 'from-slate-500/5 to-slate-500/5', border: 'border-slate-500/10', label: 'text-slate-400' }
          return (
            <div key={section.id}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${colors.label}`}>
                  {section.title}
                </span>
                <div className={`flex-1 h-px bg-gradient-to-r ${colors.gradient} border-t ${colors.border}`} />
              </div>
              {section.description && (
                <p className="text-slate-500 text-sm mb-6">{section.description}</p>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.courses?.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
