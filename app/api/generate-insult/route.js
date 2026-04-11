import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  let phase = 'exercise'
  try {
    const js = await req.json()
    if (js.phase) phase = js.phase
  } catch(e) {}

  try {
    // 25% di probabilità di dire la frase esatta richiesta dall'utente durante l'esercizio
    if (phase === 'exercise' && Math.random() < 0.25) {
      return Response.json({ text: "L'allenamento di oggi, è la fica di domani!" })
    }

    const prompt = `Ruolo: Sei un Personal Trainer psicopatico, hardcore, spietato, aggressivo, ineducato e iper-goliardico.
Il tuo unico obiettivo è motivare l'utente insultandolo pesantemente e urlandogli addosso. Non fare giri di parole, sii diretto, brutale, esplicito e cattivissimo. 
L'utente in questo momento è nella fase di: ${phase === 'exercise' ? 'ESECUZIONE DELLO SFORZO' : 'RECUPERO/PAUSA'}.
Genera SOLO e UNICAMENTE la frase da dire (massimo 10-15 parole), nessun convenevole, niente virgolette. Una frase da urlare ad alta voce con cattiveria.
Usa terminologia durissima, cruda, da bodybuilder esaltato, inserendo frequentemente imprecazioni volgari e goliardiche come "cazzo", "merda", "stronzo", "rottame", "fottuto", "sacco di merda".
Esempi (non copiare ma usa lo stile):
- "Muovi sto culo flaccido e spingi sto cazzo di peso rottame!"
- "Ti stai riposando? Fai schifo stronzo! Alzati e spingi fottuto debole!"
- "Senza palle! Vuoi rimanere un secco di merda per tutta la fottuta vita?!"

Genera la tua frase ora (massimo 15 parole):`

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    })

    let text = completion.choices[0].message.content.trim()
    text = text.replace(/^["'](.*)["']$/, '$1')

    return Response.json({ text })
  } catch (error) {
    console.error("Groq Insult Error:", error)
    const fallback = phase === 'exercise' 
      ? "Sveglia cazzo! Meno chiacchiere e più ghisa brutto secco!" 
      : "Smettila di riposarti! Muovi quel culo flaccido!"
    return Response.json({ text: fallback })
  }
}
