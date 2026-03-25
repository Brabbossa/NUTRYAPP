import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const maxDuration = 60; // Next.js API route maximum execution time in seconds (Vercel setting)

export async function POST(req) {
  try {
    const profile = await req.json();
    
    const prompt = `Sei un nutrizionista AI sportivo ("Synapse Professional"). 
Genera un piano alimentare settimanale (Lunedì-Domenica) per un utente con questi parametri:
- Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, Età: ${profile.age}
- Fabbisogno Stimato (TDEE): ${profile.tdee} kcal/giorno
- Target Macronutrienti: Proteine ~${profile.proteinTarget}g per pasto.
- Limite Zuccheri: Massimo ${profile.sugarLimit}g al giorno totali.
- Dieta: ${profile.dietType}
- Allergie/Intolleranze: ${profile.allergies || 'Nessuna'}

Pasti richiesti ogni giorno: Colazione, Spuntino 1, Pranzo, Spuntino 2, Cena.

Devi fornire la risposta ESCLUSIVAMENTE come JSON puro (nessun testo markdown) rispettando RIGOROSAMENTE questa struttura per tutti e 7 i giorni:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "nome ricetta", "ingredienti": "...", "istruzioni": "...", "pro": 30, "cho": 40, "fat": 10, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 },
      ...
    ],
    "Martedì": [ ... ]
  }
}
Sii professionale ma motivante. Assicurati che il totale giornaliero delle proteine sia in linea con il target e i grassi siano equilibrati.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    const menuData = JSON.parse(resultText);

    return Response.json(menuData);
  } catch (error) {
    console.error("Gemini Generate Menu Error:", error);
    return Response.json({ error: "Errore durante la generazione del menu." }, { status: 500 });
  }
}
