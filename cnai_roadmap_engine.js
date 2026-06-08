/* ============================================================================
 * cnai_roadmap_engine.js — Chitti News AI · Build Order 1 · Roadmap Engine
 * ----------------------------------------------------------------------------
 * Deterministic, offline, LLM-free roadmap generator. Given ANY learning goal
 * (a known skill OR a free-text profession/goal), it returns a step-by-step
 * ordered roadmap: Stages -> Topics -> a YouTube SEARCH TERM per topic (never a
 * hardcoded URL - survives dead links) + a verifiable milestone per stage.
 *
 * Doctrine (per chitti-news-ai): rules are the product, the LLM is an
 * enhancement. This engine works with every LLM provider offline.
 *
 * Research (see chitti-news-ai/features/BO1_ROADMAP_ENGINE.md):
 *   - roadmap.sh / MathAcademy  -> model topics as a prerequisite DAG; order =
 *     topological sort; REFUSE to place advanced stages before foundations.
 *   - freeCodeCamp              -> milestone = a BUILT artifact, not "watched".
 *   - Khan Academy / Duolingo   -> foundations first; gate whole stage-rows.
 *   - DataCamp / Brilliant      -> one concept per topic, gentle difficulty ramp.
 *   - roadmap.sh AI / Coursera Coach -> free-text goal -> generated ordered path.
 *   - Accessibility             -> every roadmap is fully SPEAKABLE top-to-bottom.
 *
 * Public API (window.ChittiRoadmap / module.exports):
 *   generate(goal, opts)     -> roadmap object (schema below)
 *   validate(roadmap)        -> { ok, errors[] }
 *   speakable(roadmap, lang) -> string, audio-first
 *   listKnownGoals()         -> string[]
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiRoadmap = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BANDS = ['beginner', 'intermediate', 'advanced'];
  const BAND_DOTS = { beginner: '●○○', intermediate: '●●○', advanced: '●●●' };

  function topic(name, why, hours, yt, check, band) {
    return { name, why_it_matters: why, est_hours: hours, youtube_search_term: yt, check, difficulty_band: band || 'beginner' };
  }
  function stage(name, why, milestone, band, topics, prereqIdx) {
    return { name, why_it_matters: why, milestone, difficulty_band: band, topics, _prereq: prereqIdx || [] };
  }

  const KB = {
    'python': {
      title: 'Python Developer - Zero to Advanced',
      stages: [
        stage('Foundations', 'Every AI and data tool is built on Python basics.', 'Build a command-line calculator from scratch', 'beginner', [
          topic('Syntax, variables & data types', 'The vocabulary of all code.', 4, 'python full course for beginners 2026', 'Write a program that swaps two variables', 'beginner'),
          topic('Control flow (if / loops)', 'How a program makes decisions and repeats work.', 4, 'python if else loops tutorial', 'Print the FizzBuzz sequence 1-100', 'beginner'),
          topic('Functions & scope', 'Reusable building blocks; the foundation of clean code.', 4, 'python functions tutorial beginners', 'Write a function that returns the factorial of n', 'beginner'),
        ], []),
        stage('Core Programming', 'Structure real programs and reuse other code.', 'Build a contacts app that saves to a file', 'beginner', [
          topic('Data structures (list/dict/set)', 'How real data is stored and looked up fast.', 5, 'python data structures list dict set', 'Count word frequency in a paragraph using a dict', 'beginner'),
          topic('OOP (classes & objects)', 'Model real-world things in code.', 6, 'python OOP tutorial classes objects', 'Model a BankAccount class with deposit/withdraw', 'intermediate'),
          topic('Modules, pip & virtualenv', 'Use the millions of free packages others built.', 4, 'python pip virtualenv tutorial', 'Install requests and fetch a web page', 'intermediate'),
        ], [0]),
        stage('Working with Data & APIs', 'Connect Python to the real world: files, web, data.', 'Build a weather CLI that calls a public API', 'intermediate', [
          topic('Files & exceptions', 'Read/write data and handle errors gracefully.', 4, 'python file handling exceptions tutorial', 'Read a CSV and print the average of a column', 'intermediate'),
          topic('REST APIs with requests', 'Talk to any web service.', 5, 'python REST API requests tutorial', 'Fetch and print weather from a free API', 'intermediate'),
          topic('Pandas & NumPy basics', 'The workhorses of data analysis and AI prep.', 8, 'pandas numpy data analysis tutorial', 'Load a dataset and compute group-by summaries', 'intermediate'),
        ], [1]),
        stage('Professional Python', 'Ship code others can trust and run.', 'Publish a small package with tests on GitHub', 'advanced', [
          topic('Git & GitHub', 'Version control - the universal team workflow.', 4, 'git and github tutorial for beginners', 'Push a project with a clean commit history', 'intermediate'),
          topic('Testing (pytest)', 'Prove your code works and keep it working.', 5, 'python pytest tutorial', 'Write 5 passing tests for your calculator', 'advanced'),
          topic('Packaging & deployment', 'Get your code running for real users.', 5, 'python packaging deployment tutorial', 'Deploy a Flask app to a free host', 'advanced'),
        ], [2]),
      ],
    },
    'agentic ai': {
      title: 'Agentic AI - Build AI Agents',
      stages: [
        stage('Python & AI Foundations', 'You cannot build agents without Python and basic AI literacy.', 'Call an LLM API from a Python script', 'beginner', [
          topic('Python essentials', 'The language every agent framework uses.', 8, 'python full course for beginners 2026', 'Write a script that loops over a list of prompts', 'beginner'),
          topic('What is an LLM (intuition)', 'Understand what the model can and cannot do.', 3, 'how large language models work explained', 'Explain in 3 lines what a token is', 'beginner'),
          topic('Calling an LLM API', 'The single most important agent skill.', 4, 'call openai api python tutorial', 'Get a JSON answer back from an LLM call', 'beginner'),
        ], []),
        stage('Prompting & RAG', 'Agents are only as good as their prompts and their memory.', 'Build a Q&A bot over your own documents', 'intermediate', [
          topic('Prompt engineering', 'Steer the model reliably.', 5, 'prompt engineering tutorial 2026', 'Write a prompt that always returns valid JSON', 'intermediate'),
          topic('Embeddings & vector search', 'How agents recall the right facts.', 6, 'embeddings vector database tutorial', 'Store 10 docs and retrieve the most similar one', 'intermediate'),
          topic('RAG (retrieval augmented generation)', 'Ground answers in real sources, not hallucination.', 6, 'RAG retrieval augmented generation tutorial', 'Answer a question using a retrieved document', 'intermediate'),
        ], [0]),
        stage('Tools & Single Agents', 'An agent that can DO things, not just talk.', 'Build an agent that uses a calculator + web tool', 'intermediate', [
          topic('Tool / function calling', 'Let the model take real actions.', 5, 'llm function calling tools tutorial', 'Make the model call a weather function', 'intermediate'),
          topic('Agent loop (reason-act-observe)', 'The heartbeat of every agent.', 6, 'AI agent reasoning loop ReAct tutorial', 'Build a loop that retries on a failed tool call', 'advanced'),
          topic('Frameworks (LangGraph / LangChain)', 'Do not reinvent the plumbing.', 6, 'langgraph tutorial build agent', 'Recreate your loop using a framework', 'advanced'),
        ], [1]),
        stage('Multi-Agent & Production', 'Orchestrate a TEAM of agents and ship safely.', 'Ship a multi-agent app with guardrails + evals', 'advanced', [
          topic('Orchestration (multi-agent)', 'A captain coordinating specialist agents.', 7, 'multi agent orchestration tutorial', 'Route a task between a planner and a worker agent', 'advanced'),
          topic('Guardrails & safety', 'Stop agents doing harmful or wrong actions.', 5, 'ai agent guardrails safety tutorial', 'Block an agent from a forbidden action', 'advanced'),
          topic('Evals & observability', 'Measure if your agent actually works.', 5, 'llm evals observability tutorial', 'Score your agent on 10 test tasks', 'advanced'),
        ], [2]),
      ],
    },
    'data analysis': {
      title: 'Data Analysis - Spreadsheet to Insight',
      stages: [
        stage('Data Foundations', 'You must read data before you can analyse it.', 'Clean a messy spreadsheet into a tidy table', 'beginner', [
          topic('Spreadsheets (Excel / Sheets)', 'Where most real-world data lives.', 5, 'excel for data analysis beginners', 'Build a pivot table from sales data', 'beginner'),
          topic('Descriptive statistics', 'Mean, median, spread - the language of data.', 4, 'statistics for data analysis basics', 'Describe a dataset in 3 numbers', 'beginner'),
          topic('Data cleaning', 'Real data is messy; clean it first.', 4, 'data cleaning tutorial beginners', 'Remove duplicates and fix missing values', 'beginner'),
        ], []),
        stage('SQL & Querying', 'Answer questions from databases directly.', 'Answer 5 business questions with SQL', 'intermediate', [
          topic('SQL SELECT & filters', 'Pull exactly the rows you need.', 5, 'SQL tutorial for beginners', 'Find the top 10 customers by spend', 'intermediate'),
          topic('Joins & aggregation', 'Combine tables and summarise.', 5, 'SQL joins group by tutorial', 'Join orders + customers and total by region', 'intermediate'),
        ], [0]),
        stage('Python for Data', 'Scale beyond what a spreadsheet can do.', 'Analyse a 100k-row dataset in Pandas', 'intermediate', [
          topic('Pandas', 'The spreadsheet, supercharged.', 8, 'pandas data analysis tutorial', 'Group-by and aggregate a real dataset', 'intermediate'),
          topic('Visualisation (Matplotlib)', 'A picture answers faster than a table.', 5, 'matplotlib data visualization tutorial', 'Plot a trend line with labels', 'intermediate'),
        ], [1]),
        stage('Insight & Storytelling', 'Data is useless until someone acts on it.', 'Present a dashboard that drives one decision', 'advanced', [
          topic('Dashboards (Power BI / Looker)', 'Put insight in front of decision-makers.', 6, 'power bi dashboard tutorial', 'Build a 1-page KPI dashboard', 'advanced'),
          topic('Data storytelling', 'Turn numbers into a decision.', 4, 'data storytelling tutorial', 'Write a 3-bullet so-what from your dashboard', 'advanced'),
        ], [2]),
      ],
    },
    'web development': {
      title: 'Web Development - Zero to Full-Stack',
      stages: [
        stage('The Web Basics', 'Every site is HTML, CSS, and JavaScript underneath.', 'Build and style a personal homepage', 'beginner', [
          topic('HTML', 'The skeleton of every page.', 4, 'HTML full course beginners', 'Build a page with headings, links and an image', 'beginner'),
          topic('CSS & layout', 'Make it look good and work on mobile.', 6, 'CSS flexbox grid tutorial', 'Make your page responsive at 375px', 'beginner'),
          topic('JavaScript basics', 'Make pages interactive.', 8, 'javascript full course beginners', 'Build a button that counts clicks', 'beginner'),
        ], []),
        stage('Frontend', 'Build modern, app-like interfaces.', 'Build a to-do app with a framework', 'intermediate', [
          topic('DOM & events', 'How JS talks to the page.', 5, 'javascript DOM manipulation tutorial', 'Add and remove list items on click', 'intermediate'),
          topic('A framework (React)', 'Build UIs without spaghetti.', 8, 'react tutorial for beginners 2026', 'Build a to-do app with components', 'intermediate'),
        ], [0]),
        stage('Backend & Data', 'Store data and serve it to your app.', 'Build a REST API with a database', 'intermediate', [
          topic('Node / Flask server', 'Run code on a server, not just the browser.', 6, 'build REST API tutorial', 'Serve a /health endpoint that returns JSON', 'intermediate'),
          topic('Databases', 'Remember data between visits.', 6, 'SQL database tutorial web app', 'Save and read users from a database', 'intermediate'),
        ], [1]),
        stage('Ship It', 'A real app others can use.', 'Deploy a full-stack app to the internet', 'advanced', [
          topic('Auth & security basics', 'Protect users and their data.', 5, 'web authentication tutorial', 'Add login to your app', 'advanced'),
          topic('Deployment', 'Put it online for free.', 4, 'deploy web app free tutorial', 'Deploy front + back end to a free host', 'advanced'),
        ], [2]),
      ],
    },
    'prompt engineering': {
      title: 'Prompt Engineering - Talk to AI Like a Pro',
      stages: [
        stage('Foundations', 'Understand what a prompt actually does.', 'Write 5 prompts that get reliable answers', 'beginner', [
          topic('How LLMs read prompts', 'Know why phrasing changes the answer.', 3, 'how large language models work explained', 'Explain what a token is in one line', 'beginner'),
          topic('Clear instructions & roles', 'The number-one lever for better output.', 4, 'prompt engineering basics tutorial', 'Rewrite a vague prompt to be specific', 'beginner'),
        ], []),
        stage('Techniques', 'The proven patterns that lift quality.', 'Solve a hard task with few-shot + chain-of-thought', 'intermediate', [
          topic('Few-shot examples', 'Show, do not just tell.', 4, 'few shot prompting tutorial', 'Add 2 examples to steer the format', 'intermediate'),
          topic('Chain-of-thought & structure', 'Make the model reason step by step.', 4, 'chain of thought prompting tutorial', 'Force step-by-step reasoning on a word problem', 'intermediate'),
          topic('Structured output (JSON)', 'Make AI output a program can use.', 4, 'prompt structured json output tutorial', 'Get the model to always return valid JSON', 'intermediate'),
        ], [0]),
        stage('Applied', 'Use prompting inside real workflows.', 'Build a reusable prompt template for a real task', 'advanced', [
          topic('Prompt templates & variables', 'Reuse prompts at scale.', 4, 'prompt template variables tutorial', 'Template a prompt with 3 fill-in fields', 'advanced'),
          topic('Evaluating prompts', 'Know which prompt is actually better.', 4, 'evaluate prompts ab testing llm', 'A/B test two prompts on 10 inputs', 'advanced'),
        ], [1]),
      ],
    },
  };

  const ALIASES = {
    'python': 'python', 'python programming': 'python', 'learn python': 'python', 'python developer': 'python',
    'agentic ai': 'agentic ai', 'ai agents': 'agentic ai', 'agent': 'agentic ai', 'ai agent': 'agentic ai', 'agents': 'agentic ai',
    'data analysis': 'data analysis', 'data analyst': 'data analysis', 'analytics': 'data analysis', 'data analytics': 'data analysis',
    'web development': 'web development', 'web dev': 'web development', 'full stack': 'web development', 'frontend': 'web development', 'website': 'web development',
    'prompt engineering': 'prompt engineering', 'prompting': 'prompt engineering', 'prompts': 'prompt engineering',
  };

  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim().replace(/\s+/g, ' '); }

  function resolveKey(goal) {
    const g = norm(goal);
    if (ALIASES[g]) return ALIASES[g];
    const keys = Object.keys(ALIASES).sort((a, b) => b.length - a.length);
    for (const k of keys) { if (g.includes(k)) return ALIASES[k]; }
    return null;
  }

  function titleCase(s) { return norm(s).replace(/\b\w/g, c => c.toUpperCase()); }

  function genericRoadmap(goal) {
    const g = norm(goal) || 'your goal';
    const T = titleCase(g);
    const yt = (suffix) => (g + ' ' + suffix).trim();
    return {
      title: T + ' - A Beginner-to-Confident Roadmap',
      _generic: true,
      stages: [
        stage('Understand the Basics', 'You need the core vocabulary of ' + T + ' before anything else.', 'Explain ' + T + ' in your own words to someone else', 'beginner', [
          topic('What is ' + T + '? (overview)', 'A clear mental model prevents wrong turns later.', 3, yt('explained for beginners'), 'Write 3 sentences describing what ' + T + ' is', 'beginner'),
          topic('Key terms in ' + T, 'Every field has its own words; learn them first.', 3, yt('basics terms glossary'), 'List 5 important terms and what they mean', 'beginner'),
          topic('Who uses ' + T + ' and why', 'Knowing the why keeps you motivated.', 2, yt('real world uses examples'), 'Name 2 real situations where ' + T + ' helps', 'beginner'),
        ], []),
        stage('Learn the Core Skills', 'These are the hands-on skills at the heart of ' + T + '.', 'Complete one guided ' + T + ' exercise end-to-end', 'beginner', [
          topic('Core technique 1', 'The most-used skill; practise it first.', 5, yt('tutorial step by step'), 'Follow along and reproduce one full example', 'beginner'),
          topic('Core technique 2', 'The second pillar; builds on the first.', 5, yt('intermediate tutorial'), 'Do the example again without looking', 'intermediate'),
          topic('Common tools for ' + T, 'Use the tools the experts use.', 4, yt('best free tools'), 'Try one free tool and note what it does', 'intermediate'),
        ], [0]),
        stage('Practise on Real Examples', 'Practice turns knowledge into skill.', 'Solve 3 real ' + T + ' problems on your own', 'intermediate', [
          topic('Worked examples', 'See how experts approach real problems.', 5, yt('worked examples walkthrough'), 'Re-solve one example with a small change', 'intermediate'),
          topic('Common mistakes & fixes', 'Avoiding mistakes is half the skill.', 4, yt('common mistakes beginners'), 'List 3 mistakes and how to avoid them', 'intermediate'),
        ], [1]),
        stage('Build Your Own Project', 'Building something real proves you have learned ' + T + '.', 'Ship one small ' + T + ' project you are proud of', 'advanced', [
          topic('Plan a small project', 'Scope it small so you actually finish.', 3, yt('beginner project ideas'), 'Write down what your project will do', 'advanced'),
          topic('Build and improve it', 'Iteration is where real learning happens.', 8, yt('full project tutorial'), 'Finish version 1, then improve one thing', 'advanced'),
          topic('Share & get feedback', 'Feedback accelerates the next loop.', 2, yt('how to get feedback on project'), 'Show it to one person and note their feedback', 'advanced'),
        ], [2]),
      ],
    };
  }

  function assemble(goal, raw) {
    const stages = raw.stages.map((s, i) => {
      const topics = s.topics.map((t, j) => ({
        id: 's' + (i + 1) + '-t' + (j + 1),
        order: j + 1,
        name: t.name,
        why_it_matters: t.why_it_matters,
        difficulty_band: t.difficulty_band,
        difficulty_dots: BAND_DOTS[t.difficulty_band] || BAND_DOTS.beginner,
        est_hours: t.est_hours,
        youtube_search_term: t.youtube_search_term,
        check: t.check,
      }));
      return {
        id: 'stage-' + (i + 1),
        order: i + 1,
        name: s.name,
        why_it_matters: s.why_it_matters,
        difficulty_band: s.difficulty_band,
        difficulty_dots: BAND_DOTS[s.difficulty_band] || BAND_DOTS.beginner,
        milestone: s.milestone,
        prerequisites: (s._prereq || []).map(idx => 'stage-' + (idx + 1)),
        est_hours: topics.reduce((a, t) => a + (t.est_hours || 0), 0),
        topics,
      };
    });
    const total = stages.reduce((a, s) => a + s.est_hours, 0);
    return {
      goal: String(goal),
      title: raw.title,
      generic: !!raw._generic,
      total_est_hours: total,
      total_stages: stages.length,
      total_topics: stages.reduce((a, s) => a + s.topics.length, 0),
      difficulty_band: 'beginner',
      stages,
      generated_by: 'cnai_roadmap_engine (deterministic, no LLM)',
    };
  }

  function generate(goal, opts) {
    opts = opts || {};
    const key = resolveKey(goal);
    const raw = key ? KB[key] : genericRoadmap(goal);
    return assemble(goal, raw);
  }

  function validate(rm) {
    const errors = [];
    if (!rm || !Array.isArray(rm.stages) || rm.stages.length < 2) {
      errors.push('roadmap must have at least 2 stages');
      return { ok: false, errors };
    }
    const orders = rm.stages.map(s => s.order);
    orders.forEach((o, i) => { if (o !== i + 1) errors.push('stage order not contiguous at index ' + i + ' (got ' + o + ')'); });
    const idToOrder = {};
    rm.stages.forEach(s => { idToOrder[s.id] = s.order; });
    rm.stages.forEach(s => {
      (s.prerequisites || []).forEach(p => {
        if (!(p in idToOrder)) errors.push(s.id + ' has unknown prerequisite ' + p);
        else if (idToOrder[p] >= s.order) errors.push(s.id + ' depends on ' + p + ' which is not earlier (foundations-first violated)');
      });
      if (!s.name) errors.push(s.id + ' missing name');
      if (!s.milestone) errors.push(s.id + ' missing milestone (must be a built artifact)');
      if (!s.why_it_matters) errors.push(s.id + ' missing why_it_matters');
      if (!Array.isArray(s.topics) || s.topics.length < 1) errors.push(s.id + ' has no topics');
      (s.topics || []).forEach(t => {
        if (!t.name) errors.push(s.id + '/' + t.id + ' missing name');
        if (!t.youtube_search_term) errors.push(s.id + '/' + t.id + ' missing youtube_search_term');
        if (!t.check) errors.push(s.id + '/' + t.id + ' missing check');
        if (!BANDS.includes(t.difficulty_band)) errors.push(s.id + '/' + t.id + ' bad difficulty_band ' + t.difficulty_band);
      });
    });
    if ((rm.stages[0].prerequisites || []).length) errors.push('first stage must have no prerequisites (foundations entry point)');
    return { ok: errors.length === 0, errors };
  }

  // Audio-first narration labels in 9 native-script languages (no Hinglish; proper nouns like
  // YouTube stay English). Missing language → English fallback.
  const SPK = {
    en: { intro: 'Here is your roadmap for', stages: 'It has', stagesWord: 'stages', about: 'about', hours: 'hours total', stage: 'Stage', of: 'of', why: 'Why it matters', topic: 'Topic', search: 'Search YouTube for', milestone: 'Your milestone', band: 'Level' },
    hi: { intro: 'यह आपका रोडमैप है', stages: 'इसमें', stagesWord: 'चरण हैं', about: 'लगभग', hours: 'घंटे कुल', stage: 'चरण', of: 'में से', why: 'यह क्यों ज़रूरी है', topic: 'विषय', search: 'YouTube पर खोजें', milestone: 'आपका लक्ष्य', band: 'स्तर' },
    ta: { intro: 'இது உங்கள் வழித்தடம்', stages: 'இதில்', stagesWord: 'நிலைகள் உள்ளன', about: 'சுமார்', hours: 'மணிநேரம் மொத்தம்', stage: 'நிலை', of: 'இல்', why: 'இது ஏன் முக்கியம்', topic: 'தலைப்பு', search: 'YouTube இல் தேடு', milestone: 'உங்கள் இலக்கு', band: 'நிலை' },
    te: { intro: 'ఇది మీ రోడ్‌మ్యాప్', stages: 'దీనిలో', stagesWord: 'దశలు ఉన్నాయి', about: 'సుమారు', hours: 'గంటలు మొత్తం', stage: 'దశ', of: 'లో', why: 'ఇది ఎందుకు ముఖ్యం', topic: 'అంశం', search: 'YouTube లో వెతకండి', milestone: 'మీ లక్ష్యం', band: 'స్థాయి' },
    bn: { intro: 'এটি আপনার রোডম্যাপ', stages: 'এতে', stagesWord: 'টি ধাপ আছে', about: 'প্রায়', hours: 'ঘণ্টা মোট', stage: 'ধাপ', of: 'এর', why: 'এটি কেন গুরুত্বপূর্ণ', topic: 'বিষয়', search: 'YouTube এ খুঁজুন', milestone: 'আপনার লক্ষ্য', band: 'স্তর' },
    mr: { intro: 'हा तुमचा रोडमॅप आहे', stages: 'यात', stagesWord: 'टप्पे आहेत', about: 'सुमारे', hours: 'तास एकूण', stage: 'टप्पा', of: 'पैकी', why: 'हे का महत्त्वाचे', topic: 'विषय', search: 'YouTube वर शोधा', milestone: 'तुमचे ध्येय', band: 'पातळी' },
    gu: { intro: 'આ તમારો રોડમેપ છે', stages: 'આમાં', stagesWord: 'તબક્કા છે', about: 'આશરે', hours: 'કલાક કુલ', stage: 'તબક્કો', of: 'માંથી', why: 'આ કેમ મહત્વનું', topic: 'વિષય', search: 'YouTube પર શોધો', milestone: 'તમારું લક્ષ્ય', band: 'સ્તર' },
    kn: { intro: 'ಇದು ನಿಮ್ಮ ರೋಡ್‌ಮ್ಯಾಪ್', stages: 'ಇದರಲ್ಲಿ', stagesWord: 'ಹಂತಗಳಿವೆ', about: 'ಸುಮಾರು', hours: 'ಗಂಟೆಗಳು ಒಟ್ಟು', stage: 'ಹಂತ', of: 'ರಲ್ಲಿ', why: 'ಇದು ಏಕೆ ಮುಖ್ಯ', topic: 'ವಿಷಯ', search: 'YouTube ನಲ್ಲಿ ಹುಡುಕಿ', milestone: 'ನಿಮ್ಮ ಗುರಿ', band: 'ಮಟ್ಟ' },
    ml: { intro: 'ഇത് നിങ്ങളുടെ റോഡ്‌മാപ്പ്', stages: 'ഇതിൽ', stagesWord: 'ഘട്ടങ്ങളുണ്ട്', about: 'ഏകദേശം', hours: 'മണിക്കൂർ ആകെ', stage: 'ഘട്ടം', of: 'ൽ', why: 'ഇത് എന്തുകൊണ്ട് പ്രധാനം', topic: 'വിഷയം', search: 'YouTube ൽ തിരയുക', milestone: 'നിങ്ങളുടെ ലക്ഷ്യം', band: 'നില' },
  };
  function speakable(rm, lang) {
    const L = SPK[lang] || SPK.en;
    const out = [];
    out.push(L.intro + ' ' + rm.title + '. ' + L.stages + ' ' + rm.total_stages + ' ' + L.stagesWord + ', ' + L.about + ' ' + rm.total_est_hours + ' ' + L.hours + '.');
    rm.stages.forEach(s => {
      out.push(L.stage + ' ' + s.order + ' ' + L.of + ' ' + rm.total_stages + ': ' + s.name + '. ' + L.band + ': ' + s.difficulty_band + '. ' + L.why + ': ' + s.why_it_matters);
      s.topics.forEach(t => {
        out.push(L.topic + ': ' + t.name + '. ' + t.why_it_matters + ' ' + L.search + ': ' + t.youtube_search_term + '.');
      });
      out.push(L.milestone + ': ' + s.milestone + '.');
    });
    return out.join(' ');
  }

  function listKnownGoals() { return Object.keys(KB); }

  return { generate, validate, speakable, listKnownGoals, BANDS, _KB: KB };
});