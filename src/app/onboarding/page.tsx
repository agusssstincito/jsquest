import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ArrowRight, BookOpen, LayoutGrid } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">How do you want to start?</h1>
        <p className="text-surface-muted">Pick the path that fits you best.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link href="/learn/variables/intro">
          <Card hoverable className="flex items-start gap-5">
            <div className="bg-brand-500/10 text-brand-500 p-3 rounded-lg">
              <BookOpen size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">Start from the beginning</h2>
              <p className="text-surface-muted text-sm mt-1">
                Perfect if you&apos;re new to JavaScript. We&apos;ll guide you from variables all the way to async code.
              </p>
            </div>
            <ArrowRight size={18} className="text-surface-muted mt-1" />
          </Card>
        </Link>

        <Link href="/courses">
          <Card hoverable className="flex items-start gap-5">
            <div className="bg-brand-500/10 text-brand-500 p-3 rounded-lg">
              <LayoutGrid size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold text-lg">Choose your own course</h2>
              <p className="text-surface-muted text-sm mt-1">
                Already know some JS? Jump into any topic you want and practice at your own pace.
              </p>
            </div>
            <ArrowRight size={18} className="text-surface-muted mt-1" />
          </Card>
        </Link>
      </div>
    </div>
  )
}
