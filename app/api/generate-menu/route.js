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
    
    let extraInstruction = `\nREGOLA SULLE ALLERGIE, INTOLLERANZE E CIBI ODIATI: L'utente ha esplicitamente indicato: "${profile.allergies || 'Nessuna'}". NON DEVI ASSOLUTAMENTE e in nessun caso inserire questi cibi. Se l'utente dice 'solo questo o quello' (es. proteine solo uova e legumi) devi rispettarlo testualmente!\n`;
    
    if (voiceModification) {
      extraInstruction += `\nREGOLA CRITICA DEFINITIVA (MODIFICA VOCALE UTENTE): L'utente ha appena richiesto questa modifica o preferenza per questo menù: "${voiceModification}". Riadatta l'intero menù rispettando AL 100% questa richiesta. Ignora qualsiasi standard nutrizionale se va in conflitto con questa richiesta utente specifica.\n`;
    }

    const prompt = `Sei un Nutrizionista Clinico Sportivo AI letale, preciso e analitico ("Synapse Professional Clinic"). 
Il tuo calcolo deve essere IMPECCABILE. Devi generare un piano alimentare settimanale per un utente incrociando questi esatti e rigidissimi parametri anamnestici:

1. DATI BIOMETRICI E OBIETTIVO:
- Dati Base: ${profile.gender}, ${profile.age} anni, Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, % Grasso Stimata: ${profile.body_fat}%
- Obiettivo Fisico PRINCIPALE: ${profile.goal}
- Fabbisogno Calorico Giornaliero Calcolato (TDEE): ${profile.tdee} kcal/giorno. TUTTI i giorni devono avere un totale calorico in linea con il TDEE e l'obiettivo.

2. TARGET MACRONUTRIENTI (da sommare e bilanciare rigorosamente):
- Proteine: Tetto Massimo ~${profile.protein_target || 150}g/pasto (Dividile intelligentemente ma mantienile alte, specialmente post-workout).
- Zuccheri Max: ${profile.sugar_limit || 50}g/giorno (Controlla le quote dei carboidrati semplici).

3. SCELTE ALIMENTARI E DIVIETI:
- Indirizzo Dieta: ${profile.diet_type || 'Generica'}.
- Pasti Fuori Casa: L'utente dichiara "${profile.meals_out}". (Se mangia fuori 1-2 volte a settimana, etichetta uno o due pasti nel fine settimana come "Pasto Libero / Fuori Casa").
- Integrazione: "${profile.supplements || 'Nessuna'}". (Delinea quando assumere questi integratori nei pasti).
- Infortuni o Limitazioni: "${profile.injuries || 'Nessuna'}". Se presenti patologie o infortuni articolari, INSERISCI SPONTANEAMENTE alimenti anti-infiammatori (omega 3, zenzero, curcuma, frutti rossi).
${extraInstruction}

4. TIMING METABOLICO E PRE/POST ALLENAMENTO (FONDAMENTALE):
- Orari dei Pasti dell'utente: ${mealSchedule}.
- Orario del Workout: ${workoutTimeStr}.
- COMPRENDI: Calcola matematicamente quale di questi pasti è PRE-Workout (quello prima delle ${workoutTimeStr}) e quale è POST-Workout (quello dopo). Assicurati di allocare in proporzione più carboidrati veloci/medi attorno a queste finestre per la resintesi del glicogeno. Usa i grassi più lontano possibile dal workout.

REGOLE DI OUTPUT JSON (Nessuna tolleranza all'errore):
1. DEVI SCRIVERE UN ARRAY (lista []) PER I PASTI DI OGNI GIORNO E UN ARRAY PER LA LISTA_SPESA in puro formato JSON. Nessun backtick o markdown fuori dalle graffe interne.
2. OBBLIGO DEI 5 PASTI ESATTI GIONALIERI: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena", associativi per nome e orari utente.
3. NESSUNA ABBREVIAZIONE, JSON VALIDO AL 100%. Calcola i Macro (pro, cho, fat, zuccheri in grammi come interi).
4. La lista_spesa deve aggregare tutto. Le "istruzioni" di ogni pasto devono essere un Array di Stringhe. Se un pasto coincide con il Pre o Post workout, specificalo nel "titolo" (es: "Porridge Proteico (Pre-Workout)").

Rispondi SOLO con JSON. Struttura ESATTA da replicare stringa per stringa:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Porridge proteico ai frutti di bosco", "ingredienti": "Avena 50g, Proteine siero 30g, Lamponi 50g, Mandorle 10g", "istruzioni": ["Porta a ebollizione 200ml di acqua in un pentolino.", "Aggiungi 50g di avena e cuoci."], "pro": 35, "cho": 40, "fat": 12, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "...", "ingredienti": "...", "istruzioni": [...], "pro": 15, "cho": 20, "fat": 5, "zuccheri": 2 }
    ],
... tutti i 7 giorni ...
  },
  "lista_spesa": [
    { "categoria": "Cereali & Farinacei", "items": ["Avena 500g", "Riso Basmati 1kg", "Pane Integrale 400g"] },
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
