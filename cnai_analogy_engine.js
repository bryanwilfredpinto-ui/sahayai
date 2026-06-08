/* ============================================================================
 * cnai_analogy_engine.js — Chitti News AI · Build Order 3 · Analogy Engine
 * ----------------------------------------------------------------------------
 * The signature feature. Explain ANY core AI/tech concept through the analogy
 * domain the user understands: cricket / share-market / farming / cooking /
 * Bollywood / code / general-simple. Deterministic, offline.
 *
 * PEDAGOGY (Gentner structure-mapping + Paivio dual-coding): an analogy maps an
 * unfamiliar TARGET onto a familiar SOURCE. Risk = a LEAKY analogy transfers the
 * wrong structure (e.g. "a token is a word"). RULE (non-negotiable): every cell
 * states the mapping AND where it BREAKS DOWN. A bounded analogy teaches; an
 * unbounded one creates misconceptions harder to unlearn than no analogy.
 *
 * Research: Khanmigo (Socratic, explain-back), 3Blue1Brown (intuition before
 * formalism), Physics Wallah (chai/auto/cricket framing), Brilliant (learn by
 * doing), MagicSchool (reading-level), Riiid (pre-empt the wrong answer).
 *
 * API (window.ChittiAnalogy / module.exports):
 *   explain(concept, domain)   -> { concept, domain, explanation, breaks_down, ... }
 *   detectDomain(text)         -> domain id (from "cricket analogy" etc.)
 *   listConcepts() / listDomains()
 *   switchDomain(concept, newDomain) -> explain() for a new column (same concept)
 *   speakable(result, lang)    -> audio-first string
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiAnalogy = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DOMAINS = [
    { id: 'cricket', label: 'Cricket', emoji: '🏏' },
    { id: 'share_market', label: 'Share market', emoji: '📈' },
    { id: 'farming', label: 'Farming', emoji: '🌾' },
    { id: 'cooking', label: 'Cooking', emoji: '🍳' },
    { id: 'bollywood', label: 'Bollywood', emoji: '🎬' },
    { id: 'code', label: 'Code', emoji: '💻' },
    { id: 'general', label: 'Simple', emoji: '💡' },
  ];

  // Each cell = [explanation, breaks_down]. breaks_down keeps the analogy BOUNDED.
  const C = {};
  function concept(id, label, cells) { C[id] = { id, label, cells }; }

  concept('variable', 'Variable', {
    cricket: ['A scorecard slot that holds one number, like a batsman\'s current runs.', 'But a scorecard slot only holds numbers; a variable can hold text, lists, anything.'],
    share_market: ['A ticker symbol holding today\'s price for one stock.', 'But a price changes on its own; a variable only changes when your program sets it.'],
    farming: ['A labelled sack that holds this season\'s grain.', 'But a sack holds one kind of grain; a variable can be re-used for anything.'],
    cooking: ['A bowl holding one ingredient until you need it.', 'But a bowl is physical; a variable is just a name pointing at a value.'],
    bollywood: ['A character name that stands for whoever plays the role.', 'But casting is fixed for a film; a variable can be re-assigned any time.'],
    code: ['A named box that holds a value you can read or change.', 'It is exactly that — no caveat needed.'],
    general: ['A labelled box: you put something in, and use the label to get it back.', 'But the box can be emptied and refilled with anything, any time.'],
  });
  concept('function', 'Function', {
    cricket: ['A bowling action: the same run-up motion produces the same delivery.', 'But a bowler tires; a function gives the same output every time for the same input.'],
    share_market: ['A trading rule: inputs go in, a buy/sell decision comes out.', 'But markets are noisy; a function is exact and repeatable.'],
    farming: ['A thresher: raw grain in, clean grain out.', 'But a thresher does one job; a function can be written to do anything.'],
    cooking: ['A recipe step: ingredients in, a part of the dish out.', 'But a recipe step can vary by hand; a function is precise.'],
    bollywood: ['A dialogue exchange: a cue goes in, a fixed reaction comes out.', 'But actors improvise; a function does not.'],
    code: ['A reusable machine: arguments in, a result out — call it as often as you like.', 'It is exactly that.'],
    general: ['A machine: put something in, get something out — every time the same.', 'But only if you give it the same input.'],
  });
  concept('api', 'API', {
    cricket: ['The match rules both teams must follow to interact fairly.', 'But rules are for a whole match; an API is one specific request-and-reply.'],
    share_market: ['The exchange order-window you must place trades through.', 'But you can shout on a trading floor; with an API there is only the one window.'],
    farming: ['The mandi counter: hand over your crop, get a receipt back.', 'But at a mandi you can haggle; an API has fixed, non-negotiable rules.'],
    cooking: ['The kitchen hatch: order ticket in, finished plate out.', 'But you can peek into a kitchen; an API hides everything behind the hatch.'],
    bollywood: ['The casting office you must go through to book a star.', 'But you can meet a star privately; an API is the ONLY allowed door.'],
    code: ['A contract for one program to talk to another: fixed request, fixed reply.', 'It is exactly that.'],
    general: ['A counter with fixed rules: ask the right way, get a reliable answer.', 'But ask the wrong way and you get nothing — the rules are strict.'],
  });
  concept('prompt', 'Prompt', {
    cricket: ['The captain\'s instruction to the bowler before the ball.', 'But a bowler knows the game; the AI only knows what your prompt says — be specific.'],
    share_market: ['Your buy order to the broker: vague order, wrong trade.', 'But a broker asks if unsure; the AI just guesses — so spell it out.'],
    farming: ['Telling the farmhand exactly what to sow and where.', 'But a farmhand has sense; the AI follows words literally.'],
    cooking: ['The order you give the chef — "less spicy, more gravy".', 'But a chef knows your taste; the AI only knows this one order.'],
    bollywood: ['The director\'s brief to the actor for the scene.', 'But an actor brings craft; the AI brings only your words.'],
    code: ['The instruction you type that steers the model\'s output.', 'It is exactly that — phrasing changes the result a lot.'],
    general: ['What you ask Chitti to do — clearer ask, better answer.', 'But the AI cannot read your mind; vague in, vague out.'],
  });
  concept('token', 'Token', {
    cricket: ['A single run — a small piece, not the whole over.', 'But runs add up to a score; tokens are PIECES OF WORDS, not whole words.'],
    share_market: ['A single tick of price movement, the smallest step.', 'But ticks are uniform; tokens vary — some are whole words, some sub-words.'],
    farming: ['A single grain, not the whole sack.', 'But grains are identical; tokens differ — "playing" splits into "play" + "ing".'],
    cooking: ['A pinch — a sub-part of an ingredient.', 'But a pinch is loose; tokens are exact chunks the model counts.'],
    bollywood: ['A single frame, not the whole scene.', 'But frames are equal-length; tokens are not equal-length pieces.'],
    code: ['A sub-word chunk the model reads and counts.', 'It is exactly that — "tokenization" splits text into these chunks.'],
    general: ['A small piece of a word — the AI reads text in these little pieces.', 'But a piece is NOT a whole word; long words become several tokens.'],
  });
  concept('model', 'LLM / model', {
    cricket: ['A seasoned all-rounder who has seen thousands of matches and predicts the next ball.', 'But a player understands the game; a model only predicts the next likely chunk.'],
    share_market: ['A veteran trader pattern-matching decades of charts.', 'But a trader reasons about causes; a model only matches patterns.'],
    farming: ['A farmer who has read the weather for 40 seasons.', 'But the farmer truly understands; the model is a very good guesser.'],
    cooking: ['A master chef who has cooked every dish and knows what comes next.', 'But the chef tastes reality; the model only knows text patterns.'],
    bollywood: ['A versatile actor who has played every role and can improvise any line.', 'But the actor has lived experience; the model has only seen text.'],
    code: ['A trained predictor of the next chunk of text, given everything before it.', 'It is exactly that — prediction, not understanding.'],
    general: ['A very well-read guesser of what word comes next.', 'But it is GUESSING from patterns — it does not truly "know".'],
  });
  concept('embedding', 'Embedding', {
    cricket: ['A player\'s full stat-line turned into coordinates on a chart.', 'But stats are few numbers; an embedding is hundreds of numbers capturing meaning.'],
    share_market: ['A stock\'s risk/return profile written as numbers.', 'But that is 2 numbers; an embedding is a long list capturing nuance.'],
    farming: ['A soil\'s nutrient profile written as numbers.', 'But soil tests measure real things; embeddings are learned, abstract numbers.'],
    cooking: ['A flavour profile — sweet, sour, spicy — as a set of numbers.', 'But flavour is a few axes; embeddings have hundreds of hidden axes.'],
    bollywood: ['An actor\'s "vibe" plotted on hidden axes.', 'But a vibe is a feeling; an embedding is exact, measurable numbers.'],
    code: ['A vector of numbers that captures the MEANING of text.', 'It is exactly that — similar meaning, similar numbers.'],
    general: ['Turning meaning into a list of numbers so a computer can compare it.', 'But the numbers are not human-readable — only distances matter.'],
  });
  concept('vector_search', 'Vector search', {
    cricket: ['Finding the most similar player by comparing their stat coordinates.', 'But you compare a few stats; vector search compares hundreds of numbers at once.'],
    share_market: ['Finding stocks that move alike by comparing their number profiles.', 'But correlation is one measure; vector search uses full meaning-distance.'],
    farming: ['Finding the field whose soil profile is closest to this one.', 'But soil is physical; here "closeness" is distance in number-space.'],
    cooking: ['Finding dishes with the most similar flavour profile.', 'But flavour is tasted; here similarity is pure number distance.'],
    bollywood: ['Finding actors with the most similar screen presence.', 'But presence is judged; vector search is exact nearest-neighbour math.'],
    code: ['Nearest-neighbour lookup: find the items whose vectors are closest.', 'It is exactly that.'],
    general: ['Finding the closest match by "meaning distance", not exact words.', 'But it matches MEANING, so a different wording can still be the closest.'],
  });
  concept('rag', 'RAG (retrieval)', {
    cricket: ['Checking the rulebook before the umpire gives a verdict.', 'But an umpire memorises rules; RAG looks them up fresh each time.'],
    share_market: ['Reading the company\'s filing before you decide to buy.', 'But you keep some knowledge; RAG fetches the document every single time.'],
    farming: ['Consulting the almanac before you sow.', 'But the almanac is fixed; RAG can pull from any documents you give it.'],
    cooking: ['Checking the recipe card before you cook, instead of guessing.', 'But a chef memorises recipes; RAG re-reads to stay accurate.'],
    bollywood: ['Reading the script before shooting the scene, not winging it.', 'But actors learn lines; RAG re-reads so it never makes them up.'],
    code: ['Fetch relevant documents first, then answer ONLY from them.', 'It is exactly that — grounds answers in real sources, cuts hallucination.'],
    general: ['Look it up first, THEN answer — instead of guessing from memory.', 'But it can only answer from what it found; if it is not there, it should say so.'],
  });
  concept('agent', 'Agent', {
    cricket: ['A player who reads the game and decides what to do each ball.', 'But a player has real judgement; an agent only follows learned patterns + rules.'],
    share_market: ['A trader who watches the tape and acts on its own.', 'But a trader is accountable; an agent needs guardrails so it cannot misfire.'],
    farming: ['A farmhand who decides and does the day\'s tasks without being told each step.', 'But a farmhand has common sense; an agent can confidently do the wrong thing.'],
    cooking: ['A sous-chef who plans and executes a whole course.', 'But a sous-chef tastes and corrects; an agent needs checks to catch mistakes.'],
    bollywood: ['An assistant director who runs the set, making calls in the moment.', 'But an AD understands intent; an agent only has its instructions + tools.'],
    code: ['A program that plans, uses tools, and acts in a loop to reach a goal.', 'It is exactly that — and that is why it MUST confirm before risky actions.'],
    general: ['A doer that decides the steps and carries them out for you.', 'But it should always ASK before doing anything important (Chitti Golden Rule).'],
  });
  concept('orchestrator', 'Orchestrator (multi-agent)', {
    cricket: ['The captain setting the field and rotating the bowlers.', 'But a captain plays too; an orchestrator usually only coordinates, doesn\'t do the work.'],
    share_market: ['A fund manager directing many specialist traders.', 'But traders have their own judgement; agents only do what they are routed.'],
    farming: ['The farm manager assigning each worker a plot and a task.', 'But workers improvise; agents follow their narrow instructions.'],
    cooking: ['The head chef coordinating the line cooks so the courses land together.', 'But the head chef can cook any station; an orchestrator just routes.'],
    bollywood: ['The director coordinating cast and crew toward one film.', 'But a director has vision; an orchestrator follows a fixed plan.'],
    code: ['A coordinator that routes tasks to specialist worker agents and combines results.', 'It is exactly that — the "captain" of a team of agents.'],
    general: ['A boss who splits the work among helpers and puts the answers together.', 'But the boss must check the helpers — they can each make mistakes.'],
  });
  concept('memory', 'Memory / context', {
    cricket: ['What the bowler remembers from earlier in this same over.', 'But a player remembers for years; an AI usually forgets after the conversation.'],
    share_market: ['The open positions you keep in view while trading.', 'But your records persist; AI "context" is limited and temporary.'],
    farming: ['What you recall about this field this season.', 'But your memory carries over years; context is just the current window.'],
    cooking: ['The ingredients already on the counter for this dish.', 'But a pantry persists; context is only what is on the counter right now.'],
    bollywood: ['The earlier scenes the actor must stay consistent with.', 'But actors remember the whole film; context has a size limit.'],
    code: ['The data currently in the model\'s working scope (the context window).', 'It is exactly that — and it has a maximum size (token limit).'],
    general: ['What Chitti is keeping in mind right now, in this chat.', 'But it can only hold so much, and it usually forgets once the chat ends.'],
  });
  concept('fine_tuning', 'Fine-tuning', {
    cricket: ['Net practice to specialise one specific shot.', 'But practice helps the whole player; fine-tuning narrows the model to one job.'],
    share_market: ['Back-testing and tuning a strategy for one sector.', 'But you keep flexibility; over-tuning a model can make it worse elsewhere.'],
    farming: ['Improving the same crop strain over many seasons.', 'But crops improve broadly; fine-tuning is for one narrow purpose.'],
    cooking: ['Tweaking a recipe to your family\'s exact taste.', 'But the dish stays general-purpose; a fine-tuned model gets specialised.'],
    bollywood: ['An actor training hard for one specific role.', 'But the actor can still play others; heavy fine-tuning can hurt general ability.'],
    code: ['Retraining a model\'s weights on extra examples to specialise it.', 'It is exactly that — and often a good prompt or RAG beats fine-tuning.'],
    general: ['Extra targeted practice to make the AI better at one specific thing.', 'But it can make the AI worse at other things — use it carefully.'],
  });
  concept('hallucination', 'Hallucination', {
    cricket: ['Confidently appealing for a wicket that clearly wasn\'t out.', 'But a player can be corrected by replay; you must fact-check the AI yourself.'],
    share_market: ['A confident "hot tip" with no real data behind it.', 'But tips can be checked against filings; always verify AI claims.'],
    farming: ['A "sure sign of rain" that simply doesn\'t come.', 'But weather has signs; AI hallucinations can look perfectly convincing.'],
    cooking: ['Plating a dish that looks right but tastes wrong.', 'But a bad dish is obvious; a hallucination can read as totally plausible.'],
    bollywood: ['A convincing scene that never actually happened in the book.', 'But fiction is labelled; the AI presents made-up facts as if true.'],
    code: ['Output that is fluent and confident but factually wrong.', 'It is exactly that — the #1 reason to use RAG and to verify.'],
    general: ['A confident answer that is actually made up.', 'The danger: it SOUNDS right. Always check important facts.'],
  });

  const DETECT = {
    cricket: ['cricket', 'cricketer', 'batsman', 'bowler', 'ipl'],
    share_market: ['share market', 'stock market', 'stock', 'share', 'trading', 'trader', 'sensex', 'nifty'],
    farming: ['farm', 'farming', 'farmer', 'kheti', 'agriculture', 'crop'],
    cooking: ['cooking', 'kitchen', 'recipe', 'chef', 'khana'],
    bollywood: ['bollywood', 'movie', 'film', 'cinema', 'actor'],
    code: ['code', 'coding', 'programming', 'developer', 'programmer'],
    general: ['simple', 'general', 'plain', 'easy', 'aam bhasha'],
  };
  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim(); }
  function detectDomain(text) {
    const t = norm(text);
    for (const id in DETECT) { if (DETECT[id].some(k => t.includes(k))) return id; }
    return 'general';
  }

  function explain(conceptId, domain) {
    const cid = norm(conceptId).replace(/[\s/]+/g, '_');
    const con = C[cid] || Object.values(C).find(x => norm(x.label).includes(norm(conceptId)) || norm(conceptId).includes(x.id));
    const dom = (DOMAINS.find(d => d.id === domain) ? domain : 'general');
    if (!con) return { concept: String(conceptId), domain: dom, found: false, explanation: 'Chitti has not learned this concept yet.', breaks_down: '' };
    const cell = con.cells[dom] || con.cells.general;
    return {
      concept: con.label, concept_id: con.id, domain: dom,
      domain_label: (DOMAINS.find(d => d.id === dom) || {}).label,
      found: true,
      explanation: cell[0],
      breaks_down: cell[1],
      bounded: true,
    };
  }
  function switchDomain(conceptId, newDomain) { return explain(conceptId, newDomain); }

  const SPK = {
    en: { is: 'In', terms: 'terms:', but: 'But remember,' },
    hi: { is: 'mein', terms: 'ki tarah:', but: 'Lekin yaad rakhein,' },
  };
  function speakable(res, lang) {
    const L = SPK[lang] || SPK.en;
    if (!res.found) return res.explanation;
    return res.concept + ' — ' + L.is + ' ' + res.domain_label + ' ' + L.terms + ' ' + res.explanation + ' ' + L.but + ' ' + res.breaks_down;
  }

  function listConcepts() { return Object.values(C).map(x => ({ id: x.id, label: x.label })); }
  function listDomains() { return DOMAINS.slice(); }

  return { explain, switchDomain, detectDomain, listConcepts, listDomains, speakable, _C: C };
});
