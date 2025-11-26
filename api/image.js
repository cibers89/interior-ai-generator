import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY)
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",       // MODEL GAMBAR OPENAI GRATIS
        prompt: prompt,
        size: "1024x1024"          // kualitas bagus, bisa diganti 512
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error || "OpenAI error" });
    }

    // OpenAI returns: { data: [ { b64_json: "..." } ] }
    const base64 = data?.data?.[0]?.b64_json;
    if (!base64) return res.status(500).json({ error: "No image returned" });

    return res.status(200).json({
      images: [`data:image/png;base64,${base64}`]
    });

  } catch (err) {
    console.error("OPENAI IMAGE ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
