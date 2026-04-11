'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Auth } from '../components/Auth';
import { Loader2 } from 'lucide-react';

const UserContext = createContext();

const defaultProfile = {
  gender: 'Uomo',
  weight: 75,
  height: 180,
  age: 25,
  body_fat: 15,
  chest_cm: '',
  waist_cm: '',
  hips_cm: '',
  thighs_cm: '',
  activity_level: 'Attivo',
  work_type: 'Studente/Scrivania',
  training_experience: 'Intermedio',
  goal: 'Ipertrofia',
  equipment: 'Palestra Completa',
  workout_duration: '60 min',
  workout_frequency: '3 giorni/settimana',
  injuries: '',
  workout_time: '18:00'
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const triggerEasterEgg = () => {
    console.log('UserContext: triggerEasterEgg called');
    setIsGeneratingAI(true);
    setTimeout(() => {
      console.log('UserContext: resetting isGeneratingAI to false');
      setIsGeneratingAI(false);
    }, 3500); // 3.5 seconds to cover the 3s animation + some buffer
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoaded(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(defaultProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      if (data) {
        // Formatta campi snake_case a camelCase dove serve o mantienili
        // Mappiamo i null a stringa vuota per non craschare gli input controllati, e non li scartiamo più
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        Object.keys(cleanData).forEach(k => {
          if (cleanData[k] === null) {
            if (defaultProfile[k] && typeof defaultProfile[k] === 'object') {
              cleanData[k] = defaultProfile[k];
            } else {
              cleanData[k] = '';
            }
          }
        });
        setProfile({ ...defaultProfile, ...cleanData });
      } else {
        // Inserisci default se non c'è
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId, ...defaultProfile }])
          .select()
          .single();
          
        if (newProfile) setProfile(newProfile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateProfile = async (newProfile) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    if (user) {
      // Rimuovi campi che Supabase non accetta (come created_at generati automaticamente)
      const toSave = { ...newProfile };
      delete toSave.id; // Non sovrascrivere la PK
      
      const numericFields = ['weight', 'height', 'age', 'body_fat'];
      
      // Mappa stringhe vuote a null per evitare errori Supabase su campi numerici
      Object.keys(toSave).forEach(key => {
        if (toSave[key] === '') {
          toSave[key] = null;
        } else if (numericFields.includes(key) && typeof toSave[key] === 'string') {
          toSave[key] = toSave[key].replace(',', '.');
        }
      });

      const { error } = await supabase
        .from('profiles')
        .update(toSave)
        .eq('id', user.id);
      
      if (error) {
        console.error('Errore salvataggio profilo Supabase:', error);
      }
    }
  };

  const saveWorkout = async (workout) => {
    if (!user) return;
    
    // Save to state for instant UI update
    setWorkoutHistory(prev => [...prev, workout]);

    // Save to Supabase
    await supabase.from('workout_history').insert([{
      user_id: user.id,
      date: new Date().toISOString(),
      target: workout.target,
      plan: workout.plan,
      rpe: workout.rpe
    }]);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const resetAllData = async () => {
    if (!user) return;
    
    // 1. Reset DB: Delete all history for this user
    const { error: errWorkouts } = await supabase.from('workout_history').delete().eq('user_id', user.id);
    if (errWorkouts) {
      console.error('Errore delete workouts:', errWorkouts);
      throw new Error('Impossibile cancellare i workout: ' + errWorkouts.message);
    }
    
    // 2. Reset Profile to minimum defaults on DB
    const minProfile = {
      weight: null, height: null, age: null, body_fat: null,
      gender: 'Uomo', chest_cm: null, waist_cm: null, hips_cm: null, thighs_cm: null,
      work_type: 'Studente/Scrivania', training_experience: 'Intermedio', goal: 'Ipertrofia',
      equipment: 'Palestra Completa', workout_duration: '60 min', workout_frequency: '3 giorni/settimana',
      injuries: null
    };
    const { error: errProfile } = await supabase.from('profiles').update(minProfile).eq('id', user.id);
    if (errProfile) {
      console.error('Errore reset profile:', errProfile);
      throw new Error('Impossibile resettare il profilo: ' + errProfile.message);
    }

    // 3. Clear Local State
    setProfile(minProfile);
    setWorkoutHistory([]);
  };

  return (
    <UserContext.Provider value={{ 
      user, profile, updateProfile, 
      workoutHistory, setWorkoutHistory, 
      saveWorkout, resetAllData,
      isGeneratingAI, triggerEasterEgg
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
