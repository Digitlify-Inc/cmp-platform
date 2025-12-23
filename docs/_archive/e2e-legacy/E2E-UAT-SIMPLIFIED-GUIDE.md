# E2E UAT Simplified Guide

**Version:** 1.0.0
**Date:** December 12, 2024
**Purpose:** Simple, friction-free guide for Sellers and Buyers

---

## Quick Reference

| Component | Dev URL | QA URL | Prod URL |
|-----------|---------|--------|----------|
| Marketplace (CMP) | app.dev.gsv.dev | app.qa.digitlify.com | app.digitlify.com |
| Agent Studio | studio.dev.gsv.dev | studio.qa.digitlify.com | studio.digitlify.com |
| Customer Portal | portal.dev.gsv.dev | portal.qa.digitlify.com | portal.digitlify.com |
| SSO Login | sso.dev.gsv.dev | sso.qa.digitlify.com | sso.digitlify.com |
| API | api.dev.gsv.dev | api.qa.digitlify.com | api.digitlify.com |

---

## Platform Overview

```
WHAT WE OFFER:

+------------------+     +------------------+     +------------------+     +------------------+
|     AGENTS       |     |      APPS        |     |   ASSISTANTS     |     |   AUTOMATIONS    |
|------------------|     |------------------|     |------------------|     |------------------|
| Conversational   |     | Full             |     | Generative AI    |     | Workflows with   |
| AI bots that     |     | applications     |     | tools for        |     | 3rd party        |
| chat, help,      |     | like CRM, ERP,   |     | content          |     | integrations     |
| support users    |     | Order Mgmt       |     | creation         |     |                  |
+------------------+     +------------------+     +------------------+     +------------------+

Examples:                 Examples:                Examples:                Examples:
- Customer Support        - CRM System             - Blog Writer            - Lead-to-CRM Sync
- HR Assistant            - Order Management       - Image Generator        - Invoice Processing
- Sales Bot               - E-commerce             - Social Media Writer    - Email Campaigns
- Research Agent          - Inventory Mgmt         - Report Generator       - Data Pipelines
```

---

## TEST DATA: Reference Sellers and Buyers

### SELLERS (Service Providers)

```
+--------------------------------------------------------------------------------+
|                              SELLER 1: DIGITLIFY INC                            |
+--------------------------------------------------------------------------------+
| Company:     Digitlify Inc (Platform Owner)                                     |
| Email:       admin@digitlify.com                                                |
| Role:        Platform-provided agents (first-party)                             |
| Speciality:  Customer Support, Knowledge Base, General Purpose Agents           |
+--------------------------------------------------------------------------------+
| PRODUCTS:                                                                       |
| 1. Customer Support Pro - Multi-modal AI support agent                          |
| 2. Knowledge Base Assistant - Internal documentation Q&A                        |
| 3. Lead Qualification Agent - 24/7 lead scoring                                 |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                            SELLER 2: ACME AI SOLUTIONS                          |
+--------------------------------------------------------------------------------+
| Company:     Acme AI Solutions LLC                                              |
| Email:       seller@acme-ai.com                                                 |
| Role:        Third-party agent provider                                         |
| Speciality:  E-commerce, Retail, Order Management Agents                        |
+--------------------------------------------------------------------------------+
| PRODUCTS:                                                                       |
| 1. Order Status Agent - Real-time order tracking & returns                      |
| 2. E-commerce Support Bot - Product Q&A, recommendations                        |
| 3. Inventory Assistant - Stock levels, reorder alerts                           |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                              SELLER 3: TECHBOT INC                              |
+--------------------------------------------------------------------------------+
| Company:     TechBot Inc                                                        |
| Email:       seller@techbot.io                                                  |
| Role:        Third-party app/automation provider                                |
| Speciality:  Apps, Automations, Integrations                                    |
+--------------------------------------------------------------------------------+
| PRODUCTS:                                                                       |
| 1. Blog Writer Assistant - AI-powered blog content generator                    |
| 2. Social Media Agent - Multi-platform content creation                         |
| 3. Lead-to-CRM Automation - Capture leads, sync to CRM                          |
| 4. Meeting Summary Bot - Transcribe and summarize meetings                      |
+--------------------------------------------------------------------------------+
```

### BUYERS (Customers)

```
+--------------------------------------------------------------------------------+
|                         BUYER 1: RETAILMAX INC (E-COMMERCE)                     |
+--------------------------------------------------------------------------------+
| Company:     RetailMax Inc                                                      |
| Email:       ops@retailmax.com                                                  |
| Industry:    E-commerce / Retail                                                |
| Size:        200 employees, Mid-market                                          |
| Need:        24/7 customer support, reduce tickets by 40%                       |
| Budget:      $500-1000/month                                                    |
+--------------------------------------------------------------------------------+
| BUYING:      Customer Support Pro (Business Plan)                               |
|              Order Status Agent (Professional Plan)                             |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                       BUYER 2: HEALTHFIRST CLINIC (HEALTHCARE)                  |
+--------------------------------------------------------------------------------+
| Company:     HealthFirst Medical Clinic                                         |
| Email:       admin@healthfirst.med                                              |
| Industry:    Healthcare                                                         |
| Size:        50 employees, Small business                                       |
| Need:        Appointment booking, patient FAQ                                   |
| Budget:      $200-400/month                                                     |
+--------------------------------------------------------------------------------+
| BUYING:      Knowledge Base Assistant (Team Plan)                               |
|              Meeting Summary Bot (Starter Plan)                                 |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                        BUYER 3: FINWISE BANK (FINANCE)                          |
+--------------------------------------------------------------------------------+
| Company:     FinWise Community Bank                                             |
| Email:       support@finwise.bank                                               |
| Industry:    Finance / Banking                                                  |
| Size:        500 employees, Enterprise                                          |
| Need:        Customer FAQ, loan inquiries, compliance                           |
| Budget:      $2000-5000/month                                                   |
+--------------------------------------------------------------------------------+
| BUYING:      Customer Support Pro (Enterprise Plan)                             |
|              Knowledge Base Assistant (Business Plan)                           |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                        BUYER 4: EDULEARN ACADEMY (EDUCATION)                    |
+--------------------------------------------------------------------------------+
| Company:     EduLearn Online Academy                                            |
| Email:       tech@edulearn.edu                                                  |
| Industry:    Education / E-Learning                                             |
| Size:        30 employees, Startup                                              |
| Need:        Student Q&A, course recommendations, tutoring                      |
| Budget:      $100-300/month                                                     |
+--------------------------------------------------------------------------------+
| BUYING:      Knowledge Base Assistant (Team Plan)                               |
|              Blog Writer Assistant (Starter Plan)                               |
+--------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------+
|                       BUYER 5: CLOUDSAAS CORP (SAAS)                            |
+--------------------------------------------------------------------------------+
| Company:     CloudSaaS Corporation                                              |
| Email:       success@cloudsaas.io                                               |
| Industry:    SaaS / Technology                                                  |
| Size:        100 employees, Growth-stage                                        |
| Need:        Onboarding assistant, technical support, lead gen                  |
| Budget:      $800-1500/month                                                    |
+--------------------------------------------------------------------------------+
| BUYING:      Customer Support Pro (Business Plan)                               |
|              Lead Qualification Agent (Growth Plan)                             |
|              Social Media Agent (Business Plan)                                 |
+--------------------------------------------------------------------------------+
```

