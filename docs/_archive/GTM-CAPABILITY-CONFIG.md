# GTM Capability-Driven Configuration

## Overview

This document defines the capability-driven configuration system for the CMP Agent Marketplace. Each offering type has different capabilities that determine what configuration options are available to buyers.

## Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPABILITY-DRIVEN ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Offering                                                        │
│     │                                                            │
│     ├── Capabilities[] ─────────────────────────────────────┐   │
│     │   ├── rag           → Knowledge Base Config           │   │
│     │   ├── widget        → Widget Config                   │   │
│     │   ├── api           → API Keys Config                 │   │
│     │   ├── escalation    → Human Handoff Config            │   │
│     │   ├── web_search    → Search Sources Config           │   │
│     │   ├── image_gen     → Image Generation Config         │   │
│     │   └── voice         → Voice Config                    │   │
│     │                                                            │
│     └── Config Schema (JSON Schema) ◄───────────────────────┘   │
│            │                                                     │
│            ▼                                                     │
│     Buyer Configuration Form (react-jsonschema-form)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Capability Registry

### Core Capabilities

| Capability | ID | Description | Runtime | Config Required |
|------------|-----|-------------|---------|-----------------|
| Knowledge Base | `rag` | Train with documents | Ragflow | Yes |
| Embeddable Widget | `widget` | Website chat widget | CMP Widget SDK | Yes |
| API Access | `api` | REST API integration | CMP Gateway | Yes |
| Human Handoff | `escalation` | Route to human support | Webhook | Yes |
| Web Search | `web_search` | Search internet | Langflow + Search API | Optional |
| Image Generation | `image_gen` | Generate images | DALL-E/Midjourney | Optional |
| Voice I/O | `voice` | Speech-to-text, TTS | Whisper/ElevenLabs | Optional |
| File Upload | `file_upload` | Accept file inputs | CMP Storage | Optional |
| Code Execution | `code_exec` | Run code snippets | Sandbox | Optional |

### Capability Dependencies

```
rag         → Requires Ragflow collection
widget      → Requires rag OR api
escalation  → Requires webhook URL
web_search  → Requires search API credentials
image_gen   → Requires DALL-E/Midjourney API key
voice       → Requires Whisper + TTS API keys
code_exec   → Requires sandbox environment
```

## Configuration Schemas by Capability

### RAG (Knowledge Base)

```json
{
  "capability": "rag",
  "schema": {
    "type": "object",
    "title": "Knowledge Base",
    "description": "Train your agent with your documentation",
    "properties": {
      "sources": {
        "type": "array",
        "title": "Document Sources",
        "items": {
          "type": "object",
          "oneOf": [
            {
              "type": "object",
              "title": "URL",
              "properties": {
                "type": { "const": "url" },
                "url": { "type": "string", "format": "uri" },
                "crawl_depth": { "type": "integer", "default": 1, "minimum": 1, "maximum": 3 }
              },
              "required": ["type", "url"]
            },
            {
              "type": "object",
              "title": "File Upload",
              "properties": {
                "type": { "const": "file" },
                "file_id": { "type": "string" },
                "filename": { "type": "string" }
              },
              "required": ["type", "file_id"]
            },
            {
              "type": "object",
              "title": "Notion",
              "properties": {
                "type": { "const": "notion" },
                "workspace_id": { "type": "string" },
                "page_ids": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["type", "workspace_id"]
            },
            {
              "type": "object",
              "title": "Confluence",
              "properties": {
                "type": { "const": "confluence" },
                "site_url": { "type": "string", "format": "uri" },
                "space_key": { "type": "string" }
              },
              "required": ["type", "site_url", "space_key"]
            }
          ]
        }
      },
      "sync_frequency": {
        "type": "string",
        "title": "Sync Frequency",
        "enum": ["manual", "daily", "weekly"],
        "default": "manual"
      },
      "chunk_size": {
        "type": "integer",
        "title": "Chunk Size",
        "default": 512,
        "minimum": 256,
        "maximum": 2048
      },
      "chunk_overlap": {
        "type": "integer",
        "title": "Chunk Overlap",
        "default": 50,
        "minimum": 0,
        "maximum": 200
      }
    }
  },
  "ui_schema": {
    "sources": {
      "ui:widget": "DocumentSourcesWidget",
      "ui:options": {
        "orderable": true,
        "addable": true,
        "removable": true
      }
    },
    "chunk_size": {
      "ui:widget": "range",
      "ui:options": { "showLabel": true }
    }
  }
}
```

