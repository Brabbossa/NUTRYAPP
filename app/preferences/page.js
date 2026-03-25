'use client'

import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { Save } from 'lucide-react'

export default function PreferencesPage() {
  const { profile, updateProfile } = useUser()
  const [formData, setFormData] = useState(profile)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setFormData(profile)
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

  const calculateTDEE = (data) => {
    const { weight, height, age, activityLevel } = data
    // Base BMR (Mifflin-St Jeor Unisex approximation)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    
    const multipliers = {
      'Sedentario': 1.2,
      'Leggero': 1.375,
      'Moderato': 1.55,
      'Attivo': 1.725,
      'Atleta': 1.9
    }
    const multiplier = multipliers[activityLevel] || 1.55
    return Math.round(bmr * multiplier)
  }

  const handleSave = () => {
    const tdee = calculateTDEE(formData)
    const updated = { ...formData, tdee }
    updateProfile(updated)
    setToast('Preferenze Salvate! TDEE Aggiornato.')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-muted pb-4">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary text-dark font-bold px-4 py-2 rounded-lg hover:bg-opacity-80 transition"
        >
          <Save size={18} /> Salva
        </button>
      </div>

      {toast && (
        <div className="bg-primary/20 text-primary p-3 rounded-lg border border-primary text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Dati Corporei */}
      <section className="bg-card p-6 rounded-2xl border border-muted space-y-4">
        <h2 className="text-xl font-semibold text-primary">Dati Corporei</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Peso (kg)</label>
            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Altezza (cm)</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Età</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">% Grasso</label>
            <input type="number" name="bodyFat" value={formData.bodyFat} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Livello Attività</label>
          <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary">
            <option value="Sedentario">Sedentario</option>
            <option value="Leggero">Leggero</option>
            <option value="Moderato">Moderato</option>
            <option value="Attivo">Attivo</option>
            <option value="Atleta">Atleta</option>
          </select>
        </div>
        <div className="pt-4 border-t border-muted">
          <p className="text-sm text-gray-400">TDEE Calcolato (Fabbisogno Calorico)</p>
          <p className="text-3xl font-bold text-primary">{formData.tdee} <span className="text-lg text-gray-400">kcal/giorno</span></p>
        </div>
      </section>

      {/* Target Nutrizionali & Restrizioni */}
      <section className="bg-card p-6 rounded-2xl border border-muted space-y-4">
        <h2 className="text-xl font-semibold text-primary">Target & Dieta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Proteine (g / pasto)</label>
            <input type="number" name="proteinTarget" value={formData.proteinTarget} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Limite Zuccheri (g totali)</label>
            <input type="number" name="sugarLimit" value={formData.sugarLimit} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo Dieta</label>
            <select name="dietType" value={formData.dietType} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary">
              <option value="Onnivoro">Onnivoro</option>
              <option value="Vegetariano">Vegetariano</option>
              <option value="Vegan">Vegan</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Allergie / Intolleranze</label>
            <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Es. Lattosio, Glutine" className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
        </div>
      </section>

      {/* Orari Notifiche */}
      <section className="bg-card p-6 rounded-2xl border border-muted space-y-4">
        <h2 className="text-xl font-semibold text-primary">Orari Notifiche</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Colazione</label>
            <input type="time" name="mealTimes.breakfast" value={formData.mealTimes?.breakfast || '08:00'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Spuntino 1</label>
            <input type="time" name="mealTimes.snack1" value={formData.mealTimes?.snack1 || '10:30'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pranzo</label>
            <input type="time" name="mealTimes.lunch" value={formData.mealTimes?.lunch || '13:00'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Spuntino 2</label>
            <input type="time" name="mealTimes.snack2" value={formData.mealTimes?.snack2 || '16:30'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cena</label>
            <input type="time" name="mealTimes.dinner" value={formData.mealTimes?.dinner || '20:00'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 text-primary">Workout</label>
            <input type="time" name="workoutTime" value={formData.workoutTime || '18:00'} onChange={handleChange} className="w-full bg-dark border border-muted rounded p-2 text-white outline-none focus:border-primary" />
          </div>
        </div>
      </section>
    </div>
  )
}
