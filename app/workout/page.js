'use client'

import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Loader2, Dumbbell, Save, CheckCircle2, Package, Mic, Timer } from 'lucide-react'
import { VoiceCommand } from '../components/VoiceCommand'
import { WorkoutTimer } from '../components/WorkoutTimer'

const WORKOUT_PRESETS = [
  { id: 'push', label: '🏋️ Push Day', target: 'Petto, Spalle e Tricipiti (Push Day)', desc: 'Petto, Spalle, Tricipiti' },
  { id: 'pull', label: '💪 Pull Day', target: 'Dorso, Bicipiti e Trapezio (Pull Day)', desc: 'Dorso, Bicipiti, Trapezio' },
  { id: 'legs', label: '🦵 Leg Day', target: 'Quadricipiti, Femorali, Glutei e Polpacci (Leg Day)', desc: 'Gambe complete' },
  { id: 'upper', label: '⬆️ Upper Body', target: 'Upper Body completo: Petto, Dorso, Spalle, Braccia', desc: 'Parte superiore completa' },
  { id: 'lower', label: '⬇️ Lower Body', target: 'Lower Body completo: Squat, Stacco, Affondi, Polpacci', desc: 'Parte inferiore completa' },
  { id: 'full', label: '🔥 Full Body', target: 'Full Body: tutti i gruppi muscolari principali', desc: 'Tutto il corpo' },
  { id: 'core', label: '🎯 Core & Addominali', target: 'Core, Addominali, Obliqui e Stabilizzatori', desc: 'Addome e stabilità' },
]

