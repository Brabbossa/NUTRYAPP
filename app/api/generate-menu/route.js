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
- Target Macronutrienti: Proteine ~${profile.protein_target || 150}g per pasto.
- Limite Zuccheri: Massimo ${profile.sugar_limit || 50}g al giorno totali.
- Dieta: ${profile.diet_type || 'Generica'}
- Allergie/Intolleranze: ${profile.allergies || 'Nessuna'}
${extraInstruction}

REGOLE FONDAMENTALI:
1. DEVI SCRIVERE UN ARRAY (lista []) PER I PASTI DI OGNI GIORNO, NON UN OGGETTO.
2. OBBLIGO DEI 5 PASTI: Per OGNI GIORNO genera ESATTAMENTE 5 pasti: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena". Totale: 35 pasti. Nessuna eccezione.
3. NESSUNA ABBREVIAZIONE: DEVI stampare l'intero JSON per ogni giorno. Niente "...".
4. ESTREMA VARIETÀ E GUSTO: Alterna fonti proteiche e carboidrati. Usa spezie ed erbe aromatiche.
5. ISTRUZIONI DETTAGLIATE: Il campo "istruzioni" DEVE essere un ARRAY DI STRINGHE con step numerati e dettagliati. Ogni step deve specificare tempi di cottura, temperature, tecniche precise (es. "Scalda una padella antiaderente a fuoco medio-alto per 2 minuti"). Minimo 3 step per pasto principale, minimo 2 per spuntini.

Rispondi SOLO con JSON. Struttura ESATTA da replicare per TUTTI i 7 giorni:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Porridge proteico ai frutti di bosco", "ingredienti": "Avena 50g, Proteine siero 30g, Lamponi 50g, Mandorle 10g", "istruzioni": ["Porta a ebollizione 200ml di acqua in un pentolino.", "Aggiungi 50g di fiocchi d'avena e cuoci a fuoco basso per 5 minuti mescolando spesso.", "Togli dal fuoco, lascia intiepidire 1 minuto e amalgama 30g di proteine in polvere.", "Versa nella ciotola, guarnisci con lamponi freschi e mandorle a lamelle."], "pro": 35, "cho": 40, "fat": 12, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": ["Step 1...", "Step 2..."], "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 },
      { "nome_pasto": "Pranzo", "titolo": "...", "ingredienti": "...", "istruzioni": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."], "pro": 30, "cho": 50, "fat": 15, "zuccheri": 3 },
      { "nome_pasto": "Spuntino 2", "titolo": "...", "ingredienti": "...", "istruzioni": ["Step 1...", "Step 2..."], "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 },
      { "nome_pasto": "Cena", "titolo": "...", "ingredienti": "...", "istruzioni": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."], "pro": 35, "cho": 40, "fat": 15, "zuccheri": 3 }
    ],
    "Martedì": [ ... tutti e 5 i pasti completi ... ],
    "Mercoledì": [ ... ],
    "Giovedì": [ ... ],
    "Venerdì": [ ... ],
    "Sabato": [ ... ],
    "Domenica": [ ... ]
  }
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      max_tokens: 16000
    });
    
    const resultText = completion.choices[0].message.content;
    const menuData = JSON.parse(resultText);

    return Response.json(menuData);
  } catch (error) {
    console.error("Groq Generate Menu Error:", error.message || error);
    return Response.json({ error: "Errore Groq: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}
