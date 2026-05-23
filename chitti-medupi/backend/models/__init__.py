# Makes 'models' a Python package.
# Import each model class here so Base.metadata.create_all() registers it.
from models.medicine import Medicine  # noqa: F401
from models.jan_aushadhi import JanAushadhiStore  # noqa: F401
from models.family import FamilyProfile  # noqa: F401
from models.wallet import WalletEntry  # noqa: F401
from models.reminder import Reminder  # noqa: F401
from models.price_cache import PriceCache  # noqa: F401
from models.community_price import CommunityPrice  # noqa: F401
from models.price_alert import PriceAlert  # noqa: F401
from models.search_log import SearchLog  # noqa: F401
from models.loader_run import LoaderRun  # noqa: F401
# Chitti Health File — encrypted documents + extracted facts + vitals
# + reminders + insurance policies. Added 2026-05-23.
from models.health_file import (  # noqa: F401
    HealthDocument,
    HealthFact,
    HealthVital,
    HealthReminder,
    InsurancePolicy,
)
