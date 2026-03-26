import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
L'utente (${profile.activity_level || 'Attivo'}, Età: ${profile.age || 25}) vuole allenare: ${targetMuscle}.
${extraInstruction}
Storico ultimi allenamenti e RPE: ${historyText}

REGOLA SOVRACCARICO PROGRESSIVO:
Se RPE basso (<7): suggerisci aumento carico/ripetizioni.
Se RPE alto (>8): mantieni o riduci leggermente.

Rispondi SOLO con JSON valido avente questa struttura:
{
  "titolo": "Titolo allenamento",
  "esercizi": [
    { "nome": "Nome Esercizio", "serie": "numero", "ripetizioni": "numero/range", "recupero": "secondi", "note_carico": "nota" }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    
    const resultText = completion.choices[0].message.content;
    const plan = JSON.parse(resultText);

    return Response.json(plan);
  } catch (error) {
    console.error("Groq AI Error:", error.message || error);
    return Response.json({ error: "Errore Groq: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}