---

# PART 1: SELLER JOURNEY

## What Sellers Can Create

| Type | Description | Example | Built With |
|------|-------------|---------|------------|
| **Agent** | Conversational AI that chats with users | Customer Support Bot | LangFlow |
| **App** | Full application with UI | CRM Dashboard | Custom Dev |
| **Assistant** | Generative AI for content | Blog Writer | LangFlow |
| **Automation** | Background workflow | Lead-to-CRM Sync | LangFlow + Integrations |

---

## Seller Journey: Step-by-Step

```
SELLER WORKFLOW:

  ONBOARD           BUILD              PUBLISH            OPERATE
+-----------+    +-----------+     +-----------+      +-----------+
|  Request  |    |  Create   |     |  Define   |      |  Monitor  |
|  Account  |--->|  Agent    |---->|  Pricing  |----->|  Sales &  |
|  (Waldur) |    |  (Studio) |     |  & List   |      |  Usage    |
+-----------+    +-----------+     +-----------+      +-----------+
   1 day          1-5 days           1 day             Ongoing
```

### STEP 1: Request Seller Account (1 day)

**What happens:** Seller applies to become a provider.

```
ACTION: Fill out Provider Application Form

Form Fields:
+--------------------------------------------------+
| PROVIDER APPLICATION                              |
+--------------------------------------------------+
| Company Name:    [___________________________]    |
| Contact Email:   [___________________________]    |
| Website:         [___________________________]    |
| Industry:        [_Dropdown: AI, SaaS, Retail_]  |
| What will you sell? [_Agents/Apps/Assistants_]   |
| Description:     [___________________________]    |
|                  [___________________________]    |
+--------------------------------------------------+
| [ ] I agree to the Terms of Service               |
| [ ] I agree to the Revenue Share (80/20)          |
+--------------------------------------------------+
|              [SUBMIT APPLICATION]                 |
+--------------------------------------------------+

After Submission:
- Platform admin reviews application (1-2 business days)
- Admin creates account in Keycloak (SSO)
- Admin creates organization in Waldur (CMP backend)
- Seller receives welcome email with login credentials
```

**Welcome Email Example:**
```
Subject: Welcome to the AI Marketplace - Account Ready!

Dear Acme AI Solutions,

Your seller account has been approved!

Login Details:
- Marketplace: https://app.digitlify.com
- Agent Studio: https://studio.digitlify.com
- Username: seller@acme-ai.com
- Password: [Set via SSO link]

Next Steps:
1. Login to Agent Studio
2. Build your first agent
3. Publish to marketplace

Revenue Share: You keep 80% of all sales.

Best regards,
The Platform Team
```

---

### STEP 2: Build Agent in Studio (1-5 days)

**Tool:** LangFlow (Visual Agent Builder)

**URL:** `https://studio.{domain}`

**What it is:** Drag-and-drop interface to build AI agents without coding.

```
AGENT STUDIO INTERFACE:
+----------------------------------------------------------------------------+
|  AGENT STUDIO                                        [Save] [Test] [Export]|
+----------------------------------------------------------------------------+
|  COMPONENTS     |                    CANVAS                                |
|  -----------    |  +----------+      +----------+      +----------+        |
|  [Input]        |  |  Chat    |----->|  OpenAI  |----->|  Output  |        |
|  [LLMs]         |  |  Input   |      |  GPT-4   |      |  Message |        |
|  [Prompts]      |  +----------+      +----------+      +----------+        |
|  [Memory]       |        |                |                                |
|  [RAG]          |        v                v                                |
|  [Tools]        |  +----------+      +----------+                          |
|  [Output]       |  | Prompt   |      | Memory   |                          |
|                 |  | Template |      | Store    |                          |
|                 |  +----------+      +----------+                          |
+----------------------------------------------------------------------------+
|  PLAYGROUND: Test your agent here                                          |
|  You: Hello, I need help with my order                                     |
|  Agent: Hi! I'd be happy to help. What's your order number?                |
+----------------------------------------------------------------------------+
```

#### Available Templates (Start Here!)

| Template | Use Case | Complexity |
|----------|----------|------------|
| **Basic Prompting** | Simple Q&A bot | Easy |
| **Memory Chatbot** | Remembers conversation | Easy |
| **Document Q&A** | Answer from uploaded docs | Medium |
| **Vector Store RAG** | Knowledge base search | Medium |
| **Simple Agent** | Agent with tools | Medium |
| **Blog Writer** | Content generation | Medium |
| **Research Agent** | Web search + analysis | Advanced |
| **Sequential Tasks Agents** | Multi-step workflows | Advanced |
| **Travel Planning Agents** | Complex multi-agent | Advanced |

#### Building a Customer Support Agent (Example)

```
STEP-BY-STEP BUILD:

1. CREATE NEW PROJECT
   - Click "New Project"
   - Name: "Customer Support Agent"
   - Description: "24/7 AI support with RAG"

2. ADD COMPONENTS (Drag to Canvas)

   [Chat Input] --> [System Prompt] --> [OpenAI GPT-4] --> [Chat Output]
                          |
                          v
                    [Vector Store]
                          ^
                          |
                    [RAG Retriever]

3. CONFIGURE SYSTEM PROMPT:

   +--------------------------------------------------+
   | SYSTEM PROMPT                                     |
   +--------------------------------------------------+
   | You are a helpful customer support agent for     |
   | {{company_name}}.                                |
   |                                                  |
   | Your job is to:                                  |
   | - Answer customer questions                      |
   | - Help with order issues                         |
   | - Provide product information                    |
   |                                                  |
   | Guidelines:                                      |
   | - Be friendly and professional                   |
   | - If you don't know, say so                      |
   | - Offer to connect to human support              |
   |                                                  |
   | Use the knowledge base to find answers.          |
   +--------------------------------------------------+

4. CONFIGURE RAG (Knowledge Base):
   - Vector Store: "Chroma" or "Pinecone"
   - Embedding Model: "OpenAI text-embedding-3-small"
   - Retrieval: Top 5 documents

5. TEST IN PLAYGROUND:
   - Ask: "What's your return policy?"
   - Verify agent responds correctly
   - Test edge cases

6. SAVE PROJECT
```

#### Other Agent Examples

