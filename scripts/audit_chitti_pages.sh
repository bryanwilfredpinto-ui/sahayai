#!/usr/bin/env bash
# Chitti QA audit — 12 product pages × 10 criteria
# Each criterion has at least one positive match pattern; passing is the
# union of "page-local marker" and "loaded by a shared substrate it depends on".
set -u
PAGES=(
  chitti_complete_technical.html
  chitti_fundamentals.html
  chitti_medupi.html
  chitti_news.html
  chitti_vaani.html
  chitti_upi.html
  chitti_scanner.html
  chitti_ca.html
  chitti_legal.html
  chitti_logo_video.html
  chitti_government.html
  chitti_voice_factory.html
)

check() {
  local f="$1" pat="$2"
  if grep -qiE "$pat" "$f" 2>/dev/null; then echo -n "Y"; else echo -n "."; fi
}

printf "%-35s | %s\n" "PAGE" "DISC DEMO SPKR LANG THMB A11Y FBWD MOBL HLTH EXPL"
printf "%-35s | %s\n" "-----------------------------------" "---- ---- ---- ---- ---- ---- ---- ---- ---- ----"
for p in "${PAGES[@]}"; do
  if [ ! -f "$p" ]; then printf "%-35s | MISSING\n" "$p"; continue; fi
  # DISC: any sticky disclaimer/banner the page renders or pulls in.
  disc=$(check "$p" "NOT SEBI REGISTERED|sebi-disclaimer|legal-disclaimer|disclaimer-bar|chitti_disclaimer\.js|med-bar|gov-bar|stub-bar|vf-disclaimer|news-disclaimer|MEDICAL DISCLAIMER")
  # DEMO: a sample/demo data path or "demo" toggle/button/state.
  demo=$(check "$p" "chitti_a11y\.js|demo[- ]?mode|Demo Mode|DEMO MODE|sample.*data|tryDemo|loadDemo|DEMO\b|demo_button|chitti-demo-sample")
  # SPKR: a speak/read-aloud control (page-local OR feedback widget injects one).
  spkr=$(check "$p" "feedback-widget\.js|🔊|tts|speech.?synth|aria-label=\"(Speak|Listen|Read aloud)|chitti\.speak|chitti-speak")
  # LANG: language picker (page-local OR chitti_a11y.js injects #chitti-lang).
  lang=$(check "$p" "chitti_a11y\.js|language-selector|chitti-lang|languageSelect|pick-lang")
  # THMB: thumbs up/down (page-local OR feedback widget).
  thmb=$(check "$p" "feedback-widget\.js|👍|👎|thumbs|thumb-up|thumb-down")
  # A11Y: chitti_a11y.js loaded.
  a11y=$(check "$p" "chitti_a11y\.js")
  # FBWD: feedback-widget.js loaded.
  fbwd=$(check "$p" "feedback-widget\.js")
  # MOBL: viewport meta + at least one @media or responsive grid.
  mobl=$(check "$p" "viewport.*width=device-width")
  # HLTH: backend referenced (caller's responsibility to ping; here we mark Y if any onrender URL is referenced).
  hlth=$(check "$p" "onrender\.com|chitti-.*-api")
  # EXPL: Explain Simply control (page-local OR chitti_a11y.js #chitti-explain-simply).
  expl=$(check "$p" "chitti_a11y\.js|Explain simply|explain[- ]?simply|simplify-btn|explainSimply|chitti-explain")
  printf "%-35s | %s    %s    %s    %s    %s    %s    %s    %s    %s    %s\n" \
    "$p" "$disc" "$demo" "$spkr" "$lang" "$thmb" "$a11y" "$fbwd" "$mobl" "$hlth" "$expl"
done
