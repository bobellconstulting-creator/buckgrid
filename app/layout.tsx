import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuckGrid Pro | Visual Habitat Planning For Whitetail Ground',
  description:
    'Sketch the property, lock the acreage, and get a ranked habitat plan from Tony. BuckGrid Pro turns satellite imagery into a whitetail ground strategy.',
  keywords: [
    'BuckGrid Pro',
    'whitetail habitat planning',
    'deer hunting maps',
    'property planning',
    'habitat consulting',
  ],
  openGraph: {
    title: 'BuckGrid Pro',
    description:
      'Visual habitat planning for whitetail ground.',
    url: 'https://buckgrid.com',
    siteName: 'BuckGrid Pro',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuckGrid Pro',
    description: 'Visual habitat planning for whitetail ground.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://buckgrid.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', width: '100vw', height: '100dvh', position: 'relative' }}>
        {children}
      </body>
    </html>
  )
}
