'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Send } from 'lucide-react'

export function VoiceCommand({ onResult, placeholder = "Scrivi o parla..." }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const startListening = useCallback(() => {
    setError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Il tuo browser non supporta il riconoscimento vocale. Usa la tastiera.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'it-IT'
    recognition.continuous = false
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
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (transcript.trim()) {
      onResult(transcript.trim())
    }
  }

  return (
    <div className="space-y-2 w-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[--color-dark] border border-[--color-muted] rounded-xl overflow-hidden focus-within:border-[--color-primary] transition-colors relative">
        <input 
          type="text" 
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 pl-4 pr-2 text-sm text-white outline-none w-full"
        />
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`p-3 transition-colors ${
            isListening 
              ? 'text-red-500 animate-pulse' 
              : 'text-gray-400 hover:text-[--color-primary]'
          }`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          type="submit"
          disabled={!transcript.trim()}
          className="p-3 text-gray-400 hover:text-[--color-primary] disabled:opacity-30 disabled:hover:text-gray-400"
        >
          <Send size={20} />
        </button>
      </form>
      
      {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
    </div>
  )
}
