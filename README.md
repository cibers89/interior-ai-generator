# interior-ai-generator

Full-stack demo: frontend (Tailwind) + Vercel Serverless backend that proxies:
- Text generation: Groq (Llama 3) — `api/text`
- Image generation: HuggingFace SDXL — `api/image`

Features (Variant B):
- Modern responsive UI (Tailwind)
- Loading skeletons and toasts
- Multi-image grid (2–4 images)
- Dark mode toggle
- Ready for Vercel deploy (serverless functions)

## Setup (local)
1. Clone repo or copy files to folder `interior-ai-generator`.
2. `npm install` (only node-fetch used for serverless functions; Vercel handles runtime).
3. Create `.env` from `.env.example` and fill keys:
   - `GROQ_API_KEY`
   - `HF_API_KEY`
   - optional `HF_MODEL`
4. Test locally with `vercel dev` (install Vercel CLI if needed):
   ```bash
   npm i -g vercel
   vercel dev
   ```

## Deploy to Vercel
1. Push repo to GitHub: `git init` -> `git add .` -> `git commit -m "initial"` -> push to `origin`.
2. Go to https://vercel.com/new and import repo `interior-ai-generator`.
3. Add Environment Variables in Vercel dashboard (Project Settings > Environment Variables):
   - `GROQ_API_KEY` → value
   - `HF_API_KEY` → value
   - `HF_MODEL` → optional (default: `stabilityai/sdxl-beta-2-1`)
4. Deploy. Vercel will serve `/public` and `api/*` functions.

## Endpoints
- `POST /api/text`  -> { prompt }  => { text }
- `POST /api/image` -> { prompt, num_images } => { images: [dataUri,...] }

## Notes & troubleshooting
- HuggingFace may return binary images; the server returns base64 data URIs to the frontend.
- Keep keys secret. Use Vercel Environment variables.
- If Groq endpoint differs from example, update `api/text.js`.
