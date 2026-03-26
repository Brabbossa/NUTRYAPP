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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a0f] via-[--color-card] to-[#0f1a14] border border-[--color-primary]/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[--color-primary]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[--color-primary]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-[--color-primary] via-emerald-400 to-teal-300 bg-clip-text text-transparent">Workout</span>
              <span className="text-white ml-2">Periodizzato</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Scegli il tuo split, genera con l'AI, e spacca tutto.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
              <span className="block text-gray-500 mb-0.5">ATTREZZATURA</span>
              <span className="text-[--color-primary] font-bold">{profile.equipment || 'Palestra'}</span>
            </div>
            <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
              <span className="block text-gray-500 mb-0.5">OBIETTIVO</span>
              <span className="text-white font-bold">{profile.goal || 'Ipertrofia'}</span>
            </div>
            <div className="bg-[--color-dark] border border-[--color-muted] px-3 py-2 rounded-lg text-center">
              <span className="block text-gray-500 mb-0.5">DURATA</span>
              <span className="text-white font-bold">{profile.workout_duration || '60 min'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Cards - Modern Grid */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
          <div className="w-6 h-[2px] bg-[--color-primary] rounded-full"></div>
          Seleziona lo Split
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WORKOUT_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
              className={`group p-5 rounded-2xl text-left transition-all duration-300 border ${
                selectedPreset === preset.id
                  ? 'bg-[#1a1a2e] text-[--color-primary] border-[--color-primary] shadow-[0_0_20px_rgba(0,255,65,0.15)]'
                  : 'bg-[#1a1a2e] text-gray-400 border-[#2a2a3e] hover:border-[--color-primary]/50 hover:shadow-[0_0_15px_rgba(0,255,65,0.08)] hover:text-white hover:-translate-y-0.5'
              }`}
            >
              <span className="text-3xl block mb-3">{preset.label.split(' ')[0]}</span>
              <span className="text-sm font-bold block leading-tight">{preset.label.split(' ').slice(1).join(' ')}</span>
              <span className="text-[10px] opacity-50 mt-1.5 block uppercase tracking-wider">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Voice & Generate - Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[--color-card] via-[#0e1a12] to-[--color-card] border border-[--color-muted] rounded-2xl p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-[--color-primary]/5 via-transparent to-[--color-primary]/5"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-[--color-primary]/15 flex items-center justify-center">
                <Mic size={16} className="text-[--color-primary]" />
              </div>
              Personalizzazione Vocale
            </h3>
            <p className="text-[11px] text-gray-500 mt-2 ml-10">"Concentrati sui bicipiti" · "Aggiungi superset" · "Evita panca piana"</p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceCommand onResult={handleVoice} />
            <button 
              onClick={() => handleGenerate()}
              disabled={loading || !selectedPreset}
              className="group flex items-center gap-2 bg-gradient-to-r from-[--color-primary] to-emerald-400 text-[--color-dark] font-extrabold px-7 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <span className="text-lg">⚡</span>}
              <span>GENERA</span>
            </button>
          </div>
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
            
            {!isSaved && (
              <div className="mt-6 p-4 bg-[--color-card] rounded-xl border border-[--color-muted]/50">
                <h5 className="text-xs font-bold text-[--color-primary] uppercase tracking-widest mb-2">Guida all'RPE (Sforzo Percepito)</h5>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  L'<strong>RPE (Rate of Perceived Exertion)</strong> è una scala da 1 a 10 che misura quanto è stato duro l'allenamento:
                  <br /><br />
                  • <strong>10:</strong> Sforzo Massimo. Non potevi fare un'altra ripetizione (Cedimento).
                  <br />
                  • <strong>8-9:</strong> Molto Duro. Potevi fare forse 1 o 2 ripetizioni in più.
                  <br />
                  • <strong>6-7:</strong> Moderato/Vigoro. Sentivi il muscolo lavorare ma avevi ancora margine.
                  <br /><br />
                  <span className="text-[--color-primary]/70 italic">Synapse analizzerà questo valore per aumentare o diminuire la difficoltà della tua prossima scheda.</span>
                </p>
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
