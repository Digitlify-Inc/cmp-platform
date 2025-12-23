# Website & Marketplace GitOps Remediation Plan

**Date:** 2025-12-20
**Version:** 1.0
**Status:** Implementation Ready
**Priority:** P0 - Critical Path to GTM

---

## Executive Summary

This document provides a comprehensive, long-term GitOps solution to fix the issues between the **Wagtail CMS Website** (dev.gsv.dev) and the **Saleor Storefront Marketplace** (marketplace.dev.gsv.dev). The solution ensures:

1. **No redirect loops** - Clean routing without manual `/default-channel` navigation
2. **Consistent theming** - Unified design system across both apps
3. **Consistent navigation** - Same header/footer on both sites
4. **Specification alignment** - Both apps align with documentation specs
5. **GitOps-first approach** - All changes via git commits, no kubectl apply

---

## Part 1: Current State Analysis

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT STATE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐              ┌──────────────────────┐            │
│  │   cmp-website        │              │   cmp-storefront     │            │
│  │   (Wagtail CMS)      │              │   (Next.js + Saleor) │            │
│  │                      │              │                      │            │
│  │   dev.gsv.dev        │              │ marketplace.dev.gsv.dev           │
│  │                      │              │                      │            │
│  │   - White header     │  DIFFERENT   │   - Purple header    │            │
│  │   - Different nav    │ ◄──────────► │   - Different nav    │            │
│  │   - No channel       │              │   - /default-channel │            │
│  │   - External links   │              │   - /[channel] routes│            │
│  └──────────────────────┘              └──────────────────────┘            │
│                                                                             │
│  PROBLEMS:                                                                  │
│  1. Root URL redirect loop on storefront                                    │
│  2. Different header/footer styling                                         │
│  3. Navigation links point to wrong domains                                 │
│  4. Theme colors inconsistent                                               │
│  5. Missing routes per sitemap spec                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Identified Issues

| # | Issue | Current Behavior | Expected Behavior |
|---|-------|-----------------|-------------------|
| 1 | **Redirect loop** | marketplace.dev.gsv.dev shows "too many redirects" | Clean homepage load |
| 2 | **Manual channel** | Must add `/default-channel` to access site | Auto-redirect to default channel |
| 3 | **Header mismatch** | Website: white bg, Storefront: purple gradient | Consistent across both |
| 4 | **Footer mismatch** | Different link structures and styling | Identical footer |
| 5 | **Nav links broken** | Cross-site links hardcoded incorrectly | Dynamic, correct links |
| 6 | **Theme colors** | Different purple shades | Unified brand colors |
| 7 | **Missing routes** | Many sitemap routes not implemented | All routes per spec |

---

## Part 2: Target Architecture

### Recommended Domain Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TARGET STATE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    UNIFIED BRAND EXPERIENCE                         │    │
│  │                                                                     │    │
│  │  ┌─────────────────────┐         ┌─────────────────────┐          │    │
│  │  │  Wagtail CMS        │         │  Next.js Storefront │          │    │
│  │  │  (Marketing)        │         │  (Commerce)         │          │    │
│  │  │                     │         │                     │          │    │
│  │  │  dev.gsv.dev/       │         │  dev.gsv.dev/       │          │    │
│  │  │  ├── /              │         │  └── /marketplace/* │          │    │
│  │  │  ├── /solutions/*   │         │      /checkout/*    │          │    │
│  │  │  ├── /outcomes/*    │         │      /cart          │          │    │
│  │  │  ├── /pricing       │         │      /account/*     │          │    │
│  │  │  ├── /blog/*        │         │      /run/*         │          │    │
│  │  │  ├── /docs/*        │         │                     │          │    │
│  │  │  └── /about, etc    │         │                     │          │    │
│  │  └─────────────────────┘         └─────────────────────┘          │    │
│  │                                                                     │    │
│  │  SHARED:                                                            │    │
│  │  - Header component (same on both)                                  │    │
│  │  - Footer component (same on both)                                  │    │
│  │  - Brand colors (design tokens)                                     │    │
│  │  - Typography (Inter font)                                          │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Two Implementation Options

**Option A: Unified Domain (Recommended for GTM)**
- Single domain: `dev.gsv.dev`
- Wagtail serves: `/`, `/solutions/*`, `/outcomes/*`, `/pricing`, `/blog/*`, `/docs/*`, `/about`, `/contact`, `/security`, `/legal/*`
- Storefront serves: `/marketplace/*`, `/checkout/*`, `/cart`, `/account/*`, `/run/*`
- Ingress routes by path prefix

**Option B: Separate Domains (Current)**
- CMS: `dev.gsv.dev` (www.dev.gsv.dev)
- Storefront: `marketplace.dev.gsv.dev`
- Cross-site navigation via absolute URLs
- Shared design system via npm package or copy

**Recommendation:** Start with **Option B** (separate domains) for immediate GTM, migrate to **Option A** post-GTM for unified experience.

---

## Part 3: Design System Specification

### 3.1 Brand Colors (Unified)

```css
/* design-tokens.css - SHARED across both apps */

