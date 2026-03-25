const cron = require('node-cron');
const { getUserProfile, getTodayMeals } = require('./lib/db');
require('dotenv').config({ path: '.env.local' });

const NTFY_TOPIC = process.env.NTFY_TOPIC || 'synapse_brother_2026_fitness';

// Helper to format date as YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

async function sendNotification(title, message) {
  console.log(`Sending Push Notification: ${title} - ${message}`);
  try {
    const response = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      body: message,
      headers: {
        "Title": title,
        "Tags": "muscle"
      }
    });
    if (!response.ok) {
      console.error("ntfy error:", response.statusText);
    }
  } catch (error) {
    console.error("failed to send notification", error);
  }
}

// Run every minute
cron.schedule('* * * * *', () => {
  console.log("[Worker] Checking times for notifications...");
  
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  
  const profile = getUserProfile();
  if (!profile) return;

  const todayStr = getTodayDateString();
  const meals = getTodayMeals(todayStr); // Initializes if empty

  const mealMap = {
    'breakfast': { time: profile.breakfast_time, name: "Colazione", protein: profile.protein_target * 0.2 },
    'snack1': { time: profile.snack1_time, name: "Spuntino 1", protein: profile.protein_target * 0.1 },
    'lunch': { time: profile.lunch_time, name: "Pranzo", protein: profile.protein_target * 0.3 },
    'snack2': { time: profile.snack2_time, name: "Spuntino 2", protein: profile.protein_target * 0.1 },
    'dinner': { time: profile.dinner_time, name: "Cena", protein: profile.protein_target * 0.3 }
  };

  // Check Meals
  for (const meal of meals) {
    const mealDef = mealMap[meal.meal_type];
    if (mealDef && mealDef.time === currentTime && !meal.completed) {
      sendNotification(
        "Synapse AI: È ora di mangiare!",
        `${mealDef.name} è previsto per ora. Obiettivo Proteine: ~${Math.round(mealDef.protein)}g`
      );
    }
  }

  // Check Workout
  if (profile.workout_time === currentTime) {
    sendNotification(
      "Synapse AI: Let's Work Out! 💪",
      `È l'ora dell'allenamento. Apri l'app per vedere il generatore.`
    );
  }
});

console.log(`[Worker] Started node-cron. Listening on NTFY_TOPIC: ${NTFY_TOPIC}`);
