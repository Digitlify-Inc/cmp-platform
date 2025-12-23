"""URL configuration for CMP Control Plane."""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # Health checks
    path("health/", include("health_check.urls")),
    # OpenAPI Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API v1
    path("orgs/", include("control_plane.apps.orgs.urls")),
    path("offerings/", include("control_plane.apps.offerings.urls")),
    path("instances/", include("control_plane.apps.instances.urls")),
    path("wallets/", include("control_plane.apps.billing.urls")),
    path("billing/", include("control_plane.apps.billing.billing_urls")),
    path("connectors/", include("control_plane.apps.connectors.urls")),
    path("integrations/", include("control_plane.apps.integrations.urls")),
]