**Lead Qualification Agent:**
```
Components:
[Chat Input] --> [Lead Scoring Prompt] --> [GPT-4] --> [CRM Tool] --> [Output]

System Prompt:
"You are a lead qualification specialist. Your job is to:
- Ask qualifying questions (budget, timeline, decision maker)
- Score leads based on responses
- Book meetings for qualified leads"
```

**Blog Writer Assistant:**
```
Components:
[Text Input] --> [Blog Prompt] --> [GPT-4] --> [Text Output]
     |
     v
[Web Search] (for research)

System Prompt:
"You are a professional blog writer. Create engaging, SEO-friendly
content on the given topic. Include:
- Attention-grabbing headline
- Introduction with hook
- 3-5 main sections with subheadings
- Conclusion with call-to-action"
```

---

### STEP 3: Export and Register Agent

**After building and testing:**

```
EXPORT WORKFLOW:

1. In Studio, click [Export]

   +--------------------------------------------------+
   | EXPORT AGENT                                      |
   +--------------------------------------------------+
   | Agent Name:     Customer Support Agent           |
   | Version:        1.0.0                            |
   | Category:       [ Customer Support v ]           |
   |                                                  |
   | Description:                                     |
   | [24/7 AI support agent with RAG knowledge      ]|
   | [base, multi-language support, and human       ]|
   | [handoff capabilities.                         ]|
   |                                                  |
   | Tags:     [support] [rag] [multilingual]         |
   |                                                  |
   | Capabilities:                                    |
   | [x] Text Input    [x] Voice Input                |
   | [x] RAG Retrieval [x] Document Training          |
   | [x] Multi-lingual [x] Human Handoff              |
   | [x] Widget Embed  [x] API Access                 |
   |                                                  |
   | [EXPORT TO REGISTRY]                             |
   +--------------------------------------------------+

2. Agent is registered in Agent Registry
3. Status: DRAFT (not yet visible to buyers)
```

---

### STEP 4: Define Pricing Plans

**Pricing Models Available:**

| Model | Description | Best For |
|-------|-------------|----------|
| **Token-based** | Pay per AI token consumed | High-volume apps |
| **API Call-based** | Pay per API request | Simple agents |
| **Monthly Subscription** | Fixed monthly fee | Predictable usage |
| **Tiered Plans** | Multiple price points | Different customer sizes |
| **Hybrid** | Base fee + usage | Most flexibility |

**Example: Customer Support Pro Pricing:**

```
+------------------------------------------------------------------+
| CUSTOMER SUPPORT PRO - PRICING PLANS                              |
+------------------------------------------------------------------+

STARTER          BUSINESS           ENTERPRISE
$99/month        $299/month         $999/month
-----------      -----------        -----------
1,000 convos     10,000 convos      100,000 convos
1 channel        5 channels         Unlimited
50MB storage     500MB storage      5GB storage
Email support    Priority support   Dedicated support

[x] Text chat    [x] Text chat      [x] Text chat
[ ] Voice        [x] Voice          [x] Voice
[ ] WhatsApp     [x] WhatsApp       [x] WhatsApp
[ ] Custom brand [x] Custom brand   [x] Custom brand
                 [x] Analytics      [x] Analytics
                                    [x] SLA guarantee
                                    [x] Custom integrations

Overage:         Overage:           Overage:
$0.15/convo      $0.05/convo        $0.02/convo

+------------------------------------------------------------------+
```

**Setting Up Pricing (Admin Interface):**

```
PRICING CONFIGURATION:

+--------------------------------------------------+
| CREATE PRICING PLAN                               |
+--------------------------------------------------+
| Plan Name:       [ Starter                      ] |
| Price:           [ 99.00 ] [ USD v ] [ /month v ]|
| Monthly Quota:   [ 1000 ] conversations          |
| Rate Limit:      [ 5 ] requests/second           |
|                                                  |
| Features (shown to buyers):                      |
| [+] Add Feature                                  |
| - 1,000 conversations/month                      |
| - 1 channel (web chat)                           |
| - 50MB knowledge base                            |
| - Email support                                  |
|                                                  |
| Overage Pricing:                                 |
| [ ] Hard limit (stop at quota)                   |
| [x] Soft limit (charge overage)                  |
| Overage Rate: $0.15 per conversation             |
|                                                  |
| [SAVE PLAN]                                      |
+--------------------------------------------------+
```

---

### STEP 5: Publish to Marketplace

```
PUBLISH WORKFLOW:

1. In Agent Registry, change state: DRAFT --> DEPLOYED
   (Agent is now running in Runtime environment)

2. Create Marketplace Listing:

   +--------------------------------------------------+
   | MARKETPLACE LISTING                               |
   +--------------------------------------------------+
   | Title:    Customer Support Pro                   |
   | Tagline:  24/7 AI support that learns your       |
   |           business                               |
   |                                                  |
   | Category: [ Customer Support v ]                 |
   |                                                  |
   | DESCRIPTION (Markdown supported):                |
   | +----------------------------------------------+ |
   | | Transform your customer support with AI.     | |
   | |                                              | |
   | | ## Features                                  | |
   | | - Train on YOUR knowledge base              | |
   | | - Multi-channel: chat, email, WhatsApp      | |
   | | - Smart human handoff                       | |
   | | - Real-time analytics                       | |
   | |                                              | |
   | | ## Use Cases                                 | |
   | | - E-commerce support                        | |
   | | - SaaS onboarding                           | |
   | | - Technical support                         | |
   | +----------------------------------------------+ |
   |                                                  |
   | SCREENSHOTS/DEMO:                                |
   | [Upload] [Upload] [Upload]                       |
   |                                                  |
   | PRICING PLANS: (from Step 4)                     |
   | [x] Starter $99   [x] Business $299              |
   | [x] Enterprise $999                              |
   |                                                  |
   | [PUBLISH TO MARKETPLACE]                         |
   +--------------------------------------------------+

3. State changes: DEPLOYED --> LISTED --> ACTIVE
4. Agent now visible in marketplace!
```

---

### STEP 6: Monitor Sales & Usage (Ongoing)

**Seller Dashboard:**

