"""Registers all SQLAlchemy models with Base.metadata on import."""
from . import sources  # noqa: F401
from . import articles  # noqa: F401
from . import tools  # noqa: F401
from . import ai_models  # noqa: F401
from . import trust_scores  # noqa: F401
from . import daily_tips  # noqa: F401
from . import courses_v2  # noqa: F401  # aggregator-doctrine course schema (v0.2)
from . import aggregated_items  # noqa: F401  # v0.3 unified 5-stream aggregator (cert/tool/job/scheme/roadmap)
