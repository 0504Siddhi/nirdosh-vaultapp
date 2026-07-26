# Modifications applied — current extraction plan

- UI directory preserved byte-for-byte.
- Gemini remains the primary structured extractor.
- All uncached documents are sent in one consolidated Gemini request.
- Added SHA-256 extraction cache with configurable TTL and size limit.
- Reduced preprocessing defaults to 1500 px and JPEG quality 78.
- PDF processing is limited to the first 3 pages by default.
- Gemini timeout is configurable and defaults to 45 seconds.
- PaddleOCR remains a fallback and now loads lazily by default.
- Added Docker deployment files and Python requirements.
- Removed the custom rate-limit key generator that caused IPv6 validation warnings.
- Added deployment and environment guidance.

## Validation performed

- Python fallback/rasterizer scripts compile successfully.
- UI hashes before and after modification are identical.
- A full TypeScript build could not be completed in the artifact environment because npm dependency installation timed out. Run `npm ci && npm run build && npm test` inside `api/` after download.
