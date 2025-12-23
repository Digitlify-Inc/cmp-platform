#!/usr/bin/env python3
"""
Saleor Setup Script for GSV Agent Store

This script executes the GraphQL mutations to:
1. Create the "Offering" product type
2. Create all required attributes (gsv_category, gsv_roles, etc.)
3. Assign attributes to the product type
4. Create collections for categories (Agents, Apps, Assistants, Automations)
5. Optionally seed sample products

Usage:
    # With email/password (recommended):
    python scripts/saleor-setup.py --url https://store.dev.gsv.dev/graphql/ --email admin@dev.gsv.dev --password 'Admin123!'
    python scripts/saleor-setup.py --url https://store.dev.gsv.dev/graphql/ --email admin@dev.gsv.dev --password 'Admin123!' --seed

    # With pre-existing token:
    python scripts/saleor-setup.py --url https://store.dev.gsv.dev/graphql/ --token YOUR_API_TOKEN
    python scripts/saleor-setup.py --url https://store.dev.gsv.dev/graphql/ --token YOUR_API_TOKEN --seed

Environment Variables (alternative to CLI args):
    SALEOR_API_URL - Saleor GraphQL endpoint
    SALEOR_API_TOKEN - Saleor API token with appropriate permissions
    SALEOR_EMAIL - Admin email for authentication
    SALEOR_PASSWORD - Admin password for authentication
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Any, Optional

try:
    import httpx
except ImportError:
    print("Error: httpx is required. Install with: pip install httpx")
    sys.exit(1)


TOKEN_CREATE = """
mutation TokenCreate($email: String!, $password: String!) {
  tokenCreate(email: $email, password: $password) {
    token
    refreshToken
    errors {
      field
      message
    }
  }
}
"""


@dataclass
class SaleorClient:
    """Simple Saleor GraphQL client."""

    url: str
    token: str
    verify_ssl: bool = True

    @classmethod
    def from_credentials(
        cls, url: str, email: str, password: str, verify_ssl: bool = True
    ) -> "SaleorClient":
        """Create a client by authenticating with email/password."""
        print(f"Authenticating as {email}...")

        headers = {"Content-Type": "application/json"}
        payload = {
            "query": TOKEN_CREATE,
            "variables": {"email": email, "password": password},
        }

        response = httpx.post(url, json=payload, headers=headers, timeout=30, verify=verify_ssl)
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            for error in data["errors"]:
                print(f"  GraphQL Error: {error.get('message', error)}")
            raise ValueError("Authentication failed")

        token_data = data.get("data", {}).get("tokenCreate", {})
        if token_data.get("errors"):
            for error in token_data["errors"]:
                print(f"  Auth Error: {error.get('message', error)}")
            raise ValueError("Authentication failed")

        token = token_data.get("token")
        if not token:
            raise ValueError("No token returned from authentication")

        print("  Authentication successful!")
        return cls(url=url, token=token, verify_ssl=verify_ssl)

    def execute(self, query: str, variables: Optional[dict] = None) -> dict:
        """Execute a GraphQL query/mutation."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }
        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        response = httpx.post(
            self.url, json=payload, headers=headers, timeout=30, verify=self.verify_ssl
        )
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            for error in data["errors"]:
                print(f"  GraphQL Error: {error.get('message', error)}")
            return data

        return data


# ============================================================================
# STEP 1: Create Product Type
# ============================================================================

CREATE_PRODUCT_TYPE = """
mutation CreateOfferingProductType {
  productTypeCreate(input: {
    name: "Offering"
    slug: "offering"
    kind: NORMAL
    isShippingRequired: false
    isDigital: true
    hasVariants: true
    taxClass: null
  }) {
    productType {
      id
      name
      slug
    }
    errors {
      field
      message
      code
    }
  }
}
"""

GET_PRODUCT_TYPE = """
query GetOfferingProductType {
  productTypes(first: 10, filter: { search: "Offering" }) {
    edges {
      node {
        id
        name
        slug
      }
    }
  }
}
"""


