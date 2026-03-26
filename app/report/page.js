'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { Activity, Brain } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ReportPage() {
  const { user, profile } = useUser()
  const [loading, setLoading] = useState(false)
  const [reportHtml, setReportHtml] = useState(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ meals: 0, workouts: 0 })

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoDate = sevenDaysAgo.toISOString();

      const { count: mealsCount } = await supabase
        .from('meals_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', isoDate);

      const { count: workoutsCount } = await supabase
        .from('workout_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', isoDate);

      setStats({ meals: mealsCount || 0, workouts: workoutsCount || 0 });
    }
    fetchStats();
  }, [user]);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoDate = sevenDaysAgo.toISOString();

      const { data: meals } = await supabase.from('meals_history').select('*').eq('user_id', user.id).gte('created_at', isoDate);
      const { data: workouts } = await supabase.from('workout_history').select('*').eq('user_id', user.id).gte('created_at', isoDate);

      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, workouts, meals })
      });

      const data = await res.json();
      if (res.ok && data.report) {
         setReportHtml(data.report);
      } else {
         setError(data.error || 'Errore nella generazione del report');
      }
    } catch (e) {
      setError('Errore di connessione al server.');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a0f] via-[--color-card] to-[#0f1a14] border border-[--color-primary]/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[--color-primary]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Brain className="text-[--color-primary]" size={36}/>
            <span className="bg-gradient-to-r from-[--color-primary] via-emerald-400 to-teal-300 bg-clip-text text-transparent">Synapse</span>
            <span className="text-white">Clinic</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Genera la tua valutazione clinica settimanale basata sui dati tracciati negli ultimi 7 giorni.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-white">{stats.meals}</span>
          <span className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Pasti Completati</span>
        </div>
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black text-[--color-primary]">{stats.workouts}</span>
          <span className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Workout Fatti</span>
        </div>
      </div>

      {!reportHtml && !loading && (
        <button onClick={generateReport} className="w-full bg-gradient-to-r from-[--color-primary] to-emerald-400 text-[--color-dark] font-black text-xl py-6 rounded-2xl hover:shadow-[0_0_30px_rgba(0,255,65,0.3)] transition-all duration-300 active:scale-95">
          ANALIZZA LA MIA SETTIMANA
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-muted rounded-2xl">
          <Activity className="text-primary animate-pulse mb-4" size={48} />
          <h3 className="text-lg font-bold text-white mb-2">Calcolo Diagnosi in Corso...</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">Synapse sta analizzando ogni grammo di macro e l'RPE dei tuoi ultimi 7 giorni per formulare una diagnosi brutale ma necessaria.</p>
        </div>
      )}

      {error && <div className="p-4 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-semibold">{error}</div>}

      {reportHtml && !loading && (
         <div className="bg-card border border-primary/30 p-8 rounded-2xl relative shadow-[0_0_50px_rgba(0,255,65,0.05)] text-gray-300 synapse-report">
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
            
            <button onClick={generateReport} className="mt-12 px-6 py-3 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition">
              Rigenera Analisi
            </button>
         </div>
      )}
    </div>
  )
}