### Widget (Embeddable Chat)

```json
{
  "capability": "widget",
  "schema": {
    "type": "object",
    "title": "Widget Settings",
    "properties": {
      "position": {
        "type": "string",
        "title": "Position",
        "enum": ["bottom-right", "bottom-left"],
        "default": "bottom-right"
      },
      "theme": {
        "type": "string",
        "title": "Theme",
        "enum": ["light", "dark", "auto"],
        "default": "light"
      },
      "size": {
        "type": "string",
        "title": "Size",
        "enum": ["small", "medium", "large"],
        "default": "medium"
      },
      "allowed_domains": {
        "type": "array",
        "title": "Allowed Domains",
        "description": "Domains where widget can be embedded",
        "items": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9][a-zA-Z0-9-_.]*\\.[a-zA-Z]{2,}$"
        },
        "minItems": 1
      },
      "trigger": {
        "type": "object",
        "title": "Trigger Button",
        "properties": {
          "show_on_mobile": { "type": "boolean", "default": true },
          "delay_seconds": { "type": "integer", "default": 0, "minimum": 0, "maximum": 60 },
          "custom_icon_url": { "type": "string", "format": "uri" }
        }
      },
      "header": {
        "type": "object",
        "title": "Header",
        "properties": {
          "show_avatar": { "type": "boolean", "default": true },
          "show_status": { "type": "boolean", "default": true }
        }
      }
    },
    "required": ["position", "theme", "allowed_domains"]
  },
  "ui_schema": {
    "allowed_domains": {
      "ui:widget": "DomainListWidget",
      "ui:options": {
        "addButtonText": "Add Domain"
      }
    }
  }
}
```

### API Access

```json
{
  "capability": "api",
  "schema": {
    "type": "object",
    "title": "API Settings",
    "properties": {
      "keys": {
        "type": "array",
        "title": "API Keys",
        "readOnly": true,
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "key": { "type": "string" },
            "created_at": { "type": "string", "format": "date-time" },
            "last_used": { "type": "string", "format": "date-time" },
            "permissions": {
              "type": "array",
              "items": { "type": "string", "enum": ["chat", "upload", "config"] }
            }
          }
        }
      },
      "rate_limit": {
        "type": "object",
        "title": "Rate Limiting",
        "properties": {
          "requests_per_minute": { "type": "integer", "default": 60 },
          "requests_per_day": { "type": "integer", "default": 10000 }
        }
      },
      "ip_whitelist": {
        "type": "array",
        "title": "IP Whitelist (Optional)",
        "description": "Leave empty to allow all IPs",
        "items": {
          "type": "string",
          "pattern": "^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}(?:/[0-9]{1,2})?$"
        }
      }
    }
  },
  "ui_schema": {
    "keys": {
      "ui:widget": "ApiKeysWidget",
      "ui:options": {
        "showCreateButton": true,
        "showRevokeButton": true
      }
    }
  }
}
```

### Human Handoff (Escalation)

