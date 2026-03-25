import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { profile, targetMuscle, workoutHistory, voiceModification } = await req.json();
    
    const historyText = workoutHistory && workoutHistory.length > 0
      ? JSON.stringify(workoutHistory.slice(-5))
      : 'Nessuno storico recente.';

    let extraInstruction = '';
    if (voiceModification) {
      extraInstruction = `\nIMPORTANTE: L'utente ha fatto questa richiesta vocale: "${voiceModification}". Adatta l'allenamento di conseguenza.\n`;
    }

    const prompt = `Sei un Personal Trainer AI ("Synapse Professional").
L'utente (${profile.activityLevel}, Età: ${profile.age}) vuole allenare: ${targetMuscle}.
${extraInstruction}
Storico ultimi allenamenti e RPE: ${historyText}

REGOLA SOVRACCARICO PROGRESSIVO:
Se RPE basso (<7): suggerisci aumento carico/ripetizioni.
Se RPE alto (>8): mantieni o riduci leggermente.

Rispondi SOLO con JSON valido:
{"titolo":"...","esercizi":[{"nome":"...","serie":"...","ripetizioni":"...","recupero":"...","note_carico":"..."}]}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    const plan = JSON.parse(result.response.text());

    return Response.json(plan);
  } catch (error) {
    console.error("Gemini AI Error:", error.message || error);
    return Response.json({ error: "Errore Gemini: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}
