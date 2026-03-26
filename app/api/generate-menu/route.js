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
1. DEVI SCRIVERE UN ARRAY (lista []) PER I PASTI DI OGNI GIORNO E UN ARRAY PER LA LISTA_SPESA.
2. OBBLIGO DEI 5 PASTI: Per OGNI GIORNO genera ESATTAMENTE 5 pasti: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena". Totale: 35 pasti. Nessuna eccezione.
3. NESSUNA ABBREVIAZIONE: DEVI stampare l'intero JSON per ogni giorno e tutta l'intera lista della spesa.
4. ESTREMA VARIETÀ E GUSTO: Alterna fonti proteiche e carboidrati. Usa spezie ed erbe aromatiche.
5. ISTRUZIONI E SPESA: Il campo "istruzioni" DEVE essere un ARRAY DI STRINGHE con step numerati. Crea anche, esternamente al "menu", un campo "lista_spesa" che aggrega TUTTI gli ingredienti necessari per i 7 giorni, divisi per categorie.

Rispondi SOLO con JSON. Struttura ESATTA da replicare:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Porridge proteico ai frutti di bosco", "ingredienti": "Avena 50g, Proteine siero 30g, Lamponi 50g, Mandorle 10g", "istruzioni": ["Porta a ebollizione 200ml di acqua in un pentolino.", "Aggiungi 50g di fiocchi d'avena e cuoci a fuoco basso per 5 minuti mescolando spesso."], "pro": 35, "cho": 40, "fat": 12, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": ["Step 1...", "Step 2..."], "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 }
    ],
    "Martedì": [ ... ],
    "Mercoledì": [ ... ],
    "Giovedì": [ ... ],
    "Venerdì": [ ... ],
    "Sabato": [ ... ],
    "Domenica": [ ... ]
  },
  "lista_spesa": [
    { "categoria": "Cereali & Farinacei", "items": ["Avena 500g", "Riso Basmati 1kg", "Pane Integrale 400g"] },
    { "categoria": "Proteine Animali/Vegetali", "items": ["Petto di pollo 1.5kg", "Salmone 500g", "Tofu 400g"] },
    { "categoria": "Frutta & Verdura", "items": ["Banane 1kg", "Zucchine 2kg", "Spinaci 500g"] },
    { "categoria": "Grassi & Condimenti", "items": ["Olio EVO 1 bottiglia", "Burro d'arachidi 1 vasetto", "Mandorle 200g"] }
  ]
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
