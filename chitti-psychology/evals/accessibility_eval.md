# Eval — Accessibility (= 100%, merge-blocking)

Every feature × {blind, deaf, mute, illiterate, elderly} must pass the expected-mode
behaviour in [datasets/accessibility_cases.json](datasets/accessibility_cases.json):
voice-out present, symbol/icon fallback present, ISL panel present, tap-only path
present, slow/large mode honoured, and the language dropdown (`#lang-select`) populated
by `chitti_lang.js`. Plus the platform five frontend gates (substrate). 100% or it
does not ship.
