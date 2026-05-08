# Chitti Product Scanner

**Snap or type any label.** Chitti reads the product, identifies the type (food / medicine / legal_doc / bill / mrp / insurance), flags warnings, suggests savings, and connects to MedUPI / UPI Guard / Vaani as needed.

## v1 design choice

Text-fallback first. The frontend can capture from camera (or load from gallery), but the backend's primary path is `analyze_text` — the user types out (or speaks-to-text) what the label says. This works on every browser, every phone, every illiteracy level. A vision path is wired (`DEEPSEEK_VISION_MODEL`) and disabled by default; flip it on when a vision-capable endpoint is available.

## Run locally

```bash
cd backend
pip install -r requirements.txt
DEEPSEEK_API_KEY=sk-… python main.py        # → http://127.0.0.1:8005
```

Open `../frontend/index.html?api=http://127.0.0.1:8005` (and add `&medupi=http://localhost:8001` if you also have MedUPI running locally).

## Endpoints

- `POST /api/scanner/analyze`
   - Multipart with `image` field, OR
   - JSON `{text, language?}`
- `POST /api/scanner/analyze/text` — JSON-only convenience
- `GET  /api/scanner/health`

## Cross-product hooks

Built into the response (`cross_links` array):
- `medupi_lookup` — when `type=medicine`. Frontend calls MedUPI for Jan-Aushadhi alternatives and renders inline.
- `upi_check` — when `type=insurance`. Deep-links to `chitti_upi.html`.
- `vaani_read` — when `type=food` (or always available via the "Send to Vaani" button).
- `tel` — when `type=bill|mrp` and overcharging is a possibility, returns consumer helpline 1800-11-4000.
