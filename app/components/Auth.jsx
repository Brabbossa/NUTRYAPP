'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (!isLogin && data.user) {
      // Signup success
      alert('Registrazione completata! Ora puoi fare il login.');
      setIsLogin(true);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark p-4">
      <div className="w-full max-w-md bg-card border border-muted p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2 uppercase tracking-tighter text-white">
          <span className="text-primary block mb-1 tracking-widest text-sm">Welcome to</span>
          Synapse <span className="text-primary">Clinic</span>
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Accedi per salvare i tuoi progressi nel Cloud e ottenere Report AI personalizzati.</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark border border-muted rounded-xl p-3 text-white outline-none focus:border-primary transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark border border-muted rounded-xl p-3 text-white outline-none focus:border-primary transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-dark font-bold px-4 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Attendere...' : isLogin ? 'ENTRA' : 'REGISTRATI'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-gray-400 hover:text-white text-sm underline underline-offset-4"
          >
            {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Entra"}
          </button>
        </div>
      </div>
    </div>
  );
}
