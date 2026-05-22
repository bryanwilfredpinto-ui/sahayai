# skills/chitti_news_ai.md

Chitti News AI + Coach — AI news + dynamic AI learning for every Indian.
Frontend: `chitti_news_ai.html`. Backend: chitti-vaani-api / DeepSeek.

## Two modes — toggled at the top of the page

- **📰 AI News** — current-feeling AI news, one explanation per profile.
- **🎓 AI Coach** — Zero-to-hero AI track for *any* profession.

Sire's master rule: **ZERO hardcoding of professions, certifications,
or topics**. Chitti reasons dynamically for any profession the user
types.

## Profile contract

Three questions, one time:

1. "Aap kya karte hain?" → free-text input + voice. **No dropdown,
   no profession list, no hardcoded validation.** Chitti accepts
   anything: interior decorator, truck driver, oncologist, wrestler,
   chef, dancer, farmer, filmmaker.
2. "AI ke baare mein kitna jaante ho?" → four levels:
   `🌱 Bilkul nahin · 🌿 Thoda thoda · 🌳 Theek-thaak · ⭐ Bahut acha`.
3. Language (already locked by the global language selector).

Saved to localStorage as `chitti_news_ai_profile_v1`:
```
{ profession: "<free text>", level: 0..3, name: "", lang: "<code>" }
```

Editable any time via "✏️ बदलें" pill on the profile bar.

## Dynamic snapshot (Coach landing)

On entering AI Coach with a saved profile, Chitti calls DeepSeek with:

```
For the profession "<X>" with AI knowledge level <0..3>/3, generate a
profession-specific AI snapshot. Return JSON:
{
  how_ai_helps: "<2-3 sentences in <lang> about how AI helps THIS profession>",
  best_tools: [{name, url, paid_or_free, why_for_this_profession}],
  free_certifications: [{name, provider, url, duration, why}]
}
```

`best_tools` includes Claude + (ChatGPT/Gemini/Perplexity) + one
profession-specific tool at minimum.

`free_certifications` is the only place we add a constraint:
**ONLY real certifications**, drawn from this allowlist of providers
Chitti has been instructed never to invent:

- Google AI Essentials (free)
- Microsoft AI-900 (free study materials)
- Coursera AI for Everyone — Andrew Ng (free audit)
- NASSCOM FutureSkills (India, free)
- Skill India AI modules (free)
- DeepLearning.AI Andrew Ng courses (free audit)
- Hugging Face NLP course (free)
- Fast.ai Practical Deep Learning (free)
- Elements of AI — University of Helsinki (free)
- IBM AI Foundations (free)

Snapshot is cached as `chitti_news_ai_snapshot_v1` — refreshed when
the user taps "🔄 Profile के लिए Chitti से ताज़ा insights लो", or
when the profile changes.

## 8 tracks

Hard-coded shell (numbers + titles) — every lesson's *content* is
dynamic. Per Sire's rule, the curriculum scaffolding is not a topic
hardcode; only the track headings are static.

1. AI kya hai (true zero)
2. Gen AI tools today (Claude / Gemini / Perplexity / Grok / Llama /
   Hugging Face / ChatGPT+ / Midjourney / Runway / Sora / Copilot)
3. Machine Learning basics
4. Deep Learning basics
5. Agentic AI
6. Evaluating AI quality (RAGAS, human eval, bias check,
   hallucination detection)
7. AI safety + ethics
8. Latest tools — free vs paid

## Lesson generation

Each lesson is a fresh DeepSeek call with this contract:

```
Generate AI Coach lesson <N> of <M> for track "<title>".
Student profession: "<X>". Level: <0..3>/3.
Return JSON:
{
  explanation: "<2-3 sentences in <lang>, ONE example FROM the student profession, never generic>",
  task: "<one concrete hands-on task in <lang>, e.g. open claude.ai and type X>",
  quiz: [{q, a:[3 options], correct:0..2}, {q, a, correct}]
}
Lesson must be under 3 minutes of reading.
```

Examples — what Chitti is expected to produce:

- **Interior decorator** + neural networks → "Jaise aap room ka
  layout dekhke instantly samajh jaate ho kya fit karega — AI bhi
  yahi karta hai, lakho rooms dekhke."
- **Oncologist** + deep learning → "Deep learning radiology mein —
  AI tumour detection 94% accuracy vs 85% human." Only shown to
  medical profiles via the content gate.
- **Farmer** + machine learning → "Jaise aap 20 saal ke tajurbe se
  jaante ho kaun sa beej kab daalein — AI 10 lakh farms ka data
  dekhke yahi seekhta hai."
- **Cricketer** + training data → "Jaise Kohli ne 1000 innings
  dekhke har bowler ka pattern seekha — AI bhi yahi karta hai."
- **Filmmaker** + generative AI → "Sora dekhiye — text likhein,
  video ban jaaye."
- **Student** + prompt engineering → "Jaise exam mein sahi sawaal
  poochhna zaroori hai — AI se bhi sahi tarah poochhna seekhna padta
  hai."

If a lesson generation fails, Chitti says so honestly — never fakes
content.

## Content gating (News mode)

Each story carries a `category`. Chitti shows by default:
`general`, `farming`, `education`, `creative`.

Gated:
- `medical` → only if profession matches doctor/nurse/oncologist/etc.
- `legal` → only if profession matches lawyer/advocate/judge.
- `finance` → only if profession matches banker/CA/finance.

A user can opt into any gated category by typing it in their
profession ("Medical AI news bhi dikhao" — surfaced as a future
"interest tags" field; today implemented via profession regex).

## Profiled samjhao (News mode)

Every story has a `💬 Samjhao` button. On tap, Chitti calls DeepSeek
with the headline + bullets + user's profession + level → returns
"Explain this story to them in 2-3 short sentences in <lang>. Use
ONE concrete example from THEIR profession to make it click."

Doctor sees the medical-AI angle. Farmer sees the farming-AI angle.
Same headline, totally different explanation per profile.

## Sahayai AI Certificate

Track completion auto-generates a certificate:

```
{ id: "sahayai-<8 alnum uppercase>", user, profession, track,
  level: ["Beginner","Intermediate","Advanced","Expert"][level+1],
  date: "YYYY-MM-DD",
  next: <top 3 free certs from the snapshot>,
}
```

Saved as `chitti_news_ai_cert_v1`. Rendered card includes:
- Sahayai mark
- User name
- Profession + track + level
- Verify QR (sahayai.in/verify/<id>)
- "Recommended next certifications" — three real free ones from the
  snapshot list.

Shareable via WhatsApp / native share / copy link.

## Honest failure modes

- Profession Chitti hasn't seen before → `na.unknown` string:
  "Yeh pesha Chitti ke liye naya hai — abhi jaan rahi hoon…" — and
  then makes a best-effort call. We never fail silently.
- DeepSeek returns malformed JSON → frontend shows
  "Chitti se snapshot abhi nahi mila — phir try karein."
- Story bullet/headline is empty → that card is skipped.

## Quality v2

Per-card 👎 sends `{chitti:'chitti_news_ai', card, message}` to
`/api/feedback`. Cards: `na_tools`, `na_certs`, `na_story_<idx>`,
`na_cert`. Founder dashboard aggregates.
