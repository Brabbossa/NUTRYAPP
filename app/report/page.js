'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { Activity, Brain, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ReportPage() {
  const { user, profile, triggerEasterEgg } = useUser()
  const [loading, setLoading] = useState(false)
  const [reportHtml, setReportHtml] = useState(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ workouts: 0 })

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoDate = sevenDaysAgo.toISOString();


      const { count: workoutsCount } = await supabase
        .from('workout_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', isoDate);

      setStats({ workouts: workoutsCount || 0 });
    }
    fetchStats();
  }, [user]);

  const generateReport = async () => {
    triggerEasterEgg();
    setLoading(true);
    setError('');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const isoDate = sevenDaysAgo.toISOString();


      const { data: workouts } = await supabase.from('workout_history').select('*').eq('user_id', user.id).gte('created_at', isoDate);

      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, workouts })
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
            <span className="bg-gradient-to-r from-[--color-primary] via-cyan-400 to-blue-500 bg-clip-text text-transparent">Synapse</span>
            <span className="text-white">Clinic</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Genera la tua valutazione clinica settimanale basata sui dati tracciati negli ultimi 7 giorni.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] p-6 rounded-[24px] flex flex-col items-center justify-center text-center shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <span className="text-4xl font-black text-white group-hover:text-[--color-primary] transition-colors">{stats.workouts}</span>
          <span className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">Workout Fatti</span>
        </div>
      </div>

      {!reportHtml && !loading && (
        <button onClick={generateReport} className="w-full bg-gradient-to-r from-[--color-primary] to-cyan-500 text-black font-black text-xl py-6 rounded-[24px] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300 active:scale-95 textShadow-sm">
          ANALIZZA LA MIA SETTIMANA
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <Activity className="text-[--color-primary] animate-pulse mb-4" size={48} />
          <h3 className="text-lg font-black text-white mb-2">Calcolo Diagnosi in Corso...</h3>
          <p className="text-sm text-gray-400 text-center max-w-sm">Synapse sta analizzando i volumi e l'RPE dei tuoi ultimi 7 giorni per formulare una diagnosi brutale ma necessaria.</p>
        </div>
      )}

      {error && <div className="p-4 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-semibold">{error}</div>}

      {reportHtml && !loading && (
         <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] p-8 rounded-[24px] relative shadow-[0_4px_24px_rgba(0,0,0,0.2)] text-gray-300 synapse-report">
            <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
            
            <button onClick={generateReport} className="mt-12 flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[--color-primary] to-cyan-500 text-black rounded-xl text-lg font-black shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:scale-[1.02] transition-all">
              <RefreshCw size={22} className="stroke-[3]" />
              Rigenera
            </button>
         </div>
      )}
    </div>
  )
}
