'use client'

import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { Loader2, Dumbbell, Save, CheckCircle2 } from 'lucide-react'

export default function WorkoutPage() {
  const { profile, workoutHistory, saveWorkout } = useUser()
  const [targetMuscle, setTargetMuscle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPlan, setCurrentPlan] = useState(null)
  const [rpe, setRpe] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  const handleGenerate = async () => {
    if (!targetMuscle.trim()) return;
    setLoading(true)
    setError('')
    setIsSaved(false)
    setCurrentPlan(null)
    setRpe('')

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, targetMuscle, workoutHistory })
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

  const handleSaveRPE = () => {
    if (!rpe || !currentPlan) return;
    
    const workoutRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      target: targetMuscle,
      plan: currentPlan,
      rpe: parseInt(rpe)
    };

    saveWorkout(workoutRecord);
    setIsSaved(true);
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="border-b border-muted pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Dumbbell className="text-primary" size={32} /> 
          Workout <span className="text-primary">Periodizzato</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Inserisci il gruppo muscolare per generare un allenamento ottimizzato sul tuo storico RPE.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-card p-6 rounded-2xl border border-muted flex flex-col md:flex-row gap-4">
        <input 
          type="text"
          placeholder="Es: Petto e Tricipiti, Gambe Pesanti..."
          value={targetMuscle}
          onChange={e => setTargetMuscle(e.target.value)}
          className="flex-1 bg-dark border border-muted rounded-xl p-4 text-white outline-none focus:border-primary placeholder-gray-600"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !targetMuscle}
          className="flex items-center justify-center gap-2 bg-primary text-dark font-bold px-8 py-4 rounded-xl hover:bg-opacity-80 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'GENERA AI'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/20 text-red-500 rounded-xl border border-red-500">{error}</div>}

      {/* Workout Display */}
      {currentPlan && !loading && (
        <div className="bg-card border border-primary/50 shadow-[0_0_30px_rgba(0,255,65,0.05)] rounded-2xl overflow-hidden">
          <div className="bg-primary/10 border-b border-primary/20 p-6">
            <h2 className="text-2xl font-bold text-primary">{currentPlan.titolo}</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {currentPlan.esercizi.map((ex, i) => (
              <div key={i} className="bg-dark border border-muted p-4 rounded-xl hover:border-primary transition">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <h3 className="text-lg font-bold text-white">{i + 1}. {ex.nome}</h3>
                  <div className="flex flex-wrap gap-2 text-sm font-mono tracking-wide">
                    <span className="bg-muted px-3 py-1 rounded text-gray-300">Serie: <strong className="text-white">{ex.serie}</strong></span>
                    <span className="bg-muted px-3 py-1 rounded text-gray-300">Rep: <strong className="text-white">{ex.ripetizioni}</strong></span>
                    <span className="bg-muted px-3 py-1 rounded text-gray-300">Rec: <strong className="text-white">{ex.recupero}</strong></span>
                  </div>
                </div>
                {ex.note_carico && (
                  <div className="mt-3 text-sm text-primary flex gap-2">
                    <span className="opacity-70">💡 AI Note:</span>
                    <span>{ex.note_carico}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RPE Completion Section */}
          <div className="border-t border-muted bg-dark p-6">
            {!isSaved ? (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h4 className="font-bold text-white mb-1">Allenamento Completato?</h4>
                  <p className="text-sm text-gray-400">Inserisci l'RPE (Fatica percepita da 1 a 10) per calibrare il prossimo.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <input 
                    type="number" min="1" max="10"
                    placeholder="RPE"
                    value={rpe}
                    onChange={e => setRpe(e.target.value)}
                    className="w-24 bg-card border border-muted rounded-xl p-3 text-center text-xl font-bold outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleSaveRPE}
                    disabled={!rpe}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition"
                  >
                    <Save size={18} /> SALVA
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-primary font-bold bg-primary/10 p-4 rounded-xl">
                <CheckCircle2 size={24} />
                Allenamento salvato con successo nello storico.
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
              <div key={i} className="bg-dark border border-muted p-4 rounded-xl flex items-center justify-between">
                <span className="font-bold text-white">{w.target}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">{new Date(w.date).toLocaleDateString()}</span>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded text-sm font-bold">RPE {w.rpe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
