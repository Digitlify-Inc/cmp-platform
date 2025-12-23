"""Views for Saleor integration."""

import logging
import re
from datetime import datetime

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CommerceAddCreditsRequestSerializer,
    CommerceAddCreditsResponseSerializer,
    CommerceProvisionRequestSerializer,
    CommerceProvisionResponseSerializer,
    SaleorOrderPaidEventSerializer,
    SaleorOrderPaidResponseSerializer,
)
from .commerce_services import CommerceProvisioningService
from .services import SaleorIntegrationService

logger = logging.getLogger(__name__)


def extract_credits_from_sku(sku: str) -> int | None:
    """Extract credit amount from SKU like CREDITS-100 or CREDITS-500."""
    if not sku:
        return None
    match = re.match(r"CREDITS-(\d+)", sku.upper())
    return int(match.group(1)) if match else None


class SaleorOrderPaidView(APIView):
    """
    POST /integrations/saleor/order-paid

    Process a raw Saleor ORDER_FULLY_PAID webhook event.

    Accepts the raw Saleor webhook payload and processes each line:
    - CREDITS-* SKUs: Add credits to user's wallet
    - Other products: Provision an instance
    """

    # Allow internal service calls without authentication
    permission_classes = [AllowAny]

    def post(self, request):
        """Process raw Saleor order paid webhook."""
        try:
            # Saleor sends array of order objects
            payload = request.data
            if isinstance(payload, list):
                payload = payload[0] if payload else {}

            order_id = payload.get("token") or payload.get("id", "")
            user_email = payload.get("user_email", "")
            lines = payload.get("lines", [])
            created = payload.get("created", datetime.utcnow().isoformat())

            logger.info(f"Processing Saleor order webhook: order={order_id}, email={user_email}, lines={len(lines)}")

            if not user_email:
                return Response(
                    {"error": "Missing user_email in order"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            actions = []

            for line in lines:
                sku = line.get("product_sku", "")
                product_name = line.get("product_name", "")
                variant_id = line.get("product_variant_id", "")
                quantity = line.get("quantity", 1)

                # Check if this is a credit pack
                credits = extract_credits_from_sku(sku)
                if credits:
                    # Add credits to wallet
                    try:
                        result = CommerceProvisioningService.add_credits(
                            order_id=order_id,
                            user_email=user_email,
                            credit_amount=credits * quantity,
                        )
                        actions.append(f"Added {credits * quantity} credits to wallet {result.wallet_id}")
                        logger.info(f"Added {credits * quantity} credits for {user_email}")
                    except Exception as e:
                        logger.error(f"Failed to add credits: {e}")
                        actions.append(f"Failed to add credits: {e}")
                else:
                    # Provision an instance
                    try:
                        # Look up offering by Saleor product ID
                        from control_plane.apps.offerings.models import Offering

                        # Try to find offering by saleor_product_id
                        offering = None
                        for o in Offering.objects.all():
                            if str(o.saleor_product_id) == str(variant_id).split(":")[0] if ":" in str(variant_id) else str(variant_id):
                                offering = o
                                break

                        if not offering:
                            # Try by name match
                            offering = Offering.objects.filter(name__icontains=product_name.split()[0]).first()

                        if not offering:
                            logger.warning(f"No offering found for product {product_name} (variant: {variant_id})")
                            actions.append(f"No offering found for {product_name}")
                            continue

                        result = CommerceProvisioningService.provision_instance(
                            order_id=order_id,
                            user_email=user_email,
                            offering_id=str(offering.saleor_product_id),
                            plan_id=variant_id,
                            metadata={"product_name": product_name},
                        )
                        actions.append(f"Provisioned instance {result.instance_id} for {product_name}")
                        logger.info(f"Provisioned instance {result.instance_id} for {user_email}")
                    except Exception as e:
                        logger.error(f"Failed to provision instance: {e}")
                        actions.append(f"Failed to provision: {e}")

            return Response(
                {"processed": True, "actions": actions},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception(f"Error processing Saleor webhook: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CommerceProvisionView(APIView):
    """
    POST /integrations/commerce/provision

    Provision an instance for a paid order.
    Called by Provisioner App after Saleor OrderFullyPaid webhook.
    """

    # Allow internal service calls without authentication
    permission_classes = [AllowAny]

    def post(self, request):
        """Provision an instance."""
        serializer = CommerceProvisionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            result = CommerceProvisioningService.provision_instance(
                order_id=data["order_id"],
                user_email=data["user_email"],
                offering_id=data["offering_id"],
                plan_id=data["plan_id"],
                metadata=data.get("metadata", {}),
            )

            response_serializer = CommerceProvisionResponseSerializer({
                "instance_id": str(result.instance_id),
                "api_key": result.api_key,
                "status": result.status,
            })
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            logger.error(f"Provisioning failed: {e}")
            return Response(
                {"error": {"code": "provisioning_failed", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception(f"Unexpected error during provisioning: {e}")
            return Response(
                {"error": {"code": "internal_error", "message": "Provisioning failed"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CommerceAddCreditsView(APIView):
    """
    POST /integrations/commerce/add-credits

    Add credits to a user's wallet for a credit pack purchase.
    Called by Provisioner App after Saleor OrderFullyPaid webhook.
    """

    # Allow internal service calls without authentication
    permission_classes = [AllowAny]

    def post(self, request):
        """Add credits to wallet."""
        serializer = CommerceAddCreditsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            result = CommerceProvisioningService.add_credits(
                order_id=data["order_id"],
                user_email=data["user_email"],
                credit_amount=data["credit_amount"],
            )

            response_serializer = CommerceAddCreditsResponseSerializer({
                "wallet_id": str(result.wallet_id),
                "credits_added": result.credits_added,
                "new_balance": result.new_balance,
            })
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Add credits failed: {e}")
            return Response(
                {"error": {"code": "add_credits_failed", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception(f"Unexpected error adding credits: {e}")
            return Response(
                {"error": {"code": "internal_error", "message": "Add credits failed"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