:root {
  /* Primary Brand - Purple/Violet */
  --color-primary-50: #faf5ff;
  --color-primary-100: #f3e8ff;
  --color-primary-200: #e9d5ff;
  --color-primary-300: #d8b4fe;
  --color-primary-400: #c084fc;
  --color-primary-500: #a855f7;
  --color-primary-600: #9333ea;
  --color-primary-700: #7c3aed;  /* PRIMARY BRAND COLOR */
  --color-primary-800: #6d28d9;
  --color-primary-900: #581c87;

  /* Brand Gradient */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  --gradient-hero: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);

  /* Neutral Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-500: #737373;
  --color-neutral-700: #404040;
  --color-neutral-900: #171717;

  /* Category Colors */
  --color-agents: #7c3aed;      /* Purple - Agents */
  --color-apps: #3b82f6;        /* Blue - Apps */
  --color-assistants: #f59e0b;  /* Amber - Assistants */
  --color-automations: #10b981; /* Emerald - Automations */

  /* Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### 3.2 Tailwind Configuration (Both Apps)

```typescript
// tailwind.config.ts - USE IN BOTH cmp-website AND cmp-storefront

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./templates/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand Primary
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',  // PRIMARY
          800: '#6d28d9',
          900: '#581c87',
        },
        // Category Colors
        agents: '#7c3aed',
        apps: '#3b82f6',
        assistants: '#f59e0b',
        automations: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        'gradient-hero': 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

### 3.3 Global CSS Classes (Shared)

```css
/* globals.css - ADD TO BOTH APPS */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Primary Button */
  .btn-primary {
    @apply inline-flex items-center justify-center px-6 py-3
           bg-gradient-to-r from-primary-600 to-primary-700
           text-white font-semibold rounded-lg
           hover:from-primary-700 hover:to-primary-800
           transition-all duration-200 shadow-md hover:shadow-lg;
  }

  /* Secondary Button */
  .btn-secondary {
    @apply inline-flex items-center justify-center px-6 py-3
           border-2 border-primary-600 text-primary-700
           font-semibold rounded-lg
           hover:bg-primary-50 transition-all duration-200;
  }

  /* Ghost Button */
  .btn-ghost {
    @apply inline-flex items-center justify-center px-4 py-2
           text-neutral-600 hover:text-primary-700
           hover:bg-neutral-100 rounded-lg transition-all;
  }

  /* Card */
  .card {
    @apply bg-white rounded-xl shadow-md border border-neutral-200
           hover:shadow-lg transition-shadow duration-200;
  }

  /* Section Heading */
  .section-heading {
    @apply text-3xl md:text-4xl font-bold text-neutral-900
           tracking-tight;
  }

  /* Section Subheading */
  .section-subheading {
    @apply text-lg text-neutral-600 max-w-2xl;
  }

  /* Nav Link */
  .nav-link {
    @apply text-neutral-600 hover:text-primary-700
           font-medium transition-colors;
  }

  .nav-link-active {
    @apply text-primary-700 border-b-2 border-primary-700;
  }

  /* Badge */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5
           rounded-full text-xs font-medium;
  }

  .badge-agents { @apply bg-purple-100 text-purple-800; }
  .badge-apps { @apply bg-blue-100 text-blue-800; }
  .badge-assistants { @apply bg-amber-100 text-amber-800; }
  .badge-automations { @apply bg-emerald-100 text-emerald-800; }
  .badge-verified { @apply bg-green-100 text-green-800; }
  .badge-new { @apply bg-blue-100 text-blue-800; }
  .badge-trending { @apply bg-orange-100 text-orange-800; }
  .badge-trial { @apply bg-purple-100 text-purple-800; }
}

/* Custom scrollbar */
@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## Part 4: Header & Footer Specifications

### 4.1 Unified Header Component

**Visual Specification:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                                   │
│  │ LOGO │  Marketplace  Solutions  Pricing  Blog  Docs    [Login] [Start]  │
│  └──────┘                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Height: 64px (h-16)
Background: white with backdrop blur (bg-white/80 backdrop-blur-lg)
Position: sticky top-0 z-50
Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

**Navigation Links (Per Spec 22-Storefront-IA):**

| Link | URL | Target App |
|------|-----|------------|
| Marketplace | /marketplace | Storefront |
| Solutions | /solutions | CMS |
| Pricing | /pricing | CMS |
| Blog | /blog | CMS |
| Docs | /docs | CMS |
| Log in | /login | Storefront (Keycloak) |
| Get Started Free | /marketplace | Storefront |

**Cross-Domain Link Logic:**

```typescript
// For Storefront (marketplace.dev.gsv.dev)
const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_URL || 'https://dev.gsv.dev';

const navLinks = [
  { label: 'Marketplace', href: '/marketplace', internal: true },
  { label: 'Solutions', href: `${CMS_BASE_URL}/solutions/`, internal: false },
  { label: 'Pricing', href: `${CMS_BASE_URL}/pricing/`, internal: false },
  { label: 'Blog', href: `${CMS_BASE_URL}/blog/`, internal: false },
  { label: 'Docs', href: `${CMS_BASE_URL}/docs/`, internal: false },
];

// For CMS (dev.gsv.dev)
const STOREFRONT_BASE_URL = process.env.STOREFRONT_URL || 'https://marketplace.dev.gsv.dev';

const navLinks = [
  { label: 'Marketplace', href: `${STOREFRONT_BASE_URL}/default-channel/marketplace`, internal: false },
  { label: 'Solutions', href: '/solutions/', internal: true },
  { label: 'Pricing', href: '/pricing/', internal: true },
  { label: 'Blog', href: '/blog/', internal: true },
  { label: 'Docs', href: '/docs/', internal: true },
];
```

