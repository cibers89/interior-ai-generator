import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_TOKEN) {
      return res.status(500).json({ error: "Missing REPLICATE_API_TOKEN" });
    }

    // FREE MODEL: FLUX-SCHNELL (FAST & FREE)
    const model = "black-forest-labs/flux-schnell";

    const apiURL = `https://api.replicate.com/v1/models/${model}/predictions`;

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024
        }
      })
    });

    const data = await response.json();

    // If API error
    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    // Replicate returns a "prediction" object.
    // Need to poll the endpoint until it's done.
    let prediction = data;

    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise((r) => setTimeout(r, 1200));

      const poll = await fetch(apiURL + "/" + prediction.id, {
        headers: {
          Authorization: `Bearer ${REPLICATE_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      prediction = await poll.json();
    }

    if (prediction.status === "failed") {
      return res.status(500).json({
        error: prediction.error || "Image generation failed"
      });
    }

    // output = array of image URLs
    const imageUrl = prediction.output?.[0];

    // Convert URL -> base64 (for frontend simplicity)
    const imgReq = await fetch(imageUrl);
    const buffer = Buffer.from(await imgReq.arrayBuffer());
    const base64 = buffer.toString("base64");

    return res.status(200).json({
      images: [`data:image/png;base64,${base64}`]
    });

  } catch (err) {
    console.error("REPLICATE ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
}
