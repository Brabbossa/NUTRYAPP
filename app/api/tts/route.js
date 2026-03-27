export async function POST(req) {
  try {
    let text = ''
    try {
      const js = await req.json()
      text = js.text
    } catch(e) {
      return new Response('Invalid JSON', { status: 400 })
    }
    
    if (!text) return new Response('Text is required', { status: 400 })

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || 'sk_33c50e0b745e8a1f725faf1a8cb2a0720dedf4213d1f5161'
    const voiceId = 'pNInz6obpgDQGcFmaJcg' // Adam

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('ElevenLabs API error:', err)
      return new Response('Error from ElevenLabs API', { status: response.status })
    }

    const audioBuffer = await response.arrayBuffer()
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
