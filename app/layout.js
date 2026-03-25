import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata = {
  title: 'Synapse AI',
  description: 'AI Fitness Tracker'
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="mobile-container">{children}</body>
    </html>
  )
}
