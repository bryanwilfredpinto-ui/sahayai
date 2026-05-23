"""
models/health_file.py
---------------------
Chitti Health File — encrypted document store + extracted-fact records
+ vitals log + insurance policies.

Privacy contract (NON-NEGOTIABLE):
  - The raw document bytes are AES-256-GCM encrypted at rest (see
    services/health_file_crypto.py). The DB stores only the ciphertext
    + nonce + auth tag.
  - The extracted-fact rows (medicines, diagnoses, etc.) are stored
    PLAINTEXT so the user can search them — this is the explicit
    trade-off: encrypted blob for the source-of-truth scan, plaintext
    structured data for query.
  - All rows are scoped by (user_token, profile_id). The user_token is
    sha256-hashed before storage (matches the chitti-vaani vault
    pattern).
  - "Chitti forget" deletes both the blob and the structured rows.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, LargeBinary, String, Text, Index

from database import Base
from models._schema import TABLE_KW


class HealthDocument(Base):
    """One uploaded document — PDF, photo, scan. Bytes are encrypted."""
    __tablename__ = "health_documents"
    __table_args__ = (
        Index("ix_health_documents_owner_profile", "user_token_hash", "profile_id"),
        TABLE_KW,
    )

    id              = Column(String(40), primary_key=True)          # uuid4
    user_token_hash = Column(String(80), index=True, nullable=False)
    profile_id      = Column(Integer, nullable=False)               # FK -> family_profiles.id

    # Source-of-truth original — ciphertext + AES-256-GCM nonce/tag
    blob_ct         = Column(LargeBinary, nullable=False)           # ciphertext
    blob_nonce      = Column(LargeBinary, nullable=False)           # 12 bytes
    blob_tag        = Column(LargeBinary, nullable=False)           # 16 bytes
    blob_mime       = Column(String(80), nullable=False, default="application/pdf")
    blob_size       = Column(Integer, nullable=False, default=0)    # decoded byte count

    # Classification + display
    doc_type        = Column(String(40), nullable=False, default="other")
    # blood_report | mri | ct_scan | xray | ultrasound | ecg | echo |
    # eye | dental | prescription | discharge_summary | insurance_health |
    # insurance_life | vaccination | other
    display_name    = Column(String(200), nullable=False)
    doc_date        = Column(String(12), nullable=True)             # ISO date — date of the visit/test
    doctor_name     = Column(String(200), nullable=True)
    hospital_name   = Column(String(200), nullable=True)

    # Extraction state
    extract_status  = Column(String(20), nullable=False, default="pending")
    # pending | running | done | failed | coming_soon (for doc_types we don't yet auto-extract)
    extract_summary = Column(Text, nullable=True)                   # plain-English summary
    extract_json    = Column(Text, nullable=True)                   # JSON blob of typed fields
    extract_error   = Column(Text, nullable=True)

    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    forget_at       = Column(DateTime, nullable=True)               # soft-delete tombstone


class HealthFact(Base):
    """Typed extracted fact — searchable, displayable, alertable.
    One document can produce many facts (e.g. blood report -> 10 lab rows)."""
    __tablename__ = "health_facts"
    __table_args__ = (
        Index("ix_health_facts_owner_profile", "user_token_hash", "profile_id"),
        Index("ix_health_facts_kind", "kind"),
        TABLE_KW,
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    document_id     = Column(String(40), index=True, nullable=False)   # FK -> health_documents.id
    user_token_hash = Column(String(80), nullable=False)
    profile_id      = Column(Integer, nullable=False)

    kind            = Column(String(40), nullable=False)
    # medicine | diagnosis | lab_value | imaging_finding | followup |
    # vaccine | insurance_policy | insurance_premium | doctor_visit |
    # prescription_expiry | restriction | recommendation
    label           = Column(String(200), nullable=False)              # human-readable name
    value           = Column(String(200), nullable=True)               # e.g. "8.2", "Metformin 500mg"
    unit            = Column(String(40), nullable=True)                # mg/dL, %, mmHg, etc.
    normal_low      = Column(Float, nullable=True)
    normal_high     = Column(Float, nullable=True)
    out_of_range    = Column(Integer, nullable=False, default=0)       # 0/1 — RED-flagged
    fact_date       = Column(String(12), nullable=True)                # ISO date — when this was true
    notes           = Column(Text, nullable=True)

    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)


class HealthVital(Base):
    """User-logged vitals (BP, sugar, weight, temperature, SpO2, pulse).
    Voice input lands here directly, no document required."""
    __tablename__ = "health_vitals"
    __table_args__ = (
        Index("ix_health_vitals_owner_profile_kind", "user_token_hash", "profile_id", "kind"),
        TABLE_KW,
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_token_hash = Column(String(80), nullable=False)
    profile_id      = Column(Integer, nullable=False)

    kind            = Column(String(40), nullable=False)
    # bp_systolic | bp_diastolic | bp (paired) | sugar_fasting | sugar_post |
    # sugar_random | hba1c | weight | temp | spo2 | pulse | sleep_hours | other
    value           = Column(Float, nullable=False)
    value2          = Column(Float, nullable=True)                     # for paired vitals like BP
    unit            = Column(String(20), nullable=True)
    note            = Column(Text, nullable=True)

    out_of_range    = Column(Integer, nullable=False, default=0)
    reading_at      = Column(DateTime, default=datetime.utcnow, nullable=False)


class HealthReminder(Base):
    """Smart reminders — medicine doses, premium dues, follow-ups, tests."""
    __tablename__ = "health_reminders"
    __table_args__ = (
        Index("ix_health_reminders_owner_profile", "user_token_hash", "profile_id"),
        Index("ix_health_reminders_due", "next_fire_at"),
        TABLE_KW,
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_token_hash = Column(String(80), nullable=False)
    profile_id      = Column(Integer, nullable=False)

    kind            = Column(String(40), nullable=False)
    # medicine | premium_due | followup | test_due | prescription_expiry |
    # vaccine_booster | dental_checkup | renewal
    label           = Column(String(240), nullable=False)
    detail          = Column(Text, nullable=True)
    document_id     = Column(String(40), nullable=True)                # source doc if any

    # Schedule
    rrule           = Column(String(120), nullable=True)
    # RFC 5545 RRULE subset: FREQ=DAILY;BYHOUR=8,20  /  FREQ=MONTHLY;BYMONTHDAY=15
    # NULL = one-shot
    next_fire_at    = Column(DateTime, nullable=False)
    last_fired_at   = Column(DateTime, nullable=True)
    enabled         = Column(Integer, nullable=False, default=1)

    # Channels (CSV of: browser | whatsapp | sms | voice_call)
    channels        = Column(String(80), nullable=False, default="browser,whatsapp")

    # Lead-time alerts for the kinds that benefit (premium_due, renewal)
    # CSV of days-before, e.g. "30,7,1"
    advance_alerts  = Column(String(40), nullable=True)

    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)


class InsurancePolicy(Base):
    """Insurance policy — health, life, vehicle. Subset of HealthDocument
    but pulled out because of the per-policy reasoning + premium alerts."""
    __tablename__ = "insurance_policies"
    __table_args__ = (
        Index("ix_insurance_owner_profile", "user_token_hash", "profile_id"),
        TABLE_KW,
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_token_hash = Column(String(80), nullable=False)
    profile_id      = Column(Integer, nullable=False)
    document_id     = Column(String(40), nullable=True)                # source health_documents row

    policy_kind     = Column(String(20), nullable=False)               # health | life | vehicle | term
    company         = Column(String(200), nullable=False)
    policy_number   = Column(String(80), nullable=False)
    sum_assured     = Column(Float, nullable=True)
    coverage_inr    = Column(Float, nullable=True)                     # alias for health (vs life sum_assured)
    premium_inr     = Column(Float, nullable=True)
    premium_mode    = Column(String(20), nullable=True)                # annual | half-yearly | quarterly | monthly

    start_date      = Column(String(12), nullable=True)                # ISO
    due_date        = Column(String(12), nullable=True)                # next premium ISO
    renewal_date    = Column(String(12), nullable=True)                # ISO
    maturity_date   = Column(String(12), nullable=True)                # life only

    network_hospitals = Column(Text, nullable=True)                    # JSON list of names
    exclusions      = Column(Text, nullable=True)                      # JSON list
    sub_limits      = Column(Text, nullable=True)                      # JSON dict
    nominee         = Column(String(200), nullable=True)

    raw_summary     = Column(Text, nullable=True)                      # LLM plain-English summary

    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    forget_at       = Column(DateTime, nullable=True)


class HealthDispatch(Base):
    """One queued notification dispatched from a HealthReminder.

    Phase B-4 — reminder dispatch worker. Every cron tick that finds a due
    HealthReminder rows here. The frontend long-polls
    /api/health-file/dispatch/pending and renders banners. WhatsApp + Twilio
    + browser-push payloads are baked in at queue time so the frontend (or a
    future native bridge) can fire them without re-deriving anything.

    Honest stubs: `twilio_sid` is null until TWILIO_* env vars are set;
    `browser_push_payload` is always populated so the page can fire a local
    Notification immediately.
    """
    __tablename__ = "health_dispatch"
    __table_args__ = (
        Index("ix_health_dispatch_owner", "user_token_hash"),
        Index("ix_health_dispatch_unack", "ack_at"),
        TABLE_KW,
    )

    id              = Column(Integer, primary_key=True, autoincrement=True)
    reminder_id     = Column(Integer, nullable=False)                  # FK -> health_reminders.id
    user_token_hash = Column(String(80), nullable=False)
    profile_id      = Column(Integer, nullable=False)

    kind            = Column(String(40), nullable=False)               # mirror of reminder.kind
    severity        = Column(String(20), nullable=False, default="info")
    # info | advance_30d | advance_7d | advance_1d | overdue
    label           = Column(String(240), nullable=False)
    detail          = Column(Text, nullable=True)
    spoken_en       = Column(Text, nullable=True)
    spoken_hi       = Column(Text, nullable=True)

    # Pre-baked payloads per channel — stored so the frontend just renders.
    wa_deep_link    = Column(Text, nullable=True)                      # wa.me/<phone>?text=<urlencoded>
    browser_push_payload = Column(Text, nullable=True)                 # JSON for Notification API
    twilio_sid      = Column(String(80), nullable=True)                # set when voice call placed

    channels_attempted = Column(String(80), nullable=False, default="")  # CSV
    channels_delivered = Column(String(80), nullable=False, default="")  # CSV
    last_error      = Column(Text, nullable=True)

    fire_at         = Column(DateTime, nullable=False)                 # when reminder was due
    queued_at       = Column(DateTime, default=datetime.utcnow, nullable=False)
    ack_at          = Column(DateTime, nullable=True)                  # set by /ack from frontend
