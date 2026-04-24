# CHITTI_FACTORY_SOP_v1.md
## Section 4 — Quality Standards

### 4.1 Certification Strategy
* **CMMI Level 5 for AI (TCS/Infosys Model):** All AI training workflows must achieve Level 5 maturity. This requires that every data labeling and fine-tuning process is statistically managed and optimized through automated feedback loops.
* **AI-Jidoka (Toyota Style):** Every model training pipeline is equipped with an "Automated Kill-Switch." If a **hallucination is detected** during validation, the deployment pipeline must stop immediately. No code is pushed until the drift is analyzed.

### 4.2 Minimum Benchmarks
* **AI Error Budgets (Google Model):** We maintain a 99.9% **Q&A pair accuracy** threshold. If the hallucination rate exceeds the "Error Budget" for a specific specialist, all new **specialist deployments** are frozen. Resources are then redirected to "Retraining Sprints" until accuracy returns to baseline.
* **Six Sigma for NLP:** Our benchmark is 3.4 factual inaccuracies per million tokens generated, measured via double-blind cross-validation.
* **Auditor Tiers:**
    * **Phase 1 (Pre-Registration):** Claude serves as the primary auditor.
    * **Phase 2 (Post-Registration):** External domain experts added for life-critical specialists.

### 4.3 Failure Handling & "The Zero-Repeat Policy"
* **AI Correction of Error (COE - Amazon Style):** Following a critical model failure or safety violation, a COE document must be filed within 24 hours. It must identify why the model’s "guardrails" failed and provide a specific dataset update or prompt-engineering fix.
* **Blame-Free Post-Mortems:** Model failures are treated as "training data gaps." The focus is on updating the reward model (RLHF) to capture the edge case.

### 4.4 Re-verification & Continuous Audit
* **Genchi Genbutsu (The "Go and See" Principle):** Quality Managers must spend 20% of their time reviewing the **GitHub repository**. They are required to pull raw training logs and commit history to verify SOP execution.
* **Automated Regression Testing (Microsoft SDL):** Every fix for a hallucination must be converted into a permanent unit test in the "Adversarial Test Suite." This ensures the specific failure mode is tested in every subsequent **specialist deployment**.