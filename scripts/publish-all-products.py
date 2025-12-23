#!/usr/bin/env python3
"""
Publish All Products Script

Makes all products in Saleor available for purchase in the default channel.

Usage:
    python scripts/publish-all-products.py \
        --url https://store.dev.gsv.dev/graphql/ \
        --email admin@dev.gsv.dev \
        --password 'Admin123!' \
        --insecure
"""

import argparse
import os
import sys

try:
    import httpx
except ImportError:
    print("Error: httpx is required. Install with: pip install httpx")
    sys.exit(1)


TOKEN_CREATE = """
mutation TokenCreate($email: String!, $password: String!) {
  tokenCreate(email: $email, password: $password) {
    token
    errors { field message }
  }
}
"""

GET_ALL_PRODUCTS = """
query GetAllProducts {
  products(first: 100) {
    edges {
      node {
        id
        name
        slug
        isAvailable
        isAvailableForPurchase
        variants {
          id
          name
          sku
        }
      }
    }
  }
}
"""

GET_CHANNEL = """
query GetChannel {
  channels {
    id
    slug
    name
    isActive
  }
}
"""

PUBLISH_PRODUCT = """
mutation PublishProduct($id: ID!, $input: [PublishableChannelListingInput!]!) {
  productChannelListingUpdate(id: $id, input: { updateChannels: $input }) {
    product {
      id
      name
      isAvailable
      isAvailableForPurchase
    }
    errors {
      field
      message
      code
    }
  }
}
"""

UPDATE_VARIANT_CHANNEL = """
mutation UpdateVariantChannel($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
  productVariantChannelListingUpdate(id: $id, input: $input) {
    variant {
      id
      name
    }
    errors {
      field
      message
      code
    }
  }
}
"""


def execute_graphql(url: str, token: str, query: str, variables: dict = None, verify_ssl: bool = True):
    """Execute a GraphQL query."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    response = httpx.post(url, json=payload, headers=headers, timeout=30, verify=verify_ssl)
    response.raise_for_status()
    return response.json()


def get_token(url: str, email: str, password: str, verify_ssl: bool = True) -> str:
    """Get auth token."""
    headers = {"Content-Type": "application/json"}
    payload = {
        "query": TOKEN_CREATE,
        "variables": {"email": email, "password": password},
    }
    response = httpx.post(url, json=payload, headers=headers, timeout=30, verify=verify_ssl)
    response.raise_for_status()
    data = response.json()

    token_data = data.get("data", {}).get("tokenCreate", {})
    if token_data.get("errors"):
        for error in token_data["errors"]:
            print(f"Auth Error: {error.get('message')}")
        sys.exit(1)

    return token_data.get("token")


def main():
    parser = argparse.ArgumentParser(description="Publish all products in Saleor")
    parser.add_argument("--url", required=True, help="Saleor GraphQL endpoint")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--channel", default="default-channel", help="Channel slug")
    parser.add_argument("--insecure", action="store_true", help="Disable SSL verification")

    args = parser.parse_args()
    verify_ssl = not args.insecure

    print(f"Connecting to {args.url}...")
    token = get_token(args.url, args.email, args.password, verify_ssl)
    print("Authenticated successfully!")

    # Get channel ID
    print("\nFetching channel info...")
    result = execute_graphql(args.url, token, GET_CHANNEL, verify_ssl=verify_ssl)
    channels = result.get("data", {}).get("channels", [])
    channel_id = None
    for ch in channels:
        if ch["slug"] == args.channel:
            channel_id = ch["id"]
            print(f"  Found channel: {ch['name']} ({channel_id})")
            break

    if not channel_id:
        print(f"ERROR: Channel '{args.channel}' not found")
        sys.exit(1)

    # Get all products
    print("\nFetching all products...")
    result = execute_graphql(args.url, token, GET_ALL_PRODUCTS, verify_ssl=verify_ssl)
    products = result.get("data", {}).get("products", {}).get("edges", [])
    print(f"  Found {len(products)} products")

    # Publish each product
    print("\nPublishing products...")
    success_count = 0
    error_count = 0

    for edge in products:
        product = edge["node"]
        product_id = product["id"]
        name = product["name"]
        is_available = product["isAvailable"]
        is_purchasable = product["isAvailableForPurchase"]

        if is_available and is_purchasable:
            print(f"  [OK] {name} - already published")
            success_count += 1
            continue

        print(f"  [PUBLISHING] {name}...")

        # Publish product to channel
        result = execute_graphql(
            args.url, token, PUBLISH_PRODUCT,
            {
                "id": product_id,
                "input": [{
                    "channelId": channel_id,
                    "isPublished": True,
                    "isAvailableForPurchase": True,
                    "availableForPurchaseAt": None,
                }]
            },
            verify_ssl=verify_ssl
        )

        errors = result.get("data", {}).get("productChannelListingUpdate", {}).get("errors", [])
        if errors:
            print(f"    ERROR: {errors}")
            error_count += 1
            continue

        updated = result.get("data", {}).get("productChannelListingUpdate", {}).get("product", {})
        if updated:
            print(f"    Published: isAvailable={updated.get('isAvailable')}, isAvailableForPurchase={updated.get('isAvailableForPurchase')}")

        # Update variants to have price in channel (if they don't have one)
        for variant in product.get("variants", []):
            variant_id = variant["id"]
            variant_name = variant["name"]

            var_result = execute_graphql(
                args.url, token, UPDATE_VARIANT_CHANNEL,
                {
                    "id": variant_id,
                    "input": [{
                        "channelId": channel_id,
                        "price": 0,  # Free or set a default price
                    }]
                },
                verify_ssl=verify_ssl
            )

            var_errors = var_result.get("data", {}).get("productVariantChannelListingUpdate", {}).get("errors", [])
            if var_errors:
                # Price might already exist, that's OK
                if "already exists" not in str(var_errors):
                    print(f"    Variant '{variant_name}' warning: {var_errors}")
            else:
                print(f"    Updated variant: {variant_name}")

        success_count += 1

    print(f"\n{'='*50}")
    print(f"Done! Published: {success_count}, Errors: {error_count}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
