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

    const themes = [
      "Sminuisci aggressivamente le dimensioni dei suoi muscoli inesistenti.",
      "Urla che non sta sudando abbastanza e sembra che stia facendo una scampagnata.",
      "Usa sarcasmo tagliente: fai finta di fargli un complimento per poi distruggerlo verbalmente.",
      "Dagli del rammollito viziato che piange per un po' di acido lattico.",
      "Usa metafore iperboliche assurde, ignoranti e grottesche sul sangue e la ghisa."
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const prompt = `Ruolo: Sei un Personal Trainer psicopatico, hardcore, spietato, aggressivo, ineducato e iper-goliardico.
Il tuo unico obiettivo è motivare l'utente insultandolo pesantemente e urlandogli addosso. Sii imprevedibile. 
SEGUI QUESTO TEMA SCELTO A CASO PER LA FRASE: "${randomTheme}"

L'utente in questo momento è nella fase di: ${phase === 'exercise' ? 'ESECUZIONE DELLO SFORZO' : 'RECUPERO/PAUSA'}.
Genera SOLO e UNICAMENTE la frase da dire (massimo 10-20 parole). URLA TUTTO (o usa molti punti esclamativi), deve essere recitato con rabbia furiosa e foga assoluta.
Usa terminologia durissima, inserendo imprecazioni volgari e goliardiche come "cazzo", "merda", "stronzo", "rottame", "fottuto", "sacco di merda". EVITA SEMPRE LE STESSE FRASI CLICHÉ. INVENTA!

Genera la tua frase ora (massimo 20 parole):`

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 1.1,
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