```
+----------------------------------------------------------------------------+
| SELLER DASHBOARD                                         Acme AI Solutions |
+----------------------------------------------------------------------------+
|                                                                            |
|  OVERVIEW                                  THIS MONTH                      |
|  +----------------------------------+     +---------------------------+    |
|  | Total Revenue                    |     | Sales: 45 subscriptions   |    |
|  | $12,450 this month               |     | New: 12 | Renewed: 33     |    |
|  | +23% vs last month               |     | Churn: 2 (4.4%)           |    |
|  +----------------------------------+     +---------------------------+    |
|                                                                            |
|  MY PRODUCTS                                                               |
|  +------------------------------------------------------------------------+|
|  | Product              | Subscribers | Revenue   | Avg Usage   | Status  ||
|  |----------------------|-------------|-----------|-------------|---------|
|  | Customer Support Pro | 28          | $6,580    | 4,200/mo    | Active  ||
|  | Order Status Agent   | 12          | $2,388    | 3,100/mo    | Active  ||
|  | E-commerce Bot       | 5           | $1,495    | 1,800/mo    | Active  ||
|  +------------------------------------------------------------------------+|
|                                                                            |
|  RECENT ORDERS                                                             |
|  +------------------------------------------------------------------------+|
|  | Date       | Customer      | Product              | Plan      | Amount ||
|  |------------|---------------|----------------------|-----------|--------|
|  | Dec 11     | CloudSaaS     | Customer Support Pro | Business  | $299   ||
|  | Dec 10     | RetailMax     | Order Status Agent   | Pro       | $199   ||
|  | Dec 09     | FinWise Bank  | Customer Support Pro | Enterprise| $999   ||
|  +------------------------------------------------------------------------+|
|                                                                            |
+----------------------------------------------------------------------------+
```

---

# PART 2: BUYER JOURNEY

## Buyer Journey: Step-by-Step

```
BUYER WORKFLOW:

  DISCOVER          SUBSCRIBE          CONFIGURE          USE
+-----------+    +-----------+     +-----------+      +-----------+
|  Browse   |    |  Select   |     |  Train &  |      |  Deploy   |
|  Catalog  |--->|  Plan &   |---->|  Brand    |----->|  & Use    |
|           |    |  Order    |     |  Agent    |      |  Agent    |
+-----------+    +-----------+     +-----------+      +-----------+
   Minutes         Minutes          Hours-Days          Ongoing
```

---

### STEP 1: Discover Agents

**Starting Point:** `https://app.{domain}/marketplace`

```
MARKETPLACE HOME:

+----------------------------------------------------------------------------+
|  AI AGENT MARKETPLACE                              [Search...] [Login]     |
+----------------------------------------------------------------------------+
|                                                                            |
|  CATEGORIES                                                                |
|  +----------+ +----------+ +----------+ +----------+ +----------+          |
|  |Customer  | |  Sales   | | Commerce | |Knowledge | |Automation|          |
|  | Support  | |  & Lead  | |  & Retail| |   Base   | |  & Bots  |          |
|  | 24 agents| | 18 agents| | 15 agents| | 12 agents| | 20 agents|          |
|  +----------+ +----------+ +----------+ +----------+ +----------+          |
|                                                                            |
|  FEATURED AGENTS                                                           |
|  +---------------------------+ +---------------------------+               |
|  | [IMG] Customer Support Pro| | [IMG] Lead Qualification  |               |
|  | by Digitlify              | | by Digitlify              |               |
|  | ★★★★★ 4.9 (234 reviews)   | | ★★★★☆ 4.8 (189 reviews)   |               |
|  | From $99/month            | | From $49/month            |               |
|  | [RAG] [Omnichannel]       | | [CRM] [Calendar]          |               |
|  +---------------------------+ +---------------------------+               |
|                                                                            |
|  +---------------------------+ +---------------------------+               |
|  | [IMG] Knowledge Base      | | [IMG] Order Status Agent  |               |
|  | by Digitlify              | | by Acme AI                |               |
|  | ★★★★☆ 4.7 (156 reviews)   | | ★★★★☆ 4.6 (98 reviews)    |               |
|  | From $39/month            | | From $79/month            |               |
|  | [RAG] [Internal]          | | [E-commerce] [Returns]    |               |
|  +---------------------------+ +---------------------------+               |
|                                                                            |
|  BROWSE BY INDUSTRY                                                        |
|  [Retail] [Healthcare] [Finance] [Education] [SaaS] [More...]              |
|                                                                            |
+----------------------------------------------------------------------------+
```

**Agent Detail Page:**

```
+----------------------------------------------------------------------------+
| CUSTOMER SUPPORT PRO                                                        |
| by Digitlify Inc                                              [TRY DEMO]   |
+----------------------------------------------------------------------------+
|                                                                            |
|  ★★★★★ 4.9 (234 reviews) | 1,200+ deployments | Verified Publisher         |
|                                                                            |
|  +----------------------------------------------------------------------+  |
|  | [SCREENSHOT/DEMO VIDEO]                                               |  |
|  |                                                                       |  |
|  |   "Hi! I'm your AI support assistant.                                |  |
|  |    How can I help you today?"                                        |  |
|  |                                                                       |  |
|  +----------------------------------------------------------------------+  |
|                                                                            |
|  CAPABILITIES                                                              |
|  [RAG Training] [Multi-lingual] [Omnichannel] [Human Handoff]              |
|  [Analytics] [Custom Branding] [API Access] [Widget Embed]                 |
|                                                                            |
|  DESCRIPTION                                                               |
|  Transform your customer support with AI that learns YOUR business.        |
|                                                                            |
|  - Train on your knowledge base (PDFs, docs, websites)                    |
|  - Deploy across web chat, WhatsApp, email, and more                      |
|  - Smart escalation to human agents when needed                           |
|  - Real-time analytics and conversation insights                          |
|                                                                            |
|  PRICING                                                                   |
|  +--------------------+ +--------------------+ +--------------------+      |
|  | STARTER            | | BUSINESS           | | ENTERPRISE         |      |
|  | $99/month          | | $299/month         | | $999/month         |      |
|  |                    | | MOST POPULAR       | |                    |      |
|  | 1,000 conversations| | 10,000 conversations| 100,000 conversations|     |
|  | 1 channel          | | 5 channels         | | Unlimited channels |      |
|  | 50MB KB            | | 500MB KB           | | 5GB KB             |      |
|  | Email support      | | Priority support   | | Dedicated support  |      |
|  |                    | | Custom branding    | | SLA guarantee      |      |
|  | [SELECT]           | | [SELECT]           | | [CONTACT SALES]    |      |
|  +--------------------+ +--------------------+ +--------------------+      |
|                                                                            |
|  REVIEWS                                                                   |
|  ★★★★★ "Game changer for our support team!" - RetailMax                   |
|  ★★★★☆ "Easy setup, great results" - CloudSaaS                            |
|  ★★★★★ "Cut our ticket volume by 45%" - TechStart Inc                     |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

### STEP 2: Subscribe to Agent

**Subscription Flow:**

```
STEP 2A: SELECT PLAN
+--------------------------------------------------+
| SELECT YOUR PLAN                                  |
+--------------------------------------------------+
| Customer Support Pro                              |
|                                                  |
| ( ) Starter - $99/month                          |
|     1,000 conversations, 1 channel               |
|                                                  |
| (x) Business - $299/month          <- SELECTED   |
|     10,000 conversations, 5 channels             |
|                                                  |
| ( ) Enterprise - $999/month                      |
|     100,000 conversations, unlimited             |
|                                                  |
|                              [CONTINUE]          |
+--------------------------------------------------+

