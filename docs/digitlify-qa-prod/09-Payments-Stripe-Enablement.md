# Payments & Stripe Enablement Plan

## Goal
Enable “paid order → provision instance → run & bill usage” end-to-end.

## Fastest path for QA
- Use Saleor Dummy payment or manual “mark as paid”.
- Validate:
  - order paid webhook delivered
  - CP provisions instance
  - buyer can run and usage deducts credits

## Production Stripe (recommended)
Two viable approaches (pick one):
1) **Saleor Stripe app/plugin** (preferred if you already use Saleor Apps ecosystem)
2) External checkout + “order paid” event into CP (fast but less integrated)

## Minimum checklist (Stripe)
- Stripe account created
- Webhook endpoint configured (Saleor → CP integration)
- Secrets in Vault:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
- Saleor payment gateway enabled for correct channel(s)
- Test cases:
  - successful payment
  - webhook signature verified
  - failed payment
  - refund/cancel (can be manual post-GTM)

## GTM note
If Stripe requires more than 1–2 days to stabilize, keep QA using Dummy payments and launch with a clearly documented “payment beta” path (but this is a product decision).

