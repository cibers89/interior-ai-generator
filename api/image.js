import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, num_images = 1 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const HF_KEY = process.env.HF_API_KEY;
    if (!HF_KEY)
      return res.status(500).json({ error: "Missing HF_API_KEY" });

    // 🔥 USE HF ROUTER TASK ENDPOINT
    const API_URL = `https://router.huggingface.co/hub/tasks/text-to-image`;

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
          parameters: {
            num_inference_steps: 35,
            guidance_scale: 7
          },
          options: { wait_for_model: true }
        })
      });

      const contentType = response.headers.get("content-type") || "";

      // HF task endpoint ALWAYS RETURNS JSON
      if (!contentType.includes("application/json")) {
        const raw = await response.text();
        return res.status(500).json({
          error: "Unexpected content-type: " + contentType,
          raw
        });
      }

      const json = await response.json();

      if (json.error) {
        return res.status(500).json({ error: json.error });
      }

      if (!json.images || !json.images.length) {
        return res.status(500).json({ error: "No images returned." });
      }

      // router task: images array of base64 strings
      const base64 = json.images[0]; 
      images.push(`data:image/png;base64,${base64}`);
    }

    return res.status(200).json({ images });
  } catch (err) {
    console.error("HF TASK ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
