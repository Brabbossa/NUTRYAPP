'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

export function VoiceCommand({ onResult, placeholder = "Parla per modificare..." }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const startListening = useCallback(() => {
    setError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Il tuo browser non supporta il riconoscimento vocale. Usa Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'it-IT'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript('')
    }
    
    recognition.onresult = (event) => {
      let currentTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript
      }
      setTranscript(currentTranscript)
    }

    recognition.onerror = (event) => {
      console.error("Speech error", event.error)
      if (event.error !== 'no-speech') {
         setError('Errore microfono: ' + event.error)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // Se si ferma da solo o viene fermato, prendiamo lo state più recente
      setTranscript((current) => {
        if (current.trim().length > 0) {
          onResult(current.trim())
        }
        return current
      })
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onResult])

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    // l'invio avviene in onend
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-[--color-card] border border-[--color-muted] text-gray-400 hover:text-white hover:border-[--color-primary]'
          }`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          {isListening ? 'Stop' : 'Comando Vocale'}
        </button>
        
        {transcript && (
          <span className="text-sm text-gray-400 italic truncate max-w-xs">
            "{transcript}"
          </span>
        )}
      </div>
      
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
