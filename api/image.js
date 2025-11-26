import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, num_images = 1 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const HF_KEY = process.env.HF_API_KEY;
    const MODEL = process.env.HF_MODEL || "stabilityai/stable-diffusion-xl-base-1.0";

    if (!HF_KEY) {
      return res
        .status(500)
        .json({ error: "Missing HF_API_KEY in environment" });
    }

    const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

    const images = [];

    for (let i = 0; i < Math.min(4, Math.max(1, num_images)); i++) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          Accept: "image/png",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true },
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      // 🔥 FIX: HF kadang balas JSON error saat model cold-start
      if (contentType.includes("application/json")) {
        const err = await response.json();
        return res.status(500).json({ error: err.error || JSON.stringify(err) });
      }

      // 🔥 FIX: correctly convert buffer → base64
      const buffer = Buffer.from(await response.arrayBuffer());
      images.push(`data:image/png;base64,${buffer.toString("base64")}`);
    }

    res.status(200).json({ images });
  } catch (err) {
    console.error("IMAGE ERROR:", err);
    res.status(500).json({ error: String(err) });
  }
}
