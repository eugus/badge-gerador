import { Bai_Jamjuree } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { ClientToastWrapper } from '../components/ClientToastWrapper'

export const baiJamjuree = Bai_Jamjuree({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-bai',
})

export const metadata: Metadata = {
  title: 'Badge App',
  description: 'System for assigning bagdes for students of INCODE-TECH-SCHOOL',
  generator: 'v0.dev',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${baiJamjuree.variable} font-sans`}>
        <ClientToastWrapper>
          {children}
        </ClientToastWrapper>
      </body>
    </html>
  );
}
