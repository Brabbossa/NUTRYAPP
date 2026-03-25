'use client'

import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Loader2, RefreshCw, Mic, Package } from 'lucide-react'
import { VoiceCommand } from '../components/VoiceCommand'

const MEAL_PRESETS = [
  { id: 'bulk', label: '💪 Massa / Bulk', desc: 'Alto proteico, surplus calorico', mod: 'Genera un menù ipercalorico per massa muscolare con alto apporto proteico e carboidrati complessi.' },
  { id: 'cut', label: '🔥 Definizione / Cut', desc: 'Deficit calorico, proteine alte', mod: 'Genera un menù ipocalorico per definizione con proteine alte e carboidrati ridotti, evitando zuccheri semplici.' },
  { id: 'maintain', label: '⚖️ Mantenimento', desc: 'Equilibrato, TDEE standard', mod: 'Genera un menù equilibrato per mantenimento peso con macro bilanciati.' },
  { id: 'keto', label: '🥑 Chetogenico', desc: 'Grassi alti, carbo bassissimi', mod: 'Genera un menù chetogenico con grassi sani come avocado, noci e olio EVO, carboidrati sotto 30g al giorno.' },
  { id: 'vegan', label: '🌱 Plant-Based', desc: 'Solo proteine vegetali', mod: 'Genera un menù 100% vegano con proteine da legumi, tofu, tempeh e seitan.' },
]

export default function MenuPage() {
  const { profile, weeklyMenu, setWeeklyMenu } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState('Lunedì')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [voiceMod, setVoiceMod] = useState('')

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
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[--color-muted] pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Menù Settimanale</h1>
          <p className="text-gray-400 text-sm">Target: {profile.tdee} kcal | Proteine: {profile.proteinTarget}g/pasto</p>
        </div>
        <button 
          onClick={() => handleGenerate()}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-[--color-primary] text-[--color-dark] font-bold px-4 py-2 rounded-lg hover:opacity-80 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {weeklyMenu ? 'Rigenera' : 'Genera Menù IA'}
        </button>
      </div>

      {/* Preset Packages */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <Package size={16} /> Scegli un Pacchetto Base
        </h3>
        <div className="flex flex-wrap gap-2">
          {MEAL_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                selectedPreset === preset.id
                  ? 'bg-[--color-primary]/20 text-[--color-primary] border-[--color-primary]'
                  : 'bg-[--color-card] text-gray-400 border-[--color-muted] hover:text-white hover:border-gray-500'
              }`}
            >
              {preset.label}
              <span className="block text-xs font-normal opacity-60">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Modification */}
      <div className="bg-[--color-card] border border-[--color-muted] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2"><Mic size={18} className="text-[--color-primary]" /> Modifica Vocale</h3>
          <p className="text-xs text-gray-500 mt-1">Parla per personalizzare il menù: "Vorrei più pesce" o "Aggiungi snack proteici"</p>
        </div>
        <VoiceCommand onResult={handleVoice} />
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
          </div>

          <div className="grid grid-cols-1 gap-4">
            {weeklyMenu.menu[selectedDay]?.map((meal, i) => (
              <div key={i} className="bg-[--color-card] border border-[--color-muted] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-[--color-primary]/50 transition relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--color-primary]/40"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-[--color-dark] text-xs font-bold text-gray-400 px-2 py-1 rounded border border-[--color-muted] uppercase tracking-wider">{meal.nome_pasto}</span>
                    <h3 className="text-lg font-bold text-[--color-primary]">{meal.titolo}</h3>
                  </div>
                  <p className="text-sm text-gray-400"><strong className="text-white">Ingredienti:</strong> {meal.ingredienti}</p>
                  <p className="text-sm text-gray-400"><strong className="text-white">Istruzioni:</strong> {meal.istruzioni}</p>
                </div>
                <div className="md:w-48 flex flex-col gap-2 shrink-0 justify-center">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-center">
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">PRO</span><span className="text-[--color-primary] font-bold text-sm">{meal.pro}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">CHO</span><span className="text-white font-bold text-sm">{meal.cho}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">FAT</span><span className="text-white font-bold text-sm">{meal.fat}g</span></div>
                    <div className="bg-[--color-dark] border border-[--color-muted] p-2 rounded-lg"><span className="block text-gray-500 mb-1">ZUC</span><span className="text-red-400 font-bold text-sm">{meal.zuccheri}g</span></div>
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
