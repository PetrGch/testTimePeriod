import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Time Period Selection',
  description: 'Time period management prototype',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

