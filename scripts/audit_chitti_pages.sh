#!/usr/bin/env bash
# Chitti QA audit - 12 product pages x 10 criteria
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

printf "%-35s | %s\n" "PAGE" "DISC DEMO SPKR LANG THMB A11Y FBWD MOBL EXPL"
printf "%-35s | %s\n" "-----------------------------------" "---- ---- ---- ---- ---- ---- ---- ---- ----"
for p in "${PAGES[@]}"; do
  if [ ! -f "$p" ]; then printf "%-35s | MISSING\n" "$p"; continue; fi
  disc=$(check "$p" "NOT SEBI REGISTERED|sebi-disclaimer|legal-disclaimer|disclaimer-bar")
  demo=$(check "$p" "demo[- ]?mode|Demo Mode|DEMO MODE|sample.*data|demo.*data")
  spkr=$(check "$p" "speak|🔊|tts|speech.?synth|aria-label=\"(Speak|Listen|Read aloud)")
  lang=$(check "$p" "language-selector|chitti-lang|lang-pick|select.*lang|languageSelect")
  thmb=$(check "$p" "👍|👎|thumbs|feedback-widget")
  a11y=$(check "$p" "chitti_a11y\.js")
  fbwd=$(check "$p" "feedback-widget\.js")
  mobl=$(check "$p" "viewport.*width=device-width|@media.*max-width")
  expl=$(check "$p" "Explain simply|explain[- ]?simply|simplify-btn|explainSimply|explain-simply")
  printf "%-35s | %s    %s    %s    %s    %s    %s    %s    %s    %s\n" "$p" "$disc" "$demo" "$spkr" "$lang" "$thmb" "$a11y" "$fbwd" "$mobl" "$expl"
done
