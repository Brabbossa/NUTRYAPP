import Groq from 'groq-sdk';
import { batchSearchFoods } from '../../lib/searchFood.js';

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
- Se ci sono cibi odiati o intolleranze, escludili spietatamente.
`;
    
    if (voiceModification) {
      extraInstruction += `\n[MODIFICA VOCALE UTENTE]: L'utente ha appena richiesto: "${voiceModification}". Riadatta la scelta degli ingredienti rispettando AL 100% questa richiesta.\n`;
    }

    const basePrompt = `Sei un Nutrizionista Clinico Sportivo AI letale, preciso e analitico ("Synapse Professional Clinic"). 
Devi pianificare gli INGREDIENTI per un menù settimanale (5 pasti al giorno) basato sui seguenti parametri:

1. Dati Biometrici: ${profile.gender}, ${profile.age} anni, Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, % Grasso Stimata: ${profile.body_fat}%
2. Obiettivo: ${profile.goal}. Fabbisogno Calorico: ${profile.tdee} kcal/giorno.
3. Allergie e Divieti: ${profile.allergies || 'Nessuna'}. ${extraInstruction}

PASSO 1: Analizza le regole e decidi quali ingredienti ti servono per l'intera settimana.
DEVI CHIAMARE IL TOOL 'search_crea_database' passandogli un array di TUTTI i nomi degli ingredienti che intendi usare (almeno 15-20 ingredienti diversi come 'Petto di pollo', 'Riso Basmati', 'Avena', 'Mandorle', 'Mela', 'Olio extravergine di oliva').
Non emettere nient'altro, chiama solo il tool!`;

    const tools = [
      {
        type: "function",
        function: {
          name: "search_crea_database",
          description: "Cerca un elenco di cibi nel database nutrizionale italiano CREA per ottenerne macro e calorie esatti per 100g.",
          parameters: {
            type: "object",
            properties: {
              queries: {
                type: "array",
                items: { type: "string" },
                description: "Elenco dei nomi di cibi base da inserire nella dieta (es. ['Petto di pollo', 'Riso Basmati', 'Avena', 'Olio extravergine di oliva'])"
              }
            },
            required: ["queries"]
          }
        }
      }
    ];

    const messages = [
      { role: "user", content: basePrompt }
    ];

    // --- TURN 1: Force Tool Calling ---
    const toolCallCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      tools: tools,
      tool_choice: { type: "function", function: { name: "search_crea_database" } },
      temperature: 0.1,
      max_tokens: 1500
    });

    const assistantMsg = toolCallCompletion.choices[0].message;
    messages.push(assistantMsg);

    let dbResult = [];
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      const toolCall = assistantMsg.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      console.log("[GROQ] Ingredienti richiesti dall'AI:", args.queries);
      
      // Esegui la ricerca nel DB locale!
      dbResult = batchSearchFoods(args.queries);
      console.log("[GROQ] Trovati nel DB:", dbResult.filter(r => !r.error).map(r => r.name));

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(dbResult)
      });
    }

    // --- TURN 2: Final JSON Generation ---
    const finalPrompt = `Ottimo. Ora hai i valori nutrizionali ESATTI PER 100g dei cibi disponibili nel database.
ATTENZIONE: Se per un ingrediente c'è scritto 'NON_TROVATO', NON PUOI USARLO. Devi ripiegare su altri cibi trovati o comuni (es. 'Petto di pollo' invece di 'Pollo ruspante').

ORA, DEVI RISPONDERE IN PURO FORMATO JSON. Nessun backtick fuori dalle graffe.
Il tuo calcolo matematico deve essere perfetto. Se usi 50g di avena, i macros sono (Valore per 100g) / 2.
Distribuisci su 7 giorni (Lunedì-Domenica), 5 pasti al giorno: "Colazione", "Spuntino 1", "Pranzo", "Spuntino 2", "Cena".

Struttura JSON ESATTA richiesta:
{
  "menu": {
    "Lunedì": [
      { "nome_pasto": "Colazione", "titolo": "Porridge di Avena", "ingredienti": "Fiocchi d'avena 50g, Latte 150ml", "istruzioni": ["Mischia.", "Scalda."], "pro": 12, "cho": 35, "fat": 5, "zuccheri": 5 },
      { "nome_pasto": "Spuntino 1", "titolo": "Mela", "ingredienti": "Mela, con buccia 150g", "istruzioni": ["Taglia a fette."], "pro": 0.5, "cho": 20, "fat": 0.3, "zuccheri": 18 }
    ]
  },
  "lista_spesa": [
    { "categoria": "Cereali & Farinacei", "items": ["Fiocchi d'avena 500g"] }
  ]
}`;

    messages.push({ role: "system", content: finalPrompt });

    const finalCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 16000
    });
    
    const resultText = finalCompletion.choices[0].message.content;
    const menuData = JSON.parse(resultText);

    return Response.json(menuData);
  } catch (error) {
    console.error("Groq Generate Menu ToolCall Error:", error.message || error);
    return Response.json({ error: "Errore Groq: " + (error.message || "Sconosciuto") }, { status: 500 });
  }
}