```json
{
  "capability": "escalation",
  "schema": {
    "type": "object",
    "title": "Human Handoff",
    "properties": {
      "enabled": {
        "type": "boolean",
        "title": "Enable Human Handoff",
        "default": true
      },
      "triggers": {
        "type": "object",
        "title": "Trigger Conditions",
        "properties": {
          "keywords": {
            "type": "array",
            "title": "Trigger Keywords",
            "description": "Phrases that trigger handoff",
            "items": { "type": "string" },
            "default": ["speak to human", "talk to agent", "escalate", "help desk"]
          },
          "unanswered_threshold": {
            "type": "integer",
            "title": "Unanswered Questions Threshold",
            "description": "Escalate after N consecutive 'I don't know' responses",
            "default": 3,
            "minimum": 1,
            "maximum": 10
          },
          "sentiment_negative": {
            "type": "boolean",
            "title": "Escalate on Negative Sentiment",
            "default": true
          },
          "explicit_request": {
            "type": "boolean",
            "title": "Allow User to Request Human",
            "default": true
          }
        }
      },
      "handoff_config": {
        "type": "object",
        "title": "Handoff Configuration",
        "properties": {
          "method": {
            "type": "string",
            "title": "Handoff Method",
            "enum": ["webhook", "email", "zendesk", "intercom", "freshdesk"],
            "default": "webhook"
          },
          "webhook_url": {
            "type": "string",
            "format": "uri",
            "title": "Webhook URL"
          },
          "email": {
            "type": "string",
            "format": "email",
            "title": "Email Address"
          },
          "zendesk_subdomain": {
            "type": "string",
            "title": "Zendesk Subdomain"
          },
          "include_transcript": {
            "type": "boolean",
            "title": "Include Chat Transcript",
            "default": true
          }
        }
      },
      "fallback_message": {
        "type": "string",
        "title": "Fallback Message",
        "default": "I'm connecting you with a human agent. Please hold on...",
        "maxLength": 500
      }
    }
  },
  "ui_schema": {
    "triggers.keywords": {
      "ui:widget": "TagsWidget"
    },
    "handoff_config": {
      "ui:widget": "ConditionalWidget",
      "ui:options": {
        "showFields": {
          "webhook": ["webhook_url", "include_transcript"],
          "email": ["email", "include_transcript"],
          "zendesk": ["zendesk_subdomain", "include_transcript"]
        }
      }
    }
  }
}
```

### Branding (Universal)

All offerings have branding capability:

```json
{
  "capability": "branding",
  "schema": {
    "type": "object",
    "title": "Branding",
    "properties": {
      "agent_name": {
        "type": "string",
        "title": "Agent Name",
        "default": "Assistant",
        "maxLength": 50
      },
      "avatar": {
        "type": "object",
        "title": "Avatar",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["default", "upload", "url"],
            "default": "default"
          },
          "url": {
            "type": "string",
            "format": "uri"
          }
        }
      },
      "colors": {
        "type": "object",
        "title": "Colors",
        "properties": {
          "primary": {
            "type": "string",
            "title": "Primary Color",
            "default": "#3B82F6",
            "pattern": "^#[0-9A-Fa-f]{6}$"
          },
          "secondary": {
            "type": "string",
            "title": "Secondary Color",
            "default": "#1E40AF",
            "pattern": "^#[0-9A-Fa-f]{6}$"
          }
        }
      },
      "welcome_message": {
        "type": "string",
        "title": "Welcome Message",
        "default": "Hi! How can I help you today?",
        "maxLength": 500
      },
      "placeholder_text": {
        "type": "string",
        "title": "Input Placeholder",
        "default": "Type your message...",
        "maxLength": 100
      }
    }
  },
  "ui_schema": {
    "colors.primary": {
      "ui:widget": "ColorPickerWidget"
    },
    "colors.secondary": {
      "ui:widget": "ColorPickerWidget"
    },
    "avatar": {
      "ui:widget": "AvatarUploadWidget"
    },
    "welcome_message": {
      "ui:widget": "textarea",
      "ui:options": { "rows": 3 }
    }
  }
}
```

### Behavior (Universal)

```json
{
  "capability": "behavior",
  "schema": {
    "type": "object",
    "title": "Behavior",
    "properties": {
      "tone": {
        "type": "string",
        "title": "Tone",
        "enum": ["professional", "friendly", "casual", "formal"],
        "default": "professional"
      },
      "language": {
        "type": "string",
        "title": "Primary Language",
        "enum": ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi"],
        "default": "en"
      },
      "multilingual": {
        "type": "boolean",
        "title": "Auto-detect Language",
        "default": false
      },
      "response_length": {
        "type": "string",
        "title": "Response Length",
        "enum": ["concise", "balanced", "detailed"],
        "default": "balanced"
      },
      "creativity": {
        "type": "number",
        "title": "Creativity (Temperature)",
        "default": 0.7,
        "minimum": 0,
        "maximum": 1
      },
      "system_prompt_override": {
        "type": "string",
        "title": "Additional Instructions",
        "description": "Custom instructions to append to the system prompt",
        "maxLength": 2000
      }
    }
  },
  "ui_schema": {
    "creativity": {
      "ui:widget": "range",
      "ui:options": {
        "showLabel": true,
        "labels": { "0": "Precise", "0.5": "Balanced", "1": "Creative" }
      }
    },
    "system_prompt_override": {
      "ui:widget": "textarea",
      "ui:options": { "rows": 5 }
    }
  }
}
```

