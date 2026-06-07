#!/usr/bin/env node
/* tools/gen_ca_os_samples.mjs — emit 25 REAL sample fixtures (5 categories × 5),
 * each a committed JSON file the sample test discovers by GLOB (no hardcoded list).
 * Categories map to the deterministic engine modules. Run once: node tools/gen_ca_os_samples.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = resolve(ROOT, 'test_samples/ca_os');

const SAMPLES = {
  tax: [
    { id: 'tax_new_20L', fn: 'incomeTaxOne', args: [{ gross: 2000000, salaried: true }, 'new'], expect: { taxableIncome: 1925000, totalTax: 192400 }, desc: '₹20L salaried, new regime FY25-26' },
    { id: 'tax_new_12L_rebate', fn: 'incomeTaxOne', args: [{ gross: 1200000, salaried: true }, 'new'], expect: { totalTax: 0 }, desc: '₹12L salaried → 87A rebate → ₹0' },
    { id: 'tax_old_12L_ded', fn: 'incomeTaxOne', args: [{ gross: 1200000, salaried: true, deductions: { '80C': 150000, '80D': 25000 } }, 'old'], expect: { taxableIncome: 975000, totalTax: 111800 }, desc: '₹12L old regime, 80C+80D' },
    { id: 'tax_regime_pick', fn: 'incomeTax', args: [{ gross: 1200000, salaried: true, deductions: { '80C': 150000 } }], expect: { recommendedRegime: 'new' }, desc: 'regime recommendation' },
    { id: 'tax_old_5L_boundary', fn: 'incomeTaxOne', args: [{ gross: 550000, salaried: true }, 'old'], expect: { totalTax: 0 }, desc: 'old 87A boundary ₹5L taxable → ₹0' },
  ],
  gst: [
    { id: 'gst_18pct', fn: 'gstTax', args: [100000, 18], expect: { tax: 18000, cgst: 9000 }, desc: 'GST 18% on ₹1,00,000' },
    { id: 'gst_reg_needed', fn: 'gstRegistrationNeed', args: [{ turnover: 5000000, supply: 'goods' }], expect: { mandatory: true }, desc: 'turnover ₹50L goods → registration mandatory' },
    { id: 'gst_reg_not_needed', fn: 'gstRegistrationNeed', args: [{ turnover: 1500000, supply: 'goods' }], expect: { mandatory: false }, desc: 'turnover ₹15L goods → not mandatory' },
    { id: 'gst_health_mismatch', fn: 'gstHealth', args: [{ itcClaimed: 60000, itc2B: 50000, gstr1Filed: true, gstr3bFiled: true }], expect: { itcMismatch: 10000 }, desc: 'ITC claimed > 2B by ₹10,000' },
    { id: 'gst_28pct', fn: 'gstTax', args: [50000, 28], expect: { tax: 14000 }, desc: 'GST 28% on ₹50,000' },
  ],
  fraud: [
    { id: 'fraud_gstin_bad_checksum', fn: 'validateGSTIN', args: ['27AAPFU0939F1ZX'], expect: { valid: false }, desc: 'tampered check digit → fake' },
    { id: 'fraud_gstin_short', fn: 'validateGSTIN', args: ['27AAPFU0939F1Z'], expect: { valid: false }, desc: '14 chars → invalid length' },
    { id: 'fraud_gstin_format', fn: 'validateGSTIN', args: ['ABCDE1234567890'], expect: { valid: false }, desc: 'wrong format → invalid' },
    { id: 'fraud_duplicate_invoice', fn: 'fraudShield', args: [{ invoices: [{ no: 'INV1', vendor: 'X', amount: 5000 }, { no: 'INV1', vendor: 'X', amount: 5000 }] }], expect: { _hasWarning: true }, desc: 'duplicate invoice flagged' },
    { id: 'fraud_overbilling', fn: 'fraudShield', args: [{ lineRate: 5000, marketRate: 2000 }], expect: { _hasWarning: true }, desc: 'rate 2.5x market → overbilling' },
  ],
  scheme: [
    { id: 'scheme_msme_maha', fn: 'govtBenefits', args: [{ state: 'Maharashtra', industry: 'manufacturing', turnover: 20000000, employees: 25, type: 'msme', entityAgeYears: 4 }], expect: { _schemeIncludes: ['udyam', 'cgtmse'] }, desc: 'Maharashtra manufacturing MSME' },
    { id: 'scheme_startup', fn: 'govtBenefits', args: [{ state: 'Karnataka', industry: 'services', turnover: 5000000, type: 'startup', entityAgeYears: 2 }], expect: { _schemeIncludes: ['startupindia'] }, desc: 'DPIIT startup <10yr' },
    { id: 'scheme_exporter', fn: 'govtBenefits', args: [{ state: 'Gujarat', industry: 'manufacturing', turnover: 50000000, type: 'msme', exporter: true }], expect: { _schemeIncludes: ['export'] }, desc: 'exporter → LUT/RoDTEP' },
    { id: 'scheme_micro_kirana', fn: 'govtBenefits', args: [{ state: 'Bihar', industry: 'services', turnover: 1500000, type: 'msme' }], expect: { _schemeIncludes: ['mudra', 'udyam'] }, desc: 'micro kirana → Mudra' },
    { id: 'scheme_dairy_farmer', fn: 'govtBenefits', args: [{ state: 'Punjab', industry: 'agriculture', turnover: 800000, type: 'msme' }], expect: { _schemeIncludes: ['agri'] }, desc: 'dairy/agri → PMFME/FPO' },
  ],
  business: [
    { id: 'biz_healthy', fn: 'businessDoctor', args: [{ revenue: 1000000, netProfit: 150000, currentAssets: 400000, currentLiabilities: 200000, inventory: 100000, debt: 100000, equity: 300000 }], expect: { netMargin: 15, currentRatio: 2 }, desc: 'healthy SME' },
    { id: 'biz_thin_margin', fn: 'businessDoctor', args: [{ revenue: 1000000, netProfit: 20000, currentAssets: 150000, currentLiabilities: 200000, debt: 500000, equity: 100000 }], expect: { netMargin: 2 }, desc: 'thin margin + low liquidity' },
    { id: 'biz_high_debt', fn: 'businessDoctor', args: [{ revenue: 2000000, netProfit: 200000, currentAssets: 300000, currentLiabilities: 250000, debt: 600000, equity: 200000 }], expect: { debtEquity: 3 }, desc: 'high debt-equity' },
    { id: 'biz_cfo', fn: 'cfoDashboard', args: [{ revenue: 1000000, netProfit: 150000 }], expect: { taxExposure: 37500 }, desc: 'CFO dashboard tax exposure 25% rule' },
    { id: 'biz_penalty_gstr', fn: 'penaltyEstimate', args: [{ kind: 'gstr', daysLate: 10 }], expect: { estimate: 500 }, desc: 'GSTR late fee 10 days' },
  ],
};

let n = 0;
for (const cat of Object.keys(SAMPLES)) {
  mkdirSync(resolve(BASE, cat), { recursive: true });
  for (const s of SAMPLES[cat]) {
    writeFileSync(resolve(BASE, cat, s.id + '.json'), JSON.stringify({ category: cat, ...s }, null, 2) + '\n');
    n++;
  }
}
console.log(`wrote ${n} sample files under test_samples/ca_os/{tax,gst,fraud,scheme,business}/`);