STEP 2B: LOGIN/REGISTER (if not logged in)
+--------------------------------------------------+
| CREATE ACCOUNT OR LOGIN                           |
+--------------------------------------------------+
| Already have an account? [LOGIN]                  |
|                                                  |
| OR CREATE NEW ACCOUNT:                            |
|                                                  |
| Company Name:  [RetailMax Inc                  ] |
| Your Name:     [John Smith                     ] |
| Email:         [ops@retailmax.com              ] |
| Password:      [••••••••••                     ] |
|                                                  |
| [ ] I agree to Terms of Service                  |
|                                                  |
|                    [CREATE ACCOUNT & CONTINUE]   |
+--------------------------------------------------+

STEP 2C: CREATE PROJECT (for new customers)
+--------------------------------------------------+
| CREATE PROJECT                                    |
+--------------------------------------------------+
| Projects help you organize agents by team or use |
|                                                  |
| Project Name: [Customer Support               ]  |
| Description:  [Main support channel for web   ]  |
|                                                  |
|                              [CREATE PROJECT]    |
+--------------------------------------------------+

STEP 2D: REVIEW & CONFIRM
+--------------------------------------------------+
| CONFIRM ORDER                                     |
+--------------------------------------------------+
| Agent:     Customer Support Pro                  |
| Plan:      Business                              |
| Price:     $299.00/month                         |
| Includes:  10,000 conversations                  |
| Overage:   $0.05 per additional conversation     |
|                                                  |
| Project:   Customer Support                      |
| Billing:   Monthly (cancel anytime)              |
|                                                  |
| Payment Method:                                  |
| [Credit Card] [Invoice] [PayPal]                 |
|                                                  |
| Card: **** **** **** 4242                        |
|                                                  |
|                         [COMPLETE SUBSCRIPTION]  |
+--------------------------------------------------+
```

**After Subscription:**
```
ORDER CONFIRMATION

+--------------------------------------------------+
| ORDER CONFIRMED!                                  |
+--------------------------------------------------+
| Thank you for subscribing to Customer Support Pro|
|                                                  |
| Order #: ORD-2024-00123                          |
| Status: Active                                   |
|                                                  |
| NEXT STEPS:                                      |
| 1. Configure your agent (branding, persona)      |
| 2. Train with your knowledge base                |
| 3. Deploy widget on your website                 |
|                                                  |
| [GO TO CUSTOMER PORTAL]                          |
+--------------------------------------------------+
```

---

### STEP 3: Configure Agent (Customer Portal)

**Portal URL:** `https://portal.{domain}/dashboard/agents/{id}`

```
CUSTOMER PORTAL - AGENT CONFIGURATION:

+----------------------------------------------------------------------------+
| CUSTOMER PORTAL                                   [RetailMax Inc] [Logout] |
+----------------------------------------------------------------------------+
| Dashboard | My Agents | Usage | Team | Settings                             |
+----------------------------------------------------------------------------+
|                                                                            |
| MY AGENTS                                                                  |
| +------------------------------------------------------------------------+ |
| | Customer Support Pro                                    [CONFIGURE]    | |
| | Status: Active | Plan: Business | Usage: 0/10,000                     | |
| +------------------------------------------------------------------------+ |
|                                                                            |
+----------------------------------------------------------------------------+
```

**Agent Configuration Tabs:**

```
+----------------------------------------------------------------------------+
| CUSTOMER SUPPORT PRO - CONFIGURATION                                        |
+----------------------------------------------------------------------------+
| [Overview] [Train] [Brand] [Deploy] [API] [Conversations]                  |
+----------------------------------------------------------------------------+
```

#### TAB 1: Overview
```
+----------------------------------------------------------------------------+
| OVERVIEW                                                                    |
+----------------------------------------------------------------------------+
|                                                                            |
|  STATUS: Active                      PLAN: Business ($299/month)           |
|                                                                            |
|  THIS MONTH:                                                               |
|  +------------------------+  +------------------------+                    |
|  | Conversations          |  | Satisfaction           |                    |
|  | 2,340 / 10,000         |  | 94% positive           |                    |
|  | ████████░░░░░░░ 23%    |  | ★★★★★                  |                    |
|  +------------------------+  +------------------------+                    |
|                                                                            |
|  QUICK ACTIONS:                                                            |
|  [Test Agent] [View Widget Code] [Download Reports]                        |
|                                                                            |
+----------------------------------------------------------------------------+
```

#### TAB 2: Train (RAG Knowledge Base)
```
+----------------------------------------------------------------------------+
| TRAIN YOUR AGENT                                                            |
+----------------------------------------------------------------------------+
|                                                                            |
|  Knowledge Base: 45MB / 500MB used                                         |
|                                                                            |
|  UPLOAD DOCUMENTS                                                          |
|  +--------------------------------------------------------------------+   |
|  | [Drag files here or click to upload]                                |   |
|  | Supported: PDF, DOCX, TXT, CSV, JSON                                |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  UPLOADED DOCUMENTS                                                        |
|  +--------------------------------------------------------------------+   |
|  | Document              | Size  | Status    | Chunks | Actions        |   |
|  |-----------------------|-------|-----------|--------|----------------|   |
|  | product-catalog.pdf   | 15MB  | Trained   | 234    | [View][Delete] |   |
|  | faq-document.docx     | 2MB   | Trained   | 45     | [View][Delete] |   |
|  | return-policy.pdf     | 1MB   | Trained   | 23     | [View][Delete] |   |
|  | shipping-info.txt     | 500KB | Training..| --     | [Cancel]       |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  WEBSITE CRAWL                                                             |
|  +--------------------------------------------------------------------+   |
|  | Add URLs to crawl for knowledge:                                    |   |
|  | [https://retailmax.com/help                          ] [+ ADD]      |   |
|  |                                                                     |   |
|  | Crawled Sites:                                                      |   |
|  | - retailmax.com/help (last crawl: Dec 11, 2024)      [Re-crawl]    |   |
|  | - retailmax.com/products (last crawl: Dec 10, 2024)  [Re-crawl]    |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  TRAINING SETTINGS                                                         |
|  +--------------------------------------------------------------------+   |
|  | [ ] Answer ONLY from knowledge base (strict mode)                   |   |
|  |     Agent will say "I don't have that information" for              |   |
|  |     questions not in knowledge base                                 |   |
|  |                                                                     |   |
|  | [x] Include general knowledge (recommended)                         |   |
|  |     Agent uses knowledge base + general AI knowledge                |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  [RETRAIN AGENT]                                                          |
|                                                                            |
+----------------------------------------------------------------------------+
```

