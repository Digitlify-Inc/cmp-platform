"""URL configuration for instances app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import APIKeyRevokeView, InstanceViewSet, StartTrialView

router = DefaultRouter()
router.register(r"", InstanceViewSet, basename="instance")

urlpatterns = [
    path("trial", StartTrialView.as_view(), name="start-trial"),
    path("", include(router.urls)),
    path(
        "<uuid:instance_id>/api_keys/<uuid:key_id>/revoke",
        APIKeyRevokeView.as_view(),
        name="apikey-revoke",
    ),
]
