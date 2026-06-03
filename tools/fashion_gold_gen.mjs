#!/usr/bin/env node
/**
 * tools/fashion_gold_gen.mjs — generate the 1000-case GOLD outfit dataset.
 * Ground-truth labels come from a CURATED archetype table (independent of the
 * engine's scorer), so the gold eval measures the engine for real, not itself.
 * Output: chitti-fashion/evals/datasets/gold_outfits.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'chitti-fashion', 'evals', 'datasets');
mkdirSync(DIR, { recursive: true });

// Curated archetypes: each has obvious human ground-truth occasion + colour-harmony + season.
// occasion bands used by the engine: wedding, festive, formal, business-casual, smart-casual, casual
const ARCH = [
  // casual
  { occ: 'casual', items: [['top', 'grey t-shirt'], ['bottom', 'blue jeans'], ['footwear', 'white sneakers']] },
  { occ: 'casual', items: [['top', 'black hoodie'], ['bottom', 'track pants'], ['footwear', 'sneakers']] },
  { occ: 'casual', items: [['top', 'printed tshirt'], ['bottom', 'shorts'], ['footwear', 'flip flops']] },
  // smart-casual
  { occ: 'smart-casual', items: [['top', 'blue casual shirt'], ['bottom', 'blue jeans'], ['footwear', 'brown sandals']] },
  { occ: 'smart-casual', items: [['top', 'pastel kurti'], ['bottom', 'white palazzo'], ['footwear', 'juttis']] },
  // business-casual (the user's canonical example: blazer + shirt + sneakers)
  { occ: 'business-casual', items: [['top', 'navy blazer'], ['top', 'white formal shirt'], ['footwear', 'black sneakers']] },
  { occ: 'business-casual', items: [['top', 'blue formal shirt'], ['bottom', 'beige chinos'], ['footwear', 'brown loafers']] },
  // formal
  { occ: 'formal', items: [['top', 'black formal shirt'], ['bottom', 'charcoal trousers'], ['footwear', 'black oxfords']] },
  { occ: 'formal', items: [['outfit', 'grey suit'], ['footwear', 'oxfords']] },
  // festive
  { occ: 'festive', items: [['top', 'gold kurta'], ['bottom', 'cream churidar'], ['footwear', 'juttis'], ['jewellery', 'studs']] },
  { occ: 'festive', items: [['outfit', 'maroon anarkali'], ['dupatta', 'gold dupatta'], ['jewellery', 'jhumka']] },
  // wedding
  { occ: 'wedding', items: [['outfit', 'navy sherwani'], ['footwear', 'juttis']] },
  { occ: 'wedding', items: [['outfit', 'red silk saree'], ['jewellery', 'temple set'], ['footwear', 'gold heels']] },
];
// Colour variants to multiply cases (keep label stable; colour only affects harmony field)
const COLOURS = ['blue', 'white', 'black', 'beige', 'grey', 'maroon', 'green', 'navy', 'cream', 'olive'];
const SEASONS = ['summer', 'winter', 'all'];

// harmony ground-truth: derived from colour families present in the case (curated, simple)
const NEUTRAL = ['white', 'black', 'grey', 'beige', 'navy', 'cream', 'brown', 'charcoal', 'tan'];
function fam(c) { return NEUTRAL.some(n => c.includes(n)) ? 'neutral' : 'colour'; }

const pad = (n) => String(n).padStart(4, '0');
const cases = [];
let i = 1;
while (cases.length < 1000) {
  const a = ARCH[i % ARCH.length];
  const cv = COLOURS[i % COLOURS.length];
  const season = SEASONS[i % SEASONS.length];
  // build items; tint the first garment with the colour variant for harmony diversity
  const items = a.items.map((it, idx) => ({ category: it[0], colour: idx === 0 ? cv : it[1].split(' ')[0], desc: it[1] }));
  // ground-truth harmony: count non-neutral families
  const colours = items.map(x => x.colour);
  const brights = colours.filter(c => !NEUTRAL.some(n => c.includes(n)) && /(red|orange|yellow|pink|green|maroon|olive)/.test(c)).length;
  const neutrals = colours.filter(c => NEUTRAL.some(n => c.includes(n))).length;
  let harmony = 'ok';
  if (brights >= 2 && neutrals === 0) harmony = 'competing';
  else if (neutrals >= 1 && brights <= 1) harmony = 'good';
  else harmony = 'ok';
  // ground-truth season suitability: archetype heuristic
  const hay = items.map(x => x.desc).join(' ');
  let gtSeason = 'all';
  if (/linen|cotton|sandal|shorts|tshirt|t-shirt|palazzo/.test(hay)) gtSeason = 'summer';
  if (/wool|jacket|sweater|boot|suit|sherwani/.test(hay)) gtSeason = 'winter';
  cases.push({
    id: 'G' + pad(cases.length + 1),
    items,
    expected: { occasion: a.occ, color_harmony: harmony, season_fit: gtSeason },
  });
  i++;
}
writeFileSync(resolve(DIR, 'gold_outfits.json'), JSON.stringify(cases));
console.log('gold_outfits.json written: ' + cases.length + ' cases -> ' + DIR);
