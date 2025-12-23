# CMP Unified Platform Design

**Date:** December 14, 2024
**Status:** Architecture Specification
**Version:** 1.0

---

## Executive Summary

This document defines the complete, unified architecture for the Cloud Marketplace Platform (CMP) supporting four product categories with capability-driven, adaptive UI/UX, multi-tenant isolation, and flexible runtime deployment.

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CMP UNIFIED PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                           PRODUCT CATEGORIES                                 ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                ││
│  │  │  AGENTS   │  │   APPS    │  │ASSISTANTS │  │AUTOMATIONS│                ││
│  │  │           │  │           │  │           │  │           │                ││
│  │  │ • Single  │  │ • Agentic │  │ • Writer  │  │ • Workflow│                ││
│  │  │ • Multi   │  │ • Tools   │  │ • Image   │  │ • Scheduled│               ││
│  │  │ • Swarm   │  │ • Connectors│ │ • Voice   │  │ • Triggers│                ││
│  │  │           │  │           │  │ • Video   │  │ • Hybrid  │                ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                              RUNTIME LAYER                                   ││
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  ││
│  │  │      SHARED RUNTIME         │  │       DEDICATED RUNTIME              │  ││
│  │  │  (Starter/Pro Plans)        │  │    (Enterprise/Custom Plans)         │  ││
│  │  │                             │  │                                      │  ││
│  │  │  • API Key Isolation        │  │  • Namespace Isolation              │  ││
│  │  │  • Rate Limiting            │  │  • Custom Resources                 │  ││
│  │  │  • Fair Queuing             │  │  • SLA Guarantees                   │  ││
│  │  │  • Shared Compute           │  │  • Dedicated Compute                │  ││
│  │  └─────────────────────────────┘  └─────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                           CAPABILITY ENGINE                                  ││
│  │                                                                              ││
│  │  Seller Defines → Platform Validates → Buyer Sees Adaptive UI              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Unified Capability Schema

### Master Capability Definition

Every product (agent, app, assistant, automation) declares its capabilities. This drives:
- What the seller configures during creation
- What the buyer sees after purchase
- What the runtime provisions

```typescript
/**
 * Unified Capability Schema
 * Applies to ALL 4 categories: Agents, Apps, Assistants, Automations
 */
interface ProductCapabilities {
  // ═══════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════

  category: 'agent' | 'app' | 'assistant' | 'automation';

  subcategory: {
    // Agents
    agent?: 'single' | 'multi' | 'swarm' | 'orchestrator';
    // Apps
    app?: 'agentic' | 'tool' | 'connector' | 'integration';
    // Assistants
    assistant?: 'writer' | 'image' | 'voice' | 'video' | 'code' | 'data' | 'general';
    // Automations
    automation?: 'workflow' | 'scheduled' | 'triggered' | 'hybrid';
  };

  // Department/Use Case tags
  tags: Array<'sales' | 'marketing' | 'support' | 'hr' | 'finance' | 'ops' | 'dev' | 'general'>;

  // ═══════════════════════════════════════════════════════════════════
  // INTERFACE CAPABILITIES - How users interact
  // ═══════════════════════════════════════════════════════════════════

  interfaces: {
    // Chat/Conversation
    chat: {
      enabled: boolean;
      modes: Array<'text' | 'voice' | 'video'>;
      features: {
        streaming: boolean;           // Real-time token streaming
        fileUpload: boolean;          // Accept file attachments
        imageInput: boolean;          // Accept image inputs
        multiTurn: boolean;           // Maintain conversation context
        suggestedReplies: boolean;    // Show quick reply buttons
      };
    };

    // Embeddable Widget
    widget: {
      enabled: boolean;
      types: Array<'floating' | 'inline' | 'fullpage' | 'popup'>;
      customization: {
        theme: boolean;               // Light/dark/custom
        colors: boolean;              // Brand colors
        position: boolean;            // Widget placement
        size: boolean;                // Dimensions
        avatar: boolean;              // Custom avatar
        launcher: boolean;            // Custom launch button
      };
    };

    // API Access
    api: {
      enabled: boolean;
      protocols: Array<'rest' | 'graphql' | 'websocket' | 'mcp'>;
      authentication: Array<'api_key' | 'oauth2' | 'jwt'>;
      features: {
        webhooks: boolean;            // Outbound event notifications
        callbacks: boolean;           // Async completion callbacks
        batch: boolean;               // Batch processing
      };
    };

    // Direct Integrations
    integrations: {
      enabled: boolean;
      platforms: Array<'slack' | 'teams' | 'discord' | 'whatsapp' | 'telegram' | 'email'>;
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURATION CAPABILITIES - What buyers can customize
  // ═══════════════════════════════════════════════════════════════════

  configuration: {
    // Knowledge/Training
    knowledge: {
      enabled: boolean;
      sources: {
        documents: boolean;           // PDF, DOCX, TXT upload
        websites: boolean;            // URL crawling
        databases: boolean;           // DB connections
        apis: boolean;                // External API data
        qaFiles: boolean;             // Q&A CSV upload
      };
      limits: {
        maxDocuments: number;
        maxSizeMB: number;
        maxUrls: number;
      };
    };

    // Persona/Behavior
    persona: {
      enabled: boolean;
      options: {
        name: boolean;                // Custom display name
        avatar: boolean;              // Custom avatar image
        tone: boolean;                // Formal/casual/friendly/professional
        language: boolean;            // Response language
        instructions: boolean;        // Custom system prompt additions
        boundaries: boolean;          // What NOT to do
      };
    };

    // Conversation Flow
    conversation: {
      enabled: boolean;
      options: {
        welcomeMessage: boolean;      // Initial greeting
        welcomeVariants: boolean;     // Multiple random greetings
        suggestedPrompts: boolean;    // Starter questions
        fallbackMessage: boolean;     // "I don't understand" response
        handoffMessage: boolean;      // Transfer to human message
        exitMessage: boolean;         // Conversation end message
        feedbackRequest: boolean;     // Ask for rating
      };
    };

    // Branding
    branding: {
      enabled: boolean;
      options: {
        logo: boolean;
        colors: boolean;
        fonts: boolean;
        customCSS: boolean;
      };
    };

    // Workflow (for Automations)
    workflow: {
      enabled: boolean;
      options: {
        triggers: boolean;            // Define trigger conditions
        schedule: boolean;            // Cron/interval scheduling
        conditions: boolean;          // Conditional logic
        actions: boolean;             // Output actions
        variables: boolean;           // Custom variables
        secrets: boolean;             // Secure credential storage
      };
    };

    // Output Settings (for Assistants)
    output: {
      enabled: boolean;
      options: {
        format: boolean;              // Output format selection
        quality: boolean;             // Quality/speed tradeoff
        style: boolean;               // Style presets
        templates: boolean;           // Output templates
      };
    };

    // RAG (Retrieval-Augmented Generation)
    rag: {
      enabled: boolean;
      sources: {
        documents: boolean;           // PDF, DOCX, TXT upload
        websites: boolean;            // URL crawling
        qaPairs: boolean;             // Q&A CSV upload
        databases: boolean;           // DB connections (enterprise)
        apis: boolean;                // External API data (enterprise)
      };
      limits: {
        maxDocuments: number;
        maxSizeMB: number;
        maxUrls: number;
        maxChunks: number;
      };
      retrieval: {
        topK: number;                 // Results per query
        method: 'vector' | 'hybrid' | 'keyword';
        reranking: boolean;
        citations: boolean;
      };
      grounding: {
        strictMode: boolean;          // Only answer from knowledge
        fallback: 'refuse' | 'general' | 'escalate';
      };
    };

    // Advanced Workflow Configuration
    workflowAdvanced: {
      enabled: boolean;
      triggers: {
        webhook: boolean;
        schedule: boolean;
        event: boolean;
        manual: boolean;
        api: boolean;
      };
      flow: {
        conditionals: boolean;
        loops: boolean;
        parallelExecution: boolean;
        subWorkflows: boolean;
        errorHandling: boolean;
      };
      actions: {
        http: boolean;
        database: boolean;
        ai: boolean;
        messaging: boolean;
        storage: boolean;
        transform: boolean;
        code: boolean;                // Enterprise only
      };
      data: {
        variables: boolean;
        secrets: boolean;
        statePersistence: boolean;
      };
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // ANALYTICS CAPABILITIES - What data is available
  // ═══════════════════════════════════════════════════════════════════

  analytics: {
    usage: {
      enabled: boolean;
      metrics: Array<'messages' | 'tokens' | 'sessions' | 'users' | 'api_calls' | 'compute_time'>;
    };

    conversations: {
      enabled: boolean;
      features: {
        transcripts: boolean;         // Full conversation logs
        search: boolean;              // Search conversations
        export: boolean;              // Export data
      };
    };

    insights: {
      enabled: boolean;
      features: {
        topics: boolean;              // Topic analysis
        sentiment: boolean;           // Sentiment tracking
        satisfaction: boolean;        // User ratings
        performance: boolean;         // Response quality
      };
    };

    alerts: {
      enabled: boolean;
      types: Array<'usage_limit' | 'error_rate' | 'latency' | 'satisfaction'>;
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // RUNTIME REQUIREMENTS - How it runs
  // ═══════════════════════════════════════════════════════════════════

  runtime: {
    // Deployment model
    deployment: 'shared' | 'dedicated' | 'hybrid';

    // Resource requirements
    compute: {
      cpu: 'low' | 'medium' | 'high' | 'gpu';
      memory: 'low' | 'medium' | 'high';
      scaling: 'fixed' | 'auto';
    };

    // Dependencies
    dependencies: {
      models: string[];               // Required AI models
      services: string[];             // Required external services
      mcpServers: string[];           // Required MCP servers
    };

    // Limits
    limits: {
      rateLimit: number;              // Requests per minute
      concurrency: number;            // Concurrent sessions
      timeout: number;                // Max execution time (seconds)
    };
  };
}
```

### Category-Specific Defaults

