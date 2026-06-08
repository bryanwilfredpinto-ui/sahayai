/* ============================================================================
 * cnai_roadmap_engine.js — Chitti News AI · BO1 Roadmap Engine (v2, REBUILT)
 * ----------------------------------------------------------------------------
 * REBUILD (2026-06-09) after Sire's correct critique: the old engine skipped
 * the real knowledge tree. This version encodes the ACTUAL AI curriculum as a
 * PREREQUISITE KNOWLEDGE GRAPH and attaches a REAL FREE COURSE to every stage
 * (not just a YouTube search).
 *
 * The tree (web-verified June 2026 — DataCamp, KDnuggets, Google ML, fast.ai,
 * Andrew Ng, Hugging Face Agents Course):
 *
 *   Python + Math(Stats->LinAlg->Calculus)
 *        -> Data handling (NumPy/Pandas)
 *        -> CORE ML  (supervised/unsupervised — Andrew Ng ML Spec)
 *        -> DEEP LEARNING (NN/CNN/RNN/Transformers — fast.ai, Ng DL Spec)
 *        -> GENERATIVE AI / LLMs (transformers, RAG — MS GenAI, HF NLP)
 *        -> AGENTIC AI (tools, LangGraph/CrewAI, multi-agent — HF Agents)
 *   Data Analytics branch: Python -> Stats -> SQL -> Viz/BI -> Analytics
 *   Data Science = Data handling + Core ML + Deep Learning + Stats
 *
 * So "Agentic AI" now expands to the FULL 8-stage ladder THROUGH ML and DL —
 * because you cannot build agents well without the stack beneath them.
 *
 * Sources: DeepLearning.AI Math-for-ML, Andrew Ng ML/DL Specializations,
 * fast.ai Practical Deep Learning, Microsoft "Generative AI for Beginners",
 * Hugging Face "AI Agents Course", Google "Data Analytics", roadmap.sh.
 *
 * API (window.ChittiRoadmap / module.exports) — unchanged public surface:
 *   generate(goal, opts) · validate(roadmap) · speakable(roadmap, lang) ·
 *   listKnownGoals() · listTree()
 * ==========================================================================*/
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ChittiRoadmap = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BAND_DOTS = { beginner: '●○○', intermediate: '●●○', advanced: '●●●' };
  const BANDS = ['beginner', 'intermediate', 'advanced'];

  // Real free courses (verified June 2026). free:true = free to learn (cert may
  // be free or paid-audit; noted in `note`).
  const CRS = {
    fcc_python: { provider: 'freeCodeCamp', name: 'Scientific Computing with Python', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', free: true, cert: true },
    kaggle_python: { provider: 'Kaggle Learn', name: 'Python', url: 'https://www.kaggle.com/learn/python', free: true, cert: true },
    math4ml: { provider: 'DeepLearning.AI (Coursera)', name: 'Mathematics for Machine Learning & Data Science', url: 'https://www.coursera.org/specializations/mathematics-for-machine-learning-and-data-science', free: true, cert: false, note: 'free to audit' },
    khan_stats: { provider: 'Khan Academy', name: 'Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability', free: true, cert: false },
    kaggle_pandas: { provider: 'Kaggle Learn', name: 'Pandas + Data Cleaning', url: 'https://www.kaggle.com/learn/pandas', free: true, cert: true },
    elements_ai: { provider: 'Elements of AI (U. Helsinki)', name: 'Introduction to AI', url: 'https://www.elementsofai.com/', free: true, cert: true },
    ng_ml: { provider: 'Andrew Ng / DeepLearning.AI (Coursera)', name: 'Machine Learning Specialization', url: 'https://www.coursera.org/specializations/machine-learning-introduction', free: true, cert: false, note: 'free to audit' },
    google_mlcc: { provider: 'Google', name: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', free: true, cert: false },
    kaggle_ml: { provider: 'Kaggle Learn', name: 'Intro to Machine Learning', url: 'https://www.kaggle.com/learn/intro-to-machine-learning', free: true, cert: true },
    fastai_dl: { provider: 'fast.ai', name: 'Practical Deep Learning for Coders', url: 'https://course.fast.ai/', free: true, cert: false, note: '100% free' },
    ng_dl: { provider: 'Andrew Ng / DeepLearning.AI (Coursera)', name: 'Deep Learning Specialization', url: 'https://www.coursera.org/specializations/deep-learning', free: true, cert: false, note: 'free to audit' },
    ms_genai: { provider: 'Microsoft', name: 'Generative AI for Beginners', url: 'https://microsoft.github.io/generative-ai-for-beginners/', free: true, cert: false },
    hf_nlp: { provider: 'Hugging Face', name: 'LLM / NLP Course', url: 'https://huggingface.co/learn/nlp-course', free: true, cert: true },
    anthropic_prompt: { provider: 'Anthropic Academy', name: 'Prompt Engineering', url: 'https://www.anthropic.com/learn', free: true, cert: false },
    hf_agents: { provider: 'Hugging Face', name: 'AI Agents Course', url: 'https://huggingface.co/learn/agents-course', free: true, cert: true },
    dlai_langgraph: { provider: 'DeepLearning.AI (Coursera)', name: 'AI Agents in LangGraph', url: 'https://www.coursera.org/projects/ai-agents-in-langgraph', free: true, cert: false, note: 'free to audit' },
    kaggle_sql: { provider: 'Kaggle Learn', name: 'Intro to SQL', url: 'https://www.kaggle.com/learn/intro-to-sql', free: true, cert: true },
    ms_powerbi: { provider: 'Microsoft Learn', name: 'Power BI data analyst path', url: 'https://learn.microsoft.com/training/powerplatform/power-bi', free: true, cert: false },
    google_da: { provider: 'Google (Coursera)', name: 'Google Data Analytics Certificate', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', free: true, cert: false, note: 'free to audit' },
    ibm_ds: { provider: 'IBM (Coursera)', name: 'IBM Data Science Professional Certificate', url: 'https://www.coursera.org/professional-certificates/ibm-data-science', free: true, cert: false, note: 'free to audit' },
    fcc_web: { provider: 'freeCodeCamp', name: 'Responsive Web Design + JavaScript', url: 'https://www.freecodecamp.org/learn/', free: true, cert: true },
    odin: { provider: 'The Odin Project', name: 'Full Stack Path', url: 'https://www.theodinproject.com/', free: true, cert: false },
  };

  function t(name, why, hours, yt, check, band) { return { name, why_it_matters: why, est_hours: hours, youtube_search_term: yt, check, difficulty_band: band }; }

  // ── The knowledge graph: each module is a stage; prereq[] are module ids. ──
  const M = {
    python_basics: {
      name: 'Python Programming', band: 'beginner', prereq: [], course: CRS.fcc_python,
      why: 'Python is the language of all AI, ML and data work — everything below is built on it.',
      milestone: 'Build a small Python program (e.g. a calculator) and run it',
      topics: [
        t('Syntax, variables, data types', 'The vocabulary of all code.', 6, 'python full course for beginners 2026', 'Write a program that swaps two variables', 'beginner'),
        t('Control flow & functions', 'How programs decide, repeat, and reuse logic.', 6, 'python functions loops tutorial', 'Write a function that returns factorial of n', 'beginner'),
        t('Lists, dicts & files', 'Store and read real data.', 6, 'python data structures files tutorial', 'Read a CSV and print a summary', 'beginner'),
      ],
    },
    math_for_ml: {
      name: 'Math for ML (Stats → Linear Algebra → Calculus)', band: 'beginner', prereq: [], course: CRS.math4ml,
      why: 'ML is applied math. Statistics first (evaluate models), then linear algebra (data = matrices), then calculus (how models learn).',
      milestone: 'Explain mean/variance, a matrix, and gradient descent in your own words',
      topics: [
        t('Statistics & probability', 'The first math of ML — describe data and judge results.', 10, 'statistics for machine learning tutorial', 'Compute mean, variance and a probability by hand', 'beginner'),
        t('Linear algebra (vectors & matrices)', 'Data and models ARE matrices.', 8, 'linear algebra for machine learning', 'Multiply two matrices on paper', 'intermediate'),
        t('Calculus & gradient descent (intuition)', 'How a model "learns" by minimising error.', 6, 'gradient descent explained intuition', 'Explain why the gradient points downhill', 'intermediate'),
      ],
    },
    data_handling: {
      name: 'Data Handling (NumPy & Pandas)', band: 'beginner', prereq: ['python_basics'], course: CRS.kaggle_pandas,
      why: 'Real data is messy. Before any ML you must load, clean and explore it.',
      milestone: 'Clean a messy real dataset into a tidy table',
      topics: [
        t('NumPy arrays', 'Fast numeric computation — the base of every ML library.', 5, 'numpy tutorial for beginners', 'Create and reshape a NumPy array', 'beginner'),
        t('Pandas (load, filter, group)', 'The spreadsheet, supercharged.', 7, 'pandas data analysis tutorial', 'Group-by and aggregate a real dataset', 'intermediate'),
        t('Data cleaning & EDA', 'Garbage in, garbage out — clean first.', 6, 'data cleaning exploratory data analysis tutorial', 'Handle missing values + plot a distribution', 'intermediate'),
      ],
    },
    ai_literacy: {
      name: 'AI Literacy (what AI is & is not)', band: 'beginner', prereq: [], course: CRS.elements_ai,
      why: 'A clear mental model of AI/ML/DL/GenAI prevents wrong turns later.',
      milestone: 'Draw the AI > ML > Deep Learning > GenAI/Agentic tree from memory',
      topics: [
        t('AI vs ML vs Deep Learning vs GenAI', 'The hierarchy: every layer sits inside the one above.', 4, 'AI vs ML vs deep learning vs generative AI explained', 'Explain how the four nest inside each other', 'beginner'),
        t('What AI can and cannot do', 'Set honest expectations; spot hype.', 3, 'what AI can and cannot do 2026', 'List 3 things AI is bad at', 'beginner'),
      ],
    },
    prompting: {
      name: 'Prompt Engineering', band: 'beginner', prereq: ['ai_literacy'], course: CRS.anthropic_prompt,
      why: 'The fastest-payback AI skill, and the steering wheel for every LLM and agent.',
      milestone: 'Write a prompt that reliably returns valid JSON',
      topics: [
        t('Clear instructions, roles, examples', 'The #1 lever for better output.', 4, 'prompt engineering tutorial 2026', 'Rewrite a vague prompt to be specific', 'beginner'),
        t('Few-shot & chain-of-thought', 'Show, and make the model reason step by step.', 4, 'few shot chain of thought prompting', 'Force step-by-step reasoning on a problem', 'intermediate'),
        t('Structured output (JSON)', 'Make AI output a program can use.', 3, 'prompt structured json output tutorial', 'Get the model to always return valid JSON', 'intermediate'),
      ],
    },
    core_ml: {
      name: 'Core Machine Learning', band: 'intermediate', prereq: ['python_basics', 'math_for_ml', 'data_handling'], course: CRS.ng_ml,
      why: 'The heart of AI: teach a computer from data. You CANNOT skip this on the way to deep learning or agents.',
      milestone: 'Train and evaluate a model on a real dataset (e.g. Titanic)',
      topics: [
        t('Supervised learning (regression, classification)', 'Predict a number or a label from examples.', 10, 'supervised learning machine learning tutorial', 'Train a classifier and report its accuracy', 'intermediate'),
        t('Unsupervised learning (clustering)', 'Find structure with no labels.', 6, 'kmeans clustering tutorial', 'Cluster a dataset and interpret the groups', 'intermediate'),
        t('Model evaluation & overfitting', 'Know if your model actually works.', 6, 'overfitting train test split cross validation', 'Use a train/test split + explain overfitting', 'intermediate'),
        t('Feature engineering', 'Better inputs beat fancier models.', 5, 'feature engineering tutorial', 'Create 2 new features and measure the lift', 'advanced'),
      ],
    },
    deep_learning: {
      name: 'Deep Learning (Neural Networks)', band: 'advanced', prereq: ['core_ml'], course: CRS.fastai_dl,
      why: 'The backbone of all modern Generative and Agentic AI — neural networks, CNNs, RNNs and Transformers.',
      milestone: 'Train a neural network (e.g. an image classifier) end-to-end',
      topics: [
        t('Neural networks & backprop', 'How deep models learn.', 8, 'neural network backpropagation explained', 'Train a small NN on a toy dataset', 'advanced'),
        t('CNNs (vision)', 'How computers see images.', 7, 'convolutional neural network tutorial', 'Train an image classifier with fast.ai', 'advanced'),
        t('RNNs / sequences', 'Handling sequences before Transformers.', 6, 'recurrent neural network LSTM tutorial', 'Build a simple sequence model', 'advanced'),
        t('Transformers (the big one)', 'The architecture behind every LLM.', 8, 'transformer architecture explained attention', 'Explain self-attention in plain words', 'advanced'),
      ],
    },
    genai_llms: {
      name: 'Generative AI & LLMs', band: 'advanced', prereq: ['deep_learning'], course: CRS.ms_genai,
      why: 'Built on Transformers: large language models, embeddings, retrieval (RAG) and diffusion — the layer most "AI" products live in.',
      milestone: 'Build a Q&A bot over your own documents (RAG)',
      topics: [
        t('LLMs & tokenisation', 'How models read and generate text.', 5, 'how large language models work explained', 'Explain what a token is + why context limits exist', 'advanced'),
        t('Embeddings & vector search', 'How AI recalls the right facts by meaning.', 6, 'embeddings vector database tutorial', 'Store docs + retrieve the most similar one', 'advanced'),
        t('RAG (retrieval augmented generation)', 'Ground answers in real sources, cut hallucination.', 6, 'RAG retrieval augmented generation tutorial', 'Answer a question from a retrieved document', 'advanced'),
        t('Fine-tuning vs prompting vs RAG', 'Know which tool to reach for.', 4, 'fine tuning vs rag vs prompting', 'Pick the right approach for a given task', 'advanced'),
      ],
    },
    agentic_ai: {
      name: 'Agentic AI (AI Agents)', band: 'advanced', prereq: ['genai_llms', 'prompting'], course: CRS.hf_agents,
      why: 'The 2026 frontier: LLMs that plan, use tools and act in a loop — and teams of them. Built ON TOP of everything above.',
      milestone: 'Ship a multi-agent app with tools + guardrails',
      topics: [
        t('Tool / function calling', 'Let the model take real actions.', 5, 'llm function calling tools tutorial', 'Make the model call a function', 'advanced'),
        t('Agent loop (reason → act → observe)', 'The heartbeat of every agent (ReAct).', 6, 'AI agent ReAct loop tutorial', 'Build a loop that retries on a failed tool', 'advanced'),
        t('Frameworks (LangGraph / CrewAI / smolagents)', 'Do not reinvent the plumbing.', 7, 'langgraph crewai agents tutorial', 'Recreate your loop in a framework', 'advanced'),
        t('Multi-agent orchestration + guardrails', 'A team of agents — safely (confirm before acting).', 7, 'multi agent orchestration guardrails tutorial', 'Route a task between two agents with a safety check', 'advanced'),
      ],
    },
    sql: {
      name: 'SQL & Databases', band: 'beginner', prereq: [], course: CRS.kaggle_sql,
      why: 'Almost all real-world data lives in databases; SQL is how you get it.',
      milestone: 'Answer 5 business questions with SQL queries',
      topics: [
        t('SELECT, filter, sort', 'Pull exactly the rows you need.', 5, 'SQL tutorial for beginners', 'Find the top 10 customers by spend', 'beginner'),
        t('Joins & aggregation', 'Combine tables and summarise.', 5, 'SQL joins group by tutorial', 'Join two tables and total by group', 'intermediate'),
      ],
    },
    viz_bi: {
      name: 'Visualisation & BI', band: 'intermediate', prereq: ['data_handling'], course: CRS.ms_powerbi,
      why: 'Insight is useless until a decision-maker can see it.',
      milestone: 'Build a 1-page KPI dashboard',
      topics: [
        t('Charts that tell the truth', 'Pick the right chart; avoid misleading ones.', 4, 'data visualization best practices tutorial', 'Plot a trend with clear labels', 'beginner'),
        t('Dashboards (Power BI / Looker)', 'Put insight in front of people.', 6, 'power bi dashboard tutorial', 'Build a 1-page dashboard', 'intermediate'),
      ],
    },
    data_analytics: {
      name: 'Data Analytics (end-to-end)', band: 'intermediate', prereq: ['math_for_ml', 'data_handling', 'sql', 'viz_bi'], course: CRS.google_da,
      why: 'Turn raw data into decisions: the analyst track (lighter math than data science).',
      milestone: 'Deliver an analysis that drives one real decision',
      topics: [
        t('The analytics workflow', 'Ask → get → clean → analyse → communicate.', 5, 'data analytics process tutorial', 'Run one question end-to-end', 'intermediate'),
        t('Data storytelling', 'Turn numbers into a "so what".', 4, 'data storytelling tutorial', 'Write a 3-bullet insight from your analysis', 'intermediate'),
      ],
    },
    data_science: {
      name: 'Data Science (capstone)', band: 'advanced', prereq: ['core_ml', 'deep_learning'], course: CRS.ibm_ds,
      why: 'The full scientist track: statistics + ML + deep learning applied to real problems.',
      milestone: 'Ship an end-to-end data-science project with a model + write-up',
      topics: [
        t('End-to-end ML project', 'From raw data to a deployed prediction.', 10, 'end to end machine learning project tutorial', 'Build + evaluate a full project', 'advanced'),
        t('Communicating results', 'A model nobody understands is useless.', 4, 'communicate data science results', 'Present your project in 3 slides', 'advanced'),
      ],
    },
    // Non-AI track: web development
    web_basics: {
      name: 'Web Basics (HTML/CSS/JS)', band: 'beginner', prereq: [], course: CRS.fcc_web,
      why: 'Every website is HTML, CSS and JavaScript underneath.',
      milestone: 'Build and style a responsive personal homepage',
      topics: [
        t('HTML & CSS', 'Structure and style.', 8, 'HTML CSS full course beginners', 'Build a responsive page at 375px', 'beginner'),
        t('JavaScript', 'Make pages interactive.', 10, 'javascript full course beginners', 'Build a button that counts clicks', 'beginner'),
      ],
    },
    web_fullstack: {
      name: 'Full-Stack Web', band: 'intermediate', prereq: ['web_basics'], course: CRS.odin,
      why: 'A real app: front end, back end and a database.',
      milestone: 'Deploy a full-stack app to the internet',
      topics: [
        t('Frontend framework (React)', 'Build app-like UIs.', 10, 'react tutorial for beginners 2026', 'Build a to-do app with components', 'intermediate'),
        t('Backend + database + deploy', 'Store data and ship it.', 10, 'build deploy full stack app tutorial', 'Deploy front + back end to a free host', 'intermediate'),
      ],
    },
  };

  // Goal → target module id (the destination; prerequisites are auto-included).
  const TARGET = {
    'ai': 'genai_llms', 'artificial intelligence': 'genai_llms', 'learn ai': 'genai_llms',
    'machine learning': 'core_ml', 'ml': 'core_ml',
    'deep learning': 'deep_learning', 'dl': 'deep_learning', 'neural networks': 'deep_learning',
    'generative ai': 'genai_llms', 'genai': 'genai_llms', 'gen ai': 'genai_llms', 'llm': 'genai_llms', 'llms': 'genai_llms', 'large language models': 'genai_llms',
    'agentic ai': 'agentic_ai', 'ai agents': 'agentic_ai', 'agents': 'agentic_ai', 'ai agent': 'agentic_ai', 'agent': 'agentic_ai',
    'data analysis': 'data_analytics', 'data analytics': 'data_analytics', 'analytics': 'data_analytics', 'data analyst': 'data_analytics',
    'data science': 'data_science', 'data scientist': 'data_science',
    'python': 'data_handling', 'python programming': 'data_handling', 'learn python': 'data_handling', 'python developer': 'python_basics',
    'prompt engineering': 'prompting', 'prompting': 'prompting', 'prompts': 'prompting',
    'sql': 'sql', 'databases': 'sql',
    'web development': 'web_fullstack', 'web dev': 'web_fullstack', 'full stack': 'web_fullstack', 'frontend': 'web_basics', 'website': 'web_fullstack',
  };
  const TITLE = {
    genai_llms: 'Generative AI & LLMs — Full Path', core_ml: 'Machine Learning — Full Path',
    deep_learning: 'Deep Learning — Full Path', agentic_ai: 'Agentic AI — Full Path (through ML & Deep Learning)',
    data_analytics: 'Data Analytics — Full Path', data_science: 'Data Science — Full Path',
    data_handling: 'Python for Data & AI', python_basics: 'Python Developer', prompting: 'Prompt Engineering',
    sql: 'SQL & Databases', web_fullstack: 'Full-Stack Web Development', web_basics: 'Web Development Basics',
  };

  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim().replace(/\s+/g, ' '); }
  function resolveTarget(goal) {
    const g = norm(goal);
    if (TARGET[g]) return TARGET[g];
    // Word-boundary match (longest key first) so short keys like "ai" never
    // match "rAIse" / "tAIloring". Only whole-word/phrase hits count.
    const keys = Object.keys(TARGET).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('\\b' + esc + '\\b').test(g)) return TARGET[k];
    }
    return null;
  }

  // Transitive prerequisite closure + topological (Kahn) order.
  function orderedModules(targetId) {
    const need = new Set();
    (function collect(id) { if (need.has(id)) return; need.add(id); (M[id].prereq || []).forEach(collect); })(targetId);
    const ids = [...need];
    const order = [];
    const indeg = {};
    ids.forEach(id => { indeg[id] = (M[id].prereq || []).filter(p => need.has(p)).length; });
    // stable Kahn: repeatedly take zero-indegree in a fixed canonical order
    const CANON = ['ai_literacy', 'python_basics', 'math_for_ml', 'sql', 'web_basics', 'data_handling', 'prompting', 'viz_bi', 'core_ml', 'deep_learning', 'data_analytics', 'genai_llms', 'data_science', 'agentic_ai', 'web_fullstack'];
    const remaining = new Set(ids);
    while (remaining.size) {
      const ready = CANON.filter(id => remaining.has(id) && (M[id].prereq || []).filter(p => remaining.has(p)).length === 0);
      const next = ready.length ? ready : [...remaining];
      for (const id of next) { order.push(id); remaining.delete(id); }
    }
    return order;
  }

  function assemble(goal, targetId) {
    const ids = orderedModules(targetId);
    const idToStage = {}; ids.forEach((id, i) => { idToStage[id] = 'stage-' + (i + 1); });
    const stages = ids.map((id, i) => {
      const m = M[id];
      const topics = m.topics.map((tp, j) => ({
        id: 's' + (i + 1) + '-t' + (j + 1), order: j + 1, name: tp.name, why_it_matters: tp.why_it_matters,
        difficulty_band: tp.difficulty_band, difficulty_dots: BAND_DOTS[tp.difficulty_band] || BAND_DOTS.beginner,
        est_hours: tp.est_hours, youtube_search_term: tp.youtube_search_term, check: tp.check,
      }));
      return {
        id: 'stage-' + (i + 1), order: i + 1, module_id: id, name: m.name, why_it_matters: m.why,
        difficulty_band: m.band, difficulty_dots: BAND_DOTS[m.band] || BAND_DOTS.beginner, milestone: m.milestone,
        prerequisites: (m.prereq || []).filter(p => idToStage[p]).map(p => idToStage[p]),
        course: { provider: m.course.provider, name: m.course.name, url: m.course.url, free: m.course.free, cert: !!m.course.cert, note: m.course.note || '' },
        est_hours: topics.reduce((a, x) => a + x.est_hours, 0), topics,
      };
    });
    const total = stages.reduce((a, s) => a + s.est_hours, 0);
    return {
      goal: String(goal), title: (TITLE[targetId] || M[targetId].name), target: targetId, generic: false,
      total_est_hours: total, total_stages: stages.length, total_topics: stages.reduce((a, s) => a + s.topics.length, 0),
      total_courses: stages.length, difficulty_band: stages[0] ? stages[0].difficulty_band : 'beginner',
      tree_note: targetId === 'agentic_ai' ? 'Agentic AI sits inside GenAI ⊂ Deep Learning ⊂ Machine Learning ⊂ AI — so this path takes you through the whole stack.' : '',
      stages, generated_by: 'cnai_roadmap_engine v2 (knowledge-graph; real free course per stage)',
    };
  }

  // ── Generic generator for ANY non-graph goal (improved; still real course-ish) ──
  function titleCase(s) { return norm(s).replace(/\b\w/g, c => c.toUpperCase()); }
  function genericRoadmap(goal) {
    const g = norm(goal) || 'your goal'; const T = titleCase(g); const yt = (x) => (g + ' ' + x).trim();
    const generic = (name, why, milestone, band, prereqIdx, topics) => ({ name, why, milestone, band, prereqIdx, topics });
    const raw = [
      generic('Understand the Basics', 'Learn the core vocabulary of ' + T + ' first.', 'Explain ' + T + ' to someone else', 'beginner', [], [
        t('What is ' + T + '?', 'A clear mental model prevents wrong turns.', 3, yt('explained for beginners'), 'Write 3 sentences on what ' + T + ' is', 'beginner'),
        t('Key terms', 'Every field has its own words.', 3, yt('basics terms glossary'), 'List 5 key terms', 'beginner'),
      ]),
      generic('Core Skills', 'The hands-on skills at the heart of ' + T + '.', 'Complete one guided ' + T + ' exercise', 'beginner', [0], [
        t('Core technique 1', 'The most-used skill.', 5, yt('tutorial step by step'), 'Reproduce one full example', 'beginner'),
        t('Common free tools', 'Use what the experts use.', 4, yt('best free tools'), 'Try one free tool', 'intermediate'),
      ]),
      generic('Practise', 'Practice turns knowledge into skill.', 'Solve 3 real ' + T + ' problems', 'intermediate', [1], [
        t('Worked examples', 'See how experts work.', 5, yt('worked examples walkthrough'), 'Re-solve one with a change', 'intermediate'),
      ]),
      generic('Build a Project', 'Building proves you learned ' + T + '.', 'Ship one small ' + T + ' project', 'advanced', [2], [
        t('Plan & build', 'Scope small, finish it.', 8, yt('full project tutorial'), 'Finish version 1', 'advanced'),
      ]),
    ];
    const stages = raw.map((s, i) => ({
      id: 'stage-' + (i + 1), order: i + 1, module_id: 'generic-' + (i + 1), name: s.name, why_it_matters: s.why,
      difficulty_band: s.band, difficulty_dots: BAND_DOTS[s.band], milestone: s.milestone,
      prerequisites: s.prereqIdx.map(x => 'stage-' + (x + 1)),
      course: { provider: 'YouTube + free web', name: 'Search "' + g + ' free course"', url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(g + ' free course'), free: true, cert: false, note: 'no curated course yet for this goal' },
      est_hours: s.topics.reduce((a, x) => a + x.est_hours, 0),
      topics: s.topics.map((tp, j) => ({ id: 's' + (i + 1) + '-t' + (j + 1), order: j + 1, name: tp.name, why_it_matters: tp.why_it_matters, difficulty_band: tp.difficulty_band, difficulty_dots: BAND_DOTS[tp.difficulty_band], est_hours: tp.est_hours, youtube_search_term: tp.youtube_search_term, check: tp.check })),
    }));
    return { goal: String(goal), title: T + ' — A Beginner-to-Confident Roadmap', target: null, generic: true, total_est_hours: stages.reduce((a, s) => a + s.est_hours, 0), total_stages: stages.length, total_topics: stages.reduce((a, s) => a + s.topics.length, 0), total_courses: stages.length, difficulty_band: 'beginner', tree_note: '', stages, generated_by: 'cnai_roadmap_engine v2 (generic)' };
  }

  function generate(goal, opts) {
    const targetId = resolveTarget(goal);
    return targetId ? assemble(goal, targetId) : genericRoadmap(goal);
  }

  function validate(rm) {
    const errors = [];
    if (!rm || !Array.isArray(rm.stages) || rm.stages.length < 1) { errors.push('roadmap must have at least 1 stage'); return { ok: false, errors }; }
    rm.stages.forEach((s, i) => { if (s.order !== i + 1) errors.push('stage order not contiguous at ' + i); });
    const ord = {}; rm.stages.forEach(s => { ord[s.id] = s.order; });
    rm.stages.forEach(s => {
      (s.prerequisites || []).forEach(p => {
        if (!(p in ord)) errors.push(s.id + ' unknown prereq ' + p);
        else if (ord[p] >= s.order) errors.push(s.id + ' depends on ' + p + ' which is not earlier (foundations-first violated)');
      });
      if (!s.name) errors.push(s.id + ' missing name');
      if (!s.milestone) errors.push(s.id + ' missing milestone');
      if (!s.course || !s.course.url) errors.push(s.id + ' missing course');
      if (!Array.isArray(s.topics) || !s.topics.length) errors.push(s.id + ' no topics');
      (s.topics || []).forEach(tp => { if (!tp.youtube_search_term) errors.push(s.id + '/' + tp.id + ' no youtube'); if (!BANDS.includes(tp.difficulty_band)) errors.push(s.id + '/' + tp.id + ' bad band'); });
    });
    if ((rm.stages[0].prerequisites || []).length) errors.push('first stage must have no prerequisites');
    return { ok: errors.length === 0, errors };
  }

  const SPK = {
    en: { intro: 'Here is your roadmap for', stages: 'It has', sw: 'stages', about: 'about', hours: 'hours total', stage: 'Stage', of: 'of', why: 'Why', course: 'Free course', from: 'from', milestone: 'Milestone' },
    hi: { intro: 'यह आपका रोडमैप है', stages: 'इसमें', sw: 'चरण', about: 'लगभग', hours: 'घंटे', stage: 'चरण', of: 'में से', why: 'क्यों', course: 'मुफ़्त कोर्स', from: 'से', milestone: 'लक्ष्य' },
  };
  function speakable(rm, lang) {
    const L = SPK[lang] || SPK.en; const out = [];
    out.push(L.intro + ' ' + rm.title + '. ' + L.stages + ' ' + rm.total_stages + ' ' + L.sw + ', ' + L.about + ' ' + rm.total_est_hours + ' ' + L.hours + '.');
    if (rm.tree_note) out.push(rm.tree_note);
    rm.stages.forEach(s => {
      out.push(L.stage + ' ' + s.order + ' ' + L.of + ' ' + rm.total_stages + ': ' + s.name + '. ' + L.why + ': ' + s.why_it_matters + ' ' + L.course + ': ' + s.course.name + ' ' + L.from + ' ' + s.course.provider + '. ' + L.milestone + ': ' + s.milestone + '.');
    });
    return out.join(' ');
  }

  function listKnownGoals() { return Object.keys(TARGET); }
  function listTree() {
    return Object.keys(M).map(id => ({ id, name: M[id].name, prereq: M[id].prereq, course: M[id].course.provider + ' — ' + M[id].course.name }));
  }

  return { generate, validate, speakable, listKnownGoals, listTree, BANDS, _M: M, _CRS: CRS };
});