# ============================================================================
# STEP 2: Create Attributes
# ============================================================================

ATTRIBUTES = [
    {
        "name": "Category",
        "slug": "gsv_category",
        "inputType": "DROPDOWN",
        "values": [
            {"name": "Agents", "value": "agent"},
            {"name": "Apps", "value": "app"},
            {"name": "Assistants", "value": "assistant"},
            {"name": "Automations", "value": "automation"},
        ],
    },
    {
        "name": "Target Roles",
        "slug": "gsv_roles",
        "inputType": "MULTISELECT",
        "values": [
            {"name": "Customer Support", "value": "customer_support"},
            {"name": "Sales / SDR", "value": "sales_sdr"},
            {"name": "Marketing", "value": "marketing"},
            {"name": "HR", "value": "hr"},
            {"name": "IT / Helpdesk", "value": "it_helpdesk"},
            {"name": "Operations", "value": "operations"},
            {"name": "Finance", "value": "finance"},
        ],
    },
    {
        "name": "Outcomes",
        "slug": "gsv_value_stream",
        "inputType": "MULTISELECT",
        "values": [
            {"name": "Reduce support tickets", "value": "customer_support"},
            {"name": "Send personalized outreach", "value": "sales_outreach"},
            {"name": "Turn documents into answers", "value": "knowledge_assistant"},
            {"name": "Book meetings automatically", "value": "meeting_scheduler"},
            {"name": "Create on-brand content", "value": "marketing_content"},
            {"name": "Extract data from files", "value": "data_extraction"},
            {"name": "Monitor & alert on changes", "value": "monitoring_alerting"},
            {"name": "Streamline HR ops", "value": "hr_ops"},
        ],
    },
    {
        "name": "Capabilities",
        "slug": "gsv_capabilities",
        "inputType": "MULTISELECT",
        "values": [
            {"name": "Prompt Orchestrator", "value": "prompt_orchestrator"},
            {"name": "Tool Connectors", "value": "tool_connectors"},
            {"name": "MCP Tools", "value": "mcp_tools"},
            {"name": "API Endpoint", "value": "api_endpoint"},
            {"name": "Chat UI", "value": "chat_ui"},
            {"name": "Web Widget", "value": "web_widget"},
            {"name": "Multilingual", "value": "multilingual"},
            {"name": "Multimodal Vision", "value": "multimodal_vision"},
            {"name": "Multimodal Audio", "value": "multimodal_audio"},
            {"name": "RAG Knowledgebase", "value": "rag_knowledgebase"},
            {"name": "Guardrails & Policies", "value": "guardrails_policy"},
            {"name": "Audit Trail", "value": "audit_trail"},
            {"name": "Scheduler & Triggers", "value": "scheduler_triggers"},
            {"name": "Observability", "value": "observability"},
            {"name": "Credits Wallet", "value": "credits_wallet"},
        ],
    },
    {
        "name": "Required Integrations",
        "slug": "gsv_integrations_required",
        "inputType": "MULTISELECT",
        "values": [
            {"name": "Slack", "value": "slack"},
            {"name": "Email (SMTP/IMAP)", "value": "email"},
            {"name": "HubSpot", "value": "hubspot"},
            {"name": "Salesforce", "value": "salesforce"},
            {"name": "Google Calendar", "value": "google_calendar"},
            {"name": "Google Drive", "value": "google_drive"},
            {"name": "Notion", "value": "notion"},
            {"name": "GitHub", "value": "github"},
            {"name": "Jira", "value": "jira"},
            {"name": "Zendesk", "value": "zendesk"},
            {"name": "Intercom", "value": "intercom"},
            {"name": "Webhook", "value": "webhook"},
        ],
    },
    {
        "name": "Deployment Mode",
        "slug": "gsv_deployment",
        "inputType": "DROPDOWN",
        "values": [
            {"name": "Shared", "value": "shared"},
            {"name": "Dedicated Namespace", "value": "dedicated_namespace"},
            {"name": "Dedicated vCluster", "value": "dedicated_vcluster"},
            {"name": "Dedicated Cluster", "value": "dedicated_cluster"},
            {"name": "On-Premise", "value": "on_prem"},
        ],
    },
    {
        "name": "Maturity",
        "slug": "gsv_maturity",
        "inputType": "DROPDOWN",
        "values": [
            {"name": "Beta", "value": "beta"},
            {"name": "Stable", "value": "stable"},
            {"name": "Enterprise", "value": "enterprise"},
        ],
    },
    {
        "name": "Trial Available",
        "slug": "gsv_trial_available",
        "inputType": "BOOLEAN",
        "values": [],
    },
    {
        "name": "Badges",
        "slug": "gsv_badges",
        "inputType": "MULTISELECT",
        "values": [
            {"name": "Verified", "value": "verified"},
            {"name": "Featured", "value": "featured"},
            {"name": "Trial Available", "value": "trial_available"},
            {"name": "New", "value": "new"},
            {"name": "Trending", "value": "trending"},
        ],
    },
]

