'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { Loader2, RefreshCw, Mic, Package } from 'lucide-react'
import { VoiceCommand } from '../components/VoiceCommand'
import { supabase } from '../lib/supabaseClient'

const MEAL_PRESETS = [
  { id: 'bulk', label: '💪 Massa / Bulk', desc: 'Alto proteico, surplus calorico', mod: 'Genera un menù ipercalorico per massa muscolare con alto apporto proteico e carboidrati complessi.' },
  { id: 'cut', label: '🔥 Definizione / Cut', desc: 'Deficit calorico, proteine alte', mod: 'Genera un menù ipocalorico per definizione con proteine alte e carboidrati ridotti, evitando zuccheri semplici.' },
  { id: 'maintain', label: '⚖️ Mantenimento', desc: 'Equilibrato, TDEE standard', mod: 'Genera un menù equilibrato per mantenimento peso con macro bilanciati.' },
  { id: 'keto', label: '🥑 Chetogenico', desc: 'Grassi alti, carbo bassissimi', mod: 'Genera un menù chetogenico con grassi sani come avocado, noci e olio EVO, carboidrati sotto 30g al giorno.' },
  { id: 'vegan', label: '🌱 Plant-Based', desc: 'Solo proteine vegetali', mod: 'Genera un menù 100% vegano con proteine da legumi, tofu, tempeh e seitan.' },
]

