'use client'

import { toggleMeal } from '../actions'
import { useState } from 'react'

export function MealCard({ meal, proteinTarget }) {
  const [loading, setLoading] = useState(false)
  const isCompleted = meal.completed === 1

  const mealMap = {
    'breakfast': { name: "Colazione", protein: proteinTarget * 0.2 },
    'snack1': { name: "Spuntino 1", protein: proteinTarget * 0.1 },
    'lunch': { name: "Pranzo", protein: proteinTarget * 0.3 },
    'snack2': { name: "Spuntino 2", protein: proteinTarget * 0.1 },
    'dinner': { name: "Cena", protein: proteinTarget * 0.3 }
  }

  const def = mealMap[meal.meal_type] || { name: meal.meal_type, protein: 0 }

  const handleToggle = async () => {
    setLoading(true)
    await toggleMeal(meal.id)
    setLoading(false)
  }

  return (
    <div 
      className={`meal-card ${isCompleted ? 'completed' : ''}`}
      onClick={handleToggle}
      style={{ opacity: loading ? 0.5 : 1 }}
    >
      <div className="meal-info">
        <h3>{def.name}</h3>
        <p>Target: ~{Math.round(def.protein)}g Proteine</p>
      </div>
      <div className="check-btn">
        {isCompleted ? '✓' : ''}
      </div>
    </div>
  )
}
