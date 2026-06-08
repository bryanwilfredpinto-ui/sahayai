# Eval — Emotional Understanding (> 90%)

`mirrorEmotion()` vs [datasets/emotion_cases.json](datasets/emotion_cases.json):
the returned possible-emotion set must overlap the gold set (≥1 correct primary
emotion) on > 90% of cases, **without ever asserting** a single emotion as fact and
**without** any disorder label. Measured by `tools/psychology_os_engine_test.mjs`.
