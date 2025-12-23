"""URL configuration for billing app - billing endpoints."""

from django.urls import path

from .views import BillingAuthorizeView, BillingSettleView

urlpatterns = [
    path("authorize", BillingAuthorizeView.as_view(), name="billing-authorize"),
    path("settle", BillingSettleView.as_view(), name="billing-settle"),
]
