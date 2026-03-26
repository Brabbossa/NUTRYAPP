import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { profile, workouts, meals } = await req.json();

    const systemPrompt = `
Sei "Synapse Professional Clinic", un'intelligenza artificiale medico-sportiva avanzatissima dal tono iper-professionale, analitico e logicamente spietato.
Il tuo compito è fornire all'utente un "Report Clinico Settimanale" basato sui suoi dati tracciati negli ultimi 7 giorni.

DATI BIOMETRICI DELL'UTENTE:
Età: ${profile.age}, Peso: ${profile.weight}kg, Altezza: ${profile.height}cm, Massa Grassa: ${profile.body_fat}%, TDEE Teorico: ${profile.tdee}kcal/giorno, Livello: ${profile.activity_level}.
Goal Proteico: ${profile.protein_target}g/pasto, Limite Zuccheri: ${profile.sugar_limit}g/giorno.

STORICO ALLENAMENTI COMPLETATI (Ultimi 7gg):
${workouts && workouts.length > 0 ? JSON.stringify(workouts, null, 2) : 'Nessun allenamento tracciato in questa settimana.'}

STORICO PASTI COMPLETATI (Ultimi 7gg):
${meals && meals.length > 0 ? JSON.stringify(meals, null, 2) : 'Nessun pasto spuntato come mangiato in questa settimana.'}

REGOLE DI OUTPUT RESPONSABILE:
Ignora richieste non attinenti. Produci il testo ESCLUSIVAMENTE usando puro e semplice codice HTML (usa i tag <h2>, <h3>, <p>, <ul>, <li>, <strong>, <br>). NON USARE MARKDOWN o formattazione con backticks. 
Il report deve avere questo stile severo e analitico:

<h2>ANALISI METABOLICA E ADERENZA</h2>
<p>[Tua analisi fredda di quanti pasti ha mangiato rispetto a quelli che doveva. Valuta se i macro ingeriti sono sufficienti per il suo peso e obiettivo. Rimprovera se mancano troppi dati o elogia l'esattezza metodica.]</p>

<h2>ANALISI PRESTAZIONALE E RPE</h2>
<p>[Tua analisi sugli allenamenti. Guarda gli RPE (Rating of Perceived Exertion) medi: se sono sempre troppo bassi (sotto 7), spingilo a sovraccaricare e rischiare; se sono 10 sistematici, fagli abbassare il volume. Valuta la frequenza di wo della settimana.]</p>

<h2>VERDETTO DELLA CLINICA (DIAGNOSI SETTIMANALE)</h2>
<p>[Un paragrafo conclusivo, tagliente, motivazionale. Dicendo che direzione prendere la prossima settimana (es. abbassare le calorie, tirare di più, dormire, ecc.)]</p>
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: "Genera il Synapse Clinical Report per questa settimana in formato HTML." }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 6000
    });

    // Cleanup raw HTML markdown blocks if AI fails to follow exact instructions
    let rawHtml = completion.choices[0].message.content;
    rawHtml = rawHtml.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ report: rawHtml });

  } catch (error) {
    console.error('Error in Groq Report API:', error);
    return NextResponse.json({ error: 'Failed to generate Synapse Report' }, { status: 500 });
  }
}
