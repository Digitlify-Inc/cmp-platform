# GSV Agent Store — E2E one-command runner
# Usage:
#   cp .env.example .env
#   make e2e
#
# Requires:
#   - k6: https://k6.io/docs/get-started/installation/
#   - newman (optional): npm i -g newman
#
# Notes:
#   - This Makefile automatically loads .env if present.
#   - The k6 smoke test is the primary E2E check.
#   - The Postman/Newman run validates integration contracts endpoints.

SHELL := /bin/bash
.ONESHELL:

K6 ?= k6
NEWMAN ?= newman

K6_SCRIPT ?= gsv-agent-store-k6-smoke.js
POSTMAN_COLLECTION ?= gsv-agent-store-integration-contracts-v1.postman_collection.json

# Auto-load .env if present (KEY=VALUE format)
ifneq (,$(wildcard .env))
include .env
export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

REQUIRED_VARS := API_BASE CP_BASE USER_JWT SERVICE_JWT OFFERING_VERSION_ID PLAN_ID

.DEFAULT_GOAL := help

.PHONY: help check-env check-tools smoke postman e2e print-env

help:
	@echo ""
	@echo "GSV Agent Store — E2E targets"
	@echo "----------------------------"
	@echo "make smoke    - Run k6 smoke test (recommended)"
	@echo "make postman  - Run Postman contracts via newman (optional)"
	@echo "make e2e      - Run smoke + postman"
	@echo "make print-env- Print key env vars (redacts tokens)"
	@echo ""
	@echo "Tip: copy .env.example to .env and fill values."

check-env:
	@missing=0
	@for v in $(REQUIRED_VARS); do \
	  if [ -z "$${!v}" ]; then \
	    echo "❌ Missing env var: $$v"; missing=1; \
	  fi; \
	done
	@if [ "$$missing" -ne 0 ]; then \
	  echo ""; \
	  echo "Create a .env file (see .env.example) or export vars in your shell."; \
	  exit 2; \
	fi
	@echo "✅ Env looks OK"

check-tools:
	@command -v "$(K6)" >/dev/null 2>&1 || { echo "❌ k6 not found. Install: https://k6.io/docs/get-started/installation/"; exit 2; }
	@echo "✅ k6 found: $$(command -v $(K6))"
	@if command -v "$(NEWMAN)" >/dev/null 2>&1; then \
	  echo "✅ newman found: $$(command -v $(NEWMAN))"; \
	else \
	  echo "⚠️  newman not found (optional). Install: npm i -g newman"; \
	fi

print-env:
	@echo "API_BASE=$${API_BASE}"
	@echo "CP_BASE=$${CP_BASE}"
	@echo "OFFERING_VERSION_ID=$${OFFERING_VERSION_ID}"
	@echo "PLAN_ID=$${PLAN_ID}"
	@echo "USER_JWT=$${USER_JWT:0:12}..."
	@echo "SERVICE_JWT=$${SERVICE_JWT:0:12}..."
	@echo "ORG_ID=$${ORG_ID}"
	@echo "PROJECT_ID=$${PROJECT_ID}"
	@echo "WALLET_ID=$${WALLET_ID}"
	@echo "INSTANCE_ID=$${INSTANCE_ID}"

smoke: check-tools check-env
	@echo "▶ Running k6 smoke: $(K6_SCRIPT)"
	@"$(K6)" run "$(K6_SCRIPT)"

postman: check-env
	@if ! command -v "$(NEWMAN)" >/dev/null 2>&1; then \
	  echo "❌ newman not found. Install: npm i -g newman"; \
	  exit 2; \
	fi
	@echo "▶ Running newman contracts: $(POSTMAN_COLLECTION)"
	@"$(NEWMAN)" run "$(POSTMAN_COLLECTION)" \
	  --global-var "API_BASE=$${API_BASE}" \
	  --global-var "CP_BASE=$${CP_BASE}" \
	  --global-var "KC_BASE=$${KC_BASE}" \
	  --global-var "CONN_BASE=$${CONN_BASE}" \
	  --global-var "USER_JWT=$${USER_JWT}" \
	  --global-var "SERVICE_JWT=$${SERVICE_JWT}" \
	  --global-var "RUNTIME_JWT=$${RUNTIME_JWT}" \
	  --global-var "OFFERING_VERSION_ID=$${OFFERING_VERSION_ID}" \
	  --global-var "PLAN_ID=$${PLAN_ID}" \
	  --global-var "ORG_ID=$${ORG_ID}" \
	  --global-var "PROJECT_ID=$${PROJECT_ID}" \
	  --global-var "WALLET_ID=$${WALLET_ID}" \
	  --global-var "INSTANCE_ID=$${INSTANCE_ID}"

e2e: smoke postman
	@echo "✅ E2E complete"
