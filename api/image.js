import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompts } = req.body || {};
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: "Missing prompts array" });
    }

    const images = [];

    for (const p of prompts) {
      // Pollinations format must be simple
      const cleanedPrompt = p
        .replace(/[^\w\s]/gi, "")     // remove symbols
        .replace(/\s+/g, " ")         // compress spaces
        .trim();

      const url =
        `https://image.pollinations.ai/prompt/` +
        encodeURIComponent(cleanedPrompt) +
        `?width=1024&height=1024&nologo=true`;

      const response = await fetch(url);

      if (!response.ok) {
        images.push(null);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString("base64");

      images.push(`data:image/jpeg;base64,${base64}`);
    }

    return res.status(200).json({ images });
  } catch (err) {
    console.error("POLLINATIONS ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
