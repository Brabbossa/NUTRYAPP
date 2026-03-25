'use client'

import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Loader2, RefreshCw } from 'lucide-react'

export default function MenuPage() {
  const { profile, weeklyMenu, setWeeklyMenu } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState('Lunedì')

  const daysStr = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
  const days = weeklyMenu?.menu ? Object.keys(weeklyMenu.menu) : daysStr

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      if (res.ok && data.menu) {
        setWeeklyMenu(data)
      } else {
        setError(data.error || 'Errore nella generazione.')
      }
    } catch (err) {
      setError('Errore di rete.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-muted pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Menù Settimanale</h1>
          <p className="text-gray-400 text-sm">Target: {profile.tdee} kcal | Proteine: {profile.proteinTarget}g/pasto</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-primary text-dark font-bold px-4 py-2 rounded-lg hover:bg-opacity-80 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {weeklyMenu ? 'Rigenera Settimana' : 'Genera Menù IA'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/20 text-red-500 rounded-xl border border-red-500">{error}</div>}

      {!weeklyMenu && !loading && (
        <div className="bg-card p-12 text-center rounded-2xl border border-muted">
          <p className="text-gray-400 mb-4">Nessun menù disponibile. Clicca su Genera per iniziare!</p>
        </div>
      )}

      {loading && (
        <div className="bg-card p-12 text-center rounded-2xl border border-muted flex flex-col items-center">
          <Loader2 className="animate-spin text-primary mb-4" size={32} />
          <p className="text-primary font-semibold">Generazione IA in corso... (potrebbe richiedere 10-20 secondi)</p>
        </div>
      )}

      {weeklyMenu && weeklyMenu.menu && !loading && (
        <div className="space-y-6">
          {/* Day Selector */}
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition ${selectedDay === day ? 'bg-primary text-dark' : 'bg-card text-gray-400 hover:text-white border border-muted'}`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 gap-4">
            {weeklyMenu.menu[selectedDay]?.map((meal, i) => (
              <div key={i} className="bg-card border border-muted rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-primary/50 transition relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-dark text-xs font-bold text-gray-400 px-2 py-1 rounded border border-muted uppercase tracking-wider">{meal.nome_pasto}</span>
                    <h3 className="text-lg font-bold text-primary">{meal.titolo}</h3>
                  </div>
                  <p className="text-sm text-gray-400"><strong className="text-white">Ingredienti:</strong> {meal.ingredienti}</p>
                  <p className="text-sm text-gray-400"><strong className="text-white">Istruzioni:</strong> {meal.istruzioni}</p>
                </div>
                
                {/* Macros Badge */}
                <div className="md:w-48 flex flex-col gap-2 shrink-0 justify-center">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
                    <div className="bg-dark border border-muted p-2 rounded-lg">
                      <span className="block text-gray-500 mb-1">PRO</span>
                      <span className="text-primary font-bold text-sm">{meal.pro}g</span>
                    </div>
                    <div className="bg-dark border border-muted p-2 rounded-lg">
                      <span className="block text-gray-500 mb-1">CHO</span>
                      <span className="text-white font-bold text-sm">{meal.cho}g</span>
                    </div>
                    <div className="bg-dark border border-muted p-2 rounded-lg">
                      <span className="block text-gray-500 mb-1">FAT</span>
                      <span className="text-white font-bold text-sm">{meal.fat}g</span>
                    </div>
                    <div className="bg-dark border border-muted p-2 rounded-lg">
                      <span className="block text-gray-500 mb-1">ZUC</span>
                      <span className="text-red-400 font-bold text-sm">{meal.zuccheri}g</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
