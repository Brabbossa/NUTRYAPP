const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wzrsgutwbckxwugxsalq.supabase.co',
  'sb_publishable_PFrgEPXsAZ1LY-BEnseLNA__nkOH9hM'
);

async function run() {
  const userId = '30b5f2c8-7624-4595-93cc-f0783b78197d'; // Note: The user from earlier execute_sql query
  
  // 1. fetch profile
  const { data, error: fetchErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (fetchErr) {
    console.error('fetch err', fetchErr);
    return;
  }
  
  // 2. simulate the same manipulation
  const defaultProfile = {
    gender: 'Uomo', weight: 75, height: 180, age: 25, body_fat: 15, chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '',
    activity_level: 'Attivo', work_type: 'Studente/Scrivania', training_experience: 'Intermedio', goal: 'Ipertrofia',
    equipment: 'Palestra Completa', workout_duration: '60 min', workout_frequency: '3 giorni/settimana', injuries: '',
    tdee: 2500, protein_target: 150, sugar_limit: 50, water_target: 2.5, diet_type: 'Onnivoro', allergies: '', supplements: '',
    meals_out: 'Mai', meal_times: { breakfast: '08:00', snack1: '10:30', lunch: '13:00', snack2: '16:30', dinner: '20:00' },
    workout_time: '18:00'
  };

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null) cleanData[k] = '';
  });
  
  const profile = { ...defaultProfile, ...cleanData };

  // 3. simulate component change
  const formData = { ...profile };
  formData.protein_target = "150";
  formData.sugar_limit = "50";
  formData.diet_type = "Onnivoro";
  formData.tdee = 2500;

  // 4. simulate updateProfile
  const toSave = { ...formData };
  delete toSave.id;

  Object.keys(toSave).forEach(key => {
    if (toSave[key] === '') toSave[key] = null;
  });

  console.log("Saving payload:", toSave);

  const { error: updateErr } = await supabase.from('profiles').update(toSave).eq('id', userId);
  
  if (updateErr) {
    console.error("Update error:", updateErr);
  } else {
    console.log("Update success!");
  }
}

run();
