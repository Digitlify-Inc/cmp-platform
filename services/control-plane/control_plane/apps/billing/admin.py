"""Admin configuration for billing app."""

from django.contrib import admin

from .models import LedgerEntry, Reservation, Wallet


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ["organization", "balance", "currency", "created_at"]
    search_fields = ["organization__name"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ["wallet", "amount", "entry_type", "reference_id", "created_at"]
    list_filter = ["entry_type"]
    search_fields = ["reference_id", "wallet__organization__name"]
    readonly_fields = ["id", "created_at"]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ["wallet", "instance", "amount", "status", "created_at", "settled_at"]
    list_filter = ["status"]
    search_fields = ["wallet__organization__name"]
    readonly_fields = ["id", "created_at", "settled_at"]
