import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY)
      return res.status(500).json({ error: 'Missing GROQ_API_KEY in environment' });

    // FIXED: correct Groq endpoint (2025)
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    const payload = {
      model: 'llama-3.1-70b-versatile', // recommended stable model
      messages: [
        {
          role: 'system',
          content:
            'You are a senior interior designer. Provide structured, detailed design output.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    };

    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const textResponse = await r.text();

    if (!r.ok) {
      return res.status(500).json({ error: textResponse });
    }

    const data = JSON.parse(textResponse);
    const text = data?.choices?.[0]?.message?.content;

    res.status(200).json({ text });
  } catch (err) {
    console.error('TEXT ERROR:', err);
    res.status(500).json({ error: String(err) });
  }
}
