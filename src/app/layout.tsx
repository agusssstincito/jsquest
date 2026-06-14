import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'JSQuest — Learn JavaScript by doing',
  description: 'Lessons, quizzes, and code challenges — all in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#0a0f1e] min-h-screen text-white antialiased">
          <Navbar />
          <main className="pt-14">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
