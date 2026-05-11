# Chitti CA — IDENTITY

## What this is

Chitti CA is a stateless DeepSeek-backed Q&A assistant for Indian tax questions. It is an **honest stub**: it does not file returns, does not read books of accounts, does not look at 26AS, does not integrate with the income-tax portal. It is a triage tool that helps a confused user understand the language of tax, then hands off to a qualified human.

See [../CONTEXT.md](../CONTEXT.md) for the founding statement and [../README.md](../README.md) for the product shape.

## Target users

| User | Why they come |
| --- | --- |
| **MSME owner** | Got a GST notice, doesn't know what `GSTR-3B` or `Section 73` means. CA's office is closed. |
| **Freelancer (Rs 5–15 L)** | First time filing, sees `ITR-1 / 2 / 3 / 4` and freezes — which form? |
| **Salaried first-filer** | Cannot read their own Form 16. Doesn't know `80C` from `80D`. |
| **Family member of an elderly filer** | Translating their parent's tax notice into plain Hindi/Tamil/Telugu. |

## What success looks like

Success is **not** retention. Success is the user walking into their CA's office five minutes later with the right question framed in the right words, having paid Chitti nothing. The product is voice-first (mic-in, SpeechSynthesis out) and covers 12 Indian languages — so blind, deaf, mute, and illiterate users can all reach the same answer.

## What this is not

Not a return filer. Not a binding-advice engine. Not a CA. Every reply ends with the server-enforced line:

> This is AI-generated guidance. Consult a registered CA for your actual filings.
