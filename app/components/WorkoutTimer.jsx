'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, X, Volume2, VolumeX, RotateCcw } from 'lucide-react'

// Parse recupero string like "60-90" or "90" to seconds (takes the first number)
function parseRecupero(rec) {
  if (!rec) return 60
  const match = String(rec).match(/(\d+)/)
  return match ? parseInt(match[1]) : 60
}

// Parse serie string to number
function parseSerie(serie) {
  if (!serie) return 3
  const match = String(serie).match(/(\d+)/)
  return match ? parseInt(match[1]) : 3
}

// TTS speak function
function speak(text, lang = 'it-IT') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 1.0
  utterance.pitch = 1.0
  utterance.volume = 1.0
  // Try to find an Italian voice
  const voices = window.speechSynthesis.getVoices()
  const italianVoice = voices.find(v => v.lang.startsWith('it'))
  if (italianVoice) utterance.voice = italianVoice
  window.speechSynthesis.speak(utterance)
}

// Timer phases
const PHASE = {
  IDLE: 'idle',
  EXERCISE: 'exercise',
  REST: 'rest',
  FINISHED: 'finished',
}

export function WorkoutTimer({ plan, onComplete }) {
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const intervalRef = useRef(null)
  const elapsedRef = useRef(null)

  const exercises = plan?.esercizi || []
  const currentExercise = exercises[exerciseIdx]
  const totalSets = currentExercise ? parseSerie(currentExercise.serie) : 0
  const restDuration = currentExercise ? parseRecupero(currentExercise.recupero) : 60
  
  // Ref for random motivation timeout
  const motivationTimeoutRef = useRef(null)

  // Play fart sound
  const playFartSound = useCallback(() => {
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/fart-01.mp3') // Basic fart sound
      audio.volume = 1.0;
      audio.play().catch(e => console.log('Audio play failed', e))
    } catch(err) {}
  }, [])


  // Total elapsed timer
  useEffect(() => {
    if (phase !== PHASE.IDLE && phase !== PHASE.FINISHED && !isPaused) {
      elapsedRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(elapsedRef.current)
  }, [phase, isPaused])

  // Countdown timer for rest phases
  useEffect(() => {
    if (phase === PHASE.REST && !isPaused && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            return 0
          }
          // Voice cues at key moments
          if (prev === 11 && voiceEnabled) speak('Dieci secondi alla fine della pausa')
          if (prev === 4 && voiceEnabled) speak('Tre, due, uno')
          if (totalTime > 20 && prev === Math.floor(totalTime / 2) && voiceEnabled) {
            speak('Forza Enrico! Cazzo daje uomo! Sei il più forte! Sbracali tutti!')
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [phase, isPaused, countdown, voiceEnabled, totalTime])

  // When rest countdown hits 0, move to next set/exercise
  useEffect(() => {
    if (phase === PHASE.REST && countdown === 0) {
      goToNextSet()
    }
  }, [phase, countdown])

  // Random motivation phrase during EXERCISE phase
  useEffect(() => {
    if (phase === PHASE.EXERCISE && !isPaused && voiceEnabled) {
      const scheduleNext = () => {
        // Random tra 8 e 40 secondi
        const delay = Math.floor(Math.random() * (40000 - 8000 + 1)) + 8000;
        motivationTimeoutRef.current = setTimeout(() => {
          speak("Forza cazzo spingi uomo!! QUella fica non si leccherà da sola!");
          scheduleNext(); // Schedule the next one
        }, delay);
      };
      scheduleNext();
    }
    return () => {
      if (motivationTimeoutRef.current) clearTimeout(motivationTimeoutRef.current);
    };
  }, [phase, isPaused, voiceEnabled])

  const voiceAnnounce = useCallback((text) => {
    if (voiceEnabled) speak(text)
  }, [voiceEnabled])

  // Start the workout
  const startWorkout = () => {
    if (exercises.length === 0) return
    setPhase(PHASE.EXERCISE)
    setExerciseIdx(0)
    setSetIdx(0)
    setElapsed(0)
    setIsPaused(false)
    voiceAnnounce(`Allenamento iniziato! Primo esercizio: ${exercises[0].nome}. Serie 1 di ${parseSerie(exercises[0].serie)}. Vai!`)
  }

  // Complete current set → go to rest
  const completeSet = () => {
    playFartSound()
    const rest = restDuration
    setCountdown(rest)
    setTotalTime(rest)
    setPhase(PHASE.REST)
    voiceAnnounce(`Serie completata! Pausa di ${rest} secondi. Riposa.`)
  }

  // After rest → next set or next exercise
  const goToNextSet = () => {
    playFartSound()
    const nextSet = setIdx + 1
    if (nextSet < totalSets) {
      // Next set of same exercise
      setSetIdx(nextSet)
      setPhase(PHASE.EXERCISE)
      voiceAnnounce(`Via! ${currentExercise.nome}, serie ${nextSet + 1} di ${totalSets}.`)
    } else {
      // Next exercise
      const nextEx = exerciseIdx + 1
      if (nextEx < exercises.length) {
        setExerciseIdx(nextEx)
        setSetIdx(0)
        setPhase(PHASE.EXERCISE)
        const ex = exercises[nextEx]
        voiceAnnounce(`Prossimo esercizio: ${ex.nome}! Serie 1 di ${parseSerie(ex.serie)}. Vai!`)
      } else {
        // Workout finished
        setPhase(PHASE.FINISHED)
        voiceAnnounce('Complimenti! Allenamento completato! Grande lavoro!')
      }
    }
  }

  // Skip rest / skip to next exercise
  const skipRest = () => {
    clearInterval(intervalRef.current)
    setCountdown(0)
  }

  // Toggle pause
  const togglePause = () => {
    if (isPaused) {
      voiceAnnounce('Ripreso!')
    } else {
      voiceAnnounce('In pausa')
    }
    setIsPaused(prev => !prev)
  }

  // Stop workout
  const stopWorkout = () => {
    clearInterval(intervalRef.current)
    clearInterval(elapsedRef.current)
    window.speechSynthesis?.cancel()
    setPhase(PHASE.IDLE)
    setElapsed(0)
  }

  // Format seconds to mm:ss
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Progress for the ring (0 to 1)
  const progress = phase === PHASE.REST && totalTime > 0
    ? (totalTime - countdown) / totalTime
    : 0

  // SVG ring params
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // IDLE — show start button
  if (phase === PHASE.IDLE) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={startWorkout}
          className="group relative flex items-center gap-3 bg-[--color-primary] text-[--color-dark] font-bold text-lg px-8 py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all active:scale-95"
        >
          <Play size={24} fill="currentColor" />
          <span>INIZIA ALLENAMENTO</span>
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition" />
        </button>
        <p className="text-gray-500 text-sm">{exercises.length} esercizi • Timer + Coaching Vocale AI</p>
      </div>
    )
  }

  // FINISHED
  if (phase === PHASE.FINISHED) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 animate-fadeIn">
        <div className="w-32 h-32 rounded-full bg-[--color-primary]/20 flex items-center justify-center border-2 border-[--color-primary] animate-pulse">
          <span className="text-5xl">🏆</span>
        </div>
        <h3 className="text-2xl font-bold text-[--color-primary]">Allenamento Completato!</h3>
        <p className="text-gray-400 text-lg font-mono">{formatTime(elapsed)} totali</p>
        <button
          onClick={() => { setPhase(PHASE.IDLE); onComplete?.() }}
          className="flex items-center gap-2 bg-[--color-card] border border-[--color-muted] text-gray-300 px-6 py-3 rounded-xl hover:border-[--color-primary] hover:text-white transition"
        >
          <RotateCcw size={18} /> Chiudi Timer
        </button>
      </div>
    )
  }

  // EXERCISE / REST — main timer UI
  return (
    <div className="timer-container bg-[--color-card] border border-[--color-primary]/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,255,65,0.05)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[--color-dark] border-b border-[--color-muted]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500 bg-[--color-muted] px-2 py-1 rounded">
            ⏱ {formatTime(elapsed)}
          </span>
          <span className="text-xs text-gray-500">
            Esercizio {exerciseIdx + 1}/{exercises.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(prev => !prev)}
            className={`p-2 rounded-lg transition ${voiceEnabled ? 'text-[--color-primary]' : 'text-gray-600'}`}
            title={voiceEnabled ? 'Disattiva voce' : 'Attiva voce'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={stopWorkout}
            className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Termina allenamento"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-5 px-6 py-8">
        {/* Phase Badge */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase ${
          phase === PHASE.EXERCISE
            ? 'bg-[--color-primary]/15 text-[--color-primary] border border-[--color-primary]/30'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        }`}>
          {phase === PHASE.EXERCISE ? '🔥 Esegui' : '😤 Recupero'}
        </div>

        {/* Exercise Name */}
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight">
          {currentExercise?.nome}
        </h2>

        {/* Set info */}
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-[--color-muted] px-3 py-1.5 rounded-lg text-gray-300">
            Serie <strong className="text-white">{setIdx + 1}/{totalSets}</strong>
          </span>
          <span className="bg-[--color-muted] px-3 py-1.5 rounded-lg text-gray-300">
            Rep <strong className="text-white">{currentExercise?.ripetizioni}</strong>
          </span>
        </div>

        {/* Big Timer for Elapsed Time (only during EXERCISE) */}
        {phase === PHASE.EXERCISE && (
          <div className="my-6">
            <div className="text-[5rem] md:text-[6rem] leading-none font-mono font-black text-[--color-primary] tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              {formatTime(elapsed)}
            </div>
          </div>
        )}

        {/* Timer Ring (only during REST) */}
        {phase === PHASE.REST && (
          <div className="relative my-4">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {/* Background ring */}
              <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="8" />
              {/* Progress ring */}
              <circle
                cx="100" cy="100" r={radius}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,65,0.4))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold text-white tabular-nums">
                {formatTime(countdown)}
              </span>
              <span className="text-xs text-gray-500 mt-1">recupero</span>
            </div>
          </div>
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="text-yellow-400 text-sm font-bold animate-pulse flex items-center gap-2">
            <Pause size={16} /> IN PAUSA
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2">
          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className={`p-4 rounded-xl transition-all ${
              isPaused 
                ? 'bg-[--color-primary] text-[--color-dark]' 
                : 'bg-[--color-muted] text-gray-300 hover:bg-gray-700'
            }`}
            title={isPaused ? 'Riprendi' : 'Pausa'}
          >
            {isPaused ? <Play size={22} fill="currentColor" /> : <Pause size={22} />}
          </button>

          {phase === PHASE.EXERCISE ? (
            /* Complete Set */
            <button
              onClick={completeSet}
              disabled={isPaused}
              className="flex items-center gap-2 bg-[--color-primary] text-[--color-dark] font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all active:scale-95 disabled:opacity-40"
            >
              ✅ SERIE COMPLETATA
            </button>
          ) : (
            /* Skip Rest */
            <button
              onClick={skipRest}
              disabled={isPaused}
              className="flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-6 py-4 rounded-xl hover:bg-amber-500/30 transition-all active:scale-95 disabled:opacity-40"
            >
              <SkipForward size={20} /> SALTA PAUSA
            </button>
          )}
        </div>

        {/* AI Note */}
        {currentExercise?.note_carico && phase === PHASE.EXERCISE && (
          <div className="w-full mt-4 bg-[--color-primary]/5 border border-[--color-primary]/20 rounded-xl px-4 py-3 text-sm text-[--color-primary]">
            <span className="opacity-60">💡 AI:</span> {currentExercise.note_carico}
          </div>
        )}

        {/* Exercise queue preview */}
        <div className="w-full mt-4 pt-4 border-t border-[--color-muted]">
          <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-semibold">Prossimi</p>
          <div className="flex flex-col gap-1.5">
            {exercises.slice(exerciseIdx + 1, exerciseIdx + 4).map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-gray-500">
                <span>{exerciseIdx + 2 + i}. {ex.nome}</span>
                <span className="font-mono text-xs">{ex.serie}×{ex.ripetizioni}</span>
              </div>
            ))}
            {exerciseIdx >= exercises.length - 1 && (
              <span className="text-xs text-gray-600 italic">Ultimo esercizio! 💪</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
