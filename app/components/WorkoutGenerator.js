'use client'

import { useState } from 'react'
import { submitRpe } from '../actions'
import { useUser } from '../context/UserContext'

export function WorkoutGenerator({ initialWorkout }) {
  const { triggerEasterEgg } = useUser()
  const [muscle, setMuscle] = useState('')
  const [loading, setLoading] = useState(false)
  const [workout, setWorkout] = useState(initialWorkout)
  const [rpe, setRpe] = useState('')
  const [rpeSubmitted, setRpeSubmitted] = useState(false)

  const handleGenerate = async () => {
    if (!muscle) return;
    triggerEasterEgg();
    setLoading(true);
    const res = await fetch('/api/workout', {
      method: 'POST',
      body: JSON.stringify({ targetMuscle: muscle }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.plan) {
      setWorkout(data); // Assuming data actually represents a new workout directly from DB if needed, but we just need plan
    }
    setLoading(false);
    setRpeSubmitted(false);
  }

  const handleRpeSubmit = async () => {
    if (!rpe || !workout?.id) return;
    await submitRpe(workout.id, rpe);
    setRpeSubmitted(true);
  }

  return (
    <div className="workout-card">
      <h3>AI Workout Generator</h3>
      
      {!workout || workout.rpe ? (
        <>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Inserisci il gruppo muscolare target:
          </p>
          <div className="rpe-input" style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="es. Petto e Tricipiti" 
              value={muscle} 
              onChange={e => setMuscle(e.target.value)} 
            />
          </div>
          <button className="btn-primary" onClick={handleGenerate} disabled={loading || !muscle}>
            {loading ? "Generazione in corso..." : "⚡ GENERATE"}
          </button>
        </>
      ) : (
        <>
          <div className="workout-plan">
            {workout.plan}
          </div>
          {!rpeSubmitted ? (
            <div className="rpe-section">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Fine allenamento? Inserisci RPE (Fatica percepita 1-10):
              </p>
              <div className="rpe-input">
                <input 
                  type="number" 
                  min="1" max="10" 
                  placeholder="RPE (1-10)" 
                  value={rpe} 
                  onChange={e => setRpe(e.target.value)} 
                />
                <button className="btn-primary" style={{ width: 'auto' }} onClick={handleRpeSubmit}>
                  SALVA
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>✓ RPE Salvato. Ottimo lavoro!</p>
          )}
        </>
      )}
    </div>
  )
}
