import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Pollinations free API
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch from Pollinations" });
    }

    // Convert to buffer → base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    return res.status(200).json({
      images: [`data:image/jpeg;base64,${base64}`],
      provider: "Pollinations.ai"
    });
  } catch (err) {
    console.error("POLLINATIONS ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
