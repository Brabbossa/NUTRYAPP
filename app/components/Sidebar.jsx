'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Utensils, Dumbbell, Settings, Home, Menu, X } from 'lucide-react'

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: '/preferences', label: 'Preferences', icon: Settings },
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/menu', label: 'Menù Settimanale', icon: Utensils },
    { href: '/workout', label: 'Workout Periodizzato', icon: Dumbbell },
    { href: '/report', label: 'Synapse Clinic Report', icon: Settings },
  ]

  const toggle = () => setIsOpen(!isOpen)

  return (
    <>
      <button 
        className="md:hidden fixed top-4 right-4 z-50 text-white p-2 bg-card rounded-md border border-muted" 
        onClick={toggle}
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark border-r border-muted transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">Impariamo a <span className="text-primary block">Leccare</span></h1>
        </div>
        
        <nav className="mt-6 flex flex-col gap-2 px-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                  ? 'bg-primary/10 text-primary font-bold shadow-[inset_4px_0_0_0_#00FF41]' 
                  : 'text-gray-400 hover:text-white hover:bg-card'
                }`}>
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={toggle} />}
    </>
  )
}
