# GSV Platform User Guide

## Introduction

Welcome to the GSV Platform! This guide helps you get started with key features and services.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Platform URLs](#platform-urls)
3. [Single Sign-On](#single-sign-on)
4. [Cloud Marketplace Portal](#cloud-marketplace-portal)
5. [Agent Studio](#agent-studio)
6. [Backstage Developer Portal](#backstage-developer-portal)
7. [Getting Help](#getting-help)

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Valid user account (contact your administrator)
- VPN connection (if accessing from external network)

---

## Platform URLs

| Environment | Portal URL | Purpose |
|-------------|-----------|---------|
| Development | https://portal.dev.gsv.dev | Testing |
| QA | https://marketplace.qa.digitlify.com | QA |
| Production | https://portal.digitlify.com | Production |

### All Service URLs (Dev)

| Service | URL |
|---------|-----|
| CMP Portal | https://portal.dev.gsv.dev |
| SSO Login | https://sso.dev.gsv.dev |
| Agent Studio | https://studio.dev.gsv.dev |
| Backstage | https://backstage.dev.gsv.dev |
| Grafana | https://grafana.dev.gsv.dev |

---

## Single Sign-On

### First-Time Login
1. Navigate to portal URL
2. Click "Sign in with SSO"
3. Enter corporate email
4. Complete authentication (password + MFA if enabled)
5. Accept terms of service

### Managing Your Profile
1. Log into SSO portal
2. Click username in top-right
3. Select "Account Settings"
4. Update profile, password, or MFA settings

---

## Cloud Marketplace Portal

### Overview
The CMP is your central hub for:
- Browsing and ordering cloud services
- Managing projects and resources
- Viewing usage and billing
- Team collaboration

### Navigation
| Section | Description |
|---------|-------------|
| Dashboard | Overview of your projects |
| Marketplace | Browse services |
| Projects | Manage projects |
| Resources | View deployed resources |
| Team | Manage members |
| Billing | View costs |

### Creating a Project
1. Navigate to Projects > New Project
2. Enter name and description
3. Select organization
4. Click Create Project
5. Add team members (optional)

### Ordering Services
1. Go to Marketplace
2. Browse or search for services
3. Click on service for details
4. Select configuration and plan
5. Review pricing
6. Click Order Now
7. Confirm order

### Team Roles
| Role | Permissions |
|------|-------------|
| Viewer | Read-only access |
| Member | Order and manage resources |
| Admin | Full project control |

---

## Agent Studio

### Overview
Visual development environment for creating AI agents:
- Design workflows visually
- Test agents interactively
- Deploy to production
- Monitor performance

### Creating Your First Agent
1. Log in to Agent Studio
2. Click "New Flow"
3. Drag components from sidebar
4. Connect components with lines
5. Configure each component
6. Test in Playground
7. Save and Deploy

### Component Types
| Category | Description |
|----------|-------------|
| Inputs | Receive user input |
| LLMs | Language models |
| Prompts | Define prompts |
| Memory | Store context |
| Tools | External integrations |
| Outputs | Return results |

---

## Backstage Developer Portal

### Overview
Internal developer portal providing:
- Service catalog
- Technical documentation
- Software templates
- API documentation

### Finding Services
1. Navigate to Catalog
2. Use filters (Kind, Type, Owner)
3. Click service for details

### Creating from Templates
1. Go to Create section
2. Select template
3. Fill in parameters
4. Review and create
5. Follow generated instructions

---

## Getting Help

### Resources
- Documentation: Available in Backstage
- FAQ: https://portal.{domain}/help/faq
- Status Page: https://status.{domain}

### Support Channels
| Channel | Response Time |
|---------|---------------|
| Self-Service | Immediate |
| Email Support | 24 hours |
| Chat Support | 1-4 hours |
| Phone Support | Immediate |

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Clear browser cache, try incognito |
| Account locked | Wait 15 minutes or contact admin |
| Session expired | Log in again |
| Resource not found | Check if deleted |
