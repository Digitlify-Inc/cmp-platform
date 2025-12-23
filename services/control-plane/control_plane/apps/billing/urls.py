"""URL configuration for billing app - wallet endpoints."""

from django.urls import path

from .views import MyWalletLedgerView, MyWalletView, WalletDetailView, WalletTopupView

urlpatterns = [
    path("me", MyWalletView.as_view(), name="wallet-me"),
    path("me/ledger", MyWalletLedgerView.as_view(), name="wallet-me-ledger"),
    path("<uuid:wallet_id>", WalletDetailView.as_view(), name="wallet-detail"),
    path("<uuid:wallet_id>/topups", WalletTopupView.as_view(), name="wallet-topup"),
]