## Offering Templates

### Customer Support Agent

```json
{
  "template_id": "customer-support-agent",
  "name": "Customer Support Agent",
  "category": "agents",
  "capabilities": ["rag", "widget", "api", "escalation"],
  "default_capabilities": ["rag", "widget", "api"],
  "langflow_flow_id": "customer-support-v1",
  "credit_costs": {
    "chat_message": 2,
    "document_upload": 5,
    "escalation": 0
  },
  "config_schema": {
    "$ref": "#/definitions/merged_schema",
    "definitions": {
      "merged_schema": {
        "allOf": [
          { "$ref": "capability:branding" },
          { "$ref": "capability:behavior" },
          { "$ref": "capability:rag" },
          { "$ref": "capability:widget" },
          { "$ref": "capability:api" },
          { "$ref": "capability:escalation" }
        ]
      }
    }
  }
}
```

### Research Agent

```json
{
  "template_id": "research-agent",
  "name": "Research Agent",
  "category": "agents",
  "capabilities": ["web_search", "api", "file_upload"],
  "default_capabilities": ["web_search", "api"],
  "langflow_flow_id": "research-agent-v1",
  "credit_costs": {
    "chat_message": 3,
    "web_search": 2,
    "file_analysis": 5
  },
  "config_schema": {
    "allOf": [
      { "$ref": "capability:branding" },
      { "$ref": "capability:behavior" },
      {
        "type": "object",
        "title": "Search Settings",
        "properties": {
          "search_sources": {
            "type": "array",
            "title": "Search Sources",
            "items": {
              "type": "string",
              "enum": ["google", "bing", "duckduckgo", "arxiv", "pubmed", "wikipedia"]
            },
            "default": ["google", "wikipedia"]
          },
          "max_results": {
            "type": "integer",
            "title": "Max Results per Search",
            "default": 5,
            "minimum": 1,
            "maximum": 20
          },
          "include_citations": {
            "type": "boolean",
            "title": "Include Source Citations",
            "default": true
          },
          "output_format": {
            "type": "string",
            "title": "Output Format",
            "enum": ["summary", "detailed", "bullet_points", "report"],
            "default": "summary"
          }
        }
      },
      { "$ref": "capability:api" }
    ]
  }
}
```

### Topic Assistant

```json
{
  "template_id": "topic-assistant",
  "name": "Topic Assistant",
  "category": "assistants",
  "capabilities": ["api"],
  "default_capabilities": ["api"],
  "langflow_flow_id": "topic-assistant-v1",
  "credit_costs": {
    "chat_message": 1
  },
  "config_schema": {
    "allOf": [
      { "$ref": "capability:branding" },
      { "$ref": "capability:behavior" },
      {
        "type": "object",
        "title": "Assistant Configuration",
        "properties": {
          "role": {
            "type": "string",
            "title": "Role / Expertise",
            "description": "e.g., 'Python Expert', 'Legal Advisor', 'Marketing Coach'",
            "maxLength": 100
          },
          "system_prompt": {
            "type": "string",
            "title": "System Prompt",
            "description": "Instructions for how the assistant should behave",
            "maxLength": 4000
          },
          "example_questions": {
            "type": "array",
            "title": "Example Questions",
            "description": "Shown to users as conversation starters",
            "items": { "type": "string", "maxLength": 200 },
            "maxItems": 5
          }
        },
        "required": ["role", "system_prompt"]
      },
      { "$ref": "capability:api" }
    ]
  }
}
```

### Code Assistant