#### TAB 3: Brand (Persona & Styling)
```
+----------------------------------------------------------------------------+
| BRAND YOUR AGENT                                                            |
+----------------------------------------------------------------------------+
|                                                                            |
|  PREVIEW                         |  SETTINGS                               |
|  +---------------------------+   |  +----------------------------------+   |
|  |  [RetailMax Logo]         |   |  | AGENT NAME                       |   |
|  |  RetailMax Support        |   |  | [RetailMax Support             ] |   |
|  |                           |   |  |                                  |   |
|  |  "Hi! I'm your RetailMax  |   |  | WELCOME MESSAGE                  |   |
|  |  assistant. How can I     |   |  | [Hi! I'm your RetailMax        ] |   |
|  |  help you today?"         |   |  | [assistant. How can I help     ] |   |
|  |                           |   |  | [you today?                    ] |   |
|  |  [Type your message...]   |   |  |                                  |   |
|  +---------------------------+   |  | AVATAR                           |   |
|                                  |  | [Upload Image] or [Use Default]  |   |
|                                  |  |                                  |   |
|                                  |  | PERSONALITY                      |   |
|                                  |  | [x] Friendly                     |   |
|                                  |  | [ ] Professional                 |   |
|                                  |  | [ ] Casual                       |   |
|                                  |  |                                  |   |
|                                  |  | COLORS                           |   |
|                                  |  | Primary: [#2563eb]               |   |
|                                  |  | Background: [#ffffff]            |   |
|                                  |  |                                  |   |
|                                  |  | LANGUAGE                         |   |
|                                  |  | Default: [English v]             |   |
|                                  |  | [x] Auto-detect user language    |   |
|                                  |  +----------------------------------+   |
|                                                                            |
|  [SAVE BRANDING]                                                           |
|                                                                            |
+----------------------------------------------------------------------------+
```

