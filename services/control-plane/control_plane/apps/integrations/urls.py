"""URL configuration for integrations app."""

from django.urls import path

from .views import CommerceAddCreditsView, CommerceProvisionView, SaleorOrderPaidView

urlpatterns = [
    path("saleor/order-paid", SaleorOrderPaidView.as_view(), name="saleor-order-paid"),
    path("commerce/provision", CommerceProvisionView.as_view(), name="commerce-provision"),
    path("commerce/add-credits", CommerceAddCreditsView.as_view(), name="commerce-add-credits"),
]
