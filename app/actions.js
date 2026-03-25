'use server'

import { toggleMealCompletion, updateWorkoutRpe, saveWorkout } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function toggleMeal(id) {
  toggleMealCompletion(id)
  revalidatePath('/')
}

export async function submitRpe(id, rpe) {
  updateWorkoutRpe(id, parseInt(rpe))
  revalidatePath('/')
}
