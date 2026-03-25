import { getUserProfile, getTodayMeals, getLatestWorkout } from '@/lib/db'
import { MealCard } from './components/MealCard'
import { WorkoutGenerator } from './components/WorkoutGenerator'

export default async function Home() {
  const profile = getUserProfile()
  const today = new Date().toISOString().split('T')[0]
  const meals = getTodayMeals(today)
  const latestWorkout = getLatestWorkout()
  
  // Calculate Progress
  const completedMeals = meals.filter(m => m.completed === 1)
  const proteinAchieved = completedMeals.reduce((acc, current) => {
    let p = 0;
    if (current.meal_type === 'breakfast') p = profile.protein_target * 0.2;
    if (current.meal_type === 'snack1') p = profile.protein_target * 0.1;
    if (current.meal_type === 'lunch') p = profile.protein_target * 0.3;
    if (current.meal_type === 'snack2') p = profile.protein_target * 0.1;
    if (current.meal_type === 'dinner') p = profile.protein_target * 0.3;
    return acc + p;
  }, 0)
  
  const proteinPercent = Math.min(100, Math.round((proteinAchieved / profile.protein_target) * 100))
  // For sugars, we just fake an estimation for now based on meals, or just keep it simple
  const sugarPercent = Math.min(100, Math.round((completedMeals.length / 5) * 80)) 

  // Check if today's workout is active
  const isWorkoutToday = latestWorkout && latestWorkout.date === today;

  return (
    <main className="dash-sections">
      <header className="header">
        <h1 className="title">Synapse <span>AI</span></h1>
      </header>

      <section>
        <h2 className="section-title">Daily Progress</h2>
        <div className="progress-widgets">
          <div className="widget">
            <div className="widget-label">Proteine ({Math.round(proteinAchieved)}/{profile.protein_target}g)</div>
            <div className="widget-value">{proteinPercent}%</div>
          </div>
          <div className="widget" style={{ borderColor: sugarPercent > 80 ? '#ef4444' : 'var(--border-subtle)' }}>
            <div className="widget-label">Zuccheri Residui</div>
            <div className="widget-value" style={{ color: sugarPercent > 80 ? '#ef4444' : 'var(--text-primary)' }}>
              {Math.max(0, 100 - sugarPercent)}%
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Pasti</h2>
        <div className="meal-list">
          {meals.map(meal => (
            <MealCard key={meal.id} meal={meal} proteinTarget={profile.protein_target} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Allenamento</h2>
        <WorkoutGenerator initialWorkout={isWorkoutToday ? latestWorkout : null} />
      </section>

    </main>
  )
}
