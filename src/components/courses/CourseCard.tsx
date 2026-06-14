import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Course } from '@/types'

interface CourseCardProps {
  course: Course
  completedItems?: number
  totalItems?: number
}

export function CourseCard({ course, completedItems = 0, totalItems = 0 }: CourseCardProps) {
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="group relative bg-[#0d1424] border border-white/5 hover:border-brand-500/30 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/5 h-full flex flex-col">
        
        {/* Top accent line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex-1">
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-2">Course</p>
          <h3 className="text-white font-semibold text-base mb-2 capitalize group-hover:text-brand-300 transition-colors">
            {course.title}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
            {course.description}
          </p>
        </div>

        {totalItems > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{completedItems}/{totalItems} completed</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1">
              <div className="bg-brand-500 h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs text-slate-600 group-hover:text-brand-400 transition-colors">
          <span>Explore</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
