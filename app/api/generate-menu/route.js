import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { profile, voiceModification } = await req.json();
    
    let extraInstruction = '';
    if (voiceModification) {
      extraInstruction = `\nIMPORTANTE: L'utente ha richiesto la seguente modifica vocale al menù: "${voiceModification}". Tieni conto di questa richiesta nella generazione.\n`;
    }

    const prompt = `Sei un nutrizionista AI sportivo ("Synapse Professional"). 
Genera un piano alimentare settimanale (Lunedì-Domenica) per un utente con questi parametri:
- Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, Età: ${profile.age}
- Fabbisogno Stimato (TDEE): ${profile.tdee} kcal/giorno
- Target Macronutrienti: Proteine ~${profile.proteinTarget}g per pasto.
- Limite Zuccheri: Massimo ${profile.sugarLimit}g al giorno totali.
- Dieta: ${profile.dietType}
- Allergie/Intolleranze: ${profile.allergies || 'Nessuna'}
${extraInstruction}
Pasti richiesti ogni giorno: Colazione, Spuntino 1, Pranzo, Spuntino 2, Cena.

Rispondi esplicitamente restituendo SOLO un oggetto JSON valido. Usa la seguente esatta architettura per i dati (ripeti per tutti e 7 i giorni da Lunedì a Domenica):
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "nome pasto", "ingredienti": "lista ingredienti...", "istruzioni": "istruzioni...", "pro": 30, "cho": 40, "fat": 10, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 }
    ],
    "Martedì": [
      /* stessi 5 pasti */
    ],
    ...
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    
    const resultText = completion.choices[0].message.content;
    const menuData = JSON.parse(resultText);

    return Response.json(menuData);
  } catch (error) {
    console.error("Groq Generate Menu Error:", error.message || error);
    return Response.json({ error: "Errore Groq: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}
