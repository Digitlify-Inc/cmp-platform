"""
Django management command skeleton: sync Wagtail taxonomies + offering page fields into Saleor attributes + metadata.

Path: cms/management/commands/sync_wagtail_to_saleor.py

This is a **spec-guided skeleton**, not a finished implementation.
It provides:
- CLI flags
- structure for reading Wagtail snippets/pages
- Saleor GraphQL client
- deterministic sync flow + report output

Adjust:
- Wagtail model imports
- Saleor GraphQL shapes to match your Saleor version
"""

import json
import os
import time
import random
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple

import requests
from django.core.management.base import BaseCommand, CommandError

# TODO: Replace with your actual snippet/page models
# from cms.models import (
#     RoleSnippet, OutcomeSnippet, CapabilitySnippet, IntegrationSnippet,
#     LanguageSnippet, ModalitySnippet, DeploymentModeSnippet, BadgeSnippet,
#     OfferingPage,
# )

SALEOR_API_URL = os.getenv("SALEOR_API_URL")
SALEOR_TOKEN = os.getenv("SALEOR_TOKEN")

def _assert_env():
    if not SALEOR_API_URL or not SALEOR_TOKEN:
        raise CommandError("Missing SALEOR_API_URL or SALEOR_TOKEN")

def gql(query: str, variables: Dict[str, Any], retries: int = 5) -> Dict[str, Any]:
    """GraphQL call with backoff on 429/5xx."""
    headers = {
        "Authorization": f"Bearer {SALEOR_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"query": query, "variables": variables}

    delay = 0.5
    for attempt in range(1, retries + 1):
        r = requests.post(SALEOR_API_URL, headers=headers, json=payload, timeout=30)
        if r.status_code in (429, 500, 502, 503, 504):
            if attempt == retries:
                raise CommandError(f"Saleor GraphQL failed after retries: {r.status_code} {r.text}")
            time.sleep(min(delay, 8.0) + random.random() * 0.2)
            delay *= 2
            continue
        if r.status_code >= 400:
            raise CommandError(f"Saleor GraphQL error: {r.status_code} {r.text}")
        data = r.json()
        if "errors" in data and data["errors"]:
            raise CommandError(f"Saleor GraphQL errors: {data['errors']}")
        return data["data"]

@dataclass
class SyncReport:
    created_attribute_values: List[Dict[str, Any]]
    updated_products: List[Dict[str, Any]]
    missing_products: List[Dict[str, Any]]
    missing_taxonomies: List[Dict[str, Any]]
    warnings: List[str]
    errors: List[str]

def derive_credit_label(min_c: Optional[int], max_c: Optional[int]) -> Optional[str]:
    if min_c is None and max_c is None:
        return None
    if min_c is not None and max_c is not None:
        if min_c == max_c:
            return f"~{min_c}/run"
        return f"~{min_c}–{max_c}/run"
    if min_c is not None:
        return f"~{min_c}+/run"
    return f"~0–{max_c}/run"

class Command(BaseCommand):
    help = "Sync Wagtail taxonomies and offering editorial fields into Saleor attributes and product metadata."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", default=False)
        parser.add_argument("--strict", action="store_true", default=False)
        parser.add_argument("--create-missing", action="store_true", default=False)
        parser.add_argument("--sync-attributes", action="store_true", default=False)
        parser.add_argument("--sync-products", action="store_true", default=True)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--only-slugs", type=str, default="")
        parser.add_argument("--report-path", type=str, default="sync_report.json")

    def handle(self, *args, **opts):
        _assert_env()
        dry_run = opts["dry_run"]
        strict = opts["strict"]
        create_missing = opts["create_missing"]
        sync_attributes = opts["sync_attributes"]
        sync_products = opts["sync_products"]
        limit = opts["limit"]
        only_slugs = [s.strip() for s in opts["only_slugs"].split(",") if s.strip()]

        report = SyncReport(
            created_attribute_values=[],
            updated_products=[],
            missing_products=[],
            missing_taxonomies=[],
            warnings=[],
            errors=[],
        )

        # --- A) Load canonical taxonomies from Wagtail
        # TODO: Replace with ORM reads; each item must have key+label
        taxonomies = {
            "roles": [],
            "outcomes": [],
            "capabilities": [],
            "integrations": [],
            "languages": [],
            "modalities": [],
            "deployment_modes": [],
            "badges": [],
            "maturity": [],
        }

        # --- B/C) Ensure Saleor attribute values exist (for each attribute slug)
        # mapping: taxonomy list -> saleor attribute slug
        mapping = {
            "roles": "gsv_roles",
            "outcomes": "gsv_value_stream",
            "capabilities": "gsv_capabilities",
            "integrations": "gsv_integrations_required",
            "languages": "gsv_languages_supported",
            "modalities": "gsv_modalities",
            "deployment_modes": "gsv_deployment_modes_supported",
            "badges": "gsv_badges",
            "maturity": "gsv_maturity",
        }

        # NOTE: In strict mode, fail if attribute missing. In create_missing mode, create values only.
        # TODO: load GraphQL templates from file or inline strings; omitted here for brevity.

        # --- D) Sync products
        # TODO: query OfferingPage objects; for each offering, compute desired attributes + metadata.
        # For each product: productUpdate + updateMetadata

        # --- Output report
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: no writes performed."))

        report_path = opts["report_path"]
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(asdict(report), f, indent=2)

        self.stdout.write(self.style.SUCCESS(f"Wrote report to {report_path}"))
