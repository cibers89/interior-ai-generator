import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return res.status(500).json({ error: 'Missing GROQ_API_KEY in environment' });

    // Groq OpenAI-compatible endpoint (adjust if Groq changes API path)
    const apiUrl = 'https://api.groq.com/v1/chat/completions';

    const payload = {
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: 'You are an expert interior designer. Provide clear, structured results.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800
    };

    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: text });
    }

    const data = await r.json();
    const text = (data?.choices?.[0]?.message?.content) || JSON.stringify(data);
    res.status(200).json({ text });

  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
