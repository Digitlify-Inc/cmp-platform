"""URL configuration for orgs app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AutoWorkspaceView,
    MembershipViewSet,
    OrganizationViewSet,
    ProjectViewSet,
    TeamViewSet,
)

router = DefaultRouter()
router.register(r"", OrganizationViewSet, basename="organization")

# Nested routers for org resources
org_router = DefaultRouter()
org_router.register(r"projects", ProjectViewSet, basename="project")
org_router.register(r"teams", TeamViewSet, basename="team")
org_router.register(r"members", MembershipViewSet, basename="membership")

urlpatterns = [
    # Auto-create workspace
    path("auto", AutoWorkspaceView.as_view(), name="workspace-auto"),
    # Organization routes
    path("", include(router.urls)),
    # Nested routes under organization
    path("<uuid:org_id>/", include(org_router.urls)),
]
