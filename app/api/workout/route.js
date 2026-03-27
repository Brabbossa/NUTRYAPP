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
      extraInstruction = `\nREGOLA CRITICA DEFINITIVA (MODIFICA UTENTE): L'utente ha fatto questa precisissima richiesta: "${voiceModification}". DEVI ADATTARTI AL 100% A QUESTA RICHIESTA. Se chiede di evitare un esercizio, eliminalo. Se chiede una tecnica specifica, usala.\n`;
    }

    const prompt = `Ruolo: Agisci come un Personal Trainer esperto in programmazione dell'allenamento e analisi dei dati ("Synapse Professional"). Il tuo obiettivo è generare schede di allenamento "ad hoc" che siano sicure, efficaci e strettamente personalizzate.

Fonte dei Dati (Sorgente di Verità - Profilo Utente):
- Obiettivo Principale: ${profile.goal || 'Generico'}
- Livello di Esperienza: ${profile.training_experience || 'Intermedio'}
- Attrezzatura Disponibile: ${profile.equipment || 'Palestra Completa'}
- Disponibilità di Tempo: ${profile.workout_duration || '60 min'} (Frequenza: ${profile.workout_frequency || '3 gg/sett'})
- Limitazioni Fisiche/Infortuni: ${profile.injuries || 'Nessuna'}
- Target Odierno (Muscolo richiesto): ${targetMuscle}
${extraInstruction}
Storico ultimi allenamenti e RPE: ${historyText}

Logica di Elaborazione (Incrocio Dati):
1. Match Obiettivo-Volume: Regola serie e rep (es. alte rep per resistenza/definizione, carichi per forza).
2. Filtro Attrezzatura: Escludi categoricamente esercizi che richiedono attrezzi non presenti. Esempio: se "Solo Manubri", niente bilancieri o cavi. Se "Corpo Libero", no pesi.
3. Adattamento Temporale: Se l'utente ha solo 30 min, ottimizza con superset o circuiti.
4. Progressione: Assicurati che la difficoltà sia coerente con l'esperienza dichiarata. Analizza lo storico RPE: se RPE < 7 suggerisci aumento; se > 8 mantieni o riduci.
5. Fasi Allenamento: Assicurati di includere Warm-up, Main Workout e Cool-down nella lista degli esercizi.

Istruzioni per l'Output (SOLO JSON VALIDO):
{
  "titolo": "Titolo allenamento (es. Upper Body Ipertrofia Manubri)",
  "nota_personale": "Breve nota motivazionale spiegando PERCHÈ hai creato questo workout (es. 'Considerando che hai 45 min e ti alleni a casa con manubri, ho inserito superset per...'). Massimo 3 frasi.",
  "avviso_sicurezza": "Se ci sono limitazioni (${profile.injuries || 'Nessuna'}), avvisa come prestare attenzione. Altrimenti lascia vuota ('').",
  "esercizi": [
    { "nome": "Nome Esercizio (es. Piegamenti / Warm-up)", "serie": "3", "ripetizioni": "12", "recupero": "60s", "note_carico": "Consigli tecnici o di carico" }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
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
