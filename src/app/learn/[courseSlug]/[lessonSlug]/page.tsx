import { redirect } from 'next/navigation'
import { getCourseBySlug } from '@/lib/supabase/queries'

interface PageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, lessonSlug } = await params
  const course = await getCourseBySlug(courseSlug)

  if (course && course.section) {
    redirect(`/${course.section.slug}/${course.slug}/${lessonSlug}`)
  }

  redirect('/courses')
}