export default function WorkoutPage() {
  const { profile, workoutHistory, saveWorkout } = useUser()
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState(null)
  const [rpe, setRpe] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [timerActive, setTimerActive] = useState(false)

  const handleGenerate = async (voiceMod = '') => {
    const preset = WORKOUT_PRESETS.find(p => p.id === selectedPreset)
    const target = preset?.target || 'Full Body'
    
    setLoading(true)
    setError('')
    setIsSaved(false)
    setCurrentPlan(null)
    setRpe('')

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile, 
          targetMuscle: target, 
          workoutHistory,
          voiceModification: voiceMod || undefined
        })
      })
      const data = await res.json()
      if (res.ok && data.titolo) {
        setCurrentPlan(data)
      } else {
        setError(data.error || 'Errore nella generazione.')
      }
    } catch (err) {
      setError('Errore di rete.')
    }
    setLoading(false)
  }

  const handleVoice = (transcript) => {
    handleGenerate(transcript)
  }

  const handleSaveRPE = () => {
    if (!rpe || !currentPlan) return
    const preset = WORKOUT_PRESETS.find(p => p.id === selectedPreset)
    saveWorkout({
      id: Date.now(),
      date: new Date().toISOString(),
      target: preset?.label || 'Custom',
      plan: currentPlan,
      rpe: parseInt(rpe)
    })
    setIsSaved(true)
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="border-b border-[--color-muted] pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Dumbbell className="text-[--color-primary]" size={32} /> 
          Workout <span className="text-[--color-primary]">Periodizzato</span>
        </h1>
        <p className="text-gray-400 mt-2">Scegli un pacchetto e genera, oppure personalizza con la tua voce.</p>
      </div>

      {/* Preset Packages */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
          <Package size={16} /> Scegli il Pacchetto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WORKOUT_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedPreset === preset.id
                  ? 'bg-[--color-primary]/15 text-[--color-primary] border-[--color-primary] shadow-[0_0_15px_rgba(0,255,65,0.1)]'
                  : 'bg-[--color-card] text-gray-400 border-[--color-muted] hover:text-white hover:border-gray-500'
              }`}
            >
              <span className="text-lg font-bold block">{preset.label}</span>
              <span className="text-xs opacity-60 mt-1 block">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Generate */}
      <div className="bg-[--color-card] border border-[--color-muted] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-white flex items-center gap-2"><Mic size={18} className="text-[--color-primary]" /> Modifica Vocale</h3>
          <p className="text-xs text-gray-500 mt-1">"Vorrei concentrarmi di più sui bicipiti" o "Aggiungi più esercizi di isolamento"</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceCommand onResult={handleVoice} />
          <button 
            onClick={() => handleGenerate()}
            disabled={loading || !selectedPreset}
            className="flex items-center gap-2 bg-[--color-primary] text-[--color-dark] font-bold px-6 py-3 rounded-xl hover:opacity-80 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : '⚡ GENERA'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/20 text-red-400 rounded-xl border border-red-500/50 text-sm">{error}</div>}

      {/* Workout Display */}
      {currentPlan && !loading && (
        <div className="bg-[--color-card] border border-[--color-primary]/50 shadow-[0_0_30px_rgba(0,255,65,0.05)] rounded-2xl overflow-hidden">
          <div className="bg-[--color-primary]/10 border-b border-[--color-primary]/20 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[--color-primary]">{currentPlan.titolo}</h2>
            {!timerActive && (
              <button
                onClick={() => setTimerActive(true)}
                className="flex items-center gap-2 bg-[--color-primary] text-[--color-dark] font-bold px-5 py-2.5 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,65,0.3)] transition-all active:scale-95"
              >
                <Timer size={18} /> INIZIA
              </button>
            )}
          </div>

          {/* Workout Timer */}
          {timerActive && (
            <WorkoutTimer
              plan={currentPlan}
              onComplete={() => setTimerActive(false)}
            />
          )}
          
          <div className="p-6 space-y-4">
            {currentPlan.avviso_sicurezza && currentPlan.avviso_sicurezza !== "''" && currentPlan.avviso_sicurezza !== 'Nessuna' && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <h4 className="text-red-400 font-bold mb-1">Avviso Sicurezza</h4>
                  <p className="text-sm text-red-200">{currentPlan.avviso_sicurezza}</p>
                </div>
              </div>
            )}
            
            {currentPlan.nota_personale && (
              <div className="bg-[--color-primary]/10 border border-[--color-primary]/30 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-300 italic">" {currentPlan.nota_personale} "</p>
                <p className="text-xs text-[--color-primary] font-bold mt-2 text-right">- Synapse AI Trainer</p>
              </div>
            )}

            {(Array.isArray(currentPlan.esercizi) ? currentPlan.esercizi : []).map((ex, i) => (
              <div key={i} className="bg-[--color-dark] border border-[--color-muted] p-4 rounded-xl hover:border-[--color-primary] transition">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <h3 className="text-lg font-bold text-white">{i + 1}. {ex.nome}</h3>
                  <div className="flex flex-wrap gap-2 text-sm font-mono tracking-wide">
                    <span className="bg-[--color-muted] px-3 py-1 rounded text-gray-300">Serie: <strong className="text-white">{ex.serie}</strong></span>
                    <span className="bg-[--color-muted] px-3 py-1 rounded text-gray-300">Rep: <strong className="text-white">{ex.ripetizioni}</strong></span>
                    <span className="bg-[--color-muted] px-3 py-1 rounded text-gray-300">Rec: <strong className="text-white">{ex.recupero}</strong></span>
                  </div>
                </div>
                {ex.note_carico && (
                  <div className="mt-3 text-sm text-[--color-primary] flex gap-2">
                    <span className="opacity-70">💡 AI Note:</span>
                    <span>{ex.note_carico}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[--color-muted] bg-[--color-dark] p-6">
            {!isSaved ? (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h4 className="font-bold text-white mb-1">Allenamento Completato?</h4>
                  <p className="text-sm text-gray-400">Inserisci l'RPE (1-10) per calibrare il prossimo.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input type="number" min="1" max="10" placeholder="RPE" value={rpe} onChange={e => setRpe(e.target.value)}
                    className="w-24 bg-[--color-card] border border-[--color-muted] rounded-xl p-3 text-center text-xl font-bold outline-none focus:border-[--color-primary]" />
                  <button onClick={handleSaveRPE} disabled={!rpe}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[--color-primary] text-[--color-dark] font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition">
                    <Save size={18} /> SALVA
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[--color-primary] font-bold bg-[--color-primary]/10 p-4 rounded-xl">
                <CheckCircle2 size={24} /> Allenamento salvato con successo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {workoutHistory.length > 0 && !currentPlan && (
        <div className="pt-8">
          <h3 className="text-lg font-bold text-gray-400 mb-4">Ultimi Allenamenti</h3>
          <div className="space-y-3">
            {workoutHistory.slice(-5).reverse().map((w, i) => (
              <div key={i} className="bg-[--color-dark] border border-[--color-muted] p-4 rounded-xl flex items-center justify-between">
                <span className="font-bold text-white">{w.target}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{new Date(w.date).toLocaleDateString()}</span>
                  <span className="bg-[--color-primary]/20 text-[--color-primary] px-3 py-1 rounded text-sm font-bold">RPE {w.rpe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