```typescript
const CATEGORY_DEFAULTS: Record<string, Partial<ProductCapabilities>> = {
  // ─────────────────────────────────────────────────────────────────
  // AGENTS - Conversational AI with context and memory
  // ─────────────────────────────────────────────────────────────────
  agent: {
    interfaces: {
      chat: { enabled: true, modes: ['text'], features: { multiTurn: true, streaming: true } },
      widget: { enabled: true, types: ['floating'], customization: { theme: true, colors: true } },
      api: { enabled: true, protocols: ['rest', 'mcp'], authentication: ['api_key'] },
    },
    configuration: {
      knowledge: { enabled: true, sources: { documents: true, qaFiles: true } },
      persona: { enabled: true, options: { name: true, tone: true, instructions: true } },
      conversation: { enabled: true, options: { welcomeMessage: true, suggestedPrompts: true } },
      // RAG enabled by default for agents
      rag: {
        enabled: true,
        sources: { documents: true, websites: true, qaPairs: true, databases: false, apis: false },
        limits: { maxDocuments: 50, maxSizeMB: 500, maxUrls: 100, maxChunks: 50000 },
        retrieval: { topK: 5, method: 'hybrid', reranking: true, citations: true },
        grounding: { strictMode: false, fallback: 'general' },
      },
    },
    analytics: {
      usage: { enabled: true, metrics: ['messages', 'sessions', 'users'] },
      conversations: { enabled: true, features: { transcripts: true } },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // APPS - Agentic applications with tools and integrations
  // ─────────────────────────────────────────────────────────────────
  app: {
    interfaces: {
      chat: { enabled: false },
      widget: { enabled: true, types: ['inline', 'fullpage'] },
      api: { enabled: true, protocols: ['rest', 'graphql'], authentication: ['api_key', 'oauth2'] },
      integrations: { enabled: true, platforms: ['slack', 'teams'] },
    },
    configuration: {
      knowledge: { enabled: false },
      persona: { enabled: false },
      workflow: { enabled: true, options: { triggers: true, actions: true, variables: true } },
    },
    analytics: {
      usage: { enabled: true, metrics: ['api_calls', 'compute_time'] },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // ASSISTANTS - Generative AI for content creation
  // ─────────────────────────────────────────────────────────────────
  assistant: {
    interfaces: {
      chat: { enabled: true, modes: ['text'], features: { fileUpload: true, imageInput: true } },
      widget: { enabled: true, types: ['inline', 'popup'] },
      api: { enabled: true, protocols: ['rest'], authentication: ['api_key'] },
    },
    configuration: {
      knowledge: { enabled: false },
      persona: { enabled: true, options: { tone: true, language: true } },
      output: { enabled: true, options: { format: true, quality: true, style: true, templates: true } },
    },
    analytics: {
      usage: { enabled: true, metrics: ['tokens', 'api_calls'] },
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // AUTOMATIONS - Workflow automation with triggers and schedules
  // ─────────────────────────────────────────────────────────────────
  automation: {
    interfaces: {
      chat: { enabled: false },
      widget: { enabled: false },
      api: { enabled: true, protocols: ['rest', 'websocket'], authentication: ['api_key'], features: { webhooks: true } },
    },
    configuration: {
      knowledge: { enabled: false },
      persona: { enabled: false },
      workflow: { enabled: true, options: { triggers: true, schedule: true, conditions: true, actions: true, secrets: true } },
      // Advanced workflow enabled by default for automations
      workflowAdvanced: {
        enabled: true,
        triggers: { webhook: true, schedule: true, event: true, manual: true, api: true },
        flow: { conditionals: true, loops: true, parallelExecution: true, subWorkflows: false, errorHandling: true },
        actions: { http: true, database: true, ai: true, messaging: true, storage: true, transform: true, code: false },
        data: { variables: true, secrets: true, statePersistence: true },
      },
    },
    analytics: {
      usage: { enabled: true, metrics: ['api_calls', 'compute_time', 'executions'] },
      alerts: { enabled: true, types: ['error_rate', 'latency', 'failure'] },
    },
  },
};
```

---

## Part 2: E2E Seller Journey

### Seller Flow: Build → Publish → Sell → Support → Earn

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SELLER E2E JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  BUILD   │───▶│ REGISTER │───▶│ CONFIGURE│───▶│ PUBLISH  │───▶│  MANAGE  │  │
│  │          │    │          │    │          │    │          │    │          │  │
│  │ External │    │   CMP    │    │   CMP    │    │   CMP    │    │   CMP    │  │
│  │ Studio   │    │ Registry │    │ Offering │    │Marketplace│   │Dashboard │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │               │         │
│       ▼               ▼               ▼               ▼               ▼         │
│  • Langflow      • Import flow   • Set category  • Review       • Analytics    │
│  • n8n           • Define caps   • Define plans  • Submit       • Customers    │
│  • Custom        • Test locally  • Add assets    • Approve      • Support      │
│  • API           • Version       • Write docs    • Go live      • Revenue      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Seller Dashboard Structure

```
Provider Dashboard
│
├── 🏠 Overview
│   ├── Revenue summary (MTD, trends)
│   ├── Active subscriptions count
│   ├── Recent orders
│   └── Quick actions
│
├── 📦 Products                          ← All 4 categories unified
│   ├── [Grid/List Toggle]
│   │
│   ├── ┌─────────────────────────────────────────────────────────────┐
│   │   │ Customer Support Agent          [Agent] [Active]            │
│   │   │ AI-powered customer service      ⭐ 4.8  👥 234 subscribers  │
│   │   │ [Edit] [Analytics] [Manage Customers]                       │
│   │   └─────────────────────────────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────────────────────────────┐
│   │   │ Content Writer Pro              [Assistant] [Active]        │
│   │   │ Generate blog posts, emails      ⭐ 4.6  👥 567 subscribers  │
│   │   │ [Edit] [Analytics] [Manage Customers]                       │
│   │   └─────────────────────────────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────────────────────────────┐
│   │   │ Data Sync Automation            [Automation] [Draft]        │
│   │   │ Sync data between CRM & ERP      Not published yet          │
│   │   │ [Continue Setup] [Preview] [Delete]                         │
│   │   └─────────────────────────────────────────────────────────────┘
│   │
│   └── [+ Create New Product]
│
├── 📋 Orders
│   ├── New orders (pending)
│   ├── Active subscriptions
│   └── Cancelled/expired
│
├── 💬 Support
│   ├── Open tickets
│   ├── Customer messages
│   └── FAQ management
│
├── 💰 Revenue
│   ├── Dashboard (charts, trends)
│   ├── Transactions
│   ├── Payouts
│   └── Reports
│
└── ⚙️ Settings
    ├── Provider profile
    ├── Payout settings
    ├── Team members
    └── Notifications
```

