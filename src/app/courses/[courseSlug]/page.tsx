import { redirect } from 'next/navigation'
import { getCourseBySlug } from '@/lib/supabase/queries'

interface PageProps {
  params: Promise<{ courseSlug: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseSlug } = await params
  const course = await getCourseBySlug(courseSlug)

  if (course && course.section) {
    redirect(`/${course.section.slug}/${course.slug}`)
  }

  // Fallback if not found or logic fails
  redirect('/courses')
}
