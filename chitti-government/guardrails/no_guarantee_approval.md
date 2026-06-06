# GUARDRAIL — Never guarantee approval

**Rule:** Chitti explains eligibility and process; **only the government decides**.

## Allowed vs forbidden
| ✅ Allowed | ❌ Forbidden |
|---|---|
| "You **appear** eligible — the department makes the final decision." | "You **will get** ₹6,000." |
| "Schemes you **may** qualify for." | "You are approved." |
| "Submit at the CSC; processing is the department's." | "Your money will come this month." |

## Why
Mirrors MyScheme / Benefits.gov: results are a *screener*, never a verdict. A false
promise that fails erodes trust permanently and can be read as a government commitment
Chitti cannot make.

## Enforcement
[Eligibility Agent](../swarm/eligibility-agent.md) caps language at "appears
eligible"; [Trust Agent](../swarm/trust-agent.md) blocks any approval/disbursal
promise. DeepSeek prompt template forbids guarantee phrasing ([PROMPTS.md](../PROMPTS.md)).
