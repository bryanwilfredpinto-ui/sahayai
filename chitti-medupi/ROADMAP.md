# Chitti MedUPI — ROADMAP · Authored 2026-06-06

Honest forward plan. Status taxonomy: **LIVE** · **PARTIAL** · **COMING SOON** · **FUTURE**. Derived from `PRD.md` (F0–F9) and the backend services that exist today.

## Now (LIVE)
- **F0 Strict same-composition compare** — molecule + strength + form; zero cross-molecule leakage (25/25 proven).
- **F1 Jan Aushadhi pricing + savings** — cheapest same-composition + ₹/% saved (67–78% on samples).
- **F3 NPPA ceiling cross-check** — hard cap; `over_ceiling=0`.
- **F4 Family medicine wallet** — per-token roster (backend wired; live persistence = Sire re-curl).
- **Risk classification** — H/M/L molecule banding.
- **26-language voice-first UI** — 26/26 at 99%, RTL for ur/ks/sd.
- **Four-user accessibility** — axe 0 serious × 9 profiles.

## Next (PARTIAL → finish)
- **F2 Strip / prescription scan (DeepSeek vision)** — non-diagnostic; honest `unavailable` until the **DeepSeek key is funded** (Sire). Deterministic name path is live.
- **F5 Expiry / refill reminders** — model + scheduler exist; notification fan-out (SMS/WA) stubbed.
- **F6 Price alerts** — "tell me when Crocin drops below ₹20" (SAHAYAI_MASTER §5a P1).
- **F7 Insurance match** — seed live; partner API COMING SOON.

## Soon (COMING SOON)
- **Camera "Chitti forget" one-tap tombstone** endpoint (contract defined in `sop_camera_capture_and_forget.md`).
- **Offline mode** (cross-cutting `chitti_offline.js`, SAHAYAI_MASTER §5b) — fixes KNOWN_ISSUES #4.
- **2G / Village mode** (§5c) — fixes the Slow-3G 12.4s load (KNOWN_ISSUES #3).
- **Drug-interaction checker** (HIGH-risk; needs corpus + Sire review).

## Later (FUTURE)
- Full NPPA + Jan Aushadhi public catalog ingest (replace the ~51-row seed).
- ABDM-ready Health File linkage.
- Inventory / cabinet tracker for households.
- Swarm-pushed skill updates (HIGH-risk gate: ≥100 confirmations + Sire approval).

## Engineering debt (from 02_ARCHITECTURE_REVIEW §5.5)
Split the 213 KB inline page · scope language re-translate to changed subtrees · wire QA harnesses as a CI gate · reconcile DB docs (Neon vs Turso) · add CSP/CSRF headers.

Locked decisions (DeepSeek-only, Turso, Vaani-sole-interface, four-user, per-response widget, camera intelligence, Golden Rule) are not on this roadmap — they are fixed (SAHAYAI_MASTER §2).
