'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { Menu, X, Code2 } from 'lucide-react'

export function Navbar() {
  const { isSignedIn } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg group">
          <div className="bg-brand-500/10 border border-brand-500/20 p-1.5 rounded-lg group-hover:bg-brand-500/20 transition-colors">
            <Code2 size={16} className="text-brand-400" />
          </div>
          <span>JS<span className="text-brand-400">Quest</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/courses" className="text-sm text-slate-400 hover:text-white transition-colors">
            Courses
          </Link>

          {isSignedIn && (
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          )}

          {isSignedIn ? (
            <UserButton />
          ) : (
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-brand-500 hover:bg-brand-400 text-white px-4 py-1.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/20 cursor-pointer">
                  Get started
                </button>
              </SignUpButton>
            </div>
          )}
        </div>

        <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0d1424] px-4 py-4 flex flex-col gap-4">
          <Link href="/courses" className="text-slate-400 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
            Courses
          </Link>
          {isSignedIn && (
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
          )}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm text-slate-400 hover:text-white text-left cursor-pointer">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-brand-500 text-white px-4 py-1.5 rounded-lg w-fit cursor-pointer">Get started</button>
              </SignUpButton>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