```json
{
  "template_id": "code-assistant",
  "name": "Code Assistant",
  "category": "assistants",
  "capabilities": ["api", "code_exec"],
  "default_capabilities": ["api"],
  "langflow_flow_id": "code-assistant-v1",
  "credit_costs": {
    "chat_message": 2,
    "code_execution": 3
  },
  "config_schema": {
    "allOf": [
      { "$ref": "capability:branding" },
      { "$ref": "capability:behavior" },
      {
        "type": "object",
        "title": "Code Settings",
        "properties": {
          "languages": {
            "type": "array",
            "title": "Programming Languages",
            "items": {
              "type": "string",
              "enum": ["python", "javascript", "typescript", "java", "go", "rust", "cpp", "csharp"]
            },
            "default": ["python", "javascript"]
          },
          "style_guide": {
            "type": "string",
            "title": "Style Guide",
            "enum": ["none", "pep8", "google", "airbnb", "standard"],
            "default": "none"
          },
          "include_tests": {
            "type": "boolean",
            "title": "Include Unit Tests",
            "default": false
          },
          "include_docs": {
            "type": "boolean",
            "title": "Include Documentation",
            "default": true
          },
          "repository_context": {
            "type": "object",
            "title": "Repository Context (Optional)",
            "properties": {
              "github_repo": { "type": "string", "pattern": "^[a-zA-Z0-9-]+/[a-zA-Z0-9-_.]+$" },
              "branch": { "type": "string", "default": "main" }
            }
          }
        }
      },
      { "$ref": "capability:api" }
    ]
  }
}
```

## Backend Models

```python
# waldur_mastermind/marketplace_site_agent/models.py

class AgentCapability(models.TextChoices):
    RAG = 'rag', 'Knowledge Base / RAG'
    WEB_SEARCH = 'web_search', 'Web Search'
    CODE_EXECUTION = 'code_exec', 'Code Execution'
    FILE_UPLOAD = 'file_upload', 'File Upload'
    IMAGE_GENERATION = 'image_gen', 'Image Generation'
    VOICE = 'voice', 'Voice Input/Output'
    WIDGET = 'widget', 'Embeddable Widget'
    API = 'api', 'API Access'
    ESCALATION = 'escalation', 'Human Handoff'


class OfferingTemplate(models.Model):
    """Pre-defined templates with specific capabilities."""

    template_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=[
        ('agents', 'Agents'),
        ('apps', 'Apps'),
        ('assistants', 'Assistants'),
        ('automations', 'Automations'),
    ])

    # Available capabilities for this template
    capabilities = ArrayField(
        models.CharField(max_length=50, choices=AgentCapability.choices),
        default=list
    )

    # Capabilities enabled by default
    default_capabilities = ArrayField(
        models.CharField(max_length=50, choices=AgentCapability.choices),
        default=list
    )

    # Langflow flow to use
    langflow_flow_id = models.CharField(max_length=255)

    # JSON Schema for configuration
    config_schema = models.JSONField(default=dict)

    # Credit costs per action
    credit_costs = models.JSONField(default=dict)

    # Runtime type (shared/dedicated options)
    supports_dedicated_runtime = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AgentConfig(models.Model):
    """Per-subscription agent configuration."""

    resource = models.OneToOneField(
        'marketplace.Resource',
        on_delete=models.CASCADE,
        related_name='agent_config'
    )

    template = models.ForeignKey(
        OfferingTemplate,
        on_delete=models.PROTECT,
        related_name='configs'
    )

    # Enabled capabilities (subset of template.capabilities)
    enabled_capabilities = ArrayField(
        models.CharField(max_length=50, choices=AgentCapability.choices),
        default=list
    )

    # Buyer's configuration values
    config = models.JSONField(default=dict)

    # Runtime references
    runtime_type = models.CharField(
        max_length=20,
        choices=[('shared', 'Shared'), ('dedicated', 'Dedicated')],
        default='shared'
    )
    langflow_workspace_id = models.CharField(max_length=255, null=True, blank=True)
    ragflow_collection_id = models.CharField(max_length=255, null=True, blank=True)

    # API access
    api_keys = models.JSONField(default=list)

    # Status
    is_configured = models.BooleanField(default=False)
    last_configured_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def validate_config(self):
        """Validate config against template schema."""
        from jsonschema import validate, ValidationError
        try:
            validate(self.config, self.template.config_schema)
            return True, None
        except ValidationError as e:
            return False, str(e)

    def get_credit_cost(self, action: str) -> int:
        """Get credit cost for an action."""
        return self.template.credit_costs.get(action, 1)
```

