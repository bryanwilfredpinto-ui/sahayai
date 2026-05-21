// inspect_chitti_pages.mjs — full handover inspection for the 14 Chitti pages.
//
// For each page:
//   * load via file://
//   * stub fetch to capture POSTs + return 200 OK so the widget thinks it succeeded
//   * stub speechSynthesis.speak + webkitSpeechRecognition so headless doesn't hang
//   * scan every box (a chitti-response / data-chitti-response / heuristic IDs)
//   * verify the 4-icon bar attached
//   * click each icon, verify the behavior
//   * page-level: language selector, QR code, single theme, no sample text
//   * write tools/inspect_report.md (Markdown report card) + .json (raw)
//
// Run: node tools/inspect_chitti_pages.mjs
//
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, basename } from "node:path";
import { writeFileSync, existsSync, readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const PAGES = [
  "chitti_vaani.html",
  "chitti_medupi.html",
  "chitti_news.html",
  "chitti_upi.html",
  "chitti_ca.html",
  "chitti_legal.html",
  "chitti_government.html",
  "chitti_scanner.html",
  "chitti_fundamentals.html",
  "chitti_complete_technical.html",
  "chitti_news_ai.html",
  "chitti_voice_factory.html",
  "chitti_2wheeler.html",
  "chitti_4wheeler.html",
];

// ── stub script — installed before any page script runs ───────────────────
const STUB_SCRIPT = `
  (function () {
    // Capture every fetch POST so we can assert payload shape.
    window.__chitti_fetches = [];
    var realFetch = window.fetch;
    window.fetch = function (url, opts) {
      try {
        var u = (typeof url === 'string') ? url : (url && url.url) || '';
        var method = (opts && opts.method) || 'GET';
        var body = opts && opts.body;
        if (method.toUpperCase() === 'POST') {
          var parsed = null;
          try { parsed = JSON.parse(body); } catch (e) {}
          window.__chitti_fetches.push({ url: u, body: parsed || body });
        }
      } catch (e) {}
      // Return synthetic OK — never let the widget hit real prod.
      return Promise.resolve(new Response('{}', {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
    };
    // Record every speechSynthesis.speak call (text only).
    window.__chitti_spoken = [];
    var realSS = window.speechSynthesis;
    if (realSS) {
      var realSpeak = realSS.speak.bind(realSS);
      realSS.speak = function (utter) {
        try { window.__chitti_spoken.push(String(utter && utter.text || '').slice(0, 200)); } catch (e) {}
        // Don't actually speak (headless has no audio).
      };
    }
    // Stub webkitSpeechRecognition so the 🤖 mic flow doesn't hang.
    function FakeRecognition() { this.lang = 'en-IN'; }
    FakeRecognition.prototype.start = function () {
      // Fire onerror('no-speech') after a tick so the flow completes without input.
      var self = this;
      setTimeout(function () { try { self.onerror && self.onerror({ error: 'no-speech' }); } catch (e) {} }, 30);
    };
    FakeRecognition.prototype.stop = function () {};
    if (!window.SpeechRecognition) window.SpeechRecognition = FakeRecognition;
    if (!window.webkitSpeechRecognition) window.webkitSpeechRecognition = FakeRecognition;
    // First-visit modal might block clicks; pre-fill localStorage with a profile.
    try {
      if (!localStorage.getItem('chitti_disability_profile')) {
        localStorage.setItem('chitti_disability_profile', JSON.stringify({
          profile: { blind: false, deaf: false, mute: false, isl: false, illiterate: false, elderly: false, mobility: false, cognitive: false, rural: false, none: true },
          lang: 'en',
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (e) {}
  })();
`;

function ts() { return new Date().toISOString().replace("T", " ").slice(0, 19); }

async function inspectPage(browser, htmlName) {
  const path = join(ROOT, htmlName);
  if (!existsSync(path)) {
    return { page: htmlName, fatal: "missing file" };
  }
  const url = pathToFileURL(path).href;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript({ content: STUB_SCRIPT });

  const errors = [];
  const consoleErrors = [];
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Let widget MutationObserver settle.
    await page.waitForTimeout(900);
  } catch (e) {
    await ctx.close();
    return { page: htmlName, fatal: "navigation: " + e.message, errors, consoleErrors };
  }

  // ── page-level checks ───────────────────────────────────────────────────
  const pageChecks = await page.evaluate(() => {
    const out = {};
    out.title = document.title || "";
    out.feedbackWidgetLoaded = !!window.__chittiFeedbackWidgetLoaded;
    out.a11yLoaded = !!(window.Chitti && window.Chitti.a11y);
    out.langSelector = !!document.querySelector(
      'select[id*="lang" i], select[name*="lang" i], [data-chitti-lang], button[id*="lang" i], #chitti-lang-select, .lang-toggle-bharat'
    );
    out.qrCode = !!document.querySelector(
      'img[src*="qr" i], img[alt*="qr" i], svg[class*="qr" i], canvas[id*="qr" i], [data-qr], .qr-code, #qr, #qr-code'
    );
    out.disclaimer = !!document.querySelector(
      '[class*="disclaim" i], [id*="disclaim" i], [class*="sebi" i]'
    );
    out.feedbackWidgetEl = !!document.querySelector(".chitti-fb-wrap");

    // Detect sample/placeholder text. We treat "Lorem ipsum" + "TODO" as fails.
    const bodyText = document.body.innerText || "";
    out.lorem = /lorem\s+ipsum/i.test(bodyText);
    out.todoMark = /\bTODO\b|\bFIXME\b/.test(bodyText);

    // Theme — count distinct primary brand colors across cards.
    const cards = document.querySelectorAll(
      ".section-card, .card, .feat-card, .metric-card, .status-card, .coming-soon-card, [data-chitti-response], .chitti-response"
    );
    const palette = new Set();
    const fonts = new Set();
    Array.from(cards).slice(0, 80).forEach(el => {
      const cs = getComputedStyle(el);
      palette.add((cs.borderColor || "") + "|" + (cs.backgroundColor || ""));
      fonts.add(cs.fontFamily || "");
    });
    out.paletteCount = palette.size;
    out.fontFamilyCount = fonts.size;

    return out;
  });

  // ── box-level checks ────────────────────────────────────────────────────
  const BOX_SELECTOR = [
    "[data-chitti-response]",
    ".chitti-response",
    "#reply", "#response", "#answer", "#result", "#output",
    "#reply-card", "#response-card", "#answer-card", "#result-card", "#output-card",
    "#reply-box", "#response-box", "#answer-box", "#result-box", "#output-box",
    "[id$='-reply']", "[id$='-response']", "[id$='-answer']", "[id$='-result']", "[id$='-output']",
  ].join(", ");

  const boxIds = await page.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(sel).forEach(b => {
      const text = (b.innerText || b.textContent || "").trim();
      // Generate a stable ID if missing — same logic as the widget.
      if (!b.id && !b.dataset.chittiBoxId) {
        b.setAttribute("data-chitti-box-id", "chitti-box-test-" + Math.random().toString(36).slice(2, 9));
      }
      const id = b.id || b.dataset.chittiBoxId;
      const section = b.getAttribute("data-chitti-section") || "";
      out.push({ id, section, hasText: text.length > 0, textPreview: text.slice(0, 60) });
    });
    return out;
  }, BOX_SELECTOR);

  const boxResults = [];
  let totalBoxes = 0;
  let testableBoxes = 0;
  let pass4Icon = 0, passSpeak = 0, passAsk = 0, passUp = 0, passDown = 0, passModalSubmit = 0;

  for (const meta of boxIds) {
    totalBoxes += 1;
    const r = { ...meta, has_bar: false, btn4: false, click: {} };
    if (!meta.hasText) {
      // Widget intentionally skips empty boxes. Not a fail.
      r.note = "empty (widget will attach when content loads)";
      boxResults.push(r);
      continue;
    }
    testableBoxes += 1;
    // Locate the bar: sibling AFTER the box element.
    const bar = await page.evaluateHandle(({ id }) => {
      const box = document.getElementById(id) ||
                  document.querySelector('[data-chitti-box-id="' + id + '"]');
      if (!box) return null;
      const next = box.nextElementSibling;
      if (next && next.classList && next.classList.contains("chitti-fb-box-bar") &&
          next.getAttribute("data-for-box") === id) return next;
      return null;
    }, { id: meta.id });

    const barExists = await bar.evaluate(b => !!b);
    r.has_bar = barExists;
    if (!barExists) {
      boxResults.push(r);
      continue;
    }
    // Verify 4 buttons exist on the bar.
    const fourPresent = await bar.evaluate(b => {
      const acts = ["speak", "ask", "up", "down"];
      return acts.every(a => !!b.querySelector('[data-act="' + a + '"]'));
    });
    r.btn4 = fourPresent;
    if (fourPresent) pass4Icon += 1;
    if (!fourPresent) {
      boxResults.push(r);
      continue;
    }

    // Click 🔊
    await page.evaluate(({ id }) => {
      const bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
      bar.querySelector('[data-act="speak"]').click();
    }, { id: meta.id });
    await page.waitForTimeout(80);
    const spokeN = await page.evaluate(() => window.__chitti_spoken.length);
    r.click.speak = spokeN > 0;
    if (r.click.speak) passSpeak += 1;

    // Click 🤖
    const spokeBefore = spokeN;
    await page.evaluate(({ id }) => {
      const bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
      bar.querySelector('[data-act="ask"]').click();
    }, { id: meta.id });
    // ask flow speaks then waits 900ms then listens; we just verify the speak fired.
    await page.waitForTimeout(150);
    const spokeAfter = await page.evaluate(() => window.__chitti_spoken.length);
    r.click.ask = spokeAfter > spokeBefore;
    if (r.click.ask) passAsk += 1;

    // Click 👍
    const fetchBefore = await page.evaluate(() => window.__chitti_fetches.length);
    await page.evaluate(({ id }) => {
      const bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
      bar.querySelector('[data-act="up"]').click();
    }, { id: meta.id });
    await page.waitForTimeout(120);
    const upActive = await page.evaluate(({ id }) => {
      const bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
      return bar.querySelector('[data-act="up"]').classList.contains("active");
    }, { id: meta.id });
    const fetchAfterUp = await page.evaluate(() => window.__chitti_fetches.length);
    r.click.up = upActive && fetchAfterUp > fetchBefore;
    if (r.click.up) passUp += 1;

    // Click 👎 + modal submit
    await page.evaluate(({ id }) => {
      const bar = document.querySelector('.chitti-fb-box-bar[data-for-box="' + id + '"]');
      bar.querySelector('[data-act="down"]').click();
    }, { id: meta.id });
    await page.waitForTimeout(120);
    const modalOpen = await page.evaluate(() => {
      const m = document.getElementById("chitti-fb-box-modal-bg");
      return m && m.classList.contains("show");
    });
    r.click.down_modal = !!modalOpen;
    if (r.click.down_modal) passDown += 1;
    if (modalOpen) {
      const fetchBeforeSubmit = await page.evaluate(() => window.__chitti_fetches.length);
      await page.evaluate(() => {
        const m = document.getElementById("chitti-fb-box-modal-bg");
        m.querySelector("#chitti-fb-box-text").value = "test feedback";
        m.querySelector(".chitti-fb-box-submit").click();
      });
      await page.waitForTimeout(180);
      const modalClosed = await page.evaluate(() => {
        const m = document.getElementById("chitti-fb-box-modal-bg");
        return !m.classList.contains("show");
      });
      const fetchAfterSubmit = await page.evaluate(() => window.__chitti_fetches.length);
      r.click.submit = modalClosed && fetchAfterSubmit > fetchBeforeSubmit;
      if (r.click.submit) passModalSubmit += 1;
    } else {
      r.click.submit = false;
    }
    boxResults.push(r);
  }

  await ctx.close();
  return {
    page: htmlName,
    page_checks: pageChecks,
    box_totals: {
      total: totalBoxes,
      testable: testableBoxes,
      pass_4icon: pass4Icon,
      pass_speak: passSpeak,
      pass_ask: passAsk,
      pass_up: passUp,
      pass_down: passDown,
      pass_submit: passModalSubmit,
    },
    boxes: boxResults,
    errors,
    consoleErrors: consoleErrors.slice(0, 20),
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Chitti Pages — Handover Inspection Report Card");
  lines.push("");
  lines.push("Generated: " + ts() + " IST · Inspector: tools/inspect_chitti_pages.mjs");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Page | Boxes (testable / total) | 4-icon | 🔊 | 🤖 | 👍 | 👎 modal | submit | Lang | QR | Single theme | No samples | Overall |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of report.pages) {
    if (r.fatal) {
      lines.push(`| **${r.page}** | — | — | — | — | — | — | — | — | — | — | — | ❌ FATAL: ${r.fatal} |`);
      continue;
    }
    const bt = r.box_totals;
    const pc = r.page_checks;
    const cell = (n, d) => d === 0 ? "—" : (n === d ? `✅ ${n}/${d}` : `❌ ${n}/${d}`);
    const yn = (b) => b ? "✅" : "❌";
    const singleTheme = pc.fontFamilyCount <= 3 ? "✅" : `❌ (${pc.fontFamilyCount} families)`;
    const noSamples = (!pc.lorem && !pc.todoMark) ? "✅" : "❌";
    const allBoxPass = bt.testable > 0 &&
      bt.pass_4icon === bt.testable && bt.pass_speak === bt.testable &&
      bt.pass_ask === bt.testable && bt.pass_up === bt.testable &&
      bt.pass_down === bt.testable && bt.pass_submit === bt.testable;
    const pageOk = allBoxPass && pc.langSelector && pc.qrCode && pc.fontFamilyCount <= 3 && !pc.lorem && !pc.todoMark;
    lines.push(
      `| ${r.page} | ${bt.testable}/${bt.total} | ${cell(bt.pass_4icon, bt.testable)} | ${cell(bt.pass_speak, bt.testable)} | ${cell(bt.pass_ask, bt.testable)} | ${cell(bt.pass_up, bt.testable)} | ${cell(bt.pass_down, bt.testable)} | ${cell(bt.pass_submit, bt.testable)} | ${yn(pc.langSelector)} | ${yn(pc.qrCode)} | ${singleTheme} | ${noSamples} | ${pageOk ? "✅" : "❌"} |`
    );
  }
  lines.push("");
  lines.push("## Per-page detail");
  lines.push("");
  for (const r of report.pages) {
    lines.push(`### ${r.page}`);
    if (r.fatal) {
      lines.push(`- **FATAL**: ${r.fatal}`);
      lines.push("");
      continue;
    }
    const pc = r.page_checks;
    lines.push(`- Feedback widget loaded: ${pc.feedbackWidgetLoaded ? "✅" : "❌"}`);
    lines.push(`- chitti_a11y.js loaded: ${pc.a11yLoaded ? "✅" : "❌"}`);
    lines.push(`- Language selector present: ${pc.langSelector ? "✅" : "❌"}`);
    lines.push(`- QR code present: ${pc.qrCode ? "✅" : "❌"}`);
    lines.push(`- Disclaimer present: ${pc.disclaimer ? "✅" : "❌"}`);
    lines.push(`- Font families on cards: ${pc.fontFamilyCount} ${pc.fontFamilyCount <= 3 ? "✅" : "❌"}`);
    lines.push(`- Sample text (lorem/TODO): ${(pc.lorem || pc.todoMark) ? "❌" : "✅ none"}`);
    if (r.errors && r.errors.length) {
      lines.push(`- JS errors: ${r.errors.length}`);
      for (const e of r.errors.slice(0, 5)) lines.push(`  - ${e.slice(0, 200)}`);
    }
    // Failing boxes only
    const fails = (r.boxes || []).filter(b => b.hasText && (!b.has_bar || !b.btn4 || !b.click.speak || !b.click.ask || !b.click.up || !b.click.down_modal || !b.click.submit));
    if (fails.length) {
      lines.push(`- Failing boxes: ${fails.length}`);
      for (const b of fails.slice(0, 20)) {
        const f = [];
        if (!b.has_bar) f.push("no widget bar");
        if (!b.btn4) f.push("missing 4 icons");
        if (!b.click.speak) f.push("🔊");
        if (!b.click.ask) f.push("🤖");
        if (!b.click.up) f.push("👍");
        if (!b.click.down_modal) f.push("👎 modal");
        if (!b.click.submit) f.push("submit");
        lines.push(`  - \`${b.id}\` ("${b.section || b.textPreview}") — ${f.join(", ")}`);
      }
      if (fails.length > 20) lines.push(`  - …and ${fails.length - 20} more`);
    } else {
      lines.push(`- All ${r.box_totals.testable} testable boxes ✅`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const pages = [];
  for (const name of PAGES) {
    process.stdout.write(`Inspecting ${name} …`);
    const t0 = Date.now();
    const r = await inspectPage(browser, name);
    const ms = Date.now() - t0;
    pages.push(r);
    if (r.fatal) {
      process.stdout.write(` ❌ ${r.fatal} (${ms} ms)\n`);
    } else {
      const bt = r.box_totals;
      const pc = r.page_checks;
      const ok = bt.testable > 0 && bt.pass_4icon === bt.testable && bt.pass_speak === bt.testable && bt.pass_ask === bt.testable && bt.pass_up === bt.testable && bt.pass_down === bt.testable && bt.pass_submit === bt.testable && pc.langSelector && pc.qrCode;
      process.stdout.write(` ${ok ? "✅" : "❌"}  boxes ${bt.pass_4icon}/${bt.testable} · lang ${pc.langSelector ? "✅" : "❌"} · QR ${pc.qrCode ? "✅" : "❌"} (${ms} ms)\n`);
    }
  }
  await browser.close();
  const report = { generated_at: ts(), pages };
  writeFileSync(join(__dirname, "inspect_report.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(__dirname, "inspect_report.md"), renderMarkdown(report));
  console.log("\nWrote tools/inspect_report.md + .json");
}

main().catch(e => { console.error(e); process.exit(1); });
