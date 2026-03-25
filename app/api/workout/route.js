import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveWorkout, getLatestWorkout, getUserProfile } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { targetMuscle } = await req.json();
    const profile = getUserProfile();
    const lastWorkout = getLatestWorkout();
    
    let context = `L'utente vuole allenare: ${targetMuscle}.`;
    if (lastWorkout && lastWorkout.rpe) {
      context += ` L'ultimo allenamento ha avuto un RPE (sforzo percepito da 1 a 10) di ${lastWorkout.rpe}. In base a questo, se l'RPE era alto (>8), rendi l'allenamento di oggi leggermente più facile in termini di volume. Se era basso (<6), aumenta l'intensità o il volume.`;
    }

    const prompt = `Sei un esperto personal trainer AI ("Synapse AI"). 
Genera un breve allenamento (max 5 esercizi) basato su questo contesto: ${context}
Formato richiesto: solo elenco puntato degli esercizi con serie e ripetizioni, senza introduzioni o saluti. Mantieni un tono motivazionale e diretto (stile 'Dark Fitness').`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const plan = result.response.text();

    const date = new Date().toISOString().split('T')[0];
    saveWorkout(date, plan, null); // saving without RPE yet

    return Response.json({ plan, date });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return Response.json({ error: "Failed to generate workout", details: error.message }, { status: 500 });
  }
}
