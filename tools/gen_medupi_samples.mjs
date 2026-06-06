// tools/gen_medupi_samples.mjs — write 25 REAL MedUPI sample files (5 categories × 5).
// Each sample is a real medicine that exists in the production seed
// (chitti-medupi/backend/data/medicines_seed.json) so the deterministic
// same-composition engine returns a genuine match. These are fixtures committed
// to test_samples/medupi/; the harness (test_medupi_samples.py) globs them with
// NO hardcoded list.
import { mkdirSync, writeFileSync } from 'node:fs';
const ROOT = 'test_samples/medupi';

const samples = {
  prescriptions: [
    { id: 'rx_fever_child', raw: 'Dr. R. Sharma, MBBS — Rx: Tab Crocin 650 (Paracetamol 650mg) 1-0-1 x 3 days for fever.', query: { brand: 'Crocin 650', molecule: 'Paracetamol', strength: '650mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'rx_bp_amlodipine', raw: 'Apollo Clinic — Rx: Tab Amlong 5 (Amlodipine 5mg) once daily, lifelong, review in 3 months.', query: { brand: 'Amlong 5', molecule: 'Amlodipine', strength: '5mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'rx_throat_antibiotic', raw: 'ENT note — Rx: Tab Augmentin 625 (Amoxicillin+Clavulanic Acid 500+125mg) BD x 5 days.', query: { brand: 'Augmentin 625', molecule: 'Amoxicillin+Clavulanic Acid', strength: '500+125mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'rx_thyroid', raw: 'Endocrinology — Rx: Tab Thyronorm 50mcg (Levothyroxine 50mcg) empty stomach, daily.', query: { brand: 'Thyronorm 50mcg', molecule: 'Levothyroxine', strength: '50mcg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'rx_acidity', raw: 'GP — Rx: Tab Pan 40 (Pantoprazole 40mg) 1 before breakfast x 14 days.', query: { brand: 'Pan 40', molecule: 'Pantoprazole', strength: '40mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
  ],
  medicine_strips: [
    { id: 'strip_dolo650', raw: 'Strip label: DOLO 650 | Paracetamol IP 650mg | Tablet | Mfg: Micro Labs | B.No DL2291 | Exp 08/2027 | MRP ₹30.00', query: { brand: 'Dolo 650', molecule: 'Paracetamol', strength: '650mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'strip_azee500', raw: 'Strip label: AZEE 500 | Azithromycin 500mg | Tablet | Cipla | Exp 03/2027 | MRP ₹110.00', query: { brand: 'Azee 500', molecule: 'Azithromycin', strength: '500mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'strip_shelcal', raw: 'Strip label: SHELCAL 500 | Calcium Carbonate+Vitamin D3 500mg+250IU | Tablet | Torrent | MRP ₹120.00', query: { brand: 'Shelcal 500', molecule: 'Calcium Carbonate+Vitamin D3', strength: '500mg+250IU', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'strip_pantop40', raw: 'Strip label: PANTOP 40 | Pantoprazole 40mg | Tablet | Aristo | Exp 11/2026 | MRP ₹95.00', query: { brand: 'Pantop 40', molecule: 'Pantoprazole', strength: '40mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'strip_amlodac', raw: 'Strip label: AMLODAC 5 | Amlodipine 5mg | Tablet | Zydus | Exp 06/2027 | MRP ₹28.00', query: { brand: 'Amlodac 5', molecule: 'Amlodipine', strength: '5mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
  ],
  pharmacy_bills: [
    { id: 'bill_calpol650', raw: 'MedPlus bill line: CALPOL 650 TAB 15s — Paracetamol 650mg — MRP ₹32.00 — Qty 2', query: { brand: 'Calpol 650', molecule: 'Paracetamol', strength: '650mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'bill_clavam625', raw: 'Apollo Pharmacy bill: CLAVAM 625 TAB — Amoxicillin+Clavulanic Acid 500+125mg — MRP ₹190.00 — Qty 1', query: { brand: 'Clavam 625', molecule: 'Amoxicillin+Clavulanic Acid', strength: '500+125mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'bill_azithral', raw: 'Local chemist bill: AZITHRAL 500 — Azithromycin 500mg — MRP ₹120.00 — Qty 1', query: { brand: 'Azithral 500', molecule: 'Azithromycin', strength: '500mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'bill_eltroxin', raw: 'Bill: ELTROXIN 50MCG — Levothyroxine 50mcg — MRP ₹140.00 — Qty 1', query: { brand: 'Eltroxin 50mcg', molecule: 'Levothyroxine', strength: '50mcg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'bill_calcimax', raw: 'Bill: CALCIMAX FORTE — Calcium Carbonate+Vitamin D3 500mg+250IU — MRP ₹150.00 — Qty 1', query: { brand: 'Calcimax Forte', molecule: 'Calcium Carbonate+Vitamin D3', strength: '500mg+250IU', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
  ],
  branded_queries: [
    { id: 'q_crocin650', raw: 'User: "Is there a cheaper version of Crocin 650?"', query: { brand: 'Crocin 650', molecule: 'Paracetamol', strength: '650mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'q_augmentin', raw: 'User: "Generic for Augmentin 625 please"', query: { brand: 'Augmentin 625', molecule: 'Amoxicillin+Clavulanic Acid', strength: '500+125mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'q_pan40', raw: 'User: "Pan 40 ka sasta option batao"', query: { brand: 'Pan 40', molecule: 'Pantoprazole', strength: '40mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'q_thyronorm', raw: 'User: "Cheaper Thyronorm 50mcg"', query: { brand: 'Thyronorm 50mcg', molecule: 'Levothyroxine', strength: '50mcg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
    { id: 'q_amlong', raw: 'User: "Amlong 5 alternative generic"', query: { brand: 'Amlong 5', molecule: 'Amlodipine', strength: '5mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true, savings_expected: true } },
  ],
  jan_aushadhi_lookups: [
    { id: 'ja_paracetamol650', raw: 'Jan Aushadhi composition lookup: Paracetamol 650mg Tablet', query: { brand: '', molecule: 'Paracetamol', strength: '650mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 3, must_share_composition: true } },
    { id: 'ja_azithromycin500', raw: 'Jan Aushadhi composition lookup: Azithromycin 500mg Tablet', query: { brand: '', molecule: 'Azithromycin', strength: '500mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'ja_pantoprazole40', raw: 'Jan Aushadhi composition lookup: Pantoprazole 40mg Tablet', query: { brand: '', molecule: 'Pantoprazole', strength: '40mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'ja_amoxclav625', raw: 'Jan Aushadhi composition lookup: Amoxicillin+Clavulanic Acid 500+125mg Tablet', query: { brand: '', molecule: 'Amoxicillin+Clavulanic Acid', strength: '500+125mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
    { id: 'ja_amlodipine5', raw: 'Jan Aushadhi composition lookup: Amlodipine 5mg Tablet', query: { brand: '', molecule: 'Amlodipine', strength: '5mg', dosage_form: 'Tablet' }, expect: { min_alternatives: 2, must_share_composition: true } },
  ],
};

let n = 0;
for (const [cat, items] of Object.entries(samples)) {
  mkdirSync(`${ROOT}/${cat}`, { recursive: true });
  for (const s of items) {
    writeFileSync(`${ROOT}/${cat}/${s.id}.json`, JSON.stringify({ category: cat, ...s }, null, 2));
    n++;
  }
}
writeFileSync(`${ROOT}/README.md`, `# MedUPI test samples\n\n25 real medicine samples across 5 categories (5 each). Every sample uses a medicine\nthat exists in the production seed (\`chitti-medupi/backend/data/medicines_seed.json\`)\nso the deterministic strict same-composition engine returns a genuine match.\n\n| Category | Count | What it exercises |\n|---|---|---|\n| prescriptions | 5 | Doctor Rx → brand → same-composition alternatives |\n| medicine_strips | 5 | Strip-label composition read → alternatives |\n| pharmacy_bills | 5 | Billed branded item → cheaper same-composition + savings |\n| branded_queries | 5 | "cheaper version of X" → generic, strict molecule+strength+form |\n| jan_aushadhi_lookups | 5 | Bare composition lookup → Jan Aushadhi priced options |\n\nThe harness \`tools/test_medupi_samples.py\` globs this folder with NO hardcoded\nlist and runs each sample through the REAL backend engine\n(\`medupi_alternatives.find\` → \`search_by_composition\`) on an in-memory copy of the\nproduction seed. The safety invariant checked on every sample: **every returned\nalternative shares molecule + strength + dosage form — zero cross-molecule leakage.**\n`);
console.log(`wrote ${n} sample files + README under ${ROOT}/`);