### Product Creation Wizard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Create New Product                                              Step 1 of 5     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  What type of product are you creating?                                         │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │                 │  │                 │  │                 │  │             ││
│  │    🤖 Agent     │  │    📱 App       │  │  ✨ Assistant   │  │⚡Automation ││
│  │                 │  │                 │  │                 │  │             ││
│  │ Conversational  │  │ Agentic apps    │  │ Content gen     │  │ Workflows   ││
│  │ AI with context │  │ with tools      │  │ text/image/etc  │  │ & schedules ││
│  │                 │  │                 │  │                 │  │             ││
│  │  ○ Single       │  │  ○ Tool         │  │  ○ Writer       │  │  ○ Workflow ││
│  │  ○ Multi-agent  │  │  ○ Connector    │  │  ○ Image        │  │  ○ Scheduled││
│  │  ○ Swarm        │  │  ○ Integration  │  │  ○ Voice        │  │  ○ Triggered││
│  │                 │  │                 │  │  ○ Video        │  │  ○ Hybrid   ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘│
│                                                                                  │
│  [Cancel]                                                          [Next →]     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Create New Product                                              Step 2 of 5     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Import or Build                                                                │
│                                                                                  │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                                     │  │                                 │  │
│  │     📤 Import from Studio           │  │     🔧 Build from Scratch       │  │
│  │                                     │  │                                 │  │
│  │  Import existing flow from:         │  │  Start with a template or      │  │
│  │  • Langflow (JSON)                  │  │  configure from scratch         │  │
│  │  • n8n (JSON)                       │  │                                 │  │
│  │  • OpenAPI spec                     │  │  [Select Template ▼]            │  │
│  │  • MCP definition                   │  │  • Blank                        │  │
│  │                                     │  │  • Customer Support             │  │
│  │  [Choose File] or drag & drop       │  │  • Sales Assistant              │  │
│  │                                     │  │  • FAQ Bot                      │  │
│  └─────────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                                  │
│  [← Back]                                                          [Next →]     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Create New Product                                              Step 3 of 5     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Define Capabilities                                                            │
│  What can buyers do with your product?                                          │
│                                                                                  │
│  INTERFACES ──────────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ☑ Chat Interface                                                        │   │
│  │   Modes: ☑ Text  ☐ Voice  ☐ Video                                       │   │
│  │   Features: ☑ Streaming  ☑ Multi-turn  ☐ File upload  ☐ Image input    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Embeddable Widget                                                     │   │
│  │   Types: ☑ Floating  ☐ Inline  ☐ Fullpage                               │   │
│  │   Customizable: ☑ Theme  ☑ Colors  ☑ Position  ☐ Custom CSS            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ API Access                                                            │   │
│  │   Protocols: ☑ REST  ☐ GraphQL  ☑ MCP                                   │   │
│  │   Auth: ☑ API Key  ☐ OAuth2                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  BUYER CONFIGURATION ─────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ ☑ Knowledge/Training                                                    │   │
│  │   Allow: ☑ Document upload  ☑ Q&A pairs  ☐ Website crawl  ☐ API data   │   │
│  │   Limits: Max docs [10]  Max size [50 MB]                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Persona Customization                                                 │   │
│  │   Allow: ☑ Custom name  ☑ Tone selection  ☑ Welcome message  ☐ Full prompt│ │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Branding                                                              │   │
│  │   Allow: ☑ Colors  ☑ Logo  ☐ Custom CSS                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  [← Back]                                                          [Next →]     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Create New Product                                              Step 4 of 5     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Pricing & Plans                                                                │
│                                                                                  │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐           │
│  │ Starter           │  │ Pro               │  │ Enterprise        │           │
│  │                   │  │                   │  │                   │           │
│  │ $[29]/month       │  │ $[99]/month       │  │ $[Contact Us]     │           │
│  │                   │  │                   │  │                   │           │
│  │ Includes:         │  │ Includes:         │  │ Includes:         │           │
│  │ • [1,000] msgs    │  │ • [10,000] msgs   │  │ • Unlimited msgs  │           │
│  │ • [1] user        │  │ • [5] users       │  │ • Unlimited users │           │
│  │ • Shared runtime  │  │ • Shared runtime  │  │ • Dedicated       │           │
│  │ • Email support   │  │ • Priority support│  │ • Custom SLA      │           │
│  │                   │  │                   │  │                   │           │
│  │ [Edit Plan]       │  │ [Edit Plan]       │  │ [Edit Plan]       │           │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘           │
│                                                                                  │
│  [+ Add Plan]                            Runtime: ○ Shared  ○ Dedicated  ○ Both │
│                                                                                  │
│  [← Back]                                                          [Next →]     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Create New Product                                              Step 5 of 5     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Marketplace Listing                                                            │
│                                                                                  │
│  Name: [Customer Support Agent                    ]                             │
│                                                                                  │
│  Short description (max 150 chars):                                             │
│  [AI-powered customer service agent that handles inquiries 24/7              ]  │
│                                                                                  │
│  Full description:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ # Customer Support Agent                                                │   │
│  │                                                                          │   │
│  │ Handle customer inquiries automatically with our AI agent...           │   │
│  │ [Markdown editor with preview]                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  Assets:                                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                                  │
│  │   Logo     │ │Screenshot 1│ │Screenshot 2│  [+ Add]                         │
│  │   [Upload] │ │  [Upload]  │ │  [Upload]  │                                  │
│  └────────────┘ └────────────┘ └────────────┘                                  │
│                                                                                  │
│  Demo video URL: [https://youtube.com/...                        ]             │
│                                                                                  │
│  Tags: [customer-support] [ai] [chatbot] [+]                                   │
│                                                                                  │
│  [← Back]                    [Save Draft]           [Submit for Review →]       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: E2E Buyer Journey

### Buyer Flow: Discover → Purchase → Configure → Use → Manage

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BUYER E2E JOURNEY                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ DISCOVER │───▶│ EVALUATE │───▶│ PURCHASE │───▶│CONFIGURE │───▶│   USE    │  │
│  │          │    │          │    │          │    │          │    │          │  │
│  │Marketplace│   │ Details  │    │ Checkout │    │ Adaptive │    │ Integrate│  │
│  │  Browse   │   │  Demo    │    │  Pay     │    │    UI    │    │  Widget  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │               │         │
│       ▼               ▼               ▼               ▼               ▼         │
│  • Search        • Features      • Select plan  • Based on      • Embed code  │
│  • Filter        • Pricing       • Create org   • Capabilities  • API keys    │
│  • Categories    • Reviews       • Auto-project • Only show     • Test chat   │
│  • Compare       • Try demo      • Payment      • relevant UI   • Go live     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Buyer Dashboard Structure (Adaptive)

```
Organization Dashboard
│
├── 🏠 Home
│   ├── Quick stats (usage, spending)
│   ├── Recent activity
│   ├── Recommended products
│   └── Getting started guide (if new)
│
├── 📦 My Products                       ← Unified view of all subscriptions
│   │
│   │  Filter: [All ▼] [Agents ▼] [Apps ▼] [Assistants ▼] [Automations ▼]
│   │
│   ├── ┌─────────────────────────────────────────────────────────────────────┐
│   │   │ 🤖 Customer Support Agent                              [Active ●]  │
│   │   │     Agent • Customer Support                                        │
│   │   │     Pro Plan • 8,234 / 10,000 messages                             │
│   │   │                                                                     │
│   │   │     [Open Dashboard]  [Configure]  [Get Widget]                    │
│   │   └─────────────────────────────────────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────────────────────────────────────┐
│   │   │ ✨ Content Writer Pro                                  [Active ●]  │
│   │   │     Assistant • Writer                                              │
│   │   │     Starter Plan • 45,000 / 50,000 tokens                          │
│   │   │                                                                     │
│   │   │     [Open]  [Settings]                                             │
│   │   └─────────────────────────────────────────────────────────────────────┘
│   │
│   └── [Browse Marketplace]
│
├── 🛒 Marketplace
│   ├── Browse all
│   ├── Categories (Agents, Apps, Assistants, Automations)
│   ├── Featured
│   └── My wishlist
│
├── 📊 Usage
│   ├── Overview (all products)
│   ├── By product
│   └── Billing & invoices
│
└── ⚙️ Settings
    ├── Organization
    ├── Team
    ├── Projects (if enabled)
    └── Billing
```

### Adaptive Product Dashboard (Capability-Driven)

The product dashboard renders different sections based on `ProductCapabilities`:

```typescript
// Component renders based on capabilities
function ProductDashboard({ product, capabilities }: Props) {
  return (
    <Dashboard>
      {/* Always shown */}
      <OverviewSection product={product} />

      {/* Quick Start - adapts to available interfaces */}
      <QuickStartSection
        hasWidget={capabilities.interfaces.widget.enabled}
        hasApi={capabilities.interfaces.api.enabled}
        hasChat={capabilities.interfaces.chat.enabled}
        hasIntegrations={capabilities.interfaces.integrations.enabled}
      />

      {/* Configuration - only if configurable */}
      {hasAnyConfiguration(capabilities) && (
        <ConfigurationSection capabilities={capabilities} />
      )}

      {/* Integration - based on interfaces */}
      <IntegrationSection capabilities={capabilities.interfaces} />

      {/* Analytics - based on what's available */}
      {capabilities.analytics.usage.enabled && (
        <AnalyticsSection metrics={capabilities.analytics} />
      )}
    </Dashboard>
  );
}
```

### Example: Agent Dashboard (Full Config)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Customer Support Agent                                           [Active ●]     │
│ by Acme AI Solutions • Agent • Customer Support                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Quick Start                                               [✓ Completed]    ││
│  │                                                                              ││
│  │  ① Get embed code    ② Add to site       ③ Start chatting                  ││
│  │     [Copy Widget]       [View Guide]        [Test Now]                      ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐          │
│  │ 💬 8,234           │ │ 👥 1,234           │ │ 😊 94%             │          │
│  │ Messages           │ │ Users              │ │ Satisfaction       │          │
│  │ ↑ 12% vs last week │ │ ↑ 8% vs last week  │ │ ↑ 2% vs last week  │          │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘          │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  [Overview] [Configure ▼] [Integrate ▼] [Analytics]                            │
│                                                                                  │
│  ┌─ Configure ─────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  📚 Training                                           [3 documents]        ││
│  │  ├─ Documents: product-guide.pdf, faq.docx, policies.pdf                    ││
│  │  ├─ Q&A Pairs: 45 pairs defined                                             ││
│  │  └─ [Manage Knowledge Base]                                                 ││
│  │                                                                              ││
│  │  🎭 Persona                                            [Configured ✓]       ││
│  │  ├─ Name: "Support Assistant"                                               ││
│  │  ├─ Tone: Professional, Friendly                                            ││
│  │  ├─ Welcome: "Hi! I'm here to help with your questions..."                  ││
│  │  └─ [Edit Persona]                                                          ││
│  │                                                                              ││
│  │  🎨 Branding                                           [Configured ✓]       ││
│  │  ├─ Primary Color: #7c3aed                                                  ││
│  │  ├─ Logo: company-logo.png                                                  ││
│  │  └─ [Edit Branding]                                                         ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─ Integrate ─────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  🔌 Widget                                             [Live on 2 sites]    ││
│  │  ├─ [Preview Widget]  [Customize]  [Copy Embed Code]                        ││
│  │                                                                              ││
│  │  🔑 API Keys                                           [2 active keys]      ││
│  │  ├─ Production: ar_sk_live_****abc  [Copy] [Revoke]                         ││
│  │  ├─ Development: ar_sk_test_****xyz [Copy] [Revoke]                         ││
│  │  └─ [Generate New Key]                                                      ││
│  │                                                                              ││
│  │  📡 MCP Connection                                                          ││
│  │  └─ [View MCP Config]                                                       ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Example: Assistant Dashboard (Simple - Output Focused)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Content Writer Pro                                               [Active ●]     │
│ by AI Tools Inc • Assistant • Writer                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         Start Creating                                       ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ What would you like to create?                                      │   ││
│  │  │                                                                      │   ││
│  │  │ [Blog Post] [Email] [Social Media] [Product Description] [Custom]   │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  │  [Open Full Editor]                                                         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────┐ ┌────────────────────┐                                 │
│  │ 📝 45,000          │ │ 📄 234             │                                 │
│  │ Tokens used        │ │ Documents created  │                                 │
│  │ of 50,000 / month  │ │ this month         │                                 │
│  └────────────────────┘ └────────────────────┘                                 │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  [Create] [Settings] [History] [API]                                           │
│                                                                                  │
│  ┌─ Settings ──────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  ✍️ Writing Style                                                           ││
│  │  ├─ Tone: [Professional ▼]                                                  ││
│  │  ├─ Length: [Medium ▼]                                                      ││
│  │  └─ Language: [English (US) ▼]                                              ││
│  │                                                                              ││
│  │  📋 Output Preferences                                                      ││
│  │  ├─ Default format: [Markdown ▼]                                            ││
│  │  ├─ Include headings: [Yes ▼]                                               ││
│  │  └─ Auto-save drafts: [On ▼]                                                ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Example: Automation Dashboard (Workflow Focused)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Data Sync Automation                                             [Active ●]     │
│ by Integration Co • Automation • Scheduled                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Status                                                                       ││
│  │                                                                              ││
│  │  Last run: 5 minutes ago ✓ Success                                          ││
│  │  Next run: in 55 minutes                                                    ││
│  │  Schedule: Every hour                                                        ││
│  │                                                                              ││
│  │  [Run Now]  [Pause]  [View Logs]                                            ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐          │
│  │ ✓ 1,234            │ │ ⚠️ 3               │ │ 📊 45,678          │          │
│  │ Successful runs    │ │ Failures (0.2%)    │ │ Records synced    │          │
│  │ this month         │ │ this month         │ │ this month        │          │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘          │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│  [Overview] [Configuration] [Logs] [Alerts]                                    │
│                                                                                  │
│  ┌─ Configuration ─────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  ⏰ Schedule                                                                 ││
│  │  ├─ Frequency: [Hourly ▼]                                                   ││
│  │  ├─ Run at: [:00 minutes ▼]                                                 ││
│  │  └─ Timezone: [UTC ▼]                                                       ││
│  │                                                                              ││
│  │  🔗 Connections                                                             ││
│  │  ├─ Source: Salesforce CRM [Connected ✓] [Reconnect]                        ││
│  │  └─ Target: PostgreSQL DB [Connected ✓] [Reconnect]                         ││
│  │                                                                              ││
│  │  🔐 Credentials                                                             ││
│  │  ├─ SALESFORCE_API_KEY: ******* [Edit]                                      ││
│  │  └─ DATABASE_URL: ******* [Edit]                                            ││
│  │                                                                              ││
│  │  📧 Alerts                                                                  ││
│  │  ├─ On failure: [Email ▼] to [admin@company.com]                            ││
│  │  └─ On success: [None ▼]                                                    ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Multi-Tenant Runtime Architecture

### Runtime Deployment Models

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RUNTIME ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                           API GATEWAY                                        ││
│  │  • Authentication (API Key / JWT validation)                                ││
│  │  • Rate limiting (per tenant, per product)                                  ││
│  │  • Request routing (shared vs dedicated)                                    ││
│  │  • Usage metering                                                           ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                              │                                                   │
│              ┌───────────────┴───────────────┐                                  │
│              │                               │                                   │
│              ▼                               ▼                                   │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────────┐│
│  │     SHARED RUNTIME      │    │           DEDICATED RUNTIME                  ││
│  │     (Starter/Pro)       │    │         (Enterprise/Custom)                  ││
│  │                         │    │                                              ││
│  │  ┌───────────────────┐  │    │  ┌─────────────────────────────────────────┐││
│  │  │ Shared Kubernetes │  │    │  │        Tenant A Namespace               │││
│  │  │    Namespace      │  │    │  │  ┌─────────────────────────────────┐   │││
│  │  │                   │  │    │  │  │ Dedicated Pods                   │   │││
│  │  │  ┌─────┐ ┌─────┐  │  │    │  │  │ • Custom resource limits        │   │││
│  │  │  │Pod 1│ │Pod 2│  │  │    │  │  │ • Isolated network              │   │││
│  │  │  └─────┘ └─────┘  │  │    │  │  │ • Custom scaling rules          │   │││
│  │  │  ┌─────┐ ┌─────┐  │  │    │  │  │ • SLA guarantees                │   │││
│  │  │  │Pod 3│ │Pod 4│  │  │    │  │  └─────────────────────────────────┘   │││
│  │  │  └─────┘ └─────┘  │  │    │  └─────────────────────────────────────────┘││
│  │  │                   │  │    │                                              ││
│  │  │  Isolation by:    │  │    │  ┌─────────────────────────────────────────┐││
│  │  │  • API Key        │  │    │  │        Tenant B Namespace               │││
│  │  │  • Data tagging   │  │    │  │  ┌─────────────────────────────────┐   │││
│  │  │  • Row-level sec  │  │    │  │  │ GPU-enabled Pods                 │   │││
│  │  │                   │  │    │  │  │ • Image/Video processing         │   │││
│  │  │  Fair scheduling: │  │    │  │  │ • High-memory workloads          │   │││
│  │  │  • Queue per tenant│ │    │  │  └─────────────────────────────────┘   │││
│  │  │  • Priority tiers │  │    │  └─────────────────────────────────────────┘││
│  │  └───────────────────┘  │    │                                              ││
│  └─────────────────────────┘    └─────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Tenant Isolation Strategy

```typescript
interface TenantIsolation {
  // ═══════════════════════════════════════════════════════════════════
  // SHARED RUNTIME ISOLATION
  // ═══════════════════════════════════════════════════════════════════
  shared: {
    // Data isolation
    dataIsolation: {
      method: 'row_level_security';
      implementation: {
        // Every table has tenant_id column
        // PostgreSQL RLS policies enforce access
        // API Gateway injects tenant context
      };
    };

    // Compute isolation
    computeIsolation: {
      method: 'fair_scheduling';
      implementation: {
        queuePerTenant: true;         // Separate job queues
        priorityByPlan: true;         // Pro > Starter
        maxConcurrent: number;        // Per tenant limit
        burstAllowed: boolean;        // Allow temporary spikes
      };
    };

    // Rate limiting
    rateLimiting: {
      byApiKey: true;
      byTenant: true;
      byProduct: true;
      limits: {
        starter: { rpm: 60, concurrent: 5 };
        pro: { rpm: 300, concurrent: 20 };
      };
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // DEDICATED RUNTIME ISOLATION
  // ═══════════════════════════════════════════════════════════════════
  dedicated: {
    // Kubernetes namespace per tenant
    namespace: {
      name: 'tenant-{tenant_id}';
      networkPolicy: 'deny-all-except-gateway';
      resourceQuota: 'based-on-plan';
    };

    // Dedicated resources
    resources: {
      pods: {
        replicas: { min: 2, max: 10 };
        cpu: { request: '500m', limit: '2000m' };
        memory: { request: '1Gi', limit: '4Gi' };
      };
      gpu: {
        enabled: boolean;
        type: 'nvidia-t4' | 'nvidia-a100';
        count: number;
      };
    };

    // SLA guarantees
    sla: {
      availability: '99.9%';
      latencyP99: '500ms';
      supportResponse: '1h';
    };
  };
}
```

### Plan-Based Runtime Selection

```typescript
interface PlanRuntimeMapping {
  // Automatically determine runtime based on plan
  getRuntimeForPlan(plan: Plan): RuntimeConfig {
    switch (plan.tier) {
      case 'starter':
        return {
          type: 'shared',
          limits: {
            messages: 1000,
            tokensPerMonth: 100000,
            apiCallsPerMinute: 60,
            concurrentSessions: 5,
          },
          features: {
            priority: 'normal',
            sla: 'best-effort',
            support: 'email',
          },
        };

      case 'pro':
        return {
          type: 'shared',
          limits: {
            messages: 10000,
            tokensPerMonth: 1000000,
            apiCallsPerMinute: 300,
            concurrentSessions: 20,
          },
          features: {
            priority: 'high',
            sla: '99.5%',
            support: 'priority',
          },
        };

      case 'enterprise':
        return {
          type: 'dedicated',
          limits: {
            messages: 'unlimited',
            tokensPerMonth: 'unlimited',
            apiCallsPerMinute: 'custom',
            concurrentSessions: 'custom',
          },
          features: {
            priority: 'highest',
            sla: '99.9%',
            support: '24x7',
            customNamespace: true,
            gpuAccess: true,
          },
        };
    }
  }
}
```

### Usage Metering & Billing

```typescript
interface UsageMetering {
  // What we track
  metrics: {
    // Universal metrics
    apiCalls: number;
    computeSeconds: number;

    // Category-specific
    agent: {
      messages: number;
      sessions: number;
      tokensIn: number;
      tokensOut: number;
    };

    assistant: {
      tokensIn: number;
      tokensOut: number;
      imagesGenerated: number;
      audioMinutes: number;
      videoMinutes: number;
    };

    automation: {
      executions: number;
      successfulRuns: number;
      failedRuns: number;
      dataRecordsProcessed: number;
    };

    app: {
      apiCalls: number;
      webhookDeliveries: number;
      storageGB: number;
    };
  };

  // How we bill
  billing: {
    model: 'subscription' | 'usage' | 'hybrid';

    subscription: {
      includedUsage: Record<string, number>;
      overageRate: Record<string, number>;
    };

    usage: {
      rates: Record<string, number>;
      minimumCharge: number;
    };
  };
}
```

---

## Part 5: Component Architecture

### Frontend Component Hierarchy

```
src/
├── marketplace/
│   ├── categories/
│   │   ├── CategoryGrid.tsx              # Browse by category
│   │   ├── CategoryCard.tsx              # Agent/App/Assistant/Automation card
│   │   └── CategoryFilter.tsx            # Filter controls
│   │
│   ├── products/
│   │   ├── ProductCard.tsx               # Universal product card
│   │   ├── ProductDetails.tsx            # Full product page
│   │   ├── ProductDemo.tsx               # Interactive demo
│   │   └── ProductPricing.tsx            # Plan comparison
│   │
│   └── checkout/
│       ├── CheckoutFlow.tsx              # Purchase wizard
│       ├── PlanSelector.tsx              # Choose plan
│       └── PaymentForm.tsx               # Payment entry
│
├── customer/
│   ├── products/
│   │   ├── ProductsList.tsx              # My products grid
│   │   ├── ProductCard.tsx               # Product card (buyer view)
│   │   └── ProductDashboard.tsx          # Unified product dashboard
│   │
│   ├── dashboard/
│   │   ├── AdaptiveDashboard.tsx         # Capability-driven dashboard
│   │   ├── sections/
│   │   │   ├── OverviewSection.tsx       # Always shown
│   │   │   ├── QuickStartSection.tsx     # Getting started
│   │   │   ├── ConfigureSection.tsx      # If configurable
│   │   │   ├── IntegrateSection.tsx      # Widget/API/MCP
│   │   │   └── AnalyticsSection.tsx      # If analytics enabled
│   │   │
│   │   └── category-specific/
│   │       ├── AgentDashboard.tsx        # Agent-specific features
│   │       ├── AssistantDashboard.tsx    # Assistant features (create UI)
│   │       ├── AutomationDashboard.tsx   # Automation features (workflow)
│   │       └── AppDashboard.tsx          # App features
│   │
│   ├── configure/
│   │   ├── KnowledgeManager.tsx          # Document upload, Q&A
│   │   ├── PersonaEditor.tsx             # Name, tone, instructions
│   │   ├── ConversationSettings.tsx      # Welcome, suggested, exit
│   │   ├── BrandingEditor.tsx            # Colors, logo
│   │   ├── WorkflowEditor.tsx            # Triggers, schedule, actions
│   │   └── OutputSettings.tsx            # Format, quality, style
│   │
│   ├── integrate/
│   │   ├── WidgetConfigurator.tsx        # Live preview widget customizer
│   │   ├── ApiKeyManager.tsx             # Generate, copy, revoke keys
│   │   ├── McpConfig.tsx                 # MCP connection details
│   │   └── IntegrationSetup.tsx          # Slack, Teams, etc.
│   │
│   └── analytics/
│       ├── UsageDashboard.tsx            # Metrics overview
│       ├── ConversationList.tsx          # Transcript browser
│       ├── InsightsPanel.tsx             # Topics, sentiment
│       └── AlertsManager.tsx             # Usage alerts config
│
├── provider/
│   ├── products/
│   │   ├── ProductsList.tsx              # My products (seller view)
│   │   ├── ProductEditor.tsx             # Create/edit product
│   │   └── ProductAnalytics.tsx          # Seller analytics
│   │
│   ├── wizard/
│   │   ├── CreateProductWizard.tsx       # 5-step creation flow
│   │   ├── steps/
│   │   │   ├── CategoryStep.tsx          # Choose category
│   │   │   ├── ImportStep.tsx            # Import or build
│   │   │   ├── CapabilitiesStep.tsx      # Define capabilities
│   │   │   ├── PricingStep.tsx           # Set plans
│   │   │   └── ListingStep.tsx           # Marketplace details
│   │   │
│   │   └── CapabilityEditor.tsx          # Visual capability editor
│   │
│   ├── customers/
│   │   ├── CustomerList.tsx              # Subscriber list
│   │   └── CustomerDetails.tsx           # Individual customer view
│   │
│   └── revenue/
│       ├── RevenueDashboard.tsx          # Earnings overview
│       ├── TransactionList.tsx           # All transactions
│       └── PayoutSettings.tsx            # Payout configuration
│
└── shared/
    ├── capability/
    │   ├── CapabilityContext.tsx         # Provide capabilities to tree
    │   ├── useCapabilities.ts            # Hook to access capabilities
    │   └── CapabilityGate.tsx            # Conditionally render
    │
    ├── widget/
    │   ├── WidgetPreview.tsx             # Live preview component
    │   ├── WidgetThemeEditor.tsx         # Theme controls
    │   └── EmbedCodeGenerator.tsx        # Generate embed snippets
    │
    └── analytics/
        ├── MetricCard.tsx                # Single metric display
        ├── TrendChart.tsx                # Time series chart
        └── UsageBar.tsx                  # Progress/limit bar
```

### Backend API Structure

```
api/
├── v1/
│   ├── marketplace/
│   │   ├── categories/                   # GET /categories
│   │   ├── products/                     # GET/POST /products
│   │   │   ├── {uuid}/                   # Product CRUD
│   │   │   ├── {uuid}/plans/             # Plan management
│   │   │   └── {uuid}/reviews/           # Reviews
│   │   └── search/                       # Search & filter
│   │
│   ├── subscriptions/
│   │   ├── /                             # GET /subscriptions (buyer's products)
│   │   ├── {uuid}/                       # Subscription details
│   │   ├── {uuid}/config/                # Configuration (adaptive)
│   │   │   ├── knowledge/                # If enabled
│   │   ├── persona/                  # If enabled
│   │   │   ├── branding/                 # If enabled
│   │   │   └── workflow/                 # If enabled (automations)
│   │   ├── {uuid}/keys/                  # API key management
│   │   ├── {uuid}/widget/                # Widget config
│   │   └── {uuid}/analytics/             # Usage data
│   │
│   ├── provider/
│   │   ├── products/                     # Seller's products
│   │   │   ├── {uuid}/capabilities/      # Define capabilities
│   │   │   ├── {uuid}/publish/           # Submit for review
│   │   │   └── {uuid}/analytics/         # Seller analytics
│   │   ├── customers/                    # Subscriber management
│   │   └── revenue/                      # Earnings & payouts
│   │
│   └── runtime/
│       ├── invoke/                       # Execute product
│       ├── chat/                         # Chat endpoint
│       ├── stream/                       # Streaming endpoint
│       └── webhook/                      # Webhook delivery
│
└── internal/
    ├── provisioning/                     # Runtime provisioning
    ├── metering/                         # Usage tracking
    └── billing/                          # Billing integration
```

---

## Part 6: RAG (Retrieval-Augmented Generation) Architecture

### RAG Overview

RAG enables products to augment LLM responses with customer-specific knowledge. This is critical for Agents and some Assistants.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RAG ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         KNOWLEDGE INGESTION                                  ││
│  │                                                                              ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │ Documents │  │ Websites  │  │  Q&A CSV  │  │ Databases │  │   APIs    │ ││
│  │  │ PDF/DOCX  │  │  Crawler  │  │  Pairs    │  │ Connector │  │  Fetcher  │ ││
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ ││
│  │        │              │              │              │              │        ││
│  │        └──────────────┴──────────────┼──────────────┴──────────────┘        ││
│  │                                      ▼                                      ││
│  │                          ┌───────────────────┐                              ││
│  │                          │   PARSER ENGINE   │                              ││
│  │                          │  • Text extraction│                              ││
│  │                          │  • Chunking       │                              ││
│  │                          │  • Metadata       │                              ││
│  │                          └─────────┬─────────┘                              ││
│  │                                    ▼                                        ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         VECTOR STORAGE                                       ││
│  │                                                                              ││
│  │  ┌───────────────────────────────────────────────────────────────────────┐  ││
│  │  │                       EMBEDDING ENGINE                                 │  ││
│  │  │  • OpenAI text-embedding-3-small (default)                            │  ││
│  │  │  • Cohere embed-multilingual-v3 (multilingual)                        │  ││
│  │  │  • Custom embeddings (enterprise)                                      │  ││
│  │  └───────────────────────────────────────────────────────────────────────┘  ││
│  │                                      │                                       ││
│  │                                      ▼                                       ││
│  │  ┌───────────────────────────────────────────────────────────────────────┐  ││
│  │  │                     VECTOR DATABASE (pgvector)                         │  ││
│  │  │                                                                        │  ││
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  ││
│  │  │  │ Subscription A  │  │ Subscription B  │  │ Subscription C  │       │  ││
│  │  │  │ • 500 chunks    │  │ • 2,340 chunks  │  │ • 12,500 chunks │       │  ││
│  │  │  │ • 45MB content  │  │ • 230MB content │  │ • 1.2GB content │       │  ││
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  ││
│  │  │                                                                        │  ││
│  │  │  Isolation: subscription_uuid column + RLS policies                   │  ││
│  │  └───────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         RETRIEVAL & GENERATION                               ││
│  │                                                                              ││
│  │   User Query                                                                 ││
│  │       │                                                                      ││
│  │       ▼                                                                      ││
│  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               ││
│  │  │  Query        │    │   Vector      │    │   Reranker    │               ││
│  │  │  Embedding    │───▶│   Search      │───▶│   (optional)  │               ││
│  │  │               │    │   Top-K       │    │   Cohere/BGE  │               ││
│  │  └───────────────┘    └───────────────┘    └───────┬───────┘               ││
│  │                                                    │                         ││
│  │                                                    ▼                         ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │                         CONTEXT BUILDER                              │   ││
│  │  │                                                                      │   ││
│  │  │  System Prompt + Retrieved Chunks + User Query + Conversation History│   ││
│  │  └───────────────────────────────────────────────────────────────────────┘   ││
│  │                                      │                                       ││
│  │                                      ▼                                       ││
│  │  ┌───────────────────────────────────────────────────────────────────────┐  ││
│  │  │                             LLM                                        │  ││
│  │  │  • GPT-4o (default)  • Claude 3.5 Sonnet  • Custom (enterprise)       │  ││
│  │  └───────────────────────────────────────────────────────────────────────┘  ││
│  │                                      │                                       ││
│  │                                      ▼                                       ││
│  │                              Response with Citations                         ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### RAG Capability Schema

```typescript
interface RAGCapabilities {
  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE SOURCES - What can be ingested
  // ═══════════════════════════════════════════════════════════════════

  sources: {
    documents: {
      enabled: boolean;
      formats: Array<'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'csv' | 'xlsx'>;
      maxFileSize: number;        // MB per file
      maxTotalSize: number;       // MB total storage
      maxFiles: number;           // Max number of files
    };

    websites: {
      enabled: boolean;
      maxUrls: number;            // Max URLs to crawl
      maxDepth: number;           // Crawl depth (1 = single page)
      refreshInterval: string;    // 'never' | 'daily' | 'weekly' | 'monthly'
    };

    qaPairs: {
      enabled: boolean;
      maxPairs: number;           // Max Q&A pairs
      importFormats: Array<'csv' | 'json'>;
    };

    databases: {
      enabled: boolean;           // Enterprise only
      connectors: Array<'postgres' | 'mysql' | 'mongodb' | 'snowflake'>;
      syncInterval: string;
    };

    apis: {
      enabled: boolean;           // Enterprise only
      authMethods: Array<'api_key' | 'oauth2' | 'basic'>;
      syncInterval: string;
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // PROCESSING - How content is processed
  // ═══════════════════════════════════════════════════════════════════

  processing: {
    chunking: {
      strategy: 'fixed' | 'semantic' | 'hybrid';
      chunkSize: number;          // Default: 512 tokens
      overlap: number;            // Default: 50 tokens
      customizable: boolean;      // Can buyer adjust?
    };

    embedding: {
      model: string;              // 'openai-3-small' | 'openai-3-large' | 'cohere-v3'
      dimensions: number;         // 1536 for OpenAI
      customizable: boolean;      // Enterprise only
    };

    metadata: {
      extractTitles: boolean;
      extractDates: boolean;
      extractAuthors: boolean;
      customFields: boolean;      // Buyer can add metadata
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // RETRIEVAL - How content is searched
  // ═══════════════════════════════════════════════════════════════════

  retrieval: {
    search: {
      method: 'vector' | 'hybrid' | 'keyword';  // hybrid = vector + keyword
      topK: number;               // Default: 5
      customizable: boolean;      // Can buyer adjust topK?
    };

    reranking: {
      enabled: boolean;
      model: string;              // 'cohere-rerank' | 'bge-reranker'
    };

    filtering: {
      byMetadata: boolean;        // Filter by document metadata
      byDate: boolean;            // Filter by document date
      bySource: boolean;          // Filter by source type
    };

    citations: {
      enabled: boolean;           // Show source references
      format: 'inline' | 'footnote' | 'none';
      includeSnippets: boolean;   // Show relevant text excerpts
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // GENERATION - How responses are created
  // ═══════════════════════════════════════════════════════════════════

  generation: {
    model: {
      default: string;            // 'gpt-4o' | 'claude-3.5-sonnet'
      alternatives: string[];     // Available alternatives
      customizable: boolean;      // Can buyer select model?
    };

    context: {
      maxTokens: number;          // Context window for RAG
      includeHistory: boolean;    // Include conversation history
      historyTurns: number;       // How many turns to include
    };

    grounding: {
      strictMode: boolean;        // Only answer from knowledge base
      fallbackBehavior: 'refuse' | 'general' | 'escalate';
      confidenceThreshold: number; // 0.0 - 1.0
    };
  };
}
```

### RAGFlow Integration

**Decision**: We use [RAGFlow](https://github.com/infiniflow/ragflow) as the RAG backend instead of building our own.

RAGFlow is an open-source RAG engine that provides:
- Deep document understanding for complex formats (PDF, Word, Excel, images)
- Template-based intelligent chunking (not just fixed-size)
- Built-in embedding and vector storage
- Citation tracking and visualization
- Python SDK (`ragflow-sdk`) for integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RAGFlow Integration Architecture                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                              CMP Backend                                     ││
│  │                                                                              ││
│  │  marketplace_ai Module                                                       ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │ KnowledgeBase   │  │ KnowledgeDoc    │  │ Views/API       │             ││
│  │  │ Model           │  │ Model           │  │                 │             ││
│  │  │                 │  │                 │  │ • create_kb     │             ││
│  │  │ ragflow_        │  │ ragflow_        │  │ • upload_doc    │             ││
│  │  │ dataset_id ─────┼──┼─document_id ────┼──┼─• query         │             ││
│  │  └─────────────────┘  └─────────────────┘  └────────┬────────┘             ││
│  │                                                     │                       ││
│  └─────────────────────────────────────────────────────┼───────────────────────┘│
│                                                        │                        │
│  ┌─────────────────────────────────────────────────────┼───────────────────────┐│
│  │                         RAGFlow Client Wrapper      │                        ││
│  │                                                     ▼                        ││
│  │  ragflow_client.py                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ RAGFlowClient                                                        │   ││
│  │  │   • create_dataset(name, customer_uuid, ...)                        │   ││
│  │  │   • upload_document(dataset_id, file_content, ...)                  │   ││
│  │  │   • query(dataset_ids, query, top_k, ...)                          │   ││
│  │  │   • create_chat_assistant(name, dataset_ids, ...)                  │   ││
│  │  │                                                                      │   ││
│  │  │ Tenant Isolation: prefix all dataset names with customer/project   │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         RAGFlow Server                                       ││
│  │                                                                              ││
│  │  Deployed as separate service (Docker)                                      ││
│  │  • Dataset management                                                       ││
│  │  • Document parsing & chunking                                              ││
│  │  • Embedding generation                                                     ││
│  │  • Vector storage (Elasticsearch/Infinity)                                  ││
│  │  • Retrieval & reranking                                                    ││
│  │  • Chat assistants                                                          ││
│  │                                                                              ││
│  │  Requirements: Docker >= 24.0.0, 4+ CPU cores, 16GB+ RAM                   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Configuration (Django settings)**:
```python
# RAGFlow integration
RAGFLOW_API_KEY = env("RAGFLOW_API_KEY", default=None)
RAGFLOW_BASE_URL = env("RAGFLOW_BASE_URL", default="http://ragflow:9380")
```

**Tenant Isolation**: All RAGFlow datasets are prefixed with `tenant_{customer_uuid}_{project_uuid}` to ensure multi-tenant isolation at the RAGFlow level.

### RAG Database Schema

```sql
-- ═══════════════════════════════════════════════════════════════════
-- KNOWLEDGE BASES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE knowledge_bases (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_uuid UUID NOT NULL REFERENCES subscriptions(uuid),

    -- Configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rag_config JSONB NOT NULL,      -- RAGCapabilities snapshot

    -- RAGFlow Integration
    ragflow_dataset_id VARCHAR(100),  -- ID in RAGFlow for sync

    -- Stats
    document_count INTEGER DEFAULT 0,
    chunk_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    last_indexed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE knowledge_documents (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_uuid UUID NOT NULL REFERENCES knowledge_bases(uuid),

    -- Source
    source_type VARCHAR(20) NOT NULL,  -- 'upload', 'url', 'qa', 'database', 'api'
    source_url VARCHAR(2048),

    -- File details
    filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    storage_path VARCHAR(500),         -- S3/MinIO path

    -- Content
    raw_content TEXT,

    -- Metadata
    title VARCHAR(500),
    author VARCHAR(255),
    created_date DATE,
    custom_metadata JSONB DEFAULT '{}',

    -- Processing
    processing_status VARCHAR(20) DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- CHUNKS (Vector Storage)
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_uuid UUID NOT NULL REFERENCES knowledge_documents(uuid),
    knowledge_base_uuid UUID NOT NULL,  -- Denormalized for RLS
    subscription_uuid UUID NOT NULL,    -- Denormalized for RLS

    -- Content
    content TEXT NOT NULL,
    content_tokens INTEGER,

    -- Position
    chunk_index INTEGER NOT NULL,
    start_offset INTEGER,
    end_offset INTEGER,

    -- Embedding
    embedding vector(1536),             -- OpenAI dimensions
    embedding_model VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vector search
CREATE INDEX idx_chunks_embedding ON knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_chunks_subscription ON knowledge_chunks(subscription_uuid);
CREATE INDEX idx_chunks_knowledge_base ON knowledge_chunks(knowledge_base_uuid);

-- Row Level Security
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY chunks_isolation ON knowledge_chunks
    USING (subscription_uuid = current_setting('app.subscription_uuid')::UUID);
```

### RAG UI Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Knowledge Base Manager                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Training Status: 3 documents indexed • 1,234 chunks • Last updated 2 hrs ago   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  📤 Add Knowledge                                                            ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │                                                                      │   ││
│  │  │           Drag & drop files or click to browse                      │   ││
│  │  │                                                                      │   ││
│  │  │           Supported: PDF, DOCX, TXT, CSV, MD                        │   ││
│  │  │           Max: 50MB per file, 500MB total                           │   ││
│  │  │                                                                      │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  │  OR                                                                          ││
│  │                                                                              ││
│  │  🌐 Website URL: [https://docs.example.com              ] [Add]              ││
│  │                                                                              ││
│  │  📝 Q&A Pairs:  [Upload CSV]  [Add manually]                                ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  📚 Documents                                            [Search...]        ││
│  │                                                                              ││
│  │  ┌───────────────────────────────────────────────────────────────────────┐ ││
│  │  │ ☑ product-guide.pdf          234 chunks    12.4 MB    ✓ Indexed       │ ││
│  │  │   Uploaded 2 days ago        [Preview] [Reindex] [Delete]             │ ││
│  │  ├───────────────────────────────────────────────────────────────────────┤ ││
│  │  │ ☑ faq.docx                   89 chunks     2.1 MB     ✓ Indexed       │ ││
│  │  │   Uploaded 5 days ago        [Preview] [Reindex] [Delete]             │ ││
│  │  ├───────────────────────────────────────────────────────────────────────┤ ││
│  │  │ ☐ https://docs.example.com   156 chunks    N/A        ⏳ Indexing...  │ ││
│  │  │   Added 10 minutes ago       [View] [Cancel] [Delete]                 │ ││
│  │  └───────────────────────────────────────────────────────────────────────┘ ││
│  │                                                                              ││
│  │  [Delete Selected]                        Showing 3 of 3 documents          ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  🎛️ RAG Settings                                          [Advanced ▼]      ││
│  │                                                                              ││
│  │  Retrieval                                                                   ││
│  │  ├─ Results per query: [5 ▼]                                                ││
│  │  ├─ Search method: [Hybrid (vector + keyword) ▼]                            ││
│  │  └─ Reranking: [Enabled ▼]                                                  ││
│  │                                                                              ││
│  │  Grounding                                                                   ││
│  │  ├─ Strict mode: [Off ▼]  (Only answer from knowledge base)                 ││
│  │  └─ Show citations: [Yes ▼]                                                 ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  🧪 Test Knowledge Base                                                      ││
│  │                                                                              ││
│  │  Ask a question: [What is your return policy?                            ]  ││
│  │                                                                     [Test]  ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ Response:                                                            │   ││
│  │  │                                                                      │   ││
│  │  │ Our return policy allows returns within 30 days of purchase for     │   ││
│  │  │ a full refund. Items must be in original condition. [1]              │   ││
│  │  │                                                                      │   ││
│  │  │ Sources:                                                             │   ││
│  │  │ [1] product-guide.pdf, page 12                                       │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Workflow Engine Architecture

### Langflow Integration

**Decision**: We use [Langflow](https://github.com/langflow-ai/langflow) as the workflow/automation runtime instead of building our own.

Langflow is an open-source, Python-based platform that provides:
- Visual workflow builder (Studio UI)
- Runtime execution of AI-powered workflows
- Agent orchestration and chaining
- Webhook/API triggers
- Backend-only (headless) mode for production
- Model Context Protocol (MCP) support

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Langflow Integration Architecture                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                              CMP Backend                                     ││
│  │                                                                              ││
│  │  marketplace_ai Module                                                       ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │ Workflow Model  │  │ WorkflowRun     │  │ Views/API       │             ││
│  │  │                 │  │ Model           │  │                 │             ││
│  │  │ langflow_       │  │                 │  │ • create_wf     │             ││
│  │  │ flow_id ────────┼──┼─────────────────┼──┼─• run_flow      │             ││
│  │  │                 │  │                 │  │ • get_status    │             ││
│  │  └─────────────────┘  └─────────────────┘  └────────┬────────┘             ││
│  │                                                     │                       ││
│  └─────────────────────────────────────────────────────┼───────────────────────┘│
│                                                        │                        │
│  ┌─────────────────────────────────────────────────────┼───────────────────────┐│
│  │                         Langflow Client Wrapper     │                        ││
│  │                                                     ▼                        ││
│  │  langflow_client.py                                                         ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ LangflowClient                                                       │   ││
│  │  │   • create_flow(name, data, folder_id)                              │   ││
│  │  │   • run_flow(flow_id, input_value, tweaks)                         │   ││
│  │  │   • run_flow_stream(flow_id, input_value) # Streaming               │   ││
│  │  │   • get_or_create_tenant_folder(customer_uuid)                     │   ││
│  │  │                                                                      │   ││
│  │  │ Tenant Isolation: Each tenant gets a folder in Langflow             │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         Langflow Server                                      ││
│  │                                                                              ││
│  │  Two deployment modes:                                                       ││
│  │                                                                              ││
│  │  [Studio Mode]                     [Backend-Only Mode]                       ││
│  │  • Full UI for visual editing      • Headless API server                    ││
│  │  • Used for development            • Used for production                    ││
│  │  • langflow run                    • langflow run --backend-only            ││
│  │                                                                              ││
│  │  API Endpoints:                                                             ││
│  │  • POST /api/v1/run/{flow_id}   - Execute flow                             ││
│  │  • GET  /api/v1/flows/          - List flows                               ││
│  │  • POST /api/v1/flows/          - Create flow                              ││
│  │  • POST /api/v1/build/{id}/flow - Build/compile flow                       ││
│  │                                                                              ││
│  │  Requirements: Python 3.10+, 4GB+ RAM                                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Configuration (Django settings)**:
```python
# Langflow integration
LANGFLOW_API_KEY = env("LANGFLOW_API_KEY", default=None)
LANGFLOW_BASE_URL = env("LANGFLOW_BASE_URL", default="http://langflow:7860")
```

**Tenant Isolation**: Each customer/project gets a dedicated folder in Langflow. Flows are created within these folders to maintain multi-tenant isolation.

### Workflow Overview (Legacy Architecture Reference)

The following diagram shows the conceptual workflow architecture. In practice, this is implemented by Langflow.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            WORKFLOW ENGINE                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                          TRIGGER LAYER                                       ││
│  │                                                                              ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │  Webhook  │  │  Schedule │  │   Event   │  │   Manual  │  │  API Call │ ││
│  │  │  POST/GET │  │  Cron     │  │  Pub/Sub  │  │  Button   │  │  Request  │ ││
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ ││
│  │        │              │              │              │              │        ││
│  │        └──────────────┴──────────────┼──────────────┴──────────────┘        ││
│  │                                      ▼                                      ││
│  │                          ┌───────────────────┐                              ││
│  │                          │   TRIGGER ROUTER  │                              ││
│  │                          │   Validate & Route│                              ││
│  │                          └─────────┬─────────┘                              ││
│  │                                    │                                        ││
│  └────────────────────────────────────┼────────────────────────────────────────┘│
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         EXECUTION ENGINE                                     ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │                     WORKFLOW RUNTIME                                 │   ││
│  │  │                                                                      │   ││
│  │  │   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐      │   ││
│  │  │   │ Step 1  │────▶│ Step 2  │────▶│ Step 3  │────▶│ Step N  │      │   ││
│  │  │   │ Action  │     │Condition│     │  Loop   │     │ Action  │      │   ││
│  │  │   └─────────┘     └─────────┘     └─────────┘     └─────────┘      │   ││
│  │  │                                                                      │   ││
│  │  │   Features:                                                          │   ││
│  │  │   • Parallel execution     • Error handling      • Retry logic      │   ││
│  │  │   • Conditional branching  • Variable passing    • Timeout handling │   ││
│  │  │   • Sub-workflows          • State persistence   • Checkpointing    │   ││
│  │  │                                                                      │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                          ACTION LAYER                                        ││
│  │                                                                              ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │   HTTP    │  │  Database │  │    AI     │  │   Email   │  │  Storage  │ ││
│  │  │  Request  │  │   Query   │  │   Model   │  │   Send    │  │  Upload   │ ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘ ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │   Slack   │  │ Transform │  │  Webhook  │  │   Code    │  │  Custom   │ ││
│  │  │  Message  │  │   Data    │  │  Deliver  │  │  Execute  │  │  Action   │ ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘ ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         MONITORING & LOGGING                                 ││
│  │                                                                              ││
│  │  • Execution logs (per run)              • Performance metrics              ││
│  │  • Error tracking & alerting             • Audit trail                      ││
│  │  • Run history & replay                  • Cost tracking                    ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Capability Schema

```typescript
interface WorkflowCapabilities {
  // ═══════════════════════════════════════════════════════════════════
  // TRIGGERS - What starts the workflow
  // ═══════════════════════════════════════════════════════════════════

  triggers: {
    webhook: {
      enabled: boolean;
      methods: Array<'GET' | 'POST' | 'PUT'>;
      authentication: Array<'none' | 'api_key' | 'signature' | 'basic'>;
      customHeaders: boolean;     // Can define required headers
    };

    schedule: {
      enabled: boolean;
      types: Array<'interval' | 'cron' | 'daily' | 'weekly' | 'monthly'>;
      minInterval: string;        // Minimum interval (e.g., '5m', '1h')
      timezone: boolean;          // Support timezone selection
    };

    event: {
      enabled: boolean;
      sources: Array<'email' | 'slack' | 'webhook' | 'database' | 'file'>;
      filters: boolean;           // Can filter which events trigger
    };

    manual: {
      enabled: boolean;
      parameters: boolean;        // Can pass parameters on manual run
    };

    api: {
      enabled: boolean;
      async: boolean;             // Support async execution
      timeout: number;            // Max execution time
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // FLOW CONTROL - How the workflow executes
  // ═══════════════════════════════════════════════════════════════════

  flow: {
    conditionals: {
      enabled: boolean;
      operators: Array<'equals' | 'contains' | 'greater' | 'less' | 'regex' | 'exists'>;
      nestedConditions: boolean;  // AND/OR nesting
      switchCase: boolean;        // Multiple branches
    };

    loops: {
      enabled: boolean;
      types: Array<'for_each' | 'while' | 'repeat'>;
      maxIterations: number;      // Safety limit
      parallelExecution: boolean; // Process items in parallel
    };

    errorHandling: {
      enabled: boolean;
      strategies: Array<'retry' | 'fallback' | 'continue' | 'fail'>;
      maxRetries: number;
      retryDelay: string;         // Backoff strategy
      customErrorHandlers: boolean;
    };

    subWorkflows: {
      enabled: boolean;
      maxDepth: number;           // Nesting limit
      passingVariables: boolean;  // Pass data to sub-workflow
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // ACTIONS - What the workflow can do
  // ═══════════════════════════════════════════════════════════════════

  actions: {
    http: {
      enabled: boolean;
      methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
      authentication: Array<'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2'>;
      customHeaders: boolean;
      timeout: number;
    };

    database: {
      enabled: boolean;
      operations: Array<'query' | 'insert' | 'update' | 'delete'>;
      connectors: Array<'postgres' | 'mysql' | 'mongodb' | 'redis'>;
    };

    ai: {
      enabled: boolean;
      operations: Array<'chat' | 'completion' | 'embedding' | 'classification'>;
      models: string[];
      streaming: boolean;
    };

    messaging: {
      enabled: boolean;
      channels: Array<'email' | 'slack' | 'teams' | 'sms' | 'webhook'>;
      templates: boolean;
    };

    storage: {
      enabled: boolean;
      operations: Array<'read' | 'write' | 'delete' | 'list'>;
      providers: Array<'s3' | 'gcs' | 'azure' | 'local'>;
    };

    transform: {
      enabled: boolean;
      operations: Array<'map' | 'filter' | 'reduce' | 'merge' | 'split'>;
      jsonPath: boolean;          // JSONPath expressions
      jmespath: boolean;          // JMESPath expressions
      customCode: boolean;        // JavaScript/Python snippets
    };

    code: {
      enabled: boolean;           // Enterprise only
      languages: Array<'javascript' | 'python'>;
      timeout: number;
      sandboxed: boolean;
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // DATA - Variables and secrets
  // ═══════════════════════════════════════════════════════════════════

  data: {
    variables: {
      enabled: boolean;
      types: Array<'string' | 'number' | 'boolean' | 'object' | 'array'>;
      scopes: Array<'workflow' | 'step' | 'global'>;
      expressions: boolean;       // Template expressions {{ var }}
    };

    secrets: {
      enabled: boolean;
      maxSecrets: number;
      encryption: 'aes256' | 'kms';
      rotation: boolean;
    };

    state: {
      persistence: boolean;       // Persist state between runs
      ttl: string;               // State expiration
      maxSize: number;           // KB
    };
  };

  // ═══════════════════════════════════════════════════════════════════
  // MONITORING - Observability
  // ═══════════════════════════════════════════════════════════════════

  monitoring: {
    logging: {
      enabled: boolean;
      level: Array<'debug' | 'info' | 'warn' | 'error'>;
      retention: string;         // How long to keep logs
      export: boolean;           // Export to external system
    };

    metrics: {
      enabled: boolean;
      types: Array<'executions' | 'duration' | 'errors' | 'throughput'>;
    };

    alerts: {
      enabled: boolean;
      conditions: Array<'failure' | 'slow' | 'threshold' | 'anomaly'>;
      channels: Array<'email' | 'slack' | 'webhook' | 'pagerduty'>;
    };

    tracing: {
      enabled: boolean;          // Distributed tracing
      sampling: number;          // Sampling rate 0-100%
    };
  };
}
```

### Workflow Database Schema

```sql
-- ═══════════════════════════════════════════════════════════════════
-- WORKFLOW DEFINITIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE workflows (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_uuid UUID NOT NULL REFERENCES subscriptions(uuid),

    -- Definition
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuration
    workflow_config JSONB NOT NULL,    -- WorkflowCapabilities

    -- Flow Definition (n8n/Langflow format)
    flow_definition JSONB NOT NULL,
    /*
    {
      "nodes": [
        { "id": "trigger_1", "type": "webhook", "config": {...} },
        { "id": "action_1", "type": "http", "config": {...} },
        { "id": "condition_1", "type": "if", "config": {...} }
      ],
      "edges": [
        { "source": "trigger_1", "target": "action_1" },
        { "source": "action_1", "target": "condition_1" }
      ]
    }
    */

    -- Trigger Configuration
    trigger_type VARCHAR(50) NOT NULL,
    trigger_config JSONB,
    /*
    For schedule: { "cron": "0 * * * *", "timezone": "UTC" }
    For webhook: { "path": "/webhook/abc123", "method": "POST", "auth": "signature" }
    */

    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT false,

    -- Stats
    total_runs BIGINT DEFAULT 0,
    successful_runs BIGINT DEFAULT 0,
    failed_runs BIGINT DEFAULT 0,
    last_run_at TIMESTAMPTZ,

    -- Version
    version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- WORKFLOW RUNS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE workflow_runs (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_uuid UUID NOT NULL REFERENCES workflows(uuid),
    subscription_uuid UUID NOT NULL,  -- Denormalized for RLS

    -- Run info
    trigger_type VARCHAR(50) NOT NULL,
    trigger_payload JSONB,

    -- Execution
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, running, completed, failed, cancelled, timeout

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Results
    output JSONB,
    error_message TEXT,
    error_details JSONB,

    -- Cost
    compute_cost DECIMAL(10, 6),
    ai_tokens_used INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_workflow_runs_subscription ON workflow_runs(subscription_uuid, created_at);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_uuid, created_at);

-- ═══════════════════════════════════════════════════════════════════
-- STEP EXECUTIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE workflow_step_executions (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_uuid UUID NOT NULL REFERENCES workflow_runs(uuid),

    -- Step info
    step_id VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    step_name VARCHAR(255),

    -- Execution
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- I/O
    input JSONB,
    output JSONB,

    -- Error
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_step_executions_run ON workflow_step_executions(run_uuid);

-- ═══════════════════════════════════════════════════════════════════
-- WORKFLOW SECRETS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE workflow_secrets (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_uuid UUID NOT NULL REFERENCES subscriptions(uuid),

    -- Secret info
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Encrypted value
    encrypted_value BYTEA NOT NULL,
    encryption_key_id VARCHAR(100),  -- KMS key reference

    -- Usage
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,

    -- Lifecycle
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(subscription_uuid, name)
);

-- ═══════════════════════════════════════════════════════════════════
-- SCHEDULE JOBS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE workflow_schedules (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_uuid UUID NOT NULL REFERENCES workflows(uuid) ON DELETE CASCADE,

    -- Schedule
    schedule_type VARCHAR(20) NOT NULL,  -- cron, interval, daily, weekly, monthly
    cron_expression VARCHAR(100),
    interval_seconds INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- State
    is_active BOOLEAN DEFAULT true,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_next_run ON workflow_schedules(next_run_at) WHERE is_active = true;
```

### Workflow UI Components

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Workflow Editor                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Data Sync Automation                              [Inactive]  [Test] [Activate] │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  TRIGGER                                                                     ││
│  │                                                                              ││
│  │  ⏰ Schedule                                                [Change ▼]       ││
│  │                                                                              ││
│  │  Run every: [1] [hour(s) ▼]                                                 ││
│  │  At minute: [:00 ▼]                                                         ││
│  │  Timezone:  [UTC ▼]                                                         ││
│  │                                                                              ││
│  │  Next run: December 14, 2024 at 3:00 PM UTC                                 ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  WORKFLOW STEPS                                                              ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ 1. Fetch Data from Salesforce                              [Edit ▼] │   ││
│  │  │    HTTP GET • api.salesforce.com/query                              │   ││
│  │  │    Auth: OAuth2 (connected)                                         │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                              │                                              ││
│  │                              ▼                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ 2. Transform Data                                          [Edit ▼] │   ││
│  │  │    Map fields: id → external_id, name → display_name                │   ││
│  │  │    Filter: status = 'active'                                        │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                              │                                              ││
│  │                              ▼                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ 3. Upsert to Database                                      [Edit ▼] │   ││
│  │  │    PostgreSQL • INSERT ... ON CONFLICT UPDATE                       │   ││
│  │  │    Connection: production-db (connected)                            │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                              │                                              ││
│  │                              ▼                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ 4. Send Notification                                       [Edit ▼] │   ││
│  │  │    Slack • #data-ops channel                                        │   ││
│  │  │    Template: "Synced {{ count }} records"                           │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  │  [+ Add Step]                                                               ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  ERROR HANDLING                                                              ││
│  │                                                                              ││
│  │  On failure: [Retry 3 times, then notify ▼]                                 ││
│  │  Retry delay: [30 seconds, exponential backoff ▼]                           ││
│  │  Alert channel: [#data-ops ▼]                                               ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  SECRETS & CONNECTIONS                                                       ││
│  │                                                                              ││
│  │  🔐 SALESFORCE_CLIENT_ID       [Connected ✓]        [Edit] [Test]           ││
│  │  🔐 SALESFORCE_CLIENT_SECRET   [Connected ✓]        [Edit] [Test]           ││
│  │  🔐 DATABASE_URL               [Connected ✓]        [Edit] [Test]           ││
│  │  🔐 SLACK_WEBHOOK              [Connected ✓]        [Edit] [Test]           ││
│  │                                                                              ││
│  │  [+ Add Secret]                                                             ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Run History                                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Filter: [All ▼]  [Last 24 hours ▼]                        [Export] [Refresh]   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Run #1234          ✓ Completed       Dec 14, 2:00 PM       Duration: 12s   │ │
│  │                    4/4 steps         45 records synced                     │ │
│  │                                                           [View Details]   │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │ Run #1233          ✓ Completed       Dec 14, 1:00 PM       Duration: 11s   │ │
│  │                    4/4 steps         42 records synced                     │ │
│  │                                                           [View Details]   │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │ Run #1232          ✗ Failed          Dec 14, 12:00 PM      Duration: 8s    │ │
│  │                    2/4 steps         Error: Connection timeout             │ │
│  │                                                           [View Details]   │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Showing 3 of 156 runs                                [< Previous] [Next >]     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 8: Database Schema

### Core Tables

```sql
-- ═══════════════════════════════════════════════════════════════════
-- PRODUCTS (Universal for all 4 categories)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE products (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Provider
    provider_uuid UUID NOT NULL REFERENCES providers(uuid),

    -- Classification
    category VARCHAR(20) NOT NULL CHECK (category IN ('agent', 'app', 'assistant', 'automation')),
    subcategory VARCHAR(50),
    tags JSONB DEFAULT '[]',

    -- Capabilities (the key schema)
    capabilities JSONB NOT NULL,

    -- Listing
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,

    -- Assets
    logo_url VARCHAR(500),
    screenshots JSONB DEFAULT '[]',
    demo_url VARCHAR(500),
    documentation_url VARCHAR(500),

    -- Runtime definition
    flow_definition JSONB,           -- Langflow/n8n export
    runtime_config JSONB,            -- Resource requirements

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
    published_at TIMESTAMPTZ,

    -- Versioning
    version VARCHAR(20) DEFAULT '1.0.0',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- PLANS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE plans (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_uuid UUID NOT NULL REFERENCES products(uuid),

    -- Plan details
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise', 'custom')),

    -- Pricing
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Limits (populated from capabilities)
    limits JSONB NOT NULL,
    /*
    {
      "messages": 1000,
      "tokens": 100000,
      "apiCalls": 10000,
      "users": 1,
      "storage": "1GB"
    }
    */

    -- Runtime
    runtime_type VARCHAR(20) DEFAULT 'shared' CHECK (runtime_type IN ('shared', 'dedicated')),

    -- Features
    features JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS (Buyer's products)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE subscriptions (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant
    tenant_uuid UUID NOT NULL REFERENCES tenants(uuid),
    project_uuid UUID REFERENCES projects(uuid),

    -- Product & Plan
    product_uuid UUID NOT NULL REFERENCES products(uuid),
    plan_uuid UUID NOT NULL REFERENCES plans(uuid),

    -- Inherited capabilities (snapshot at purchase)
    capabilities JSONB NOT NULL,

    -- Buyer configuration (within allowed capabilities)
    configuration JSONB DEFAULT '{}',
    /*
    {
      "knowledge": { "documents": [...], "qa_pairs": [...] },
      "persona": { "name": "Support Bot", "tone": "friendly", "welcome": "Hi!" },
      "branding": { "primaryColor": "#7c3aed", "logo": "..." },
      "workflow": { "schedule": "0 * * * *", "triggers": [...] }
    }
    */

    -- Runtime
    runtime_config JSONB,
    flow_instance_id VARCHAR(255),      -- Langflow flow ID
    namespace VARCHAR(100),              -- K8s namespace (if dedicated)

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired')),

    -- Billing
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════
-- API KEYS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE api_keys (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_uuid UUID NOT NULL REFERENCES subscriptions(uuid),

    -- Key details
    name VARCHAR(100),
    key_prefix VARCHAR(20) NOT NULL,      -- ar_sk_live_ or ar_sk_test_
    key_hash VARCHAR(64) NOT NULL,        -- SHA256 hash

    -- Permissions
    scopes JSONB DEFAULT '["invoke"]',    -- What the key can do

    -- Rate limiting
    rate_limit_rpm INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- USAGE TRACKING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE usage_records (
    id BIGSERIAL PRIMARY KEY,
    subscription_uuid UUID NOT NULL REFERENCES subscriptions(uuid),
    api_key_uuid UUID REFERENCES api_keys(uuid),

    -- What was used
    metric_type VARCHAR(50) NOT NULL,     -- messages, tokens, api_calls, etc.
    quantity BIGINT NOT NULL,

    -- Context
    metadata JSONB,

    -- When
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL
);

-- Partitioned by month for performance
CREATE INDEX idx_usage_subscription_period ON usage_records(subscription_uuid, period_start);
```

---

## Part 7: End-to-End Architecture and Data Flows

### System Architecture Overview

The CMP platform integrates multiple components to provide a complete marketplace for AI products:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROVIDER TOOLS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Langflow   │    │  RAGFlow    │    │   Other     │    │    CMP      │  │
│  │  (Studio)   │    │  (RAG)      │    │  Services   │    │  (Portal)   │  │
│  │             │    │             │    │             │    │             │  │
│  │ - Visual    │    │ - Document  │    │ - LLM APIs  │    │ - Offering  │  │
│  │   workflow  │    │   ingestion │    │ - Vector DB │    │   mgmt      │  │
│  │   builder   │    │ - Chunking  │    │ - Auth      │    │ - Pricing   │  │
│  │ - Agent     │    │ - Embedding │    │ - Billing   │    │ - Orders    │  │
│  │   design    │    │ - Retrieval │    │   ...       │    │ - Analytics │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED RUNTIME LAYER                                 │
│                    (Multi-Tenant Isolated Execution)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Langflow Runtime Engine                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │  │  Tenant D   │  │  │
│  │  │  (Folder)   │  │  (Folder)   │  │  (Folder)   │  │  (Folder)   │  │  │
│  │  │ - Flows     │  │ - Flows     │  │ - Flows     │  │ - Flows     │  │  │
│  │  │ - Sessions  │  │ - Sessions  │  │ - Sessions  │  │ - Sessions  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      RAGFlow Runtime Engine                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │  │  Tenant D   │  │  │
│  │  │  (Dataset)  │  │  (Dataset)  │  │  (Dataset)  │  │  (Dataset)  │  │  │
│  │  │ - Docs      │  │ - Docs      │  │ - Docs      │  │ - Docs      │  │  │
│  │  │ - Vectors   │  │ - Vectors   │  │ - Vectors   │  │ - Vectors   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUYER TOUCHPOINTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Widget    │    │    API      │    │   Webhook   │    │    CMP      │  │
│  │  (Embed)    │    │  (Direct)   │    │  (Events)   │    │  (Portal)   │  │
│  │ Chat widget │    │ REST/SDK    │    │ Triggers    │    │ Dashboard   │  │
│  │ on buyer's  │    │ calls from  │    │ from buyer  │    │ for usage   │  │
│  │ website     │    │ buyer apps  │    │ systems     │    │ & billing   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Components

| Component | Purpose | Role |
|-----------|---------|------|
| **Langflow Studio** | Visual workflow/agent builder | Design-time tool for providers |
| **Langflow Runtime** | Execute flows and agents | Runtime execution engine |
| **RAGFlow** | Document processing and retrieval | Knowledge backend for RAG |
| **CMP (Waldur)** | Marketplace orchestration | Business logic, billing, access control |

### Data Flow: Design → Purchase → Configure → Execute

```
DESIGN-TIME (Provider creates offering):
─────────────────────────────────────────

  Provider                 Langflow              RAGFlow               CMP
     │                     Studio                   │                   │
     │ 1. Create agent flow   │                     │                   │
     │───────────────────────>│                     │                   │
     │ 2. Add RAG component   │ 3. Create dataset   │                   │
     │───────────────────────>│────────────────────>│                   │
     │ 4. Configure & test    │                     │                   │
     │───────────────────────>│                     │                   │
     │ 5. Publish to marketplace                    │                   │
     │─────────────────────────────────────────────────────────────────>│
     │                        │<────────────────────────6. Store IDs    │


PURCHASE-TIME (Buyer subscribes):
──────────────────────────────────

  Buyer                    CMP                  Langflow              RAGFlow
    │ 1. Browse & order     │                      │                     │
    │──────────────────────>│                      │                     │
    │ 2. Approve order      │ 3. Clone flow        │                     │
    │──────────────────────>│─────────────────────>│                     │
    │                       │ 4. Clone KB          │                     │
    │                       │─────────────────────────────────────────-->│
    │                       │ 5. Return endpoints  │                     │
    │<──────────────────────│                      │                     │


CONFIGURATION-TIME (Buyer customizes):
───────────────────────────────────────

  Buyer                    CMP                  Langflow              RAGFlow
    │ 1. Upload docs        │                      │                     │
    │──────────────────────>│─────────────────────────────────────────-->│
    │ 2. Configure branding │ 3. Update tweaks     │                     │
    │──────────────────────>│─────────────────────>│                     │
    │ 4. Set persona        │ 5. Update prompts    │                     │
    │──────────────────────>│─────────────────────>│                     │


RUNTIME (End-user interacts):
──────────────────────────────

  End User       Widget/API            Langflow              RAGFlow
    │ 1. Ask question         │                     │                     │
    │────────────────────────>│                     │                     │
    │                         │ 2. Execute flow     │                     │
    │                         │────────────────────>│                     │
    │                         │                     │ 3. Retrieve context │
    │                         │                     │────────────────────>│
    │                         │                     │<────────────────────│
    │                         │                     │ 4. Generate response│
    │                         │<────────────────────│                     │
    │ 5. Receive answer       │                     │                     │
    │<────────────────────────│                     │                     │
```

### Multi-Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ISOLATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer              Isolation Mechanism                                     │
│  ─────              ───────────────────                                     │
│                                                                             │
│  CMP (Waldur)       Customer → Project → Resource hierarchy                 │
│                     Row-Level Security via customer_path/project_path       │
│                     API key scoped to resource                              │
│                                                                             │
│  Langflow           Folder-based isolation                                  │
│                     Folder name: tenant_{customer_uuid}_{project_uuid}      │
│                     Flows cloned per subscription                           │
│                     Session IDs scoped to resource                          │
│                                                                             │
│  RAGFlow            Dataset-based isolation                                 │
│                     Dataset name: tenant_{customer_uuid}_{kb_uuid}          │
│                     Vector indices isolated per dataset                     │
│                     No cross-tenant data leakage possible                   │
│                                                                             │
│  Database           Denormalized customer/project on chunks & runs          │
│                     Indexes on tenant fields for efficient RLS queries      │
│                     All queries filtered by tenant context                  │
│                                                                             │
│  Storage            Path-based isolation for uploaded documents             │
│                     knowledge_documents/{year}/{month}/{tenant}/            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Example: "Multimodal Multilingual Customer Support Agent"

This example demonstrates the complete flow for a RAG-enabled, multimodal customer support agent.

#### Provider Creates the Offering

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    LANGFLOW STUDIO (Visual Builder)                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌─────────┐     ┌─────────────┐     ┌──────────────┐                    │
│   │ Chat    │────>│ Language    │────>│ RAG Retriever │                    │
│   │ Input   │     │ Detector    │     │ (Knowledge    │                    │
│   │         │     │             │     │  Base Query)  │                    │
│   └─────────┘     └─────────────┘     └───────┬──────┘                    │
│                                               │                            │
│                         ┌─────────────────────┘                            │
│                         ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                    Prompt Template                               │     │
│   │  ┌──────────────────────────────────────────────────────────┐   │     │
│   │  │ System: You are {persona_name}, a {persona_role}.        │   │     │
│   │  │ Brand: {brand_name} - {brand_tagline}                    │   │     │
│   │  │ Voice: {brand_voice}                                     │   │     │
│   │  │ Language: Respond in {detected_language}                 │   │     │
│   │  │                                                           │   │     │
│   │  │ Context from knowledge base:                              │   │     │
│   │  │ {rag_context}                                             │   │     │
│   │  │                                                           │   │     │
│   │  │ User query: {user_input}                                  │   │     │
│   │  └──────────────────────────────────────────────────────────┘   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                         │                                                  │
│                         ▼                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌─────────┐                   │
│   │ Vision LLM   │────>│ Translation  │────>│ Chat    │                   │
│   │ (GPT-4V)     │     │ (if needed)  │     │ Output  │                   │
│   └──────────────┘     └──────────────┘     └─────────┘                   │
│                                                                            │
│  [Tweakable Parameters - Exposed to Buyer]                                │
│  • persona_name, persona_role, brand_name, brand_tagline, brand_voice     │
│  • supported_languages, knowledge_base_id                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Buyer Configures the Agent

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    CMP BUYER PORTAL - Resource Configuration                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Resource: Multimodal Multilingual Customer Support Agent                  │
│  Status: ● Active                                                          │
│                                                                            │
│  [Overview] [Branding] [Persona] [Knowledge] [Integration]                 │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│  BRANDING                                                                  │
│  ═══════════════════════════════════════════════════════════════════════  │
│  Company Name: [TechCorp Inc.                    ]                         │
│  Tagline:      [Your One-Stop Tech Shop          ]                         │
│  Logo:         [Upload Logo] techcorp-logo.png ✓                           │
│  Voice Style:   ○ Professional  ● Friendly  ○ Casual                       │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│  KNOWLEDGE                                                                 │
│  ═══════════════════════════════════════════════════════════════════════  │
│  Storage Used: 234 MB / 1 GB                                               │
│  Documents: 47  |  Chunks: 2,341  |  Last Indexed: 2 hours ago            │
│                                                                            │
│  [+ Upload Documents]  [+ Add URL]  [+ Add Q&A]                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ Document                          │ Type    │ Status  │ Chunks      │ │
│  ├──────────────────────────────────────────────────────────────────────┤ │
│  │ 📄 Product Catalog 2024.pdf       │ Upload  │ ✓ Ready │ 892         │ │
│  │ 📄 Return Policy.docx             │ Upload  │ ✓ Ready │ 34          │ │
│  │ 🌐 techcorp.com/help              │ URL     │ ✓ Ready │ 1,245       │ │
│  │ ❓ "What's your return policy?"   │ Q&A     │ ✓ Ready │ 1           │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════  │
│  INTEGRATION                                                               │
│  ═══════════════════════════════════════════════════════════════════════  │
│  API Endpoint: https://api.cmp.digitlify.com/v1/agents/res-abc123         │
│  API Key:      sk-techcorp-xxxxxxxxxxxx  [Regenerate] [Copy]              │
│                                                                            │
│  Widget Embed Code:                                                        │
│  <script src="https://widget.cmp.digitlify.com/v1/chat.js"                │
│          data-token="wt-techcorp-yyyyyyyy"                                │
│          data-position="bottom-right">                                    │
│  </script>                                                                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Runtime Execution

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    EXECUTION PIPELINE                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Widget → CMP API Gateway                                               │
│     POST /v1/agents/res-abc123/chat                                        │
│     { "message": "Hola! ¿Es compatible este cargador?", "image": "..." }  │
│                                                                            │
│  2. CMP → Validates & Routes                                               │
│     - Verify token belongs to resource                                     │
│     - Check plan limits (messages remaining)                               │
│     - Load resource config (branding, persona)                             │
│                                                                            │
│  3. CMP → Langflow Runtime                                                 │
│     POST /api/v1/run/{flow-techcorp-001}                                   │
│     { "input_value": "...", "tweaks": { persona, brand, kb_id, image } }  │
│                                                                            │
│  4. Langflow Executes Flow                                                 │
│     4a. Language Detector → Spanish (es)                                   │
│     4b. RAG Retriever → RAGFlow Query for charger compatibility           │
│     4c. Vision LLM → Analyzes image (65W USB-C charger)                   │
│     4d. Prompt Assembly with RAG context + image analysis                 │
│     4e. LLM Generation → Response in Spanish                              │
│                                                                            │
│  5. Response → Widget                                                      │
│     { "response": "¡Hola! El cargador de 65W no es compatible...",        │
│       "citations": [{ "doc": "Product Catalog", "page": 42 }] }           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Journey Maps Remain Unchanged

**Important**: The RAG and Langflow integrations are implementation details that do NOT change the buyer or seller journey maps. Users interact with CMP; the underlying runtime is transparent.

| Journey | User Sees | System Does |
|---------|-----------|-------------|
| **Seller: Design** | "Design in Studio" button | Opens Langflow Studio |
| **Seller: Add RAG** | Drag "Knowledge Base" node | Creates RAGFlow dataset |
| **Buyer: Upload Docs** | "Training" or "Knowledge" section | Processes in RAGFlow |
| **Buyer: Configure** | Branding/Persona forms | Updates Langflow tweaks |
| **End User: Chat** | Chat widget | Executes via Langflow + RAGFlow |

---

## Part 8: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Capability schema finalization
- [ ] Database migrations
- [ ] API endpoints for capabilities
- [ ] Basic adaptive dashboard component

### Phase 2: Seller Journey (Weeks 3-4)

- [ ] Product creation wizard
- [ ] Capability editor UI
- [ ] Flow import (Langflow JSON)
- [ ] Plan configuration
- [ ] Marketplace listing

### Phase 3: Buyer Journey (Weeks 5-6)

- [ ] Adaptive product dashboard
- [ ] Category-specific sections
- [ ] Configuration UIs (knowledge, persona, etc.)
- [ ] Widget configurator with live preview
- [ ] API key management

### Phase 4: Runtime Integration (Weeks 7-8)

- [ ] Shared runtime provisioning
- [ ] API Gateway with tenant isolation
- [ ] Usage metering integration
- [ ] Rate limiting implementation

### Phase 5: Analytics & Polish (Weeks 9-10)

- [ ] Usage analytics dashboard
- [ ] Conversation transcripts (agents)
- [ ] Execution logs (automations)
- [ ] Seller analytics
- [ ] Revenue dashboard

### Phase 6: Enterprise Features (Weeks 11-12)

- [ ] Dedicated runtime provisioning
- [ ] Custom namespace creation
- [ ] SLA monitoring
- [ ] Advanced billing (usage-based)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Seller: Time to first listing | < 30 min | Analytics |
| Buyer: Time to first use | < 5 min | Analytics |
| Configuration completion | > 70% | Feature adoption |
| Widget deployment rate | > 50% | Tracking |
| API key generation rate | > 60% | Tracking |
| User satisfaction | > 4.5/5 | NPS survey |

---

## Related Documents

- [CMP Journey Maps](./CMP-JOURNEY-MAPS.md)
- [CMP UX Improvements](./CMP-UX-IMPROVEMENTS.md)
- [Site-Kit Architecture](./SITE-KIT-ARCHITECTURE.md)
- [PRD Cloud Marketplace Platform](./PRD-CLOUD-MARKETPLACE-PLATFORM.md)

---

*Document maintained by GSV Platform Team*
