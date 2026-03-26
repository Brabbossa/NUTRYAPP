import './globals.css'
import { UserProvider } from './context/UserContext'
import { Sidebar } from './components/Sidebar'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata = {
  title: 'Eat & Fit',
  description: 'Synapse Professional AI Tracker',
  manifest: '/manifest.json',
  themeColor: '#00FF41',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Eat & Fit'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-dark text-white font-sans overflow-x-hidden selection:bg-primary selection:text-dark">
        <UserProvider>
          <div className="flex min-h-screen w-full relative">
            <Sidebar />
            <main className="flex-1 w-full md:ml-64 p-4 md:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  )
}
