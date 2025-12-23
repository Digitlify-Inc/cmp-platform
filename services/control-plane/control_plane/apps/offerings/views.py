"""API views for offerings app."""

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Offering, OfferingVersion, Plan
from .serializers import (
    OfferingCreateSerializer,
    OfferingDetailSerializer,
    OfferingSerializer,
    OfferingVersionCreateSerializer,
    OfferingVersionSerializer,
    PlanSerializer,
)

logger = logging.getLogger(__name__)


class OfferingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for offerings.

    Public listing is allowed, but creation requires authentication.
    """

    queryset = Offering.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return OfferingCreateSerializer
        if self.action == "retrieve":
            return OfferingDetailSerializer
        return OfferingSerializer

    def get_permissions(self):
        """Allow public access to list and retrieve."""
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter by status for public access."""
        queryset = Offering.objects.all()
        if not self.request.user.is_authenticated:
            # Only show published offerings to anonymous users
            queryset = queryset.filter(status=Offering.Status.PUBLISHED)
        return queryset

    @action(detail=True, methods=["get", "post"])
    def versions(self, request, pk=None):
        """
        GET /offerings/{id}/versions - List versions
        POST /offerings/{id}/versions - Create version
        """
        offering = self.get_object()

        if request.method == "GET":
            versions = offering.versions.all()
            serializer = OfferingVersionSerializer(versions, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = OfferingVersionCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            artifact = serializer.validated_data["artifact"]
            version = OfferingVersion.objects.create(
                offering=offering,
                version_label=serializer.validated_data["version_label"],
                artifact_s3_key=artifact["s3Key"],
                artifact_sha256=artifact["sha256"],
                capabilities=serializer.validated_data.get("capabilities", []),
                defaults=serializer.validated_data.get("defaults", {}),
            )

            response_serializer = OfferingVersionSerializer(version)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"])
    def plans(self, request, pk=None):
        """
        GET /offerings/{id}/plans - List plans
        POST /offerings/{id}/plans - Create plan
        """
        offering = self.get_object()

        if request.method == "GET":
            plans = offering.plans.all()
            serializer = PlanSerializer(plans, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = PlanSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(offering=offering)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class OfferingVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for offering versions (read-only).

    Versions are created via /offerings/{id}/versions.
    """

    queryset = OfferingVersion.objects.all()
    serializer_class = OfferingVersionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Filter by offering if specified."""
        queryset = OfferingVersion.objects.all()
        offering_id = self.request.query_params.get("offering_id")
        if offering_id:
            queryset = queryset.filter(offering_id=offering_id)
        return queryset
