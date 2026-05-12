"""
Sahay AI shared quality framework.

Six modules, used by every Chitti backend:

  quadrails       — 4 rails (safety / relevance / truth / compliance)
  hooks           — before_model / after_model / before_tool / after_tool
  observability   — audit log + Prometheus metrics + OpenTelemetry
  evaluators      — LLM-as-judge for correctness/tone/helpfulness/hallucination
  feedback        — thumbs up/down storage + /api/feedback Flask blueprint
  founder_report  — daily aggregation + email to bryanwilfredpinto@gmail.com

Wiring (in each Chitti's main.py):

    from lib.hooks import HookRegistry
    from lib.quadrails import build_default_quadrails
    from lib.observability import Observability
    from lib.feedback import feedback_bp

    chitti = "chitti-medupi"   # one of the 12 Chitti slugs

    obs = Observability(chitti=chitti, db_url=settings.DATABASE_URL)
    hooks = HookRegistry(
        chitti=chitti,
        quadrails=build_default_quadrails(chitti),
        observability=obs,
    )
    app.register_blueprint(feedback_bp)

    # Around every DeepSeek call:
    safe_input  = hooks.before_model(user_text, ctx)
    raw_output  = call_deepseek(safe_input)
    final       = hooks.after_model(safe_input, raw_output, ctx)

See lib/<module>.py for per-module detail. Each module ships its own
README in its docstring + clear public/private split (`_` prefix = private).
"""
__version__ = "1.0.0"
