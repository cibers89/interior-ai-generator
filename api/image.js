import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt, num_images = 1 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const HF_KEY = process.env.HF_API_KEY;
    const HF_MODEL = process.env.HF_MODEL || 'stabilityai/sdxl-beta-2-1';
    if (!HF_KEY) return res.status(500).json({ error: 'Missing HF_API_KEY in environment' });

    const modelUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

    // We'll request images one by one (or parallel) and return data URIs
    const images = [];

    for (let i = 0; i < Math.max(1, Math.min(4, num_images)); i++) {
      const r = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
      });

      if (!r.ok) {
        const text = await r.text();
        return res.status(500).json({ error: text });
      }

      const contentType = r.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // HF sometimes returns JSON with an error or with URLs/base64
        const j = await r.json();
        if (j?.error) return res.status(500).json({ error: j.error || JSON.stringify(j) });
        // If the response contains image data or URLs, try to extract images
        if (Array.isArray(j)) {
          // possibly array of images as base64 or objects
          for (const item of j) {
            if (item?.generated_image) images.push(item.generated_image);
            else if (item?.data && item.data[0]?.b64_json) images.push('data:image/png;base64,' + item.data[0].b64_json);
          }
          continue;
        }
        // fallback, return the json
        return res.status(200).json(j);
      }

      const buffer = await r.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      images.push(`data:${contentType};base64,${base64}`);
    }

    res.status(200).json({ images });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
