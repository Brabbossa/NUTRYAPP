'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

const defaultProfile = {
  weight: 75,
  height: 180,
  age: 25,
  bodyFat: 15,
  activityLevel: 'Active',
  tdee: 2500,
  proteinTarget: 150,
  sugarLimit: 50,
  dietType: 'Onnivoro',
  allergies: '',
  mealTimes: {
    breakfast: '08:00',
    snack1: '10:30',
    lunch: '13:00',
    snack2: '16:30',
    dinner: '20:00'
  },
  workoutTime: '18:00'
};

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('synapse_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedMenu = localStorage.getItem('synapse_menu');
      if (savedMenu) setWeeklyMenu(JSON.parse(savedMenu));

      const savedWorkouts = localStorage.getItem('synapse_workouts');
      if (savedWorkouts) setWorkoutHistory(JSON.parse(savedWorkouts));
    } catch (e) {
      console.error("Error loading state", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('synapse_profile', JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  useEffect(() => {
    if (isLoaded && weeklyMenu) {
      localStorage.setItem('synapse_menu', JSON.stringify(weeklyMenu));
    }
  }, [weeklyMenu, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('synapse_workouts', JSON.stringify(workoutHistory));
    }
  }, [workoutHistory, isLoaded]);

  const saveWorkout = (workout) => {
    setWorkoutHistory(prev => [...prev, workout]);
  };

  const updateProfile = (newProfile) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <UserContext.Provider value={{ profile, updateProfile, weeklyMenu, setWeeklyMenu, workoutHistory, saveWorkout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