export default function MenuPage() {
  const { user, profile, weeklyMenu, setWeeklyMenu } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState('Lunedì')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [voiceMod, setVoiceMod] = useState('')
  const [completedMeals, setCompletedMeals] = useState([])

  useEffect(() => {
    // Fetch today's completed meals
    const fetchCompletedMeals = async () => {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('meals_history')
        .select('recipe_title')
        .eq('user_id', user.id)
        .eq('date', today)
      
      if (data) {
        setCompletedMeals(data.map(m => m.recipe_title))
      }
    }
    fetchCompletedMeals()
  }, [user])

  const daysStr = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
  const days = weeklyMenu?.menu ? Object.keys(weeklyMenu.menu) : daysStr

  const handleGenerate = async (extraVoice = '') => {
    setLoading(true)
    setError('')
    const presetMod = selectedPreset ? MEAL_PRESETS.find(p => p.id === selectedPreset)?.mod : ''
    const combinedMod = [presetMod, extraVoice, voiceMod].filter(Boolean).join('. ')

    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, voiceModification: combinedMod || undefined })
      })
      const data = await res.json()
      if (res.ok && data.menu) {
        setWeeklyMenu(data)
        setVoiceMod('')
      } else {
        setError(data.error || 'Errore nella generazione.')
      }
    } catch (err) {
      setError('Errore di rete.')
    }
    setLoading(false)
  }

  const handleVoice = (transcript) => {
    setVoiceMod(transcript)
    handleGenerate(transcript)
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f0a1a] via-[--color-card] to-[#0a1214] border border-[--color-primary]/20 p-8">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-[--color-primary]/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">Menù</span>
              <span className="text-white ml-2">Settimanale</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">35 pasti calibrati dall'AI sul tuo profilo. Genera, mangia, domina.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
                <span className="block text-gray-500 mb-0.5">TDEE</span>
                <span className="text-[--color-primary] font-bold">{profile.tdee} kcal</span>
              </div>
              <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
                <span className="block text-gray-500 mb-0.5">PROTEINE</span>
                <span className="text-white font-bold">{profile.protein_target || 150}g</span>
              </div>
              <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
                <span className="block text-gray-500 mb-0.5">DIETA</span>
                <span className="text-white font-bold">{profile.diet_type || 'Onnivoro'}</span>
              </div>
            </div>
            <button 
              onClick={() => handleGenerate()}
              disabled={loading}
              className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[--color-dark] font-extrabold px-6 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 disabled:opacity-40 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              <span>{weeklyMenu ? 'Rigenera' : 'Genera IA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Cards */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
          <div className="w-6 h-[2px] bg-amber-500 rounded-full"></div>
          Pacchetto Base
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {MEAL_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
              className={`group p-5 rounded-2xl text-left transition-all duration-300 border ${
                selectedPreset === preset.id
                  ? 'bg-[#1a1a2e] text-amber-400 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'bg-[#1a1a2e] text-gray-400 border-[#2a2a3e] hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.08)] hover:text-white hover:-translate-y-0.5'
              }`}
            >
              <span className="text-3xl block mb-3">{preset.label.split(' ')[0]}</span>
              <span className="text-sm font-bold block leading-tight">{preset.label.split(' ').slice(1).join(' ')}</span>
              <span className="text-[10px] opacity-50 mt-1.5 block uppercase tracking-wider">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Modification - Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[--color-card] via-[#14100e] to-[--color-card] border border-[--color-muted] rounded-2xl p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Mic size={16} className="text-amber-400" />
              </div>
              Personalizzazione Vocale
            </h3>
            <p className="text-[11px] text-gray-500 mt-2 ml-10">"Vorrei più pesce" · "Aggiungi snack proteici" · "Niente latticini"</p>
          </div>
          <VoiceCommand onResult={handleVoice} />
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/20 text-red-400 rounded-xl border border-red-500/50 text-sm">{error}</div>}

      {loading && (
        <div className="bg-[--color-card] p-12 text-center rounded-2xl border border-[--color-muted] flex flex-col items-center">
          <Loader2 className="animate-spin text-[--color-primary] mb-4" size={32} />
          <p className="text-[--color-primary] font-semibold">Generazione IA in corso... (10-30 sec)</p>
        </div>
      )}

      {!weeklyMenu && !loading && (
        <div className="bg-[--color-card] p-12 text-center rounded-2xl border border-[--color-muted]">
          <p className="text-gray-400 mb-4">Seleziona un pacchetto e clicca Genera, oppure usa un comando vocale!</p>
        </div>
      )}

      {weeklyMenu?.menu && !loading && (
        <div className="space-y-6">
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {days.map(day => (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition ${selectedDay === day ? 'bg-[--color-primary] text-[--color-dark]' : 'bg-[--color-card] text-gray-400 hover:text-white border border-[--color-muted]'}`}>
                {day}
              </button>
            ))}
            {weeklyMenu.lista_spesa && (
              <button onClick={() => setSelectedDay('Spesa')}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition border border-dashed ${selectedDay === 'Spesa' ? 'bg-[--color-primary] text-[--color-dark] border-[--color-primary]' : 'bg-[--color-card] text-[--color-primary] hover:bg-[--color-primary]/10 border-[--color-primary]/50'}`}>
                🛒 Lista della Spesa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedDay === 'Spesa' && weeklyMenu.lista_spesa ? (
              <div className="bg-[--color-card] border border-[--color-primary]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,255,65,0.05)]">
                <h2 className="text-2xl font-bold text-[--color-primary] mb-6 flex items-center gap-2">🛒 Lista della Spesa Settimanale</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(Array.isArray(weeklyMenu.lista_spesa) ? weeklyMenu.lista_spesa : []).map((cat, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-bold text-lg text-white border-b border-[--color-muted] pb-2">{cat.categoria}</h3>
                      <ul className="space-y-2">
                        {(Array.isArray(cat.items) ? cat.items : []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-[--color-primary] mt-2 shrink-0"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              (Array.isArray(weeklyMenu.menu[selectedDay]) ? weeklyMenu.menu[selectedDay] : []).map((meal, i) => (
                <div key={i} className="bg-[--color-card] border border-[--color-muted] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-[--color-primary]/50 transition relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--color-primary]/40"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[--color-dark] text-xs font-bold text-gray-400 px-2 py-1 rounded border border-[--color-muted] uppercase tracking-wider">{meal.nome_pasto || 'PASTO'}</span>
                    <h3 className="text-lg font-bold text-[--color-primary]">{meal.titolo || 'Pasto Generico'}</h3>
                  </div>
                  <p className="text-sm text-gray-400"><strong className="text-white">Ingredienti:</strong> {meal.ingredienti}</p>
                  <div className="mt-2">
                    <strong className="text-white text-sm">Preparazione:</strong>
                    {Array.isArray(meal.istruzioni) ? (
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        {meal.istruzioni.map((step, si) => (
                          <li key={si} className="text-sm text-gray-400 leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">{meal.istruzioni}</p>
                    )}
                  </div>
                </div>
                <div className="md:w-48 flex flex-col gap-2 shrink-0 justify-center">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">PRO</span><span className="text-[--color-primary] font-bold text-sm">{meal.pro}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">CHO</span><span className="text-white font-bold text-sm">{meal.cho}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">FAT</span><span className="text-white font-bold text-sm">{meal.fat}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">ZUC</span><span className="text-red-400 font-bold text-sm">{meal.zuccheri}g</span></div>
                  </div>
                  
                  {completedMeals.includes(meal.titolo) ? (
                    <div className="mt-2 text-center bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-bold border border-green-500/50">
                      ✔️ Mangiato Oggi
                    </div>
                  ) : (
                    <button 
                      onClick={async () => {
                        const today = new Date().toISOString().split('T')[0]
                        const { error } = await supabase.from('meals_history').insert([{
                          user_id: user.id,
                          date: today,
                          meal_name: meal.nome_pasto,
                          recipe_title: meal.titolo,
                          macros: { pro: meal.pro, cho: meal.cho, fat: meal.fat, zuccheri: meal.zuccheri },
                          is_completed: true
                        }])
                        if (!error) {
                          setCompletedMeals(prev => [...prev, meal.titolo])
                        }
                      }}
                      className="mt-2 text-center bg-dark hover:bg-[--color-primary]/20 text-gray-300 hover:text-[--color-primary] py-2 rounded-lg text-sm font-bold border border-[--color-muted] hover:border-[--color-primary] transition-all"
                    >
                      Segna Mangiato
                    </button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
