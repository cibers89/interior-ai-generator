import fetch from "node-fetch";

// FREE PUBLIC HF SPACE MODELS
const MODELS = [
  {
    name: "FLUX-SCHNELL",
    url: "https://black-forest-labs-flux-1-schnell.hf.space/run/predict"
  },
  {
    name: "SDXL-LIGHTNING",
    url: "https://byte-dance-sdxl-lightning.hf.space/run/predict"
  },
  {
    name: "PLAYGROUND-V2.5",
    url: "https://playgroundai-playground-v2-5.hf.space/run/predict"
  }
];

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`🔥 Trying model: ${model.name}`);

        const response = await fetch(model.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [prompt] })
        });

        const result = await response.json();

        // If Space returns error
        if (result.error) {
          console.warn(`⚠ Model ${model.name} error:`, result.error);
          lastError = result.error;
          continue; // try next model
        }

        // HF Spaces return base64 inside result.data[0]
        const base64 = result?.data?.[0];

        if (!base64) {
          console.warn(`⚠ Model ${model.name} returned no image`);
          continue;
        }

        console.log(`✅ Success with ${model.name}`);
        return res.status(200).json({ images: [base64], model: model.name });
      } catch (err) {
        console.warn(`⚠ Model ${model.name} failed:`, err);
        lastError = err.message;
        continue;
      }
    }

    // If all models fail
    return res.status(500).json({
      error: "All image models failed",
      details: lastError
    });

  } catch (err) {
    console.error("IMAGE MULTI-BACKUP ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
