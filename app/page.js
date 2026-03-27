'use client'

import { useUser } from './context/UserContext'
import Link from 'next/link'
import { Dumbbell, Utensils, Settings, ArrowRight, Zap } from 'lucide-react'

export default function Home() {
  const { profile, weeklyMenu } = useUser()

  const daysStr = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
  const todayStr = daysStr[new Date().getDay()]

  const todayMenu = weeklyMenu?.menu?.[todayStr] || []
  const hasMenu = todayMenu.length > 0

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a0f] via-[--color-card] to-[#0f1a14] border border-[--color-primary]/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[--color-primary]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[--color-primary]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Bentornato su <span className="bg-gradient-to-r from-[--color-primary] via-emerald-400 to-teal-300 bg-clip-text text-transparent">Synapse</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            TDEE: <strong className="text-white">{profile.tdee} kcal</strong> | Proteine Target: <strong className="text-white">~{(profile.protein_target || 150) * 5}g/giorno</strong> | Obiettivo: <strong className="text-[--color-primary]">{profile.goal || 'Ipertrofia'}</strong>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/workout" className="group bg-white/5 border-transparent hover:bg-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:-translate-y-1 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[--color-primary]/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50 group-hover:opacity-100"></div>
          <Dumbbell className="text-[--color-primary] mb-4 relative z-10" size={32} />
          <div className="flex justify-between items-center relative z-10">
            <span className="font-black text-lg text-white group-hover:text-[--color-primary] transition-colors">Vai al Workout AI</span>
            <ArrowRight className="text-gray-400 group-hover:text-[--color-primary] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/menu" className="group bg-white/5 border-transparent hover:bg-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:-translate-y-1 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[--color-primary]/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50 group-hover:opacity-100"></div>
          <Utensils className="text-[--color-primary] mb-4 relative z-10" size={32} />
          <div className="flex justify-between items-center relative z-10">
            <span className="font-black text-lg text-white group-hover:text-[--color-primary] transition-colors">Il Tuo Menù</span>
            <ArrowRight className="text-gray-400 group-hover:text-[--color-primary] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/preferences" className="group bg-white/5 border-transparent hover:bg-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:-translate-y-1 p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[--color-primary]/20 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50 group-hover:opacity-100"></div>
          <Settings className="text-[--color-primary] mb-4 relative z-10" size={32} />
          <div className="flex justify-between items-center relative z-10">
            <span className="font-black text-lg text-white group-hover:text-[--color-primary] transition-colors">Preferenze & Dati</span>
            <ArrowRight className="text-gray-400 group-hover:text-[--color-primary] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Today's Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="text-primary" /> Menù di Oggi ({todayStr})
        </h2>
        
        {hasMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayMenu.map(meal => (
              <div key={meal.nome_pasto} className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:-translate-y-1 transition-all duration-300 group">
                <span className="text-[10px] font-black text-gray-400 group-hover:text-[--color-primary] uppercase tracking-widest">{meal.nome_pasto}</span>
                <h3 className="font-black mt-2 text-xl truncate text-white" title={meal.titolo}>{meal.titolo}</h3>
                <div className="mt-5 flex gap-2 text-sm">
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 font-mono text-xs text-center flex-1"><strong className="block text-white text-base">{meal.pro}g</strong> PRO</div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 font-mono text-xs text-center flex-1"><strong className="block text-white text-base">{meal.cho}g</strong> CHO</div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 font-mono text-xs text-center flex-1"><strong className="block text-white text-base">{meal.fat}g</strong> FAT</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-10 shadow-lg text-center flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-6 text-lg">Non hai ancora generato il tuo menù intelligente.</p>
            <Link href="/menu" className="bg-gradient-to-r from-[--color-primary] to-emerald-400 text-black font-black px-8 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] hover:scale-[1.02] transition-all duration-300">
              Genera Ora
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}
