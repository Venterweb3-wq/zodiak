import os
from celery import Celery

# Replace 'myproject.settings.dev' with your actual settings file, 
# or use a more dynamic way to set this if needed (e.g., based on an environment variable)
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings.dev')

app = Celery('myproject')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


# Optional: Example task for testing
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 