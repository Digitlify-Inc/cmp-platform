#!/usr/bin/env python3
"""
Register Saleor webhook for ORDER_FULLY_PAID events.

This script creates a webhook subscription in Saleor that will call
the Provisioner service when an order is fully paid.

Usage:
    python register-saleor-webhook.py

Environment variables:
    SALEOR_API_URL: Saleor GraphQL API URL (default: http://cmp-commerce-api:8000/graphql/)
    SALEOR_EMAIL: Admin email (default: admin@dev.gsv.dev)
    SALEOR_PASSWORD: Admin password
    PROVISIONER_URL: Provisioner webhook URL (default: http://cmp-provisioner:8000/webhooks/saleor/order-paid)
"""

import os
import sys
import json
import urllib.request
import urllib.error

# Configuration
SALEOR_API_URL = os.environ.get("SALEOR_API_URL", "http://cmp-commerce-api:8000/graphql/")
SALEOR_EMAIL = os.environ.get("SALEOR_EMAIL", "admin@dev.gsv.dev")
SALEOR_PASSWORD = os.environ.get("SALEOR_PASSWORD", "Admin123!")
PROVISIONER_URL = os.environ.get("PROVISIONER_URL", "http://cmp-provisioner:8000/webhooks/saleor/order-paid")
WEBHOOK_NAME = "CMP Provisioner - Order Paid"


def graphql_request(query, variables=None, token=None):
    """Execute a GraphQL request against Saleor."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(SALEOR_API_URL, data=data, headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        print(f"HTTP Error {e.code}: {error_body}")
        raise


def get_auth_token():
    """Get authentication token from Saleor."""
    query = '''
    mutation TokenCreate($email: String!, $password: String!) {
        tokenCreate(email: $email, password: $password) {
            token
            errors {
                field
                message
            }
        }
    }
    '''
    result = graphql_request(query, {"email": SALEOR_EMAIL, "password": SALEOR_PASSWORD})
    
    if "errors" in result:
        print(f"GraphQL errors: {result['errors']}")
        sys.exit(1)
    
    data = result.get("data", {}).get("tokenCreate", {})
    if data.get("errors"):
        print(f"Auth errors: {data['errors']}")
        sys.exit(1)
    
    return data.get("token")


def list_webhooks(token):
    """List existing webhooks."""
    query = '''
    query {
        webhooks(first: 100) {
            edges {
                node {
                    id
                    name
                    targetUrl
                    isActive
                    syncEvents {
                        eventType
                    }
                    asyncEvents {
                        eventType
                    }
                }
            }
        }
    }
    '''
    result = graphql_request(query, token=token)
    return [edge["node"] for edge in result.get("data", {}).get("webhooks", {}).get("edges", [])]


def delete_webhook(token, webhook_id):
    """Delete a webhook by ID."""
    query = '''
    mutation WebhookDelete($id: ID!) {
        webhookDelete(id: $id) {
            errors {
                field
                message
            }
        }
    }
    '''
    result = graphql_request(query, {"id": webhook_id}, token=token)
    errors = result.get("data", {}).get("webhookDelete", {}).get("errors", [])
    return len(errors) == 0


def create_webhook(token):
    """Create the ORDER_FULLY_PAID webhook."""
    query = '''
    mutation WebhookCreate($input: WebhookCreateInput!) {
        webhookCreate(input: $input) {
            webhook {
                id
                name
                targetUrl
                isActive
            }
            errors {
                field
                message
                code
            }
        }
    }
    '''
    
    variables = {
        "input": {
            "name": WEBHOOK_NAME,
            "targetUrl": PROVISIONER_URL,
            "asyncEvents": ["ORDER_FULLY_PAID"],
            "isActive": True,
        }
    }
    
    result = graphql_request(query, variables, token=token)
    return result.get("data", {}).get("webhookCreate", {})


def main():
    print(f"Saleor API URL: {SALEOR_API_URL}")
    print(f"Provisioner URL: {PROVISIONER_URL}")
    print()
    
    # Get auth token
    print("Authenticating...")
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        sys.exit(1)
    print("Authenticated successfully")
    print()
    
    # List existing webhooks
    print("Checking existing webhooks...")
    webhooks = list_webhooks(token)
    
    # Check if webhook already exists
    existing = None
    for wh in webhooks:
        if wh["name"] == WEBHOOK_NAME or wh["targetUrl"] == PROVISIONER_URL:
            existing = wh
            break
    
    if existing:
        print(f"Found existing webhook: {existing['name']} ({existing['id']})")
        print(f"  Target URL: {existing['targetUrl']}")
        print(f"  Active: {existing['isActive']}")
        
        # Delete and recreate to ensure latest config
        print("Deleting existing webhook to recreate...")
        if delete_webhook(token, existing["id"]):
            print("Deleted successfully")
        else:
            print("Failed to delete, continuing anyway...")
    
    # Create webhook
    print()
    print("Creating webhook...")
    result = create_webhook(token)
    
    if result.get("errors"):
        print(f"Failed to create webhook: {result['errors']}")
        sys.exit(1)
    
    webhook = result.get("webhook")
    if webhook:
        print("Webhook created successfully!")
        print(f"  ID: {webhook['id']}")
        print(f"  Name: {webhook['name']}")
        print(f"  Target URL: {webhook['targetUrl']}")
        print(f"  Active: {webhook['isActive']}")
    else:
        print("Failed to create webhook (no webhook in response)")
        sys.exit(1)


if __name__ == "__main__":
    main()
