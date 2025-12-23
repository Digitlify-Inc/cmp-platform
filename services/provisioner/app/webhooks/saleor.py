"""Saleor webhook handlers."""

import hashlib
import hmac
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.config import settings
from app.cp_client import cp_client
from app.idempotency import idempotency_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/saleor", tags=["webhooks"])


class OrderLine(BaseModel):
    """Order line item from Saleor."""

    product_id: str
    product_name: str
    variant_id: str
    variant_name: str
    quantity: int
    unit_price: float


class OrderPayload(BaseModel):
    """Order payload from Saleor webhook."""

    id: str
    number: str
    user_email: str
    total: float
    currency: str
    lines: list[OrderLine]
    metadata: dict[str, Any] = {}


class WebhookPayload(BaseModel):
    """Saleor webhook payload structure."""

    event: str
    order: OrderPayload


def verify_saleor_signature(
    payload: bytes,
    signature: str,
    secret: str,
) -> bool:
    """Verify Saleor webhook signature.

    Saleor uses HMAC-SHA256 for webhook signatures.
    """
    if not secret:
        # In dev mode without secret, skip verification
        logger.warning("Webhook secret not configured, skipping signature verification")
        return True

    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


@router.post("/order-paid")
async def handle_order_paid(
    request: Request,
    x_saleor_signature: str = Header(None, alias="X-Saleor-Signature"),
):
    """
    Handle Saleor OrderFullyPaid webhook.

    This is triggered when a customer completes payment for an order.
    We:
    1. Verify the webhook signature
    2. Check idempotency (skip if already processed)
    3. Parse order lines to determine what was purchased
    4. Call Control Plane to provision instances or add credits
    """
    body = await request.body()

    # Verify signature
    if x_saleor_signature:
        if not verify_saleor_signature(
            body,
            x_saleor_signature,
            settings.saleor_webhook_secret,
        ):
            logger.error("Invalid webhook signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature",
            )

    # Parse payload
    try:
        payload = WebhookPayload.model_validate_json(body)
    except Exception as e:
        logger.error(f"Failed to parse webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )

    order = payload.order
    logger.info(f"Received OrderFullyPaid for order {order.id} ({order.number})")

    # Check idempotency
    if not idempotency_store.check_and_set("order_paid", order.id):
        logger.info(f"Order {order.id} already processed, skipping")
        return {"status": "already_processed", "order_id": order.id}

    # Process each line item
    results = []
    for line in order.lines:
        try:
            # Determine if this is an offering subscription or credit pack
            # Convention: products starting with "credit-" are credit packs
            if line.product_id.startswith("credit-"):
                # Credit pack purchase
                credit_amount = int(line.variant_name.replace("credits", "").strip())
                result = await cp_client.add_credits(
                    order_id=order.id,
                    user_email=order.user_email,
                    credit_amount=credit_amount * line.quantity,
                )
                results.append({
                    "type": "credits",
                    "amount": credit_amount * line.quantity,
                    "result": result,
                })
            else:
                # Offering subscription
                result = await cp_client.provision_instance(
                    order_id=order.id,
                    user_email=order.user_email,
                    offering_id=line.product_id,
                    plan_id=line.variant_id,
                    metadata={
                        "order_number": order.number,
                        "product_name": line.product_name,
                        "variant_name": line.variant_name,
                    },
                )
                results.append({
                    "type": "instance",
                    "offering_id": line.product_id,
                    "instance_id": result.instance_id,
                    "api_key": result.api_key[:8] + "...",  # Redact
                })

        except Exception as e:
            logger.error(f"Failed to process line item {line.product_id}: {e}")
            # Continue processing other items
            results.append({
                "type": "error",
                "product_id": line.product_id,
                "error": str(e),
            })

    logger.info(f"Order {order.id} processing complete: {len(results)} items")

    return {
        "status": "processed",
        "order_id": order.id,
        "results": results,
    }


@router.get("/health")
async def webhook_health():
    """Health check for webhook endpoint."""
    return {"status": "healthy", "service": "saleor-webhooks"}
