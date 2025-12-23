"""URL configuration for connectors app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConnectorBindingViewSet

router = DefaultRouter()
router.register(r"bindings", ConnectorBindingViewSet, basename="connector-binding")

urlpatterns = [
    path("", include(router.urls)),
]
