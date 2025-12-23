# GSV Agent Store — Site Structure & Navigation v1
_Last updated: 2025-12-19_

This is a **GTM-first** website structure inspired by outcome-led stores (e.g., Lindy) while staying compatible with your architecture (Saleor + Wagtail + Control Plane).

## Primary navigation (header)
1. **Marketplace**
2. **Solutions**
3. **Pricing**
4. **Resources**
5. **Sign in** / **Credits** (logged-in)

### Marketplace mega / sub-nav
- Browse by: **Outcome**, **Role**, **Capability**, **Category**
- Categories: **Agents**, **Apps**, **Assistants**, **Automations**
- Featured rails: **New**, **Trending**, **Most used**, **Starter-friendly**

### Solutions sub-nav (GTM v1)
- Customer Support
- Sales / SDR
- Marketing
- Operations
- HR (optional in v1; keep if you have offerings)

### Resources sub-nav
- Docs
- Templates / Examples
- Integrations
- Blog
- Changelog
- Security
- Contact

## Footer (minimal, trust-building)
- Product: Marketplace, Pricing, Integrations, Docs
- Company: About, Security, Changelog
- Legal: Privacy, Terms, Acceptable Use
- Contact: Email, Social

## Sitemap (v1)
```
/
/marketplace
/marketplace/agents
/marketplace/apps
/marketplace/assistants
/marketplace/automations
/marketplace/{category}/{slug}

/solutions
/solutions/{role}

/outcomes/{valueStream}            (8 GTM pages)
/capabilities/{capabilityKey}      (top capabilities, 10–15)

/pricing
/pricing/credits
/pricing/topup
/pricing/gift-cards

/integrations
/templates
/docs
/blog
/changelog
/security
/about
/contact
/faq
```

## Content ownership (recommended)
- **Wagtail**: home, solutions, outcomes, capability explainers, blog, docs landing pages.
- **Saleor**: marketplace listing + PDP pricing blocks + checkout.
- **Control Plane**: in-app / logged-in (wallet, entitlements, config, run console).

## 3 GTM rules
1. **Lead with Outcomes** (home page hero + ads + SEO pages).
2. Keep “Agents/Apps/Assistants/Automations” as *secondary browsing*.
3. Make **Credits** understandable in <15 seconds (what they are + examples + estimate widget).
