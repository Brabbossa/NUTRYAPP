'use client'

import { useUser } from './context/UserContext'
import Link from 'next/link'
import { Dumbbell, Settings, ArrowRight } from 'lucide-react'

export default function Home() {
  const { profile } = useUser()


  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a0f] via-[--color-card] to-[#0f1a14] border border-[--color-primary]/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[--color-primary]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[--color-primary]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Bentornato su <span className="bg-gradient-to-r from-[--color-primary] via-cyan-400 to-blue-500 bg-clip-text text-transparent">Synapse</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Esperienza: <strong className="text-white">{profile.training_experience || 'Intermedio'}</strong> | Obiettivo: <strong className="text-[--color-primary]">{profile.goal || 'Ipertrofia'}</strong>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/workout" className="group bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(0,229,255,0.15)] hover:-translate-y-1 p-6 rounded-[24px] transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[--color-primary]/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50 group-hover:opacity-100"></div>
          <Dumbbell className="text-[--color-primary] mb-4 relative z-10" size={32} />
          <div className="flex justify-between items-center relative z-10">
            <span className="font-black text-lg text-white group-hover:text-[--color-primary] transition-colors">Vai al Workout AI</span>
            <ArrowRight className="text-gray-400 group-hover:text-[--color-primary] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/preferences" className="group bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(0,229,255,0.15)] hover:-translate-y-1 p-6 rounded-[24px] transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[--color-primary]/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50 group-hover:opacity-100"></div>
          <Settings className="text-[--color-primary] mb-4 relative z-10" size={32} />
          <div className="flex justify-between items-center relative z-10">
            <span className="font-black text-lg text-white group-hover:text-[--color-primary] transition-colors">Preferenze & Dati</span>
            <ArrowRight className="text-gray-400 group-hover:text-[--color-primary] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>


    </div>
  )
}
