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
  tdee: 2500,
  protein_target: 150,
  sugar_limit: 50,
  water_target: 2.5,
  diet_type: 'Onnivoro',
  allergies: '',
  supplements: '',
  meals_out: 'Mai',
  meal_times: {
    breakfast: '08:00',
    snack1: '10:30',
    lunch: '13:00',
    snack2: '16:30',
    dinner: '20:00'
  },
  workout_time: '18:00'
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Sync menu to localstorage so it persists per device
  useEffect(() => {
    if (isLoaded) {
      if (weeklyMenu) {
        localStorage.setItem('synapse_menu', JSON.stringify(weeklyMenu));
      } else {
        const savedMenu = localStorage.getItem('synapse_menu');
        if (savedMenu) setWeeklyMenu(JSON.parse(savedMenu));
      }
    }
  }, [weeklyMenu, isLoaded]);

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
        // Filtriamo i valori null per evitare che sovrascrivano il defaultProfile
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
        );
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
      await supabase
        .from('profiles')
        .update(newProfile)
        .eq('id', user.id);
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

  return (
    <UserContext.Provider value={{ user, profile, updateProfile, weeklyMenu, setWeeklyMenu, workoutHistory, setWorkoutHistory, saveWorkout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
