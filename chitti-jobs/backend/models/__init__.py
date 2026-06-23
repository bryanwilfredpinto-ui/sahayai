# Makes 'models' a package. Importing each model here registers it with
# Base.metadata so Base.metadata.create_all() in main.py picks it up.
from models.user import UserProfile  # noqa: F401
from models.job_raw import JobRaw  # noqa: F401
from models.job_scored import JobScored  # noqa: F401
from models.application import Application  # noqa: F401
from models.follow_up import FollowUp  # noqa: F401
from models.interview import Interview  # noqa: F401
from models.ingest_log import IngestLog  # noqa: F401
