"""URL configuration for offerings app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OfferingVersionViewSet, OfferingViewSet

router = DefaultRouter()
router.register(r"", OfferingViewSet, basename="offering")

urlpatterns = [
    path("", include(router.urls)),
]