### 4.2 Header HTML Template (CMS - Wagtail)

```html
<!-- digitlify/templates/includes/header.html -->
{% load static %}

<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2">
        <svg class="h-8 w-8" viewBox="0 0 40 40" fill="none">
          <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="url(#logo-gradient)"/>
          <text x="13" y="26" fill="white" font-size="16" font-weight="700">D</text>
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8b5cf6"/>
              <stop offset="100%" style="stop-color:#6d28d9"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="text-xl font-bold text-neutral-900">Digitlify</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-8">
        <a href="{{ STOREFRONT_URL }}/default-channel/marketplace" class="nav-link">Marketplace</a>
        <a href="/solutions/" class="nav-link {% if request.path == '/solutions/' %}nav-link-active{% endif %}">Solutions</a>
        <a href="/pricing/" class="nav-link {% if request.path == '/pricing/' %}nav-link-active{% endif %}">Pricing</a>
        <a href="/blog/" class="nav-link {% if request.path|slice:':5' == '/blog' %}nav-link-active{% endif %}">Blog</a>
        <a href="/docs/" class="nav-link {% if request.path|slice:':5' == '/docs' %}nav-link-active{% endif %}">Docs</a>
      </nav>

      <!-- Auth Buttons -->
      <div class="hidden md:flex items-center gap-4">
        <a href="{{ STOREFRONT_URL }}/login" class="btn-ghost">Log in</a>
        <a href="{{ STOREFRONT_URL }}/default-channel/marketplace" class="btn-primary">Get Started Free</a>
      </div>

      <!-- Mobile Menu Button -->
      <button id="mobile-menu-btn" class="md:hidden p-2 text-neutral-600" aria-label="Menu">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile Menu (hidden by default) -->
  <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-neutral-200">
    <div class="px-4 py-4 space-y-3">
      <a href="{{ STOREFRONT_URL }}/default-channel/marketplace" class="block nav-link py-2">Marketplace</a>
      <a href="/solutions/" class="block nav-link py-2">Solutions</a>
      <a href="/pricing/" class="block nav-link py-2">Pricing</a>
      <a href="/blog/" class="block nav-link py-2">Blog</a>
      <a href="/docs/" class="block nav-link py-2">Docs</a>
      <hr class="my-3 border-neutral-200">
      <a href="{{ STOREFRONT_URL }}/login" class="block btn-ghost w-full text-center">Log in</a>
      <a href="{{ STOREFRONT_URL }}/default-channel/marketplace" class="block btn-primary w-full text-center">Get Started Free</a>
    </div>
  </div>
</header>

<script>
document.getElementById('mobile-menu-btn').addEventListener('click', function() {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});
</script>
```

### 4.3 Header Component (Storefront - Next.js)

```tsx
// src/ui/components/Header.tsx

import Link from "next/link";
import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_URL || "https://dev.gsv.dev";

export function Header({ channel }: { channel: string }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <Nav channel={channel} cmsBaseUrl={CMS_BASE_URL} />
        </div>
      </div>
    </header>
  );
}
```

```tsx
// src/ui/components/nav/components/NavLinks.tsx

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_URL || "https://dev.gsv.dev";

const primaryNavLinks = [
  { label: "Marketplace", href: "/marketplace", internal: true },
  { label: "Solutions", href: `${CMS_BASE_URL}/solutions/`, internal: false },
  { label: "Pricing", href: `${CMS_BASE_URL}/pricing/`, internal: false },
  { label: "Blog", href: `${CMS_BASE_URL}/blog/`, internal: false },
  { label: "Docs", href: `${CMS_BASE_URL}/docs/`, internal: false },
];

export async function NavLinks({ channel }: { channel: string }) {
  return (
    <>
      {primaryNavLinks.map((link) => (
        <li key={link.href}>
          {link.internal ? (
            <NavLink href={link.href}>{link.label}</NavLink>
          ) : (
            <a
              href={link.href}
              className="text-neutral-600 hover:text-primary-700 font-medium transition-colors"
            >
              {link.label}
            </a>
          )}
        </li>
      ))}
    </>
  );
}
```

### 4.4 Unified Footer Component

**Visual Specification:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────┐                                                                   │
│  │ LOGO │  Simplify IT. Amplify IT. Digitlify IT.                          │
│  └──────┘  The AI Agent Marketplace.                                        │
│                                                                             │
│  Product          Resources         Company          Legal                  │
│  ──────────       ──────────       ──────────       ──────────             │
│  Marketplace      Documentation    About            Privacy Policy          │
│  Solutions        Blog             Security         Terms of Service        │
│  Pricing          Changelog        Contact          Acceptable Use          │
│  Integrations     Templates                                                 │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  © 2025 Digitlify Inc. All rights reserved.     Terms  Privacy  Security   │
└─────────────────────────────────────────────────────────────────────────────┘

