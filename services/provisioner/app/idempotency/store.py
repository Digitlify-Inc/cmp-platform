"""Idempotency store for webhook deduplication."""

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)


class IdempotencyStore:
    """In-memory idempotency store for webhook deduplication.

    In production, this should use Redis or a database.
    """

    def __init__(self, ttl_hours: int = 24):
        self._store: dict[str, datetime] = {}
        self._ttl = timedelta(hours=ttl_hours)

    def _compute_key(self, event_type: str, order_id: str) -> str:
        """Compute idempotency key from event type and order ID."""
        raw = f"{event_type}:{order_id}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def _cleanup_expired(self):
        """Remove expired entries."""
        now = datetime.now(timezone.utc)
        expired = [k for k, v in self._store.items() if now - v > self._ttl]
        for key in expired:
            del self._store[key]

    def check_and_set(self, event_type: str, order_id: str) -> bool:
        """
        Check if this event was already processed.

        Returns:
            True if this is a new event (should be processed)
            False if this event was already processed (should be skipped)
        """
        self._cleanup_expired()

        key = self._compute_key(event_type, order_id)
        if key in self._store:
            logger.info(f"Duplicate event detected: {event_type} for order {order_id}")
            return False

        self._store[key] = datetime.now(timezone.utc)
        logger.info(f"New event recorded: {event_type} for order {order_id}")
        return True

    def get_processed_at(self, event_type: str, order_id: str) -> Optional[datetime]:
        """Get when an event was processed, if at all."""
        key = self._compute_key(event_type, order_id)
        return self._store.get(key)


# Singleton store
idempotency_store = IdempotencyStore()