CREATE_ATTRIBUTE = """
mutation CreateAttribute($input: AttributeCreateInput!) {
  attributeCreate(input: $input) {
    attribute {
      id
      slug
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

GET_ATTRIBUTES = """
query GetAttributes {
  attributes(first: 50, filter: { search: "gsv_" }) {
    edges {
      node {
        id
        slug
        name
      }
    }
  }
}
"""

ASSIGN_ATTRIBUTES = """
mutation AssignAttributesToProductType($productTypeId: ID!, $attributeIds: [ID!]!) {
  productTypeUpdate(
    id: $productTypeId
    input: {
      productAttributes: $attributeIds
    }
  ) {
    productType {
      id
      name
      productAttributes {
        slug
        name
      }
    }
    errors {
      field
      message
      code
    }
  }
}
"""


# ============================================================================
# STEP 3: Create Collections
# ============================================================================

COLLECTIONS = [
    {
        "name": "Agents",
        "slug": "agents",
        "description": "Autonomous AI workers that complete tasks independently",
    },
    {
        "name": "Apps",
        "slug": "apps",
        "description": "Structured AI-powered applications and workflows",
    },
    {
        "name": "Assistants",
        "slug": "assistants",
        "description": "Interactive chat and voice assistants",
    },
    {
        "name": "Automations",
        "slug": "automations",
        "description": "Event-driven workflows that run on autopilot",
    },
]

CREATE_COLLECTION = """
mutation CreateCollection($input: CollectionCreateInput!) {
  collectionCreate(input: $input) {
    collection {
      id
      slug
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

GET_COLLECTIONS = """
query GetCollections($channel: String!) {
  collections(first: 10, channel: $channel) {
    edges {
      node {
        id
        slug
        name
      }
    }
  }
}
"""


# ============================================================================
# STEP 4: Sample Products
# ============================================================================

SAMPLE_PRODUCTS = [
    {
        "name": "Customer Support Agent",
        "slug": "customer-support-agent",
        "description": "AI agent that handles tier-1 customer inquiries automatically. Reduces ticket volume by 40-60% while maintaining high CSAT scores.",
        "category": "agent",
        "attributes": {
            "gsv_category": ["agent"],
            "gsv_roles": ["customer_support"],
            "gsv_value_stream": ["customer_support"],
            "gsv_capabilities": ["chat_ui", "web_widget", "rag_knowledgebase", "multilingual"],
            "gsv_integrations_required": ["slack", "zendesk", "intercom"],
            "gsv_deployment": ["shared"],
            "gsv_maturity": ["stable"],
            "gsv_badges": ["verified", "featured", "trial_available"],
        },
        "metadata": {
            "cp_offering_id": "cust-support-agent-001",
            "credits_estimate_min": "3",
            "credits_estimate_max": "8",
            "credits_estimate_label": "~3-8/message",
            "primary_outcome": "customer_support",
            "primary_role": "customer_support",
        },
        "price": 49.00,
    },
    {
        "name": "Knowledge Base Assistant",
        "slug": "knowledge-base-assistant",
        "description": "AI assistant that answers questions from your documentation, policies, and knowledge base. RAG-powered for accurate, sourced answers.",
        "category": "assistant",
        "attributes": {
            "gsv_category": ["assistant"],
            "gsv_roles": ["customer_support", "hr", "it_helpdesk", "operations"],
            "gsv_value_stream": ["knowledge_assistant"],
            "gsv_capabilities": ["chat_ui", "web_widget", "rag_knowledgebase", "multilingual", "audit_trail"],
            "gsv_integrations_required": ["google_drive", "notion", "slack"],
            "gsv_deployment": ["shared"],
            "gsv_maturity": ["stable"],
            "gsv_badges": ["verified", "featured", "trial_available"],
        },
        "metadata": {
            "cp_offering_id": "kb-assistant-001",
            "credits_estimate_min": "2",
            "credits_estimate_max": "5",
            "credits_estimate_label": "~2-5/query",
            "primary_outcome": "knowledge_assistant",
            "primary_role": "operations",
        },
        "price": 29.00,
    },
    {
        "name": "Meeting Scheduler",
        "slug": "meeting-scheduler",
        "description": "AI that schedules, reschedules, and confirms meetings. Handles back-and-forth, finds optimal times, and sends calendar invites.",
        "category": "automation",
        "attributes": {
            "gsv_category": ["automation"],
            "gsv_roles": ["sales_sdr", "customer_support", "hr"],
            "gsv_value_stream": ["meeting_scheduler"],
            "gsv_capabilities": ["tool_connectors", "scheduler_triggers", "multilingual"],
            "gsv_integrations_required": ["google_calendar", "email", "slack"],
            "gsv_deployment": ["shared"],
            "gsv_maturity": ["stable"],
            "gsv_badges": ["verified", "featured", "trial_available"],
        },
        "metadata": {
            "cp_offering_id": "meeting-scheduler-001",
            "credits_estimate_min": "2",
            "credits_estimate_max": "5",
            "credits_estimate_label": "~2-5/meeting",
            "primary_outcome": "meeting_scheduler",
            "primary_role": "sales_sdr",
        },
        "price": 19.00,
    },
]

CREATE_PRODUCT = """
mutation CreateProduct($input: ProductCreateInput!) {
  productCreate(input: $input) {
    product {
      id
      slug
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

CREATE_VARIANT = """
mutation CreateVariant($input: ProductVariantCreateInput!) {
  productVariantCreate(input: $input) {
    productVariant {
      id
      sku
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

UPDATE_VARIANT_PRICE = """
mutation UpdateVariantPrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
  productVariantChannelListingUpdate(id: $id, input: $input) {
    variant {
      id
      channelListings {
        price {
          amount
          currency
        }
      }
    }
    errors {
      field
      message
      code
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
    }
    errors {
      field
      message
      code
    }
  }
}
"""


def setup_saleor(client: SaleorClient, seed: bool = False, channel: str = "default-channel"):
    """Run the full Saleor setup."""

    print("\n" + "=" * 60)
    print("GSV Agent Store - Saleor Setup")
    print("=" * 60)

    # Step 1: Get or create product type
    print("\n[1/5] Setting up Product Type...")

    result = client.execute(GET_PRODUCT_TYPE)
    product_types = result.get("data", {}).get("productTypes", {}).get("edges", [])

    product_type_id = None
    for pt in product_types:
        if pt["node"]["slug"] == "offering":
            product_type_id = pt["node"]["id"]
            print(f"  Found existing product type: {product_type_id}")
            break

    if not product_type_id:
        result = client.execute(CREATE_PRODUCT_TYPE)
        if result.get("data", {}).get("productTypeCreate", {}).get("productType"):
            product_type_id = result["data"]["productTypeCreate"]["productType"]["id"]
            print(f"  Created product type: {product_type_id}")
        else:
            print("  ERROR: Failed to create product type")
            return

    # Step 2: Create attributes
    print("\n[2/5] Creating Attributes...")

    # First, get existing attributes
    result = client.execute(GET_ATTRIBUTES)
    existing_attrs = {
        edge["node"]["slug"]: edge["node"]["id"]
        for edge in result.get("data", {}).get("attributes", {}).get("edges", [])
    }

    attribute_ids = []
    for attr in ATTRIBUTES:
        if attr["slug"] in existing_attrs:
            print(f"  Attribute '{attr['slug']}' already exists")
            attribute_ids.append(existing_attrs[attr["slug"]])
            continue

        # Build values list
        values = []
        for v in attr.get("values", []):
            values.append({"name": v["name"], "value": v["value"]})

        input_data = {
            "name": attr["name"],
            "slug": attr["slug"],
            "type": "PRODUCT_TYPE",
            "inputType": attr["inputType"],
            "filterableInStorefront": True,
            "filterableInDashboard": True,
            "visibleInStorefront": True,
        }

        if values:
            input_data["values"] = values

        result = client.execute(CREATE_ATTRIBUTE, {"input": input_data})

        if result.get("data", {}).get("attributeCreate", {}).get("attribute"):
            attr_id = result["data"]["attributeCreate"]["attribute"]["id"]
            attribute_ids.append(attr_id)
            print(f"  Created attribute: {attr['slug']} ({attr_id})")
        else:
            print(f"  ERROR creating attribute: {attr['slug']}")

    # Step 3: Assign attributes to product type
    print("\n[3/5] Assigning Attributes to Product Type...")

    result = client.execute(ASSIGN_ATTRIBUTES, {
        "productTypeId": product_type_id,
        "attributeIds": attribute_ids,
    })

    if result.get("data", {}).get("productTypeUpdate", {}).get("productType"):
        print(f"  Assigned {len(attribute_ids)} attributes to Offering product type")
    else:
        print("  ERROR: Failed to assign attributes")

    # Step 4: Create collections
    print("\n[4/5] Creating Collections...")

    # Get existing collections
    result = client.execute(GET_COLLECTIONS, {"channel": channel})
    existing_collections = {
        edge["node"]["slug"]: edge["node"]["id"]
        for edge in result.get("data", {}).get("collections", {}).get("edges", [])
    }

    collection_ids = {}
    for coll in COLLECTIONS:
        if coll["slug"] in existing_collections:
            print(f"  Collection '{coll['slug']}' already exists")
            collection_ids[coll["slug"]] = existing_collections[coll["slug"]]
            continue

        result = client.execute(CREATE_COLLECTION, {
            "input": {
                "name": coll["name"],
                "slug": coll["slug"],
                "description": coll["description"],
                "isPublished": True,
            }
        })

        if result.get("data", {}).get("collectionCreate", {}).get("collection"):
            coll_id = result["data"]["collectionCreate"]["collection"]["id"]
            collection_ids[coll["slug"]] = coll_id
            print(f"  Created collection: {coll['slug']} ({coll_id})")
        else:
            print(f"  ERROR creating collection: {coll['slug']}")

    # Step 5: Seed sample products
    if seed:
        print("\n[5/5] Seeding Sample Products...")

        # Get channel ID
        result = client.execute(GET_CHANNEL)
        channels = result.get("data", {}).get("channels", [])
        channel_id = None
        for ch in channels:
            if ch["slug"] == channel or ch["isActive"]:
                channel_id = ch["id"]
                break

        if not channel_id:
            print("  ERROR: No active channel found")
            return

        # Refresh attribute IDs
        result = client.execute(GET_ATTRIBUTES)
        attr_id_map = {
            edge["node"]["slug"]: edge["node"]["id"]
            for edge in result.get("data", {}).get("attributes", {}).get("edges", [])
        }

        for product in SAMPLE_PRODUCTS:
            print(f"  Creating: {product['name']}...")

            # Build attribute assignments
            attributes = []
            for attr_slug, values in product["attributes"].items():
                if attr_slug in attr_id_map:
                    attributes.append({
                        "id": attr_id_map[attr_slug],
                        "values": values,
                    })

            # Build metadata
            metadata = [
                {"key": k, "value": v}
                for k, v in product["metadata"].items()
            ]

            # Get collection for category
            category_collection = f"{product['category']}s"  # agent -> agents

            input_data = {
                "productType": product_type_id,
                "name": product["name"],
                "slug": product["slug"],
                "description": json.dumps({"blocks": [{"type": "paragraph", "data": {"text": product["description"]}}]}),
                "attributes": attributes,
                "metadata": metadata,
            }

            if category_collection in collection_ids:
                input_data["collections"] = [collection_ids[category_collection]]

            result = client.execute(CREATE_PRODUCT, {"input": input_data})

            if result.get("data", {}).get("productCreate", {}).get("product"):
                product_id = result["data"]["productCreate"]["product"]["id"]
                print(f"    Created product: {product_id}")

                # Create variant
                variant_result = client.execute(CREATE_VARIANT, {
                    "input": {
                        "product": product_id,
                        "sku": product["slug"] + "-monthly",
                        "name": "Monthly Subscription",
                        "trackInventory": False,
                    }
                })

                if variant_result.get("data", {}).get("productVariantCreate", {}).get("productVariant"):
                    variant_id = variant_result["data"]["productVariantCreate"]["productVariant"]["id"]
                    print(f"    Created variant: {variant_id}")

                    # Set price
                    price_result = client.execute(UPDATE_VARIANT_PRICE, {
                        "id": variant_id,
                        "input": [{
                            "channelId": channel_id,
                            "price": product["price"],
                            "costPrice": 0,
                        }]
                    })

                    if price_result.get("data", {}).get("productVariantChannelListingUpdate", {}).get("variant"):
                        print(f"    Set price: ${product['price']}")

                # Publish product
                publish_result = client.execute(PUBLISH_PRODUCT, {
                    "id": product_id,
                    "input": [{
                        "channelId": channel_id,
                        "isPublished": True,
                        "isAvailableForPurchase": True,
                    }]
                })

                if publish_result.get("data", {}).get("productChannelListingUpdate", {}).get("product"):
                    print(f"    Published to channel")
            else:
                print(f"    ERROR creating product")
    else:
        print("\n[5/5] Skipping product seeding (use --seed to create sample products)")

    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Visit your Saleor dashboard to verify products")
    print("  2. Configure payment integration (Stripe, etc.)")
    print("  3. Set up webhooks to point to your Provisioner service")
    print("  4. Test a purchase flow end-to-end")


def main():
    parser = argparse.ArgumentParser(
        description="Setup Saleor for GSV Agent Store",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("SALEOR_API_URL", "http://localhost:8000/graphql/"),
        help="Saleor GraphQL endpoint",
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("SALEOR_API_TOKEN", ""),
        help="Saleor API token (alternative to email/password)",
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("SALEOR_EMAIL", ""),
        help="Admin email for authentication",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("SALEOR_PASSWORD", ""),
        help="Admin password for authentication",
    )
    parser.add_argument(
        "--channel",
        default="default-channel",
        help="Saleor channel slug (default: default-channel)",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Also seed sample products",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable SSL certificate verification (for dev environments)",
    )

    args = parser.parse_args()

    verify_ssl = not args.insecure
    if args.insecure:
        print("WARNING: SSL verification disabled")

    # Create client - prefer email/password, fall back to token
    client = None
    if args.email and args.password:
        try:
            client = SaleorClient.from_credentials(
                url=args.url,
                email=args.email,
                password=args.password,
                verify_ssl=verify_ssl,
            )
        except Exception as e:
            print(f"Authentication failed: {e}")
            sys.exit(1)
    elif args.token:
        client = SaleorClient(url=args.url, token=args.token, verify_ssl=verify_ssl)
    else:
        print("Error: Either --email/--password or --token required")
        print("  Option 1: --email admin@dev.gsv.dev --password 'Admin123!'")
        print("  Option 2: --token YOUR_API_TOKEN")
        sys.exit(1)

    try:
        setup_saleor(client, seed=args.seed, channel=args.channel)
    except httpx.HTTPError as e:
        print(f"\nHTTP Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
