import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 60;

export async function POST(req) {
  try {
    const { profile, voiceModification } = await req.json();
    
    // Formatting meal times cleanly
    const t = profile.meal_times || {};
    const mealSchedule = `Colazione: ${t.breakfast || '08:00'}, Spuntino 1: ${t.snack1 || '10:30'}, Pranzo: ${t.lunch || '13:00'}, Spuntino 2: ${t.snack2 || '16:30'}, Cena: ${t.dinner || '20:00'}`;
    const workoutTimeStr = profile.workout_time || '18:00';
    
    let extraInstruction = `
[!!! DIRETTIVA DI SICUREZZA ALIMENTARE ASSOLUTA !!!]
L'utente ha esplicitamente indicato nel campo Allergie/Esclusioni: "${profile.allergies || 'Nessuna'}".
QUESTA REGOLA SOVRASCRIVE QUALSIASI ALTRA LOGICA. 
- Se l'utente scrive "proteine solo da uova e legumi", NON DEVI INSERIRE CARNE, NON DEVI INSERIRE TOFU, NON DEVI INSERIRE PESCE, NON DEVI INSERIRE YOGURT o SIERO (WHEY) a meno che non li tolleri. Solo uova e legumi. 
- Se ci sono cibi odiati o intolleranze, escludili spietatamente anche dalla lista della spesa.
- ATTENZIONE: Gli ingredienti che trovi nell'esempio JSON in basso (es. Avena, Proteine siero, Pollo) SONO SOLO ESEMPI DI FORMATTAZIONE. NON copiarli se contravvengono alle regole o ai divieti dell'utente!`;
    
    if (voiceModification) {
      extraInstruction += `\n[MODIFICA VOCALE UTENTE]: L'utente ha appena richiesto: "${voiceModification}". Riadatta l'intero menù rispettando AL 100% questa richiesta.\n`;
    }

    const prompt = `Sei un Nutrizionista Clinico Sportivo AI letale, preciso e analitico ("Synapse Professional Clinic"). 
Il tuo calcolo deve essere IMPECCABILE. Devi generare un piano alimentare settimanale per un utente incrociando questi esatti e rigidissimi parametri anamnestici:

1. DATI BIOMETRICI E OBIETTIVO:
- Dati Base: ${profile.gender}, ${profile.age} anni, Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, % Grasso Stimata: ${profile.body_fat}%
- Obiettivo Fisico PRINCIPALE: ${profile.goal}
- Fabbisogno Calorico (TDEE): ${profile.tdee} kcal/giorno.

2. TARGET MACRONUTRIENTI (bilanciati su 5 pasti al giorno):
- Proteine Max: ~${profile.protein_target || 150}g/pasto
- Zuccheri Max: ${profile.sugar_limit || 50}g/giorno

3. SCELTE ALIMENTARI E DIVIETI:
- Indirizzo Dieta: ${profile.diet_type || 'Generica'}.
- Pasti Fuori Casa: "${profile.meals_out}".
- Integrazione: "${profile.supplements || 'Nessuna'}". 
- Infortuni o Limitazioni: "${profile.injuries || 'Nessuna'}".
${extraInstruction}

4. TIMING METABOLICO E PRE/POST ALLENAMENTO (FONDAMENTALE):
- Orari dei Pasti dell'utente: ${mealSchedule}.
- Orario del Workout: ${workoutTimeStr}.
- COMPRENDI: Calcola quale pasto cade PRIMA e quale DOPO il workout, adattando le fonti di carboidrati e indicandolo nel "titolo".

REGOLE DI OUTPUT JSON (Nessuna tolleranza all'errore):
1. DEVI SCRIVERE UN ARRAY (lista []) PER I PASTI DI OGNI GIORNO E UN ARRAY PER LA LISTA_SPESA in puro formato JSON. Nessun backtick Markdown fuori dalle graffe.
2. OBBLIGO DEI 5 PASTI: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena".
3. L'Esempio JSON qui sotto usa cibi standard (es. Proteine siero, Lamponi). SE L'UTENTE HA VIETATO IL LATTOSIO O HA CHIESTO SOLO UOVA/LEGUMI, IGNORA L'ESEMPIO E USA CIBI COERENTI ALLE SUE REGOLE. NON USARE CIBI VIETATI.
4. Ogni "istruzioni" deve essere un Array di Stringhe.

Esempio Struttura ESATTA da replicare stringa per stringa (Sostituisci i cibi con quelli ammessi):
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Nome Ricetta Coerente con Regole", "ingredienti": "IngredienteA 50g, IngredienteB 30g", "istruzioni": ["Step 1.", "Step 2."], "pro": 35, "cho": 40, "fat": 12, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": [...], "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 }
    ],
... tutti i 7 giorni ...
  },
  "lista_spesa": [
    { "categoria": "Cereali & Farinacei", "items": ["Riso 1kg", "Farro 400g"] },
... tutte le categorie...
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1,
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
