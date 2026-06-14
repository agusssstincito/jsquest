'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Code, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson, Challenge } from '@/types'

interface CourseSidebarProps {
  courseSlug: string
  courseTitle: string
  lessons: Lesson[]
  challenges: Challenge[]
}

export function CourseSidebar({ courseSlug, courseTitle, lessons, challenges }: CourseSidebarProps) {
  const pathname = usePathname()

  const items = [
    ...lessons.map(l => ({ type: 'lesson' as const, slug: l.slug, title: l.title, id: l.id, order: l.order_index })),
    ...challenges.map(c => ({ type: 'challenge' as const, slug: c.slug, title: c.title, id: c.id, order: c.order_index })),
  ].sort((a, b) => a.order - b.order)

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-56px)] w-56 border-r border-white/5 bg-[#0a0f1e] overflow-y-auto hidden lg:flex flex-col z-40">
      {/* Course title */}
      <div className="px-4 py-4 border-b border-white/5">
        <Link href={`/courses/${courseSlug}`} className="text-xs text-brand-400 font-semibold uppercase tracking-widest hover:text-brand-300 transition-colors capitalize">
          {courseTitle}
        </Link>
      </div>

      {/* Items list */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {items.map((item, index) => {
          const href = item.type === 'lesson'
            ? `/learn/${courseSlug}/${item.slug}`
            : `/challenge/${courseSlug}/${item.slug}`
          const isActive = pathname === href

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all group',
                isActive
                  ? 'bg-brand-500/10 text-brand-400 font-medium'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
            >
              {/* Number */}
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border',
                isActive
                  ? 'border-brand-500/50 bg-brand-500/20 text-brand-400'
                  : 'border-white/10 text-slate-600 group-hover:border-white/20 group-hover:text-slate-400'
              )}>
                {index + 1}
              </span>

              {/* Icon */}
              {item.type === 'lesson'
                ? <BookOpen size={11} className="shrink-0 opacity-60" />
                : <Code size={11} className="shrink-0 opacity-60" />
              }

              {/* Title */}
              <span className="truncate leading-tight">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
