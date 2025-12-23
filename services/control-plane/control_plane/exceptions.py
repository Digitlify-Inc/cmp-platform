"""Custom exception handling for Control Plane API."""

import logging
import uuid

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class ControlPlaneException(APIException):
    """Base exception for Control Plane errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred"
    default_code = "error"

    def __init__(self, detail=None, code=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code
        self.code = code
        super().__init__(detail=detail, code=code)


class InsufficientCreditsError(ControlPlaneException):
    """Raised when wallet has insufficient credits."""

    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Insufficient credits"
    default_code = "insufficient_credits"


class ResourceNotFoundError(ControlPlaneException):
    """Raised when a resource is not found."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found"
    default_code = "not_found"


class DuplicateResourceError(ControlPlaneException):
    """Raised when trying to create a duplicate resource."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Resource already exists"
    default_code = "duplicate"


class InvalidStateError(ControlPlaneException):
    """Raised when operation is invalid for current state."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Invalid state for this operation"
    default_code = "invalid_state"


class ExternalServiceError(ControlPlaneException):
    """Raised when an external service call fails."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "External service error"
    default_code = "external_service_error"


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses."""
    trace_id = str(uuid.uuid4())[:8]

    # Log the exception
    logger.exception(f"[{trace_id}] Exception in {context.get('view', 'unknown')}: {exc}")

    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Wrap in standard error format
        error_code = getattr(exc, "code", getattr(exc, "default_code", "error"))
        error_message = str(exc.detail) if hasattr(exc, "detail") else str(exc)

        response.data = {
            "error": {
                "code": error_code,
                "message": error_message,
                "traceId": trace_id,
            }
        }
    else:
        # Handle unhandled exceptions
        response = Response(
            {
                "error": {
                    "code": "internal_error",
                    "message": "An internal error occurred",
                    "traceId": trace_id,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