#### TAB 4: Deploy (Widget & Channels)
```
+----------------------------------------------------------------------------+
| DEPLOY YOUR AGENT                                                           |
+----------------------------------------------------------------------------+
|                                                                            |
|  WEB CHAT WIDGET                                                           |
|  +--------------------------------------------------------------------+   |
|  | Copy this code to your website's <head> or before </body>:          |   |
|  |                                                                     |   |
|  | <script                                                             |   |
|  |   src="https://cdn.digitlify.com/widget.js"                         |   |
|  |   data-api-key="ak_retailmax_prod_a1b2c3d4e5f6"                      |   |
|  |   data-agent-id="customer-support-pro"                              |   |
|  |   data-agent-name="RetailMax Support"                               |   |
|  |   data-primary-color="#2563eb"                                      |   |
|  | ></script>                                                          |   |
|  |                                                                     |   |
|  | [COPY CODE]                                                         |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  WIDGET SETTINGS                                                           |
|  +--------------------------------------------------------------------+   |
|  | Position: [Bottom Right v]                                          |   |
|  | Auto-open after: [30 seconds v]                                     |   |
|  | Show on pages: [All pages v]                                        |   |
|  | Hide on mobile: [ ]                                                 |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  OTHER CHANNELS                                                            |
|  +--------------------------------------------------------------------+   |
|  | WhatsApp   [Configure] - Connect your WhatsApp Business number      |   |
|  | Slack      [Configure] - Add to your Slack workspace                |   |
|  | Email      [Configure] - Forward support emails to agent            |   |
|  | API        [Go to API] - Direct API integration                     |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

#### TAB 5: API Access
```
+----------------------------------------------------------------------------+
| API ACCESS                                                                  |
+----------------------------------------------------------------------------+
|                                                                            |
|  API KEYS                                                                  |
|  +--------------------------------------------------------------------+   |
|  | Key Name          | Created     | Last Used   | Actions             |   |
|  |-------------------|-------------|-------------|---------------------|   |
|  | Production Key    | Dec 10, 2024| Dec 12, 2024| [Revoke] [Regenerate|   |
|  | ak_retailmax_**** |             |             |                     |   |
|  |-------------------|-------------|-------------|---------------------|   |
|  | Test Key          | Dec 8, 2024 | Dec 11, 2024| [Revoke] [Regenerate|   |
|  | ak_test_****      |             |             |                     |   |
|  +--------------------------------------------------------------------+   |
|  [+ CREATE NEW KEY]                                                       |
|                                                                            |
|  API DOCUMENTATION                                                         |
|  +--------------------------------------------------------------------+   |
|  | ENDPOINT: https://api.digitlify.com/v1/chat                         |   |
|  |                                                                     |   |
|  | EXAMPLE REQUEST:                                                    |   |
|  | curl -X POST https://api.digitlify.com/v1/chat \                    |   |
|  |   -H "Authorization: Bearer ak_retailmax_prod_a1b2c3d4e5f6" \       |   |
|  |   -H "Content-Type: application/json" \                             |   |
|  |   -d '{                                                             |   |
|  |     "message": "What is your return policy?",                       |   |
|  |     "session_id": "user-session-123"                                |   |
|  |   }'                                                                |   |
|  |                                                                     |   |
|  | RESPONSE:                                                           |   |
|  | {                                                                   |   |
|  |   "response": "Our return policy allows returns within 30 days...",|   |
|  |   "session_id": "user-session-123",                                 |   |
|  |   "message_id": "msg_abc123",                                       |   |
|  |   "tokens_used": 150                                                |   |
|  | }                                                                   |   |
|  +--------------------------------------------------------------------+   |
|  [VIEW FULL API DOCS]                                                     |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

### STEP 4: Use the Agent

**After deployment, the agent is live:**

```
LIVE WIDGET ON RETAILMAX.COM:

+---------------------------+
|  [RetailMax Logo]         |
|  RetailMax Support        |
|---------------------------|
|                           |
| Agent: Hi! I'm your       |
| RetailMax assistant.      |
| How can I help you?       |
|                           |
| You: What's your return   |
| policy?                   |
|                           |
| Agent: Great question!    |
| At RetailMax, you can     |
| return any item within    |
| 30 days of purchase.      |
|                           |
| For electronics, we       |
| extend this to 45 days.   |
|                           |
| Would you like me to      |
| start a return for you?   |
|                           |
|---------------------------|
| [Type your message...]    |
+---------------------------+
```

---

# PART 3: DAY 2 OPERATIONS

## For Buyers (Ongoing Operations)

### 1. Monitor Usage

```
USAGE DASHBOARD:

+----------------------------------------------------------------------------+
| USAGE & BILLING                                                             |
+----------------------------------------------------------------------------+
|                                                                            |
|  CURRENT BILLING PERIOD: Dec 1 - Dec 31, 2024                              |
|                                                                            |
|  +----------------------------------+  +----------------------------------+ |
|  | CONVERSATIONS                    |  | COST                             | |
|  | 4,567 / 10,000                   |  | Plan: $299.00                    | |
|  | ████████████░░░░░ 46%            |  | Overage: $0.00                   | |
|  |                                  |  | Est. Total: $299.00              | |
|  +----------------------------------+  +----------------------------------+ |
|                                                                            |
|  DAILY USAGE (Last 30 days)                                                |
|  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                            |
|                                                                            |
|  USAGE BY CHANNEL                                                          |
|  +--------------------------------------------------------------------+   |
|  | Channel       | Conversations | % of Total | Avg. Duration         |   |
|  |---------------|---------------|------------|----------------------|   |
|  | Web Chat      | 3,200         | 70%        | 4.2 minutes          |   |
|  | WhatsApp      | 1,000         | 22%        | 3.8 minutes          |   |
|  | API           | 367           | 8%         | 1.5 minutes          |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  ALERTS                                                                    |
|  +--------------------------------------------------------------------+   |
|  | [x] Email me at 75% usage                                           |   |
|  | [x] Email me at 90% usage                                           |   |
|  | [ ] Auto-upgrade plan if limit exceeded                             |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

### 2. View Conversation Analytics

```
ANALYTICS DASHBOARD:

+----------------------------------------------------------------------------+
| CONVERSATION ANALYTICS                                                      |
+----------------------------------------------------------------------------+
|                                                                            |
|  SATISFACTION                        TOP TOPICS                            |
|  +------------------------+          +---------------------------+         |
|  | ★★★★★ 94% positive    |          | 1. Returns (28%)          |         |
|  | ████████████████████░ |          | 2. Order Status (25%)     |         |
|  |                        |          | 3. Product Info (20%)     |         |
|  | Needs human: 6%        |          | 4. Shipping (15%)         |         |
|  +------------------------+          | 5. Other (12%)            |         |
|                                      +---------------------------+         |
|                                                                            |
|  ESCALATION RATE                                                           |
|  +--------------------------------------------------------------------+   |
|  | Last 30 days: 4.2% (down from 5.8%)                                 |   |
|  | Reason for escalation:                                              |   |
|  | - Complex issue: 45%                                                |   |
|  | - User requested: 35%                                               |   |
|  | - Agent unsure: 20%                                                 |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  RESPONSE QUALITY                                                          |
|  +--------------------------------------------------------------------+   |
|  | Avg. response time: 1.2 seconds                                     |   |
|  | Avg. conversation length: 4.5 messages                              |   |
|  | Resolution rate (no follow-up): 78%                                 |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

### 3. Update Knowledge Base

```
KNOWLEDGE BASE MAINTENANCE:

+--------------------------------------------------------------------+
| RECOMMENDED ACTIONS                                                 |
+--------------------------------------------------------------------+
| ! 15 unanswered questions this week - Add to knowledge base         |
|   [View Questions] [Add Answers]                                    |
|                                                                     |
| ! Product catalog updated 30 days ago - Consider re-crawling        |
|   [Re-crawl Now]                                                    |
|                                                                     |
| ! New FAQ page detected on website - Add to training                |
|   [Add to Training]                                                 |
+--------------------------------------------------------------------+
```

### 4. Upgrade/Downgrade Plan

```
PLAN MANAGEMENT:

+--------------------------------------------------------------------+
| CURRENT PLAN: Business ($299/month)                                 |
+--------------------------------------------------------------------+
| Usage trend: 85% avg over last 3 months                             |
|                                                                     |
| RECOMMENDATION: You're approaching your limit. Consider upgrading.  |
|                                                                     |
| [ ] Downgrade to Starter ($99/month) - 1,000 conversations         |
| [x] Keep Business ($299/month) - 10,000 conversations              |
| [ ] Upgrade to Enterprise ($999/month) - 100,000 conversations     |
|                                                                     |
| [CHANGE PLAN]                                                       |
+--------------------------------------------------------------------+
```

### 5. Team Management

```
TEAM ACCESS:

+--------------------------------------------------------------------+
| TEAM MEMBERS                                                        |
+--------------------------------------------------------------------+
| Name              | Email                | Role    | Access        |
|-------------------|----------------------|---------|---------------|
| John Smith        | john@retailmax.com   | Admin   | Full          |
| Sarah Johnson     | sarah@retailmax.com  | Manager | Config + View |
| Mike Brown        | mike@retailmax.com   | Support | View Only     |
+--------------------------------------------------------------------+
| [+ INVITE TEAM MEMBER]                                              |
+--------------------------------------------------------------------+
```

---

## For Sellers (Ongoing Operations)

### 1. Monitor Revenue

```
SELLER REVENUE DASHBOARD:

+----------------------------------------------------------------------------+
| REVENUE OVERVIEW                                                            |
+----------------------------------------------------------------------------+
|                                                                            |
|  THIS MONTH                           PAYOUT                               |
|  +------------------------+          +---------------------------+         |
|  | Gross Revenue: $12,450 |          | Your Share (80%): $9,960  |         |
|  | Platform Fee (20%): $2,490        | Next Payout: Dec 15       |         |
|  | Your Earnings: $9,960  |          | Payment Method: Bank      |         |
|  +------------------------+          +---------------------------+         |
|                                                                            |
|  REVENUE BY PRODUCT                                                        |
|  +--------------------------------------------------------------------+   |
|  | Product              | Subscribers | MRR       | Your Share        |   |
|  |----------------------|-------------|-----------|-------------------|   |
|  | Customer Support Pro | 28          | $6,580    | $5,264            |   |
|  | Order Status Agent   | 12          | $2,388    | $1,910            |   |
|  | E-commerce Bot       | 5           | $1,495    | $1,196            |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

### 2. Update Agent Version

```
VERSION MANAGEMENT:

+--------------------------------------------------------------------+
| CUSTOMER SUPPORT PRO - VERSIONS                                     |
+--------------------------------------------------------------------+
| Current: v1.2.0 (released Dec 1, 2024) - 28 active subscribers      |
|                                                                     |
| PUBLISH NEW VERSION                                                 |
| +----------------------------------------------------------------+ |
| | Version: [1.3.0                                              ] | |
| | Changes:                                                       | |
| | [ ] Bug fix      [x] New feature      [ ] Breaking change      | |
| |                                                                | |
| | Release Notes:                                                 | |
| | [Added Spanish language support                              ] | |
| | [Improved response accuracy for return questions             ] | |
| |                                                                | |
| | Migration:                                                     | |
| | [x] Auto-migrate existing subscribers (recommended)            | |
| | [ ] Allow subscribers to migrate manually                      | |
| +----------------------------------------------------------------+ |
| [PUBLISH VERSION]                                                   |
+--------------------------------------------------------------------+
```

### 3. Respond to Reviews

```
CUSTOMER REVIEWS:

+--------------------------------------------------------------------+
| RECENT REVIEWS                                                      |
+--------------------------------------------------------------------+
| ★★★★★ RetailMax Inc - Dec 10, 2024                                  |
| "Cut our support tickets by 45%! Great product."                    |
| [RESPOND]                                                           |
|                                                                     |
| ★★★☆☆ CloudSaaS Corp - Dec 8, 2024                                  |
| "Good agent but slow response times during peak hours."             |
| [RESPOND]                                                           |
+--------------------------------------------------------------------+
```

### 4. View Usage Analytics

```
USAGE ANALYTICS (ACROSS ALL SUBSCRIBERS):

+--------------------------------------------------------------------+
| AGGREGATE USAGE                                                     |
+--------------------------------------------------------------------+
| Total Conversations This Month: 45,230                              |
| Total Tokens Consumed: 12.5M                                        |
| Avg. per Subscriber: 1,615 conversations                            |
|                                                                     |
| USAGE PATTERNS                                                      |
| Peak Hours: 9am-11am, 2pm-4pm (local time)                          |
| Top Topics: Returns (28%), Orders (25%), Products (20%)             |
| Avg. Satisfaction: 94.2%                                            |
+--------------------------------------------------------------------+
```

---

## For Platform Operators

### 1. System Health

```
PLATFORM DASHBOARD:

+----------------------------------------------------------------------------+
| PLATFORM HEALTH                                                             |
+----------------------------------------------------------------------------+
|                                                                            |
|  SERVICES                                                                  |
|  +--------------------------------------------------------------------+   |
|  | Service           | Status  | Latency | CPU   | Memory              |   |
|  |-------------------|---------|---------|-------|---------------------|   |
|  | CMP (Waldur)      | ● OK    | 45ms    | 32%   | 1.2GB / 4GB         |   |
|  | Agent Registry    | ● OK    | 23ms    | 18%   | 800MB / 2GB         |   |
|  | Agent Runtime     | ● OK    | 120ms   | 65%   | 3.5GB / 8GB         |   |
|  | SSO (Keycloak)    | ● OK    | 35ms    | 12%   | 600MB / 2GB         |   |
|  | Studio (LangFlow) | ● OK    | 89ms    | 45%   | 2.1GB / 4GB         |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  PLATFORM METRICS                                                          |
|  +--------------------------------------------------------------------+   |
|  | Total Sellers:        3                                             |   |
|  | Total Buyers:         48                                            |   |
|  | Active Subscriptions: 127                                           |   |
|  | Conversations Today:  15,230                                        |   |
|  | GMV This Month:       $38,450                                       |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
+----------------------------------------------------------------------------+
```

### 2. Cost Management

```
INFRASTRUCTURE COSTS:

+--------------------------------------------------------------------+
| COST BREAKDOWN - DECEMBER 2024                                      |
+--------------------------------------------------------------------+
| Compute (Kubernetes):   $2,450                                      |
| AI Tokens (OpenAI):     $1,890                                      |
| Storage (S3/Postgres):  $320                                        |
| Bandwidth:              $180                                        |
| Other:                  $160                                        |
| TOTAL:                  $5,000                                      |
|                                                                     |
| Revenue:                $38,450                                     |
| Platform Fee (20%):     $7,690                                      |
| Net Margin:             $2,690 (35%)                                |
+--------------------------------------------------------------------+
```

### 3. Support Queue

```
SUPPORT TICKETS:

+--------------------------------------------------------------------+
| OPEN TICKETS                                                        |
+--------------------------------------------------------------------+
| Priority | Customer    | Issue                      | Opened       |
|----------|-------------|----------------------------|--------------|
| HIGH     | FinWise     | Agent not responding       | 2 hours ago  |
| MEDIUM   | CloudSaaS   | API rate limit questions   | 5 hours ago  |
| LOW      | EduLearn    | Billing inquiry            | 1 day ago    |
+--------------------------------------------------------------------+
```

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Agent not responding | API key expired | Regenerate key in portal |
| Widget not loading | CORS error | Add domain to whitelist |
| Slow responses | High traffic | Upgrade plan or optimize prompts |
| Wrong answers | Outdated KB | Retrain with updated documents |
| High escalation rate | Missing topics | Add missing info to KB |

### Support Contacts

| Type | Contact |
|------|---------|
| Technical Support | support@digitlify.com |
| Billing Questions | billing@digitlify.com |
| Sales (Enterprise) | sales@digitlify.com |
| Status Page | status.digitlify.com |

---

## Appendix: LangFlow Templates Reference

### Templates Available in Studio

| Template | Category | Description | Complexity |
|----------|----------|-------------|------------|
| Basic Prompting | Starter | Simple Q&A | Easy |
| Basic Prompt Chaining | Starter | Multi-step prompts | Easy |
| Memory Chatbot | Chat | Conversation memory | Easy |
| Document Q&A | RAG | Answer from docs | Medium |
| Vector Store RAG | RAG | Knowledge base search | Medium |
| Knowledge Ingestion | RAG | Index documents | Medium |
| Knowledge Retrieval | RAG | Search indexed docs | Medium |
| Simple Agent | Agent | Agent with tools | Medium |
| Search Agent | Agent | Web search | Medium |
| Research Agent | Agent | Deep research | Advanced |
| Sequential Tasks Agents | Agent | Multi-step workflow | Advanced |
| Travel Planning Agents | Agent | Complex multi-agent | Advanced |
| Blog Writer | Content | Blog generation | Medium |
| Instagram Copywriter | Content | Social media | Medium |
| Twitter Thread Generator | Content | Thread creation | Medium |
| SEO Keyword Generator | Content | SEO tools | Medium |
| Meeting Summary | Productivity | Summarization | Medium |
| Invoice Summarizer | Business | Document parsing | Medium |
| Financial Report Parser | Business | Finance analysis | Advanced |
| Market Research | Business | Research automation | Advanced |
| Text Sentiment Analysis | Analytics | Sentiment detection | Easy |
| Image Sentiment Analysis | Analytics | Visual analysis | Medium |
| YouTube Analysis | Analytics | Video insights | Medium |
| News Aggregator | Automation | News curation | Medium |
| Price Deal Finder | Automation | Price tracking | Medium |
| Social Media Agent | Automation | Multi-platform | Advanced |

---

## Checklist: UAT Test Scenarios

### Seller Test Cases

- [ ] Apply for seller account
- [ ] Login to Studio
- [ ] Create new agent from template
- [ ] Configure agent prompts
- [ ] Test agent in playground
- [ ] Export to Registry
- [ ] Define 2-3 pricing plans
- [ ] Publish to marketplace
- [ ] View sales dashboard
- [ ] Respond to customer review

### Buyer Test Cases

- [ ] Browse marketplace catalog
- [ ] View agent details page
- [ ] Register new account
- [ ] Subscribe to agent (Business plan)
- [ ] Access customer portal
- [ ] Upload training documents
- [ ] Configure branding/persona
- [ ] Get widget embed code
- [ ] Test widget on test page
- [ ] View usage dashboard
- [ ] Generate API key
- [ ] Make API call

### Day 2 Test Cases

- [ ] Check usage limits
- [ ] Upgrade plan
- [ ] Add team member
- [ ] Update knowledge base
- [ ] View conversation analytics
- [ ] (Seller) Publish new version
- [ ] (Seller) View revenue report
- [ ] (Platform) Check system health