Background: neutral-50 (bg-neutral-50)
Border: border-t border-neutral-200
Padding: py-12 lg:py-16
```

**Footer Links (Per Spec 00-Site-Structure):**

| Section | Links |
|---------|-------|
| Product | Marketplace, Solutions, Pricing, Integrations |
| Resources | Documentation, Blog, Changelog, Templates |
| Company | About, Security, Contact |
| Legal | Privacy Policy, Terms of Service, Acceptable Use |

### 4.5 Footer HTML Template (CMS - Wagtail)

```html
<!-- digitlify/templates/includes/footer.html -->
{% load static %}

<footer class="bg-neutral-50 border-t border-neutral-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
      <!-- Brand Column -->
      <div class="col-span-2">
        <a href="/" class="flex items-center gap-2 mb-4">
          <svg class="h-8 w-8" viewBox="0 0 40 40" fill="none">
            <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="url(#footer-logo-gradient)"/>
            <text x="13" y="26" fill="white" font-size="16" font-weight="700">D</text>
            <defs>
              <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6"/>
                <stop offset="100%" style="stop-color:#6d28d9"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="text-xl font-bold text-neutral-900">Digitlify</span>
        </a>
        <p class="text-neutral-600 text-sm mb-2">Simplify IT. Amplify IT. Digitlify IT.</p>
        <p class="text-neutral-500 text-sm">The AI Agent Marketplace.</p>
      </div>

      <!-- Product Links -->
      <div>
        <h3 class="font-semibold text-neutral-900 mb-4">Product</h3>
        <ul class="space-y-3">
          <li><a href="{{ STOREFRONT_URL }}/default-channel/marketplace" class="text-neutral-600 hover:text-primary-700 text-sm">Marketplace</a></li>
          <li><a href="/solutions/" class="text-neutral-600 hover:text-primary-700 text-sm">Solutions</a></li>
          <li><a href="/pricing/" class="text-neutral-600 hover:text-primary-700 text-sm">Pricing</a></li>
          <li><a href="/integrations/" class="text-neutral-600 hover:text-primary-700 text-sm">Integrations</a></li>
        </ul>
      </div>

      <!-- Resources Links -->
      <div>
        <h3 class="font-semibold text-neutral-900 mb-4">Resources</h3>
        <ul class="space-y-3">
          <li><a href="/docs/" class="text-neutral-600 hover:text-primary-700 text-sm">Documentation</a></li>
          <li><a href="/blog/" class="text-neutral-600 hover:text-primary-700 text-sm">Blog</a></li>
          <li><a href="/changelog/" class="text-neutral-600 hover:text-primary-700 text-sm">Changelog</a></li>
          <li><a href="/templates/" class="text-neutral-600 hover:text-primary-700 text-sm">Templates</a></li>
        </ul>
      </div>

      <!-- Company Links -->
      <div>
        <h3 class="font-semibold text-neutral-900 mb-4">Company</h3>
        <ul class="space-y-3">
          <li><a href="/about/" class="text-neutral-600 hover:text-primary-700 text-sm">About</a></li>
          <li><a href="/security/" class="text-neutral-600 hover:text-primary-700 text-sm">Security</a></li>
          <li><a href="/contact/" class="text-neutral-600 hover:text-primary-700 text-sm">Contact</a></li>
        </ul>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="mt-12 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-neutral-500 text-sm">© 2025 Digitlify Inc. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="/legal/privacy/" class="text-neutral-500 hover:text-primary-700 text-sm">Privacy</a>
        <a href="/legal/terms/" class="text-neutral-500 hover:text-primary-700 text-sm">Terms</a>
        <a href="/security/" class="text-neutral-500 hover:text-primary-700 text-sm">Security</a>
      </div>
    </div>
  </div>
</footer>
```

### 4.6 Footer Component (Storefront - Next.js)

```tsx
// src/ui/components/Footer.tsx

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_URL || "https://dev.gsv.dev";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace", internal: true },
      { label: "Solutions", href: `${CMS_BASE_URL}/solutions/`, internal: false },
      { label: "Pricing", href: `${CMS_BASE_URL}/pricing/`, internal: false },
      { label: "Integrations", href: `${CMS_BASE_URL}/integrations/`, internal: false },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: `${CMS_BASE_URL}/docs/`, internal: false },
      { label: "Blog", href: `${CMS_BASE_URL}/blog/`, internal: false },
      { label: "Changelog", href: `${CMS_BASE_URL}/changelog/`, internal: false },
      { label: "Templates", href: `${CMS_BASE_URL}/templates/`, internal: false },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: `${CMS_BASE_URL}/about/`, internal: false },
      { label: "Security", href: `${CMS_BASE_URL}/security/`, internal: false },
      { label: "Contact", href: `${CMS_BASE_URL}/contact/`, internal: false },
    ],
  },
];

const legalLinks = [
  { label: "Privacy", href: `${CMS_BASE_URL}/legal/privacy/` },
  { label: "Terms", href: `${CMS_BASE_URL}/legal/terms/` },
  { label: "Security", href: `${CMS_BASE_URL}/security/` },
];

