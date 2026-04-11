'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { Save, Bell, BellOff, CalendarPlus, CheckCircle2 } from 'lucide-react'

export default function PreferencesPage() {
  const { profile, updateProfile, resetAllData } = useUser()
  const [formData, setFormData] = useState(profile)
  const [toast, setToast] = useState('')
  const [notifPermission, setNotifPermission] = useState('default')
  const [notifScheduled, setNotifScheduled] = useState(false)

  useEffect(() => {
    setFormData(profile)
    // Check current notification permission
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
    }
  }, [profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    updateProfile(formData)
    setToast('Preferenze Salvate con successo!')
    setTimeout(() => setToast(''), 3000)
  }

  // ─── NOTIFICATIONS ───
  const requestNotificationPermission = async () => {
    try {
      // Register SW first
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
      }
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
      if (permission === 'granted') {
        setToast('🔔 Notifiche attivate!')
        setTimeout(() => setToast(''), 3000)
      }
    } catch (err) {
      console.error('Notification error:', err)
    }
  }

  const scheduleNotifications = async () => {
    if (notifPermission !== 'granted') {
      await requestNotificationPermission()
      return
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Build notification schedule from workout_time
    const schedule = [
      { key: 'workout', label: '💪 WORKOUT TIME', time: formData.workout_time || '18:00' },
    ]

    const registration = await navigator.serviceWorker.ready

    let scheduled = 0
    for (const item of schedule) {
      const [h, m] = item.time.split(':').map(Number)
      const target = new Date(todayStr + 'T' + item.time + ':00')
      const delay = target.getTime() - now.getTime()

      if (delay > 0) {
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          title: item.label,
          body: 'È ora di spaccare ferro! Apri Synapse e inizia il workout.',
          delay,
          tag: `synapse-${item.key}`
        })
        scheduled++
      }
    }

    setNotifScheduled(true)
    setToast(`🔔 ${scheduled} notifiche programmate per oggi!`)
    setTimeout(() => setToast(''), 4000)
  }

  // ─── CALENDAR SYNC (ICS EXPORT) ───
  const exportToCalendar = () => {
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const formatDate = (d) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

    const workoutTime = formData.workout_time || '18:00'
    const [wh, wm] = workoutTime.split(':').map(Number)

    // Generate recurring daily workout events for the next 4 weeks
    let events = ''
    for (let day = 0; day < 28; day++) {
      const start = new Date(now)
      start.setDate(start.getDate() + day)
      start.setHours(wh, wm, 0, 0)
      const end = new Date(start)
      end.setHours(end.getHours() + 1, end.getMinutes() + 30) // 1.5h workout

      events += `BEGIN:VEVENT
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:💪 Synapse Workout
DESCRIPTION:È ora di allenarsi! Apri Synapse Professional per il tuo workout AI.
LOCATION:Palestra
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Workout tra 15 minuti!
END:VALARM
END:VEVENT
`
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Synapse Professional//Fitness//IT
CALSCALE:GREGORIAN
${events}END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'synapse_workout_schedule.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setToast('📅 File calendario scaricato! Aprilo per aggiungerlo al tuo calendario.')
    setTimeout(() => setToast(''), 5000)
  }
  const inputClass = "w-full bg-white/5 rounded-xl p-3 text-white outline-none focus:bg-white/10 transition-colors"

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a0f] via-[--color-card] to-[#0f1a14] border border-[--color-primary]/20 p-8 flex items-center justify-between">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[--color-primary]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-[--color-primary] via-cyan-400 to-blue-500 bg-clip-text text-transparent">Preferences</span>
          </h1>
        </div>
        <button 
          onClick={handleSave}
          className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-[--color-primary] to-cyan-500 text-black font-extrabold px-6 py-3 rounded-[16px] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all duration-300 active:scale-95"
        >
          <Save size={18} /> Salva
        </button>
      </div>

      {toast && (
        <div className="bg-primary/20 text-primary p-3 rounded-lg border border-primary text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-6">
        <h3 className="text-primary font-bold text-lg mb-2 flex items-center gap-2">💡 Ottimizza l'Intelligenza Artificiale</h3>
        <p className="text-sm text-gray-300 mb-3">
          I dati che inserisci qui sono fondamentali. <strong>Synapse Professional</strong> (la nostra AI) li utilizzerà come core per calcolare ogni tuo risultato:
        </p>
        <ul className="text-sm text-gray-400 list-disc pl-5 space-y-2">
          <li><strong>Workout Periodizzato:</strong> L'esperienza, l'età e il livello di attività determineranno il volume (serie e ripetizioni) e i tempi di recupero ideali. Inoltre, i parametri RPE dei tuoi allenamenti passati calibreranno il sovraccarico progressivo.</li>
        </ul>
        <p className="text-sm text-primary mt-3 font-semibold">📍 Più sei preciso in questa pagina, più estremi saranno i tuoi risultati muscolari.</p>
      </div>

      {/* Dati Corporei & Anamnesi PT */}
      <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 rounded-[24px] space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
          <h2 className="text-xl font-black text-white">Dati Corporei & Anamnesi</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sesso</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
              <option value="Uomo">Uomo</option>
              <option value="Donna">Donna</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Peso (kg)</label>
            <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Altezza (cm)</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Età</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">% Grasso Stimata</label>
            <input type="number" step="0.1" name="body_fat" value={formData.body_fat} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Circonferenze (cm) - Opzionali</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Petto / Torace</label>
              <input type="number" step="0.1" name="chest_cm" value={formData.chest_cm || ''} onChange={handleChange} placeholder="Es. 100" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Girovita (Ombelico)</label>
              <input type="number" step="0.1" name="waist_cm" value={formData.waist_cm || ''} onChange={handleChange} placeholder="Es. 80" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fianchi / Glutei</label>
              <input type="number" step="0.1" name="hips_cm" value={formData.hips_cm || ''} onChange={handleChange} placeholder="Es. 95" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Girocoscia</label>
              <input type="number" step="0.1" name="thighs_cm" value={formData.thighs_cm || ''} onChange={handleChange} placeholder="Es. 60" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Stile di Vita & Allenamento</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lavoro / Dinamismo</label>
              <select name="work_type" value={formData.work_type || 'Studente/Scrivania'} onChange={handleChange} className={inputClass}>
                <option value="Studente/Scrivania">Sedentario (Scrivania/Studio)</option>
                <option value="Attivo/In piedi">Dinamico (Commesso, Infermiere)</option>
                <option value="Pesante/Cantiere">Manuale Pesante (Operaio, Muratore)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Livello NEAT Formale</label>
              <select name="activity_level" value={formData.activity_level} onChange={handleChange} className={inputClass}>
                <option value="Sedentario">Quasi nullo (0-3k passi)</option>
                <option value="Leggero">Leggero (4k-6k passi)</option>
                <option value="Moderato">Moderato (7k-10k passi)</option>
                <option value="Attivo">Attivo (11k-15k passi)</option>
                <option value="Atleta">Molto Attivo (+15k passi)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Esperienza Allenamento</label>
              <select name="training_experience" value={formData.training_experience || 'Intermedio'} onChange={handleChange} className={inputClass}>
                <option value="Neofita">Neofita (0-1 anni)</option>
                <option value="Intermedio">Intermedio (1-3 anni)</option>
                <option value="Avanzato">Avanzato (+3 anni)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1 text-primary">Obiettivo PT</label>
              <select name="goal" value={formData.goal || 'Ipertrofia'} onChange={handleChange} className="w-full bg-[--color-primary]/10 border border-[--color-primary] rounded p-2 text-white outline-none focus:border-white">
                <option value="Dimagrimento">Definizione / Dimagrimento (Cut)</option>
                <option value="Ricomp. Corporea">Ricomposizione Corporea</option>
                <option value="Ipertrofia">Ipertrofia / Massa (Bulk)</option>
                <option value="Mantenimento">Mantenimento</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Logistica Allenamento & Infortuni</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Attrezzatura Disponibile</label>
              <select name="equipment" value={formData.equipment || 'Palestra Completa'} onChange={handleChange} className={inputClass}>
                <option value="Palestra Completa">Palestra Completa (Macchinari + Pesi Liberi)</option>
                <option value="Solo Manubri">Solo Manubri / Panca</option>
                <option value="Corpo Libero">Corpo Libero / Calisthenics</option>
                <option value="Elastici">Elastici / Bande di resistenza</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Durata Sessione</label>
              <select name="workout_duration" value={formData.workout_duration || '60 min'} onChange={handleChange} className={inputClass}>
                <option value="30 min">Express (30 min)</option>
                <option value="45 min">Breve (45 min)</option>
                <option value="60 min">Standard (60 min)</option>
                <option value="90 min">Lunga (90 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Frequenza Settimanale</label>
              <select name="workout_frequency" value={formData.workout_frequency || '3 giorni/settimana'} onChange={handleChange} className={inputClass}>
                <option value="2 giorni/settimana">2 Giorni a Settimana</option>
                <option value="3 giorni/settimana">3 Giorni a Settimana</option>
                <option value="4 giorni/settimana">4 Giorni a Settimana</option>
                <option value="5+ giorni/settimana">5+ Giorni a Settimana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-red-400 mb-1 font-semibold">Limitazioni / Infortuni</label>
              <input type="text" name="injuries" value={formData.injuries || ''} onChange={handleChange} placeholder="Es. Ginocchio dx, Spalla, Nessuna..." className="w-full bg-red-500/10 border border-red-500/50 rounded p-2 text-white outline-none focus:border-red-400" />
            </div>
          </div>
        </div>

      </section>

      {/* Orari Notifiche */}
      <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 rounded-[24px] space-y-6">
        <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">Orario Workout</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-[--color-primary] mb-2 font-bold uppercase tracking-wider text-[11px]">🏋️ Avviso Workout Push</label>
            <input type="time" name="workout_time" value={formData.workout_time || '18:00'} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </section>

      {/* 🔔 Notifiche & Calendario */}
      <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 rounded-[24px] space-y-6">
        <h2 className="text-xl font-semibold text-primary flex items-center gap-2"><Bell size={22}/> Notifiche & Calendario</h2>
        
        {/* Blocco Istruzioni */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 space-y-3">
          <h3 className="text-primary font-bold flex items-center gap-2">📖 Come Funziona</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="font-bold text-white mb-1">🔔 Notifiche Push</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Clicca <strong className="text-white">"Attiva Notifiche"</strong> e concedi il permesso quando il browser te lo chiede.</li>
                <li>Una volta attivate, clicca <strong className="text-white">"Programma Notifiche Oggi"</strong>: riceverai un avviso sul telefono all'orario del Workout che hai impostato.</li>
                <li>Le notifiche funzionano anche con il telefono bloccato, a patto che l'app sia stata aperta almeno una volta oggi.</li>
                <li><strong className="text-yellow-400">⚠️ iPhone:</strong> Per ricevere le notifiche su iPhone, devi prima aggiungere l'app alla Home Screen (Safari → Condividi → "Aggiungi alla schermata Home"). Solo da lì le notifiche PWA funzionano su iOS.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-1">📅 Sincronizzazione Calendario</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Clicca <strong className="text-white">"Esporta nel Calendario"</strong> per scaricare un file <code className="bg-dark px-1 rounded text-primary">.ics</code> con 4 settimane di workout programmati.</li>
                <li><strong className="text-white">iPhone:</strong> Apri il file scaricato → ti chiederà <em>"Aggiungere tutti gli eventi?"</em> → Conferma. Troverai gli allenamenti nel Calendario Apple con allarme 15 minuti prima.</li>
                <li><strong className="text-white">Android:</strong> Apri il file .ics → Google Calendar importerà automaticamente tutti gli eventi.</li>
                <li>Se cambi l'orario del workout, riesporta il file per aggiornare il calendario.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Button */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2)] rounded-[24px] p-8 flex flex-col items-center text-center gap-4">
            {notifPermission === 'granted' ? (
              <>
                <CheckCircle2 className="text-primary" size={32}/>
                <span className="text-sm text-primary font-bold">Notifiche Attive</span>
                <button
                  onClick={scheduleNotifications}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${notifScheduled ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-primary text-dark hover:opacity-90 active:scale-95'}`}
                >
                  {notifScheduled ? '✅ Programmate per Oggi' : '🔔 Programma Notifiche Oggi'}
                </button>
              </>
            ) : notifPermission === 'denied' ? (
              <>
                <BellOff className="text-red-400" size={32}/>
                <span className="text-sm text-red-400 font-bold">Notifiche Bloccate</span>
                <p className="text-xs text-gray-500">Vai nelle impostazioni del browser e abilita le notifiche per questo sito.</p>
              </>
            ) : (
              <>
                <Bell className="text-gray-400" size={32}/>
                <span className="text-sm text-gray-400 font-bold">Notifiche Non Attive</span>
                <button
                  onClick={requestNotificationPermission}
                  className="w-full bg-primary text-dark font-bold py-3 rounded-xl hover:opacity-90 transition active:scale-95"
                >
                  🔔 Attiva Notifiche
                </button>
              </>
            )}
          </div>

          {/* Calendar Export Button */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.2)] rounded-[24px] p-8 flex flex-col items-center text-center gap-4">
            <CalendarPlus className="text-primary" size={32}/>
            <span className="text-sm text-primary font-bold">Sincronizza Calendario</span>
            <p className="text-xs text-gray-500">Scarica un file .ics con 4 settimane di workout programmati all'orario che hai impostato. Aprilo per aggiungerlo al Calendario di iPhone/Android.</p>
            <button
              onClick={exportToCalendar}
              className="w-full bg-primary/20 text-primary font-bold py-3 rounded-xl border border-primary/50 hover:bg-primary/30 transition active:scale-95"
            >
              📅 Esporta nel Calendario
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.05)] mt-8">
        <h2 className="text-xl font-semibold text-red-500 flex items-center gap-2">⚠️ Danger Zone</h2>
        <div className="bg-dark/50 p-5 rounded-xl border border-red-500/10">
          <h3 className="text-white font-bold mb-2">Reset Totale Dati</h3>
          <p className="text-sm text-gray-400 mb-4">Questa azione eliminerà definitivamente tutto il tuo storico dei workout e riporterà l'app ai valori di default. L'azione è irreversibile.</p>
          
          <button
            onClick={async () => {
              if (window.confirm("Sei sicuro di voler cancellare TUTTI i tuoi dati? Questa azione è irreversibile.")) {
                try {
                  await resetAllData();
                  window.location.href = '/'; // Ricarica la pagina da capo con i default minimi
                } catch(e) {
                  console.error('Errore Reset:', e)
                  window.alert("Errore durante il reset: " + e.message)
                }
              }
            }}
            className="w-full md:w-auto bg-red-500/10 text-red-500 border border-red-500/50 font-bold px-6 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Cancella Tutto e Ricomincia
          </button>
        </div>
      </section>
    </div>
  )
}
