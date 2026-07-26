# Backend deployment and upload-speed plan

The UI folder has not been changed.

## Extraction flow

1. The browser uploads the selected files in the existing single multipart request.
2. The API verifies file signatures.
3. Images/PDF pages are preprocessed in parallel to a maximum 1500 px edge at JPEG quality 78.
4. Recently repeated files are served from a 30-minute SHA-256 extraction cache.
5. Uncached documents are sent together in one Gemini request with a 45-second timeout.
6. PaddleOCR is loaded only when Gemini fails or returns unusable structured fields.
7. Normalization, comparison and correction guidance remain deterministic backend operations.

## Local environment

Copy `api/.env.example` to `api/.env`, then set at least:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
JWT_SECRET=a_long_random_secret
HMAC_PEPPER=a_different_long_random_value
MASTER_KEY=a_different_long_random_value
CORS_ORIGIN=http://localhost:5173
PADDLE_WARMUP_ON_START=false
```

Run:

```bash
cd api
npm install
pip install -r requirements.txt
npm run dev
```

## Deployment

The included `render.yaml` and `api/Dockerfile` deploy the Node API plus Python fallback. Add secrets in the hosting dashboard; never commit `.env`.

Required production variables:

- `GEMINI_API_KEY`
- `JWT_SECRET`
- `HMAC_PEPPER`
- `MASTER_KEY`
- `CORS_ORIGIN` (your deployed frontend URL)

For a low-memory demo deployment leave `PADDLE_WARMUP_ON_START=false`. Gemini stays primary and PaddleOCR loads only after a failure.

## Expected behavior

- Clear compressed images: Gemini path should normally finish before the 45-second timeout.
- A repeated demo upload: extraction should be returned from cache.
- Gemini failure: PaddleOCR fallback may be slower and the result is marked for review.
- PDFs: only the first three pages are processed by default to prevent unexpectedly long requests.
