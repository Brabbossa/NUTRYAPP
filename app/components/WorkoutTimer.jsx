'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, SkipForward, X, Volume2, VolumeX, RotateCcw } from 'lucide-react'

// Parse recupero string like "60-90" or "90" to seconds (takes the first number)
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&fit=crop", // Squat/Barbell
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&fit=crop", // Dumbbells
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&fit=crop", // Intense workout
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&fit=crop", // Pushups/Ground
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&fit=crop", // Plates
];

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

// Estimate active time based on reps (MINIMUM 120s)
function estimateActiveTime(ripetizioni) {
  if (!ripetizioni) return 120
  const match = String(ripetizioni).match(/(\d+)/)
  const reps = match ? parseInt(match[1]) : 10
  
  if (reps >= 120) return reps; // Se l'utente deve stare in plank 5 min, usa 300 ecc.
  
  // Il minimo garantito di esecuzione diventa 120 secondi.
  return Math.max(120, (reps * 3) + 5) 
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
  const [imageUrl, setImageUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const intervalRef = useRef(null)
  const elapsedRef = useRef(null)
  const audioRef = useRef(null)
  
  // Keep one reliable audio element for bypass Autoplay policies
  useEffect(() => {
    audioRef.current = new Audio()
  }, [])
  
  const voiceAnnounce = useCallback(async (text) => {
    if (!voiceEnabled || !audioRef.current) return
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) throw new Error('TTS fallito o Quota Terminata')
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      audioRef.current.src = url
      await audioRef.current.play()
    } catch (e) {
      console.warn('Audio backend failed, falling back to Web Speech API:', e)
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';
        utterance.rate = 1.1;
        utterance.pitch = 0.6; // Voce più aggressiva
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [voiceEnabled])

  const exercises = plan?.esercizi || []
  const currentExercise = exercises[exerciseIdx]
  const totalSets = currentExercise ? parseSerie(currentExercise.serie) : 0
  const restDuration = currentExercise ? parseRecupero(currentExercise.recupero) : 60
  
  const motivationTimeoutRef = useRef(null)

  const playFartSound = useCallback(() => {
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/fart-01.mp3')
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

  // Fetch WGER image when exercise changes (only active phases)
  useEffect(() => {
    if (!currentExercise || phase === PHASE.IDLE || phase === PHASE.FINISHED) return;
    
    let isMounted = true;
    setImageUrl(null);
    setImageError(false);
    
    const fetchImage = async () => {
      try {
        // Usa il nome inglese se fornito dall'AI, o le prime due parole del nome italiano
        const queryStr = currentExercise.nome_inglese || currentExercise.nome;
        // Estrarre parola chiave per cercare un riscontro
        const query = encodeURIComponent(queryStr.split(' ')[0]);
        
        // WGER DB usa l'inglese o stringhe generiche.
        const res = await fetch(`https://wger.de/api/v2/exercise/search/?term=${query}&language=2`);
        const data = await res.json();
        
        let foundImage = null;

        if (data.suggestions && data.suggestions.length > 0) {
          // Cerca prima se una suggestion ha già l'immagine valorizzata
          for (const sug of data.suggestions) {
            if (sug.data.image) {
              foundImage = sug.data.image.startsWith('http') ? sug.data.image : `https://wger.de${sug.data.image}`;
              break;
            }
          }
          
          // Se nessuna suggestion ha l'immagine, interroghiamo l'endpoint specifico col base_id del primo risultato
          if (!foundImage) {
            const id = data.suggestions[0].data.base_id;
            const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise_base=${id}`);
            const imgData = await imgRes.json();
            
            if (imgData.results && imgData.results.length > 0) {
              foundImage = imgData.results[0].image.startsWith('http') ? imgData.results[0].image : `https://wger.de${imgData.results[0].image}`;
            }
          }
        }
        
        if (foundImage && isMounted) {
          setImageUrl(foundImage);
        } else if (isMounted) {
          setImageError(true);
        }
      } catch (err) {
        if (isMounted) setImageError(true);
      }
    };
    
    fetchImage();
    return () => { isMounted = false; };
  }, [currentExercise, phase]);

  // Countdown timer for automatic progression
  useEffect(() => {
    if ((phase === PHASE.REST || phase === PHASE.EXERCISE) && !isPaused && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            return 0
          }
          
          if (phase === PHASE.REST) {
            if (prev === 11) voiceAnnounce('Dieci secondi alla fine della pausa')
            if (prev === 4) voiceAnnounce('Tre, due, uno')
            if (totalTime > 20 && prev === Math.floor(totalTime / 2)) {
              voiceAnnounce('Forza! Cazzo daje uomo! Sei il più forte! Sbracali tutti!')
            }
          } else if (phase === PHASE.EXERCISE) {
            if (prev === 11) voiceAnnounce('Ultimi dieci secondi, non mollare!')
            if (prev === 4) voiceAnnounce('Tre, due, uno, Stop!')
          }

          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [phase, isPaused, countdown, voiceEnabled, totalTime, voiceAnnounce])

  // Complete current set → go to rest
  const completeSet = useCallback(() => {
    playFartSound()
    const rest = restDuration
    setCountdown(rest)
    setTotalTime(rest)
    setPhase(PHASE.REST)
    voiceAnnounce(`Serie completata! Pausa di ${rest} secondi. Riposa.`)
  }, [restDuration, playFartSound, voiceAnnounce])

  // After rest → next set or next exercise
  const goToNextSet = useCallback(() => {
    playFartSound()
    const nextSet = setIdx + 1
    if (nextSet < totalSets) {
      setSetIdx(nextSet)
      setPhase(PHASE.EXERCISE)
      const activeTime = estimateActiveTime(currentExercise?.ripetizioni)
      setCountdown(activeTime)
      setTotalTime(activeTime)
      voiceAnnounce(`Via! ${currentExercise?.nome}, serie ${nextSet + 1} di ${totalSets}.`)
    } else {
      const nextEx = exerciseIdx + 1
      if (nextEx < exercises.length) {
        setExerciseIdx(nextEx)
        setSetIdx(0)
        setPhase(PHASE.EXERCISE)
        const ex = exercises[nextEx]
        const activeTime = estimateActiveTime(ex.ripetizioni)
        setCountdown(activeTime)
        setTotalTime(activeTime)
        voiceAnnounce(`Prossimo esercizio: ${ex.nome}! Serie 1 di ${parseSerie(ex.serie)}. Vai!`)
      } else {
        setPhase(PHASE.FINISHED)
        voiceAnnounce('Complimenti! Allenamento completato! Grande lavoro!')
      }
    }
  }, [setIdx, totalSets, exerciseIdx, exercises, currentExercise, playFartSound, voiceAnnounce])

  // When countdown hits 0, transition automatically
  useEffect(() => {
    if (countdown === 0) {
      if (phase === PHASE.REST) {
        goToNextSet()
      } else if (phase === PHASE.EXERCISE) {
        completeSet()
      }
    }
  }, [countdown, phase, goToNextSet, completeSet])

  // Random motivation phrase during EXERCISE and REST phases
  useEffect(() => {
    if ((phase === PHASE.EXERCISE || phase === PHASE.REST) && !isPaused && voiceEnabled) {
      const scheduleNext = () => {
        const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000; // Tra 5 e 10 secondi esatti
        motivationTimeoutRef.current = setTimeout(async () => {
          // Non sovrascrivere i voice cue imminenti
          if (countdown > 5) {
            try {
              const res = await fetch('/api/generate-insult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase: phase.toLowerCase() })
              })
              const data = await res.json()
              if (data.text) voiceAnnounce(data.text)
            } catch(e) {}
          }
          scheduleNext()
        }, delay);
      };
      scheduleNext();
    }
    return () => {
      if (motivationTimeoutRef.current) clearTimeout(motivationTimeoutRef.current);
    };
  }, [phase, isPaused, voiceEnabled, countdown, voiceAnnounce])

  // Start the workout
  const startWorkout = () => {
    if (exercises.length === 0) return
    setPhase(PHASE.EXERCISE)
    setExerciseIdx(0)
    setSetIdx(0)
    setElapsed(0)
    setIsPaused(false)
    
    // Set active time for first exercise
    const activeTime = estimateActiveTime(exercises[0].ripetizioni)
    setCountdown(activeTime)
    setTotalTime(activeTime)
    
    voiceAnnounce(`Allenamento iniziato! Primo esercizio: ${exercises[0].nome}. Serie 1 di ${parseSerie(exercises[0].serie)}. Vai!`)
  }

  // Skip phases manually
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
  const progress = totalTime > 0 ? (totalTime - countdown) / totalTime : 0

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
          <span>INIZIA ALLENAMENTO AUTOMATICO</span>
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition" />
        </button>
        <p className="text-gray-500 text-sm">{exercises.length} esercizi • Completamente Automatico</p>
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
          <span className="text-xs font-mono text-gray-500 bg-[--color-muted] px-2 py-1 rounded" title="Tempo Totale">
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

        {/* Immagine WGER o Fallback UI */}
        <div className="w-full flex justify-center my-1 z-10 relative">
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={currentExercise?.nome} 
              className="w-40 h-40 md:w-56 md:h-56 object-cover rounded-xl border border-white/10 shadow-[0_4px_30px_rgba(0,255,65,0.2)] bg-black/50" 
            />
          ) : (
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-xl relative overflow-hidden flex items-center justify-center border border-red-500/20 shadow-[0_4px_30px_rgba(255,0,0,0.15)] bg-black">
              <img 
                src={FALLBACK_IMAGES[exerciseIdx % FALLBACK_IMAGES.length]} 
                className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" 
                alt="Hardcore Gym" 
              />
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-sm font-black text-red-500 uppercase tracking-widest text-shadow-xl">NO EXCUSES</span>
                <span className="text-[9px] font-bold text-gray-300 mt-1 uppercase tracking-widest backdrop-blur-sm bg-black/30 px-2 py-1 rounded">Visual Offline</span>
              </div>
            </div>
          )}
        </div>

        {/* Set info */}
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-[--color-muted] px-3 py-1.5 rounded-lg text-gray-300">
            Serie <strong className="text-white">{setIdx + 1}/{totalSets}</strong>
          </span>
          <span className="bg-[--color-muted] px-3 py-1.5 rounded-lg text-gray-300">
            Rep <strong className="text-white">{currentExercise?.ripetizioni}</strong>
          </span>
        </div>

        {/* Timer Ring (unified for both REST and EXERCISE) */}
        <div className="relative my-4">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {/* Background ring */}
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={phase === PHASE.EXERCISE ? 'var(--color-primary)' : '#fbbf24'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: phase === PHASE.EXERCISE ? 'drop-shadow(0 0 8px rgba(0,255,65,0.4))' : 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-mono font-bold tabular-nums ${phase === PHASE.EXERCISE ? 'text-[--color-primary]' : 'text-amber-400'}`}>
              {formatTime(countdown)}
            </span>
            <span className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{phase === PHASE.EXERCISE ? 'Rimasti' : 'Recupero'}</span>
          </div>
        </div>

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
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all ${
              isPaused 
                ? 'bg-[--color-primary] text-[--color-dark] shadow-[0_0_20px_rgba(0,255,65,0.2)]' 
                : 'bg-[--color-muted] text-gray-300 hover:bg-gray-700'
            }`}
            title={isPaused ? 'Riprendi Automatico' : 'Pausa'}
          >
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} />}
            {isPaused ? 'RIPRENDI' : 'PAUSA'}
          </button>

          {phase === PHASE.EXERCISE ? (
            /* Skip Set early */
            <button
              onClick={skipRest}
              disabled={isPaused}
              className="px-6 py-4 rounded-xl text-gray-400 font-bold hover:text-white transition-all disabled:opacity-40"
              title="Completa in anticipo"
            >
              <SkipForward size={20} />
            </button>
          ) : (
            /* Skip Rest */
            <button
              onClick={skipRest}
              disabled={isPaused}
              className="px-6 py-4 rounded-xl text-amber-400 font-bold hover:text-white transition-all disabled:opacity-40"
              title="Salta Pausa"
            >
              <SkipForward size={20} />
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
            {exercises.slice(exerciseIdx + (phase === PHASE.REST && setIdx === totalSets - 1 ? 1 : 0), exerciseIdx + 3).map((ex, i) => {
              // Adjust preview logic depending on whether we are moving to next exercise soon
              const effectiveIdx = exerciseIdx + (phase === PHASE.REST && setIdx === totalSets - 1 ? 1 : 0) + i;
              if (effectiveIdx >= exercises.length) return null;
              
              const isPulsing = i === 0 && phase === PHASE.REST && setIdx === totalSets - 1;
              
              return (
                <div key={i} className={`flex items-center justify-between text-sm ${isPulsing ? 'text-[--color-primary] animate-pulse' : 'text-gray-500'}`}>
                  <span>{effectiveIdx + 1}. {exercises[effectiveIdx].nome}</span>
                  <span className="font-mono text-xs">{exercises[effectiveIdx].serie}×{exercises[effectiveIdx].ripetizioni}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
