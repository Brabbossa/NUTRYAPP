import { POST } from '../app/api/generate-menu/route.js';

async function test() {
  const req = {
    json: async () => ({
      profile: {
        gender: "Uomo",
        age: 30,
        weight: 80,
        height: 180,
        body_fat: 15,
        goal: "Ipertrofia Mantenimento",
        tdee: 2500,
        protein_target: 180,
        sugar_limit: 50,
        diet_type: "Nessuna restrizione",
        meals_out: "Solo il Sabato sera",
        allergies: "Nessuna",
        meal_times: {
          breakfast: "08:00",
          snack1: "11:00",
          lunch: "13:30",
          snack2: "17:00",
          dinner: "20:30"
        },
        workout_time: "18:30"
      }
    })
  };

  try {
    const res = await POST(req);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test error:", error);
  }
}

test();
