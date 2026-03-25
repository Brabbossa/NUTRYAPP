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
      <header className="border-b border-muted pb-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter">
          Bentornato su <span className="text-primary">Synapse</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          TDEE: {profile.tdee} kcal | Obiettivo Proteine: ~{profile.proteinTarget * 5}g/giorno
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/workout" className="group bg-card border border-muted hover:border-primary p-6 rounded-2xl transition flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Dumbbell className="text-primary mb-4" size={32} />
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Vai al Workout AI</span>
            <ArrowRight className="text-gray-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/menu" className="group bg-card border border-muted hover:border-primary p-6 rounded-2xl transition flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Utensils className="text-primary mb-4" size={32} />
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Il Tuo Menù</span>
            <ArrowRight className="text-gray-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/preferences" className="group bg-card border border-muted hover:border-primary p-6 rounded-2xl transition flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <Settings className="text-primary mb-4" size={32} />
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Preferenze & Dati</span>
            <ArrowRight className="text-gray-500 group-hover:text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Today's Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="text-primary" /> Menù di Oggi ({todayStr})
        </h2>
        
        {hasMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayMenu.map(meal => (
              <div key={meal.nome_pasto} className="bg-dark border border-muted rounded-xl p-5 hover:border-primary/50 transition">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{meal.nome_pasto}</span>
                <h3 className="font-bold mt-1 text-lg truncate" title={meal.titolo}>{meal.titolo}</h3>
                <div className="mt-4 flex gap-3 text-sm">
                  <div className="bg-card px-2 py-1 rounded border border-muted text-gray-400"><strong className="text-white">{meal.pro}g</strong> PRO</div>
                  <div className="bg-card px-2 py-1 rounded border border-muted text-gray-400"><strong className="text-white">{meal.cho}g</strong> CHO</div>
                  <div className="bg-card px-2 py-1 rounded border border-muted text-gray-400"><strong className="text-white">{meal.fat}g</strong> FAT</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-muted rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-4">Non hai ancora generato il tuo menù intelligente.</p>
            <Link href="/menu" className="bg-primary text-dark font-bold px-6 py-3 rounded-lg hover:opacity-90 transition">
              Genera Ora
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}
