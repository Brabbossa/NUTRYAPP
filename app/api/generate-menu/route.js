import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

Rispondi SOLO con JSON valido con questa struttura:
{"menu":{"Lunedì":[{"nome_pasto":"Colazione","titolo":"...","ingredienti":"...","istruzioni":"...","pro":30,"cho":40,"fat":10,"zuccheri":5}],"Martedì":[...],"Mercoledì":[...],"Giovedì":[...],"Venerdì":[...],"Sabato":[...],"Domenica":[...]}}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    const menuData = JSON.parse(resultText);

    return Response.json(menuData);
  } catch (error) {
    console.error("Gemini Generate Menu Error:", error.message || error);
    return Response.json({ error: "Errore Gemini: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}
