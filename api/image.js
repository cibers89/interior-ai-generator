import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, num_images = 1 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const HF_KEY = process.env.HF_API_KEY;
    const MODEL =
      process.env.HF_MODEL ||
      "stabilityai/stable-diffusion-xl-base-1.0";

    if (!HF_KEY)
      return res.status(500).json({ error: "Missing HF_API_KEY" });

    const API_URL = `https://router.huggingface.co/${MODEL}`;

    const images = [];

    for (let i = 0; i < Math.min(4, Math.max(1, num_images)); i++) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {},
          options: { wait_for_model: true }
        })
      });

      const contentType = response.headers.get("content-type") || "";

      // ❗ Router returns errors as JSON
      if (contentType.includes("application/json")) {
        const err = await response.json();
        return res.status(500).json({
          error: err.error || JSON.stringify(err)
        });
      }

      // ❗ Router returns MULTIPART response for images
      if (contentType.startsWith("multipart/")) {
        const boundary = contentType.split("boundary=")[1];
        const text = await response.text();

        // Extract base64 data from multipart
        const parts = text.split(`--${boundary}`);
        let foundImage = null;

        for (const part of parts) {
          if (part.includes("image/")) {
            // Take everything after two CRLF as body
            const body = part.split("\r\n\r\n")[1];
            foundImage = body.trim();
            break;
          }
        }

        if (!foundImage) {
          return res.status(500).json({
            error: "No image found in multipart response."
          });
        }

        // HF router already returns base64 encoded images
        images.push(`data:image/png;base64,${foundImage}`);
        continue;
      }

      return res.status(500).json({
        error: "Unknown content-type from HF router: " + contentType
      });
    }

    return res.status(200).json({ images });
  } catch (err) {
    console.error("HF ROUTER ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
