# Makes 'models' a Python package.
# Importing each model class here registers it with Base.metadata so
# Base.metadata.create_all() in main.py picks it up.
from models.scheme import Scheme  # noqa: F401
from models.pib_announcement import PIBAnnouncement  # noqa: F401
from models.feedback import Feedback  # noqa: F401
from models.ingest_log import IngestLog  # noqa: F401
from models.application import Application  # noqa: F401
