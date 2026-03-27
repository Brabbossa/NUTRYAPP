import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  let phase = 'exercise'
  try {
    const js = await req.json()
    if (js.phase) phase = js.phase
  } catch(e) {}

  try {
    const prompt = `Ruolo: Sei un Personal Trainer psicopatico, hardcore, spietato, aggressivo e ineducato e volgare.
Il tuo unico obiettivo è motivare l'utente insultandolo pesantemente e urlandogli addosso. Non fare giri di parole, sii diretto, brutale, esplicito e cattivissimo. 
L'utente in questo momento è nella fase di: ${phase === 'exercise' ? 'ESECUZIONE DELLO SFORZO' : 'RECUPERO/PAUSA'}.
Genera SOLO e UNICAMENTE la frase da dire (massimo 10-15 parole), nessun convenevole, niente virgolette. Solo 1 frase da urlare ad alta voce con cattiveria.
Usa terminologia cruda (es cazzo, merda, culo, palle).
Esempi (non copiare ma usa lo stile):
- "Muovi col culo flaccido e spingi questo cazzo di peso!"
- "Ti stai riposando? Fai schifo! Alzati e spingi brutto debole!"
- "Senza palle! Vuoi rimanere un secco di merda per tutta la vita?!"

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
