from rest_framework.permissions import BasePermission
from django.conf import settings

class IsNodeWorker(BasePermission):
    """
    Custom permission to only allow access to requests with a valid worker token.
    Expects 'Authorization: Bearer <token>'.
    """
    def has_permission(self, request, view):
        expected_token = getattr(settings, 'NODE_WORKER_API_TOKEN', None)
        if not expected_token:
            print("CRITICAL: settings.NODE_WORKER_API_TOKEN is not set in Django settings.")
            return False
        
        auth_header = request.headers.get("Authorization", "")
        token_type, _, client_token = auth_header.partition(' ')

        if token_type.lower() != "bearer" or not client_token:
            return False
        
        return client_token == expected_token 