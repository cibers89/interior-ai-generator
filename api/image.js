import fetch from "node-fetch";

// FREE PUBLIC HF SPACES (NO TOKEN NEEDED)
const MODELS = [
  {
    name: "FLUX-SCHNELL",
    base: "https://black-forest-labs-flux-1-schnell.hf.space"
  },
  {
    name: "SDXL-LIGHTNING",
    base: "https://byte-dance-sdxl-lightning.hf.space"
  },
  {
    name: "PLAYGROUND-V2.5",
    base: "https://playgroundai-playground-v2-5.hf.space"
  }
];

// Try calling generic HF Space API (Gradio V3+)
async function callHFSpace(baseUrl, prompt) {
  const endpoints = [
    "/api/predict",       // New API (2024/2025)
    "/run/predict"        // Older Gradio API
  ];

  for (const endpoint of endpoints) {
    try {
      const url = baseUrl + endpoint;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [prompt] })
      });

      const text = await response.text();

      // Make sure we only try parsing JSON if it's actually JSON
      if (!text.startsWith("{")) {
        throw new Error(`Not JSON: ${text.slice(0, 40)}...`);
      }

      const result = JSON.parse(text);

      if (result.error) throw new Error(result.error);

      // Possible response formats:

      // 1) { data: ["data:image/png;base64,..."] }
      if (typeof result?.data?.[0] === "string" &&
          result.data[0].startsWith("data:image")) {
        return result.data[0];
      }

      // 2) { data: [ { image: "data:image/png;base64,..."} ] }
      if (typeof result?.data?.[0]?.image === "string") {
        return result.data[0].image;
      }

      // 3) Some spaces return nested arrays
      if (Array.isArray(result.data)) {
        const flat = JSON.stringify(result.data);
        if (flat.includes("data:image")) {
          const base64 = flat.match(/data:image[^"]+/)?.[0];
          if (base64) return base64;
        }
      }

      throw new Error("No valid image found in JSON");
    } catch (err) {
      // Try next endpoint
      continue;
    }
  }

  throw new Error("All endpoints failed");
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`🔥 Trying HF Space: ${model.name}`);

        const image = await callHFSpace(model.base, prompt);

        console.log(`✅ ${model.name} succeeded`);

        return res.status(200).json({
          images: [image],
          model: model.name
        });

      } catch (err) {
        console.warn(`⚠ ${model.name} failed:`, err.message);
        lastError = err.message;
      }
    }

    return res.status(500).json({
      error: "All image models failed",
      details: lastError
    });

  } catch (err) {
    console.error("UNIVERSAL HF ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