## Frontend Configuration UI

```tsx
// src/customer/agents/AgentConfigForm.tsx

import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { ColorPickerWidget } from './widgets/ColorPickerWidget';
import { DocumentSourcesWidget } from './widgets/DocumentSourcesWidget';
import { ApiKeysWidget } from './widgets/ApiKeysWidget';
import { DomainListWidget } from './widgets/DomainListWidget';

const widgets = {
  ColorPickerWidget,
  DocumentSourcesWidget,
  ApiKeysWidget,
  DomainListWidget,
  TagsWidget,
  AvatarUploadWidget,
};

interface AgentConfigFormProps {
  template: OfferingTemplate;
  config: AgentConfigData;
  enabledCapabilities: string[];
  onSave: (config: AgentConfigData) => Promise<void>;
  onCapabilityToggle: (capability: string, enabled: boolean) => void;
}

export const AgentConfigForm: FC<AgentConfigFormProps> = ({
  template,
  config,
  enabledCapabilities,
  onSave,
  onCapabilityToggle,
}) => {
  // Filter schema to only show enabled capabilities
  const filteredSchema = useMemo(() => {
    return filterSchemaByCapabilities(template.config_schema, enabledCapabilities);
  }, [template.config_schema, enabledCapabilities]);

  return (
    <div className="agent-config-form">
      {/* Capability toggles */}
      <Card className="mb-4">
        <Card.Header>
          <Card.Title>Capabilities</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="capability-toggles">
            {template.capabilities.map((capability) => (
              <Form.Check
                key={capability}
                type="switch"
                id={`capability-${capability}`}
                label={getCapabilityLabel(capability)}
                checked={enabledCapabilities.includes(capability)}
                onChange={(e) => onCapabilityToggle(capability, e.target.checked)}
                disabled={template.default_capabilities.includes(capability)}
              />
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Configuration form */}
      <Form
        schema={filteredSchema}
        uiSchema={template.ui_schema}
        formData={config}
        validator={validator}
        widgets={widgets}
        onSubmit={({ formData }) => onSave(formData)}
      >
        <Button type="submit" variant="primary">
          Save Configuration
        </Button>
      </Form>
    </div>
  );
};
```

## Configuration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. SUBSCRIPTION CREATED                                          │
│    → AgentConfig created with template.default_capabilities      │
│    → Langflow workspace provisioned                              │
│    → Ragflow collection created (if rag capability)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. BUYER OPENS CONFIGURE PAGE                                    │
│    → Loads template.config_schema                                │
│    → Filters by enabled_capabilities                             │
│    → Renders form with react-jsonschema-form                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. BUYER CONFIGURES                                              │
│    → Uploads documents (if rag)                                  │
│    → Sets branding options                                       │
│    → Configures behavior                                         │
│    → Sets up widget/API                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. SAVE CONFIGURATION                                            │
│    → Validate against schema                                     │
│    → Update AgentConfig.config                                   │
│    → Sync to Langflow (update workspace variables)               │
│    → Sync to Ragflow (if documents changed)                      │
│    → Mark is_configured = True                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. READY TO USE                                                  │
│    → Widget code available                                       │
│    → API keys can be created                                     │
│    → Agent responds with buyer's configuration                   │
└─────────────────────────────────────────────────────────────────┘
```

## Related Documents

- [GTM-BUYER-JOURNEY.md](./GTM-BUYER-JOURNEY.md) - Buyer journey
- [GTM-SELLER-JOURNEY.md](./GTM-SELLER-JOURNEY.md) - Seller journey
- [GTM-TENANT-ISOLATION.md](./GTM-TENANT-ISOLATION.md) - Multi-tenant architecture
