# Chitti News AI — DEVILS_ADVOCATE

A discipline. Every recommendation runs through a second pass that argues
*against* it before reaching the user.

## On every Profession → Tools answer

After ranking, Chitti runs the devil's advocate on the top result:

- **What's the catch?** What does the free tier *not* let you do?
- **Where does it break?** Is there a known reliability issue (HN
  complaints, GitHub issues > 100 open, vendor downtime in the last 30
  days)?
- **Is the data going somewhere you'd object to?** Privacy posture: does
  the tool train on your inputs?
- **What's the lock-in?** Is exporting your work easy or impossible?

If any answer reduces confidence below the rank threshold, the top result
is **demoted** and a note is attached.

## On every news item

Before adding to the daily briefing:

- **Could this be wrong?** Single-source? Vendor press release without
  third-party confirmation?
- **Is the framing loaded?** Headline could be neutral; is it?
- **Who benefits if I amplify this?** If only one party gains and the
  signal is thin, lower the importance.

## On every trust check

Before declaring a source `Trusted`:

- **Has it ever recanted?** Search recent corrections — sometimes a high
  trust score hides a known systematic bias on a single topic.
- **Is the AI licensing status a *positive* signal or a *neutered* one?**
  Some outlets gate AI access *because* they want to be cited; others
  because they want to control the narrative. Distinguish.

## Output contract

The devil's advocate **does not show up in the user-facing response**. It
runs server-side and either:

- Adjusts the ranking / importance silently, **or**
- Attaches a one-line caveat to the card: *"Note: free tier excludes
  commercial use."*

The user gets a calmer, more honest answer — not a longer one.