import { redirect } from 'next/navigation'
import { getCourseBySlug } from '@/lib/supabase/queries'

interface PageProps {
  params: Promise<{ courseSlug: string; challengeSlug: string }>
}

export default async function ChallengePage({ params }: PageProps) {
  const { courseSlug, challengeSlug } = await params
  const course = await getCourseBySlug(courseSlug)

  if (course && course.section) {
    redirect(`/${course.section.slug}/${course.slug}/${challengeSlug}`)
  }

  redirect('/courses')
}