export async function Footer({ channel }: { channel: string }) {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Logo className="mb-4" />
            <p className="text-neutral-600 text-sm mb-2">
              Simplify IT. Amplify IT. Digitlify IT.
            </p>
            <p className="text-neutral-500 text-sm">The AI Agent Marketplace.</p>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-neutral-900 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.internal ? (
                      <LinkWithChannel
                        href={link.href}
                        className="text-neutral-600 hover:text-primary-700 text-sm"
                      >
                        {link.label}
                      </LinkWithChannel>
                    ) : (
                      <a
                        href={link.href}
                        className="text-neutral-600 hover:text-primary-700 text-sm"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Digitlify Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-neutral-500 hover:text-primary-700 text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Part 5: Routing & Redirect Fixes

### 5.1 Storefront next.config.js (Complete)

```javascript
// cmp-storefront/next.config.js

/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [{ hostname: "*" }],
  },
  experimental: {
    typedRoutes: false,
  },
  // Environment-based output mode
  ...(process.env.NEXT_OUTPUT_MODE === "export" && { output: "export" }),
  ...(process.env.NEXT_OUTPUT_MODE === "standalone" && { output: "standalone" }),

  // CRITICAL: Redirects to fix routing issues
  async redirects() {
    return [
      // 1. Root to default channel
      {
        source: "/",
        destination: "/default-channel",
        permanent: false,
      },
      // 2. Marketplace without channel
      {
        source: "/marketplace",
        destination: "/default-channel/marketplace",
        permanent: false,
      },
      {
        source: "/marketplace/:path*",
        destination: "/default-channel/marketplace/:path*",
        permanent: false,
      },
      // 3. Legacy /categories/ URLs
      {
        source: "/marketplace/categories/:category",
        destination: "/default-channel/marketplace/:category",
        permanent: true,
      },
      {
        source: "/:channel/marketplace/categories/:category",
        destination: "/:channel/marketplace/:category",
        permanent: true,
      },
      // 4. Cart without channel
      {
        source: "/cart",
        destination: "/default-channel/cart",
        permanent: false,
      },
      // 5. Account routes without channel
      {
        source: "/account",
        destination: "/default-channel/account",
        permanent: false,
      },
      {
        source: "/account/:path*",
        destination: "/default-channel/account/:path*",
        permanent: false,
      },
      // 6. Checkout without channel
      {
        source: "/checkout",
        destination: "/default-channel/checkout",
        permanent: false,
      },
      {
        source: "/checkout/:path*",
        destination: "/default-channel/checkout/:path*",
        permanent: false,
      },
      // 7. Login without channel
      {
        source: "/login",
        destination: "/default-channel/login",
        permanent: false,
      },
      // 8. Products without channel (for direct links)
      {
        source: "/products/:slug",
        destination: "/default-channel/products/:slug",
        permanent: false,
      },
    ];
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

module.exports = config;
```

### 5.2 Storefront Root Page Fix

```tsx
// src/app/page.tsx - REPLACE EXISTING

import { redirect } from "next/navigation";
import { DefaultChannelSlug } from "./config";

export default function RootPage() {
  // Redirect root to default channel homepage
  redirect(`/${DefaultChannelSlug}`);
}

// Prevent static generation issues
export const dynamic = "force-dynamic";
```

### 5.3 Channel Layout Fix

```tsx
// src/app/[channel]/layout.tsx - UPDATE

import { type ReactNode } from "react";
import { DefaultChannelSlug } from "../config";

export const generateStaticParams = async () => {
  // Always include default channel for static generation
  return [{ channel: DefaultChannelSlug }];
};

export default function ChannelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { channel: string };
}) {
  return <>{children}</>;
}

// Allow dynamic channel values
export const dynamicParams = true;
```

### 5.4 Not Found Page Fix

```tsx
// src/app/[channel]/not-found.tsx - UPDATE

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-neutral-900">404</h1>
      <p className="mt-4 text-lg text-neutral-600">Page not found</p>
      <Link
        href="/default-channel/marketplace"
        className="mt-8 btn-primary"
      >
        Go to Marketplace
      </Link>
    </div>
  );
}
```

### 5.5 Middleware for Channel Detection (Optional Enhancement)

```typescript
// src/middleware.ts - CREATE NEW FILE

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_CHANNEL = "default-channel";

// Routes that should NOT have channel prefix
const STATIC_ROUTES = ["/_next", "/api", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static routes
  if (STATIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip if already has channel prefix
  if (pathname.startsWith(`/${DEFAULT_CHANNEL}`)) {
    return NextResponse.next();
  }

  // Check if path starts with a known channel
  // For now, only support default-channel
  const pathParts = pathname.split("/").filter(Boolean);
  if (pathParts.length > 0 && pathParts[0] === DEFAULT_CHANNEL) {
    return NextResponse.next();
  }

  // Redirect root to default channel
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_CHANNEL}`, request.url));
  }

  // For other paths, check if they should be redirected
  const knownPaths = ["/marketplace", "/cart", "/checkout", "/account", "/login", "/products"];

  for (const knownPath of knownPaths) {
    if (pathname === knownPath || pathname.startsWith(`${knownPath}/`)) {
      const newPath = `/${DEFAULT_CHANNEL}${pathname}`;
      return NextResponse.redirect(new URL(newPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## Part 6: Environment Configuration

### 6.1 Storefront Environment Variables

```bash
# cmp-storefront/.env.production

# Saleor Configuration
NEXT_PUBLIC_SALEOR_API_URL=https://shop.dev.gsv.dev/graphql/
SALEOR_API_URL=http://cmp-commerce-api.cmp:8000/graphql/
SALEOR_APP_TOKEN=<saleor-app-token>

# Storefront URLs
NEXT_PUBLIC_STOREFRONT_URL=https://marketplace.dev.gsv.dev
NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel

# CMS Integration
NEXT_PUBLIC_CMS_URL=https://dev.gsv.dev

# Control Plane Integration
NEXT_PUBLIC_CONTROL_PLANE_URL=https://cp.dev.gsv.dev

# Authentication
KEYCLOAK_ISSUER=https://sso.dev.gsv.dev/realms/digitlify
KEYCLOAK_CLIENT_ID=storefront
KEYCLOAK_CLIENT_SECRET=<keycloak-secret>
AUTH_SECRET=<auth-secret>
```

### 6.2 CMS Environment Variables

```bash
# cmp-website/.env.production

# Django Configuration
DJANGO_SECRET_KEY=<django-secret>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=dev.gsv.dev,www.dev.gsv.dev

# Database
DATABASE_URL=postgres://user:pass@cmp-cms-postgres-rw.cmp:5432/cms

# Wagtail
WAGTAILADMIN_BASE_URL=https://dev.gsv.dev

# Cross-App URLs
STOREFRONT_URL=https://marketplace.dev.gsv.dev
SALEOR_API_URL=https://shop.dev.gsv.dev/graphql/
SALEOR_TOKEN=<saleor-token>

# SSO (Optional)
OIDC_RP_CLIENT_ID=cms
OIDC_RP_CLIENT_SECRET=<keycloak-secret>
```

### 6.3 GitOps ConfigMap (Storefront)

```yaml
# gsv-gitops/apps/cmp/storefront/configmap.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: cmp-storefront-config
  namespace: cmp
data:
  NEXT_PUBLIC_SALEOR_API_URL: "https://shop.dev.gsv.dev/graphql/"
  NEXT_PUBLIC_STOREFRONT_URL: "https://marketplace.dev.gsv.dev"
  NEXT_PUBLIC_DEFAULT_CHANNEL: "default-channel"
  NEXT_PUBLIC_CMS_URL: "https://dev.gsv.dev"
  NEXT_PUBLIC_CONTROL_PLANE_URL: "https://cp.dev.gsv.dev"
```

### 6.4 GitOps ConfigMap (CMS)

```yaml
# gsv-gitops/apps/cmp/cms/configmap.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: cmp-cms-config
  namespace: cmp
data:
  DJANGO_DEBUG: "False"
  DJANGO_ALLOWED_HOSTS: "dev.gsv.dev,www.dev.gsv.dev"
  WAGTAILADMIN_BASE_URL: "https://dev.gsv.dev"
  STOREFRONT_URL: "https://marketplace.dev.gsv.dev"
  SALEOR_API_URL: "https://shop.dev.gsv.dev/graphql/"
```

---

## Part 7: Sitemap Implementation

### 7.1 Complete Sitemap (Per Spec 22)

```
WAGTAIL CMS (dev.gsv.dev)
├── /                               → StreamHomePage (homepage)
├── /solutions/                     → SolutionIndexPage
│   ├── /solutions/customer-support → RoleSolutionPage
│   ├── /solutions/sales            → RoleSolutionPage
│   ├── /solutions/marketing        → RoleSolutionPage
│   ├── /solutions/operations       → RoleSolutionPage
│   └── /solutions/hr               → RoleSolutionPage
├── /outcomes/                      → (index - optional)
│   ├── /outcomes/customer_support  → OutcomePage
│   ├── /outcomes/sales_outreach    → OutcomePage
│   ├── /outcomes/knowledge_assistant → OutcomePage
│   ├── /outcomes/meeting_scheduler → OutcomePage
│   ├── /outcomes/marketing_content → OutcomePage
│   ├── /outcomes/data_extraction   → OutcomePage
│   ├── /outcomes/monitoring_alerting → OutcomePage
│   └── /outcomes/hr_ops            → OutcomePage
├── /capabilities/                  → CapabilityIndexPage
│   ├── /capabilities/rag_knowledgebase → CapabilityPage
│   ├── /capabilities/web_widget    → CapabilityPage
│   └── ... (15 capabilities)
├── /pricing/                       → StreamPricingPage
├── /integrations/                  → IntegrationsPage
├── /templates/                     → TemplatesPage
├── /docs/                          → DocsLandingPage
├── /blog/                          → BlogIndexPage
│   └── /blog/<slug>/               → BlogPage
├── /changelog/                     → ChangelogPage
├── /security/                      → SecurityPage
├── /about/                         → AboutPage
├── /contact/                       → ContactPage
├── /faq/                           → FAQPage (or use AboutPage)
└── /legal/
    ├── /legal/privacy/             → LegalPage (kind=privacy)
    ├── /legal/terms/               → LegalPage (kind=terms)
    └── /legal/aup/                 → LegalPage (kind=aup)

NEXT.JS STOREFRONT (marketplace.dev.gsv.dev)
├── /                               → Redirect to /default-channel
├── /default-channel/               → Homepage (hero + featured)
├── /default-channel/marketplace/   → Marketplace listing
│   ├── /marketplace/agents         → Category filter
│   ├── /marketplace/apps           → Category filter
│   ├── /marketplace/assistants     → Category filter
│   ├── /marketplace/automations    → Category filter
│   └── /marketplace/:category/:slug → Product detail (PDP)
├── /default-channel/cart/          → Shopping cart
├── /default-channel/checkout/      → Saleor checkout flow
├── /default-channel/login/         → Keycloak login
├── /default-channel/account/       → User account
│   ├── /account/billing            → Wallet & credits
│   ├── /account/instances          → My Agents
│   └── /account/instances/:id      → Instance detail
├── /default-channel/orders/        → Order history
├── /default-channel/run/:instanceId → Run console
└── /default-channel/redeem/        → Gift card redemption
```

### 7.2 Missing Routes to Implement (Storefront)

```tsx
// Routes to create in cmp-storefront/src/app/[channel]/(main)/

// 1. /account - Account dashboard
// src/app/[channel]/(main)/account/page.tsx

// 2. /account/billing - Wallet & credits
// src/app/[channel]/(main)/account/billing/page.tsx

// 3. /account/instances - My Agents list
// src/app/[channel]/(main)/account/instances/page.tsx

// 4. /account/instances/[instanceId] - Instance detail
// src/app/[channel]/(main)/account/instances/[instanceId]/page.tsx

// 5. /run/[instanceId] - Run console
// src/app/[channel]/(main)/run/[instanceId]/page.tsx

// 6. /redeem - Gift card redemption
// src/app/[channel]/(main)/redeem/page.tsx
```

---

## Part 8: Wagtail-Saleor Sync Implementation

### 8.1 Sync Command Enhancement

The sync command at `cmp-website/digitlify/cms/management/commands/sync_wagtail_to_saleor.py` needs to be enhanced:

```python
# Key enhancements needed:

# 1. Ensure attribute values match exactly
# Wagtail snippet.key == Saleor attribute value slug

# 2. Sync product metadata
# - cp_offering_id
# - credits_estimate_min/max
# - outcome_tagline
# - primary_outcome
# - primary_role

# 3. Report drift
# Output JSON report of mismatches

# 4. CI integration
# --dry-run --strict mode for CI checks
```

### 8.2 Taxonomy Alignment

Ensure these match exactly across systems:

| Taxonomy | Wagtail Snippet Key | Saleor Attribute Value Slug |
|----------|---------------------|----------------------------|
| Category | `agents` | `agents` |
| Category | `apps` | `apps` |
| Category | `assistants` | `assistants` |
| Category | `automations` | `automations` |
| Role | `customer-support` | `customer-support` |
| Role | `sales-sdr` | `sales-sdr` |
| Outcome | `reduce-support-tickets` | `reduce-support-tickets` |
| Capability | `rag-knowledgebase` | `rag-knowledgebase` |

### 8.3 Saleor Attribute Setup

Run this in Saleor to create required attributes:

```graphql
# Create gsv_category attribute
mutation {
  attributeCreate(input: {
    slug: "gsv_category"
    name: "Category"
    type: PRODUCT_TYPE
    inputType: DROPDOWN
    values: [
      { name: "Agents", slug: "agents" }
      { name: "Apps", slug: "apps" }
      { name: "Assistants", slug: "assistants" }
      { name: "Automations", slug: "automations" }
    ]
  }) {
    attribute { id slug }
    errors { field message }
  }
}

# Similar for gsv_roles, gsv_value_stream, gsv_capabilities, etc.
```

---

## Part 9: Implementation Checklist

### Phase 1: Critical Fixes (Day 1-2)

- [ ] **1.1** Update `next.config.js` with redirects (Storefront)
- [ ] **1.2** Create `middleware.ts` for channel detection (Storefront)
- [ ] **1.3** Fix root page redirect (Storefront)
- [ ] **1.4** Update environment variables in GitOps ConfigMaps
- [ ] **1.5** Deploy and verify redirect loop is fixed

### Phase 2: Design System (Day 2-3)

- [ ] **2.1** Update `tailwind.config.ts` in both apps (identical)
- [ ] **2.2** Update `globals.css` in both apps (shared classes)
- [ ] **2.3** Create design tokens CSS file
- [ ] **2.4** Update CMS base.html with new styles
- [ ] **2.5** Verify visual consistency

### Phase 3: Header/Footer (Day 3-4)

- [ ] **3.1** Update CMS `includes/header.html`
- [ ] **3.2** Update CMS `includes/footer.html`
- [ ] **3.3** Update Storefront `Header.tsx`
- [ ] **3.4** Update Storefront `Footer.tsx`
- [ ] **3.5** Update Storefront `NavLinks.tsx`
- [ ] **3.6** Configure cross-domain environment variables
- [ ] **3.7** Test navigation between sites

### Phase 4: Missing Routes (Day 4-5)

- [ ] **4.1** Create `/account` route (Storefront)
- [ ] **4.2** Create `/account/billing` route (Storefront)
- [ ] **4.3** Create `/account/instances` route (Storefront)
- [ ] **4.4** Create `/account/instances/[id]` route (Storefront)
- [ ] **4.5** Create missing CMS pages (Wagtail admin)

### Phase 5: Saleor Sync (Day 5-6)

- [ ] **5.1** Run `seed_taxonomies` command (CMS)
- [ ] **5.2** Create Saleor attributes (if missing)
- [ ] **5.3** Run `assign_saleor_attributes.py` script
- [ ] **5.4** Enhance `sync_wagtail_to_saleor` command
- [ ] **5.5** Verify filters work in marketplace

### Phase 6: E2E Validation (Day 6-7)

- [ ] **6.1** Test anonymous browse flow
- [ ] **6.2** Test authenticated flow
- [ ] **6.3** Test cross-site navigation
- [ ] **6.4** Test all redirects
- [ ] **6.5** Visual comparison screenshots

---

## Part 10: Git Commits Required

### Commit 1: Routing Fixes (cmp-storefront)

```bash
# Files to modify:
- next.config.js (add redirects)
- src/middleware.ts (create new)
- src/app/page.tsx (fix redirect)
- src/app/[channel]/layout.tsx (fix static params)
- src/app/[channel]/not-found.tsx (fix links)

git commit -m "fix: resolve redirect loop and channel routing

- Add comprehensive redirects in next.config.js
- Create middleware for automatic channel prefix
- Fix root page redirect to default-channel
- Update not-found page with correct links

Fixes #<issue-number>
"
```

### Commit 2: Design System (Both Repos)

```bash
# cmp-storefront files:
- tailwind.config.ts
- src/app/globals.css

# cmp-website files:
- digitlify/templates/base.html
- digitlify/static/css/design-tokens.css (new)

git commit -m "feat: implement unified design system

- Add brand color palette to Tailwind config
- Add shared utility classes (btn-primary, card, etc.)
- Align purple shades across both apps
- Add CSS custom properties for design tokens
"
```

### Commit 3: Header/Footer (Both Repos)

```bash
# cmp-storefront files:
- src/ui/components/Header.tsx
- src/ui/components/Footer.tsx
- src/ui/components/nav/components/NavLinks.tsx

# cmp-website files:
- digitlify/templates/includes/header.html
- digitlify/templates/includes/footer.html

git commit -m "feat: unify header and footer across apps

- Add CMS_BASE_URL environment variable
- Update nav links to use correct cross-domain URLs
- Align header styling (white bg, sticky, backdrop blur)
- Align footer sections per specification
- Fix mobile menu styling
"
```

### Commit 4: Environment Config (gsv-gitops)

```bash
# gsv-gitops files:
- apps/cmp/storefront/configmap.yaml
- apps/cmp/cms/configmap.yaml

git commit -m "config: add cross-app URL environment variables

- Add NEXT_PUBLIC_CMS_URL to storefront
- Add STOREFRONT_URL to CMS
- Update allowed hosts
"
```

---

## Appendix A: Verification Commands

```bash
# 1. Test redirect loop is fixed
curl -I -L https://marketplace.dev.gsv.dev/
# Should return 200, not redirect loop

# 2. Test root redirect
curl -I https://marketplace.dev.gsv.dev/
# Should 302 to /default-channel

# 3. Test marketplace route
curl -I https://marketplace.dev.gsv.dev/marketplace
# Should 302 to /default-channel/marketplace

# 4. Test CMS homepage
curl -I https://dev.gsv.dev/
# Should return 200

# 5. Test cross-site navigation
# From CMS, click Marketplace link -> should go to storefront
# From Storefront, click Solutions link -> should go to CMS
```

---

## Appendix B: File Change Summary

| Repository | File | Action | Priority |
|------------|------|--------|----------|
| cmp-storefront | next.config.js | Modify | P0 |
| cmp-storefront | src/middleware.ts | Create | P0 |
| cmp-storefront | src/app/page.tsx | Modify | P0 |
| cmp-storefront | src/app/globals.css | Modify | P1 |
| cmp-storefront | tailwind.config.ts | Modify | P1 |
| cmp-storefront | src/ui/components/Header.tsx | Modify | P1 |
| cmp-storefront | src/ui/components/Footer.tsx | Modify | P1 |
| cmp-storefront | src/ui/components/nav/components/NavLinks.tsx | Modify | P1 |
| cmp-website | digitlify/templates/base.html | Modify | P1 |
| cmp-website | digitlify/templates/includes/header.html | Modify | P1 |
| cmp-website | digitlify/templates/includes/footer.html | Modify | P1 |
| gsv-gitops | apps/cmp/storefront/configmap.yaml | Modify | P1 |
| gsv-gitops | apps/cmp/cms/configmap.yaml | Modify | P1 |

---

*Document created: 2025-12-20*
*Author: Claude Code*
*Status: Ready for Implementation*
