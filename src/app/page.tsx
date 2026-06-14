import Link from 'next/link'
import { ArrowRight, BookOpen, Code2, Zap, Terminal } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />
        
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none animate-glow" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs px-4 py-2 rounded-full mb-8 font-medium">
            <Zap size={11} className="fill-brand-400" />
            Free forever · No account required to browse
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Learn JavaScript
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">
              by doing
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Lessons, quizzes, and code challenges — all in one place.
            Go from zero to confident in JavaScript.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/onboarding"
              className="group flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5">
              Start Learning
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/courses"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5">
              Browse Courses
            </Link>
          </div>

          {/* Code preview */}
          <div className="max-w-lg mx-auto bg-[#0d1424] border border-white/10 rounded-xl overflow-hidden shadow-2xl text-left">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-slate-500 font-mono">solution.js</span>
            </div>
            <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto">
              <span className="text-slate-500">{"// Challenge: Sum two numbers\n"}</span>
              <span className="text-purple-400">{"function "}</span>
              <span className="text-cyan-300">{"solution"}</span>
              <span className="text-white">{"(a, b) {"}</span>
              <span className="text-slate-500">{"\n  "}</span>
              <span className="text-purple-400">{"\n  return "}</span>
              <span className="text-white">{"a + b;"}</span>
              <span className="text-white">{"\n}"}</span>
              <span className="text-slate-500">{"\n\n"}</span>
              <span className="text-green-400">{"✓ All 4 tests passed!"}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '20+', label: 'Courses', icon: BookOpen },
            { value: '100+', label: 'Challenges', icon: Terminal },
            { value: 'Free', label: 'Forever', icon: Zap },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon size={20} className="text-brand-400" />
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you'll learn */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
          <p className="text-slate-400">From basic variables to async programming and DOM manipulation.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'JavaScript Basics', description: 'Variables, booleans, strings, functions, arrays, objects, loops.', color: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
            { title: 'Intermediate JavaScript', description: 'Array methods, scope, closures, async/await, classes.', color: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', dot: 'bg-purple-400' },
            { title: 'JavaScript DOM', description: 'Selectors, events, DOM manipulation, recursive functions.', color: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20', dot: 'bg-green-400' },
            { title: 'JavaScript Practice', description: 'Real-world challenges on fundamentals, arrays, objects, and dates.', color: 'from-orange-500/10 to-yellow-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
          ].map((item) => (
            <div key={item.title}
              className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-xl p-6 flex gap-4 hover:scale-[1.01] transition-transform`}>
              <div className={`w-2 h-2 rounded-full ${item.dot} mt-2 shrink-0`} />
              <div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/5 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
        <p className="text-slate-400 mb-8">Join thousands of developers learning JavaScript the right way.</p>
        <Link href="/onboarding"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40">
          Start Learning for free <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}
