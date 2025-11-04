"""Test Settings"""

import os

from .common import *  # noqa

DEBUG = True

# Ensure test runs can fall back to environment values instead of instance config.
SKIP_ENV_VAR = False  # noqa: F405
os.environ.setdefault("EMAIL_HOST", "smtp.test")

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

INSTALLED_APPS.append(  # noqa
    "plane.tests"
)
