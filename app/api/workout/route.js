import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { profile, targetMuscle, workoutHistory } = await req.json();
    
    const historyText = workoutHistory && workoutHistory.length > 0
      ? JSON.stringify(workoutHistory.slice(-5)) // last 5 for context
      : 'Nessuno storico recente.';

    const prompt = `Sei un Personal Trainer AI ("Synapse Professional").
L'utente (${profile.activityLevel}, Età: ${profile.age}) vuole allenare il seguente gruppo muscolare: ${targetMuscle}.

Storico ultimi allenamenti salvati e relativi RPE (sforzo percepito 1-10): 
${historyText}

REGOLA SOVRACCARICO PROGRESSIVO:
Se l'utente ha fatto questo stesso gruppo muscolare di recente e l'RPE era basso (<7), devi suggerire un lieve aumento di carico o ripetizioni (Sovraccarico).
Se l'RPE era alto (>8), mantieni il carico o indica un leggero scarico tecnico.

Formato:
Rispondi ESCLUSIVAMENTE con un JSON puro che rispetta questa struttura:
{
  "titolo": "Titolo motivante dell'allenamento",
  "esercizi": [
    { "nome": "Nome esercizio", "serie": "numero", "ripetizioni": "numero/range", "recupero": "secondi", "note_carico": "suggerimento carico" },
    ...
  ]
}

Non includere commenti o markdown extra.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    const plan = JSON.parse(result.response.text());

    return Response.json(plan);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return Response.json({ error: "Failed to generate workout" }, { status: 500 });
  }
}
