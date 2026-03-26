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

    const prompt = `Sei un nutrizionista AI sportivo e Chef di altissimo livello ("Synapse Professional"). 
Genera un piano alimentare settimanale (da Lunedì a Domenica) per un utente con questi parametri:
- Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, Età: ${profile.age}
- Fabbisogno Stimato (TDEE): ${profile.tdee} kcal/giorno
- Target Macronutrienti: Proteine ~${profile.proteinTarget}g per pasto.
- Limite Zuccheri: Massimo ${profile.sugarLimit}g al giorno totali.
- Dieta: ${profile.dietType}
- Allergie/Intolleranze: ${profile.allergies || 'Nessuna'}
${extraInstruction}

REGOLE FONDAMENTALI:
1. OBBLIGO DEI 5 PASTI: Per OGNI SINGOLO GIORNO della settimana devi generare ESATTAMENTE 5 pasti: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena". Totale: 35 pasti esatti. Nessuna eccezione.
2. NESSUNA ABBREVIAZIONE: Il modello matematico fallirà se usi abbreviazioni, puntini di sospensione (...) o frasi come "stessi 5 pasti". DEVI stampare l'intero JSON array per ogni giorno di tutti i 7 giorni.
3. ESTREMA VARIETÀ E GUSTO: Ispira le ricette a menù salutari, deliziosi e vari. Non ripetere gli stessi alimenti di continuo; alterna fonti proteiche (pollo, pesce, tofu, uova, legumi, vitello magro) e carboidrati (riso basmati, quinoa, patate dolci, pasta integrale, avena). Usa spezie ed erbe aromatiche nelle descrizioni.

Rispondi RESTITUENDO SOLO UN OGGETTO JSON. Esempio della struttura che DEVI replicare da Lunedì a Domenica coprendo tutti e 5 i pasti ogni giorno:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Porridge proteico ai frutti di bosco e mandorle", "ingredienti": "Avena 50g, Proteine siero 30g, Lamponi 50g, Mandorle 10g", "istruzioni": "Cuocere l'avena, a fuoco spento amalgamare le proteine. Guarnire con lamponi e mandorle.", "pro": 35, "cho": 40, "fat": 12, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 },
      { "nome_pasto": "Pranzo", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 30, "cho": 50, "fat": 15, "zuccheri": 3 },
      { "nome_pasto": "Spuntino 2", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 },
      { "nome_pasto": "Cena", "titolo": "...", "ingredienti": "...", "istruzioni": "...", "pro": 35, "cho": 40, "fat": 15, "zuccheri": 3 }
    ],
    "Martedì": [
      // ... devi scrivere tutti e 5 i pasti completi per Martedì ...
    ]
    // ... prosegui Scrivendo tutto fino alla Domenica compresa ...
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
