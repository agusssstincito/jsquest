import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSectionWithCourses } from '@/lib/supabase/queries'
import { BookOpen, ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ sectionSlug: string }>
}

export default async function SectionPage({ params }: PageProps) {
  const { sectionSlug } = await params
  const section = await getSectionWithCourses(sectionSlug)
  if (!section) notFound()

  const courses = section.courses ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-10">
        <Link href="/courses" className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3 inline-block">
          ← All sections
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">{section.title}</h1>
        <p className="text-slate-400">{section.description}</p>
      </div>

      {/* Course timeline */}
      <div className="relative">
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-white/5" />
        <div className="flex flex-col gap-2">
          {courses.map((course: { id: string; slug: string; title: string; description: string; challenges?: any[] }) => (
            <Link
              key={course.id}
              href={`/${sectionSlug}/${course.slug}`}
              className="group flex items-center gap-4 py-3 relative"
            >
              {/* Circle with progress */}
              <div className="w-11 h-11 rounded-full border-2 border-brand-500/30 bg-brand-500/5 group-hover:border-brand-500/60 group-hover:bg-brand-500/10 flex items-center justify-center shrink-0 z-10 transition-all">
                <BookOpen size={16} className="text-brand-400" />
              </div>

              {/* Content */}
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div>
                  <p className="text-white font-medium capitalize group-hover:text-brand-300 transition-colors">
                    {course.title}
                  </p>
                  <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">
                    {course.description}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
