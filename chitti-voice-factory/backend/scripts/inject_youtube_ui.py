#!/usr/bin/env python3
"""
scripts/inject_youtube_ui.py — Add the "📺 Teach Chitti with YouTube Videos"
section to every chitti_<lang>.html in chitti-voice-factory/frontend/.

Idempotent: if the marker `data-chitti-section="youtube"` is already present,
the file is left untouched.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
FRONTEND = REPO_ROOT / "chitti-voice-factory" / "frontend"

SECTION_MARKER = 'data-chitti-section="youtube"'

# The HTML/JS block we inject. Inserted just before `</main>`.
SECTION_HTML = """
        <section data-chitti-section="youtube">
            <h2>📺 Teach Chitti with YouTube Videos</h2>
            <p style="color:#555;font-size:0.95rem;margin-top:-0.5rem;">
                Add up to <strong>10</strong> YouTube videos in this language.
                Chitti will read their transcripts to learn grammar and vocabulary.
                Real text, real provenance — tagged
                <code>textbook_source: community</code>.
            </p>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:stretch;">
                <input id="yt-url" type="url" placeholder="https://youtu.be/..."
                       aria-label="YouTube URL"
                       style="flex:1;min-width:240px;padding:0.75rem;border:2px solid #667eea;border-radius:4px;font-size:1rem;">
                <button class="btn-speak" type="button" onclick="ytAdd()">➕ Add Video</button>
            </div>
            <div id="yt-status" role="status" aria-live="polite"
                 style="margin-top:0.75rem;color:#444;min-height:1.5rem;"></div>
            <ul id="yt-list" style="margin-top:1rem;padding-left:1.2rem;font-size:0.95rem;"></ul>
            <button class="btn-download" type="button" onclick="ytProcess()"
                    style="margin-top:0.75rem;">▶️ Process Videos &amp; Add to Corpus</button>
            <p style="color:#777;font-size:0.85rem;margin-top:0.75rem;">
                Processing extracts each video's transcript (preferring this language's
                track, falling back to auto-generated) and appends real chunks to the
                language corpus. No audio or images are stored.
            </p>
        </section>
        <script>
            (function () {
                const ytApiBase = API + "/api/voice/fluency/" + LANG + "/videos";
                const $url = document.getElementById("yt-url");
                const $status = document.getElementById("yt-status");
                const $list = document.getElementById("yt-list");

                function setStatus(msg, isError) {
                    $status.textContent = msg;
                    $status.style.color = isError ? "#a40000" : "#0a6b2a";
                }
                async function refresh() {
                    try {
                        const r = await fetch(ytApiBase);
                        const d = await r.json();
                        $list.innerHTML = "";
                        (d.videos || []).forEach(v => {
                            const li = document.createElement("li");
                            li.style.marginBottom = "0.35rem";
                            const a = document.createElement("a");
                            a.href = v.url; a.target = "_blank"; a.rel = "noopener";
                            a.textContent = v.video_id;
                            li.appendChild(a);
                            const meta = document.createElement("span");
                            meta.style.color = "#666"; meta.style.marginLeft = "0.5rem";
                            if (v.processed_at && !v.error) {
                                meta.textContent = "✅ " + (v.transcript_chunks || 0) + " chunks";
                                if (v.auto_generated) meta.textContent += " (auto-generated transcript)";
                            } else if (v.error) {
                                meta.textContent = "⚠️ " + v.error;
                                meta.style.color = "#a40000";
                            } else {
                                meta.textContent = "pending";
                            }
                            li.appendChild(meta);
                            const rm = document.createElement("button");
                            rm.textContent = "✕"; rm.title = "Remove";
                            rm.style.marginLeft = "0.5rem"; rm.style.padding = "0.1rem 0.5rem";
                            rm.style.background = "transparent"; rm.style.border = "1px solid #999";
                            rm.style.color = "#a40000"; rm.style.borderRadius = "4px";
                            rm.onclick = () => ytRemove(v.video_id);
                            li.appendChild(rm);
                            $list.appendChild(li);
                        });
                        setStatus(d.count + " / " + d.max_videos + " videos queued.", false);
                    } catch (e) { setStatus("Could not load video list.", true); }
                }
                window.ytAdd = async function () {
                    const url = $url.value.trim();
                    if (!url) { setStatus("Paste a YouTube URL first.", true); return; }
                    setStatus("Adding…", false);
                    try {
                        const r = await fetch(ytApiBase, {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({url})
                        });
                        const d = await r.json();
                        if (!d.ok) { setStatus("Rejected: " + (d.error || "unknown"), true); return; }
                        $url.value = "";
                        setStatus("Added " + d.video.video_id, false);
                        refresh();
                    } catch (e) { setStatus("Add failed.", true); }
                };
                window.ytRemove = async function (videoId) {
                    try {
                        await fetch(ytApiBase + "/" + videoId, {method: "DELETE"});
                        refresh();
                    } catch (e) { setStatus("Remove failed.", true); }
                };
                window.ytProcess = async function () {
                    setStatus("Processing transcripts (~30s)…", false);
                    try {
                        const r = await fetch(ytApiBase + "/process", {method: "POST"});
                        const d = await r.json();
                        setStatus("Processed " + d.processed +
                                  ", skipped " + d.skipped +
                                  ", errors " + d.errors +
                                  " — " + d.new_chunks + " new chunks added.",
                                  d.errors > 0);
                        refresh();
                    } catch (e) { setStatus("Process call failed.", true); }
                };
                refresh();
            })();
        </script>
"""


def inject_into(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if SECTION_MARKER in text:
        return "already-injected"
    # Insert before the FIRST closing </main>
    if "</main>" not in text:
        return "no-main-tag"
    new_text = text.replace("</main>", SECTION_HTML + "    </main>", 1)
    path.write_text(new_text, encoding="utf-8")
    return "injected"


def main() -> int:
    files = sorted(FRONTEND.glob("chitti_*.html"))
    if not files:
        print("ERROR: no chitti_*.html files found under", FRONTEND)
        return 1
    counts = {"injected": 0, "already-injected": 0, "no-main-tag": 0}
    for f in files:
        outcome = inject_into(f)
        counts[outcome] = counts.get(outcome, 0) + 1
        print(f"  {f.name}: {outcome}")
    print("-" * 40)
    for k, v in counts.items():
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
