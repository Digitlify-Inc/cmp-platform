# GTM Agent Architecture - Capability-Based Configuration

## The Problem

1. **Dify licensing** - Not suitable for SaaS (restrictive enterprise license)
2. **Different agent types need different configurations**
3. **Need multi-tenant isolation with per-tenant knowledge base**
4. **Lightweight chat playground is insufficient for production agents**

## Better OSS Options (MIT/Apache 2.0)

### 1. AnythingLLM (MIT License) - Recommended
- **License**: MIT - fully permissive for SaaS
- **Multi-tenant**: Workspace-based isolation
- **RAG**: Built-in document processing and vector storage
- **Agents**: No-code agent builder
- **API**: Full REST API for integration
- **Self-hosted**: Docker deployment

**GitHub**: https://github.com/Mintplex-Labs/anything-llm

### 2. LLMStack (Check License)
- Multi-tenant by design
- No-code agent builder
- Built-in RAG pipeline
- API access for integration

**GitHub**: https://github.com/trypromptly/LLMStack

### 3. Build Custom with LangChain/LangGraph (Apache 2.0)
- Full control over architecture
- Multi-tenant from ground up
- More development effort but maximum flexibility

## Capability-Based Agent Configuration

### Agent Type Taxonomy

| Type | Capabilities | Config Requirements |
|------|-------------|---------------------|
| **Customer Support** | RAG, Chat, Escalation | Knowledge base, Branding, Widget, Welcome msg, Handoff rules |
| **Research Agent** | Web search, Analysis | Search sources, Output format, Citation style |
| **Topic Assistant** | Chat, Q&A | System prompt, Avatar, Language, Tone |
| **Code Assistant** | Code gen, Explain | Language preferences, Style guide, Repo context |
| **Data Analyst** | SQL, Visualization | Data sources, Permissions, Output formats |

### Configuration Schema

```python
# Backend Model - waldur_mastermind/marketplace_site_agent/models.py

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


class AgentTemplate(models.Model):
    """Pre-defined agent templates with specific capabilities"""
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField()  # 'agents', 'assistants', 'apps', 'automations'

    # Capabilities this template supports
    capabilities = ArrayField(
        models.CharField(max_length=50, choices=AgentCapability.choices)
    )

    # Default configuration schema (JSON Schema)
    config_schema = models.JSONField()

    # Runtime backend
    runtime_type = models.CharField()  # 'anythingllm', 'langchain', 'direct'


class AgentConfig(models.Model):
    """Per-subscription agent configuration"""
    resource = models.OneToOneField('marketplace.Resource', on_delete=models.CASCADE)
    template = models.ForeignKey(AgentTemplate, on_delete=models.PROTECT)

    # User-configured values based on template schema
    config = models.JSONField(default=dict)

    # Runtime references (populated on provisioning)
    runtime_workspace_id = models.CharField(null=True)  # AnythingLLM workspace
    runtime_agent_id = models.CharField(null=True)

    # Branding
    display_name = models.CharField(max_length=255)
    avatar_url = models.URLField(null=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')

    # Widget settings (if capability enabled)
    widget_position = models.CharField(default='bottom-right')
    widget_theme = models.CharField(default='light')
    welcome_message = models.TextField(null=True)

    # Knowledge base (if RAG capability)
    knowledge_base_id = models.CharField(null=True)
```

### Example: Customer Support Agent Template

```json
{
  "name": "Customer Support Agent",
  "category": "agents",
  "capabilities": ["rag", "widget", "escalation", "api"],
  "config_schema": {
    "type": "object",
    "properties": {
      "knowledge_base": {
        "type": "object",
        "title": "Knowledge Base",
        "description": "Train your agent with your documentation",
        "properties": {
          "sources": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": { "enum": ["url", "file", "notion", "confluence"] },
                "value": { "type": "string" }
              }
            }
          },
          "sync_frequency": { "enum": ["manual", "daily", "weekly"] }
        }
      },
      "branding": {
        "type": "object",
        "title": "Branding",
        "properties": {
          "agent_name": { "type": "string", "default": "Support Assistant" },
          "welcome_message": { "type": "string" },
          "primary_color": { "type": "string", "format": "color" },
          "logo_url": { "type": "string", "format": "uri" }
        }
      },
      "behavior": {
        "type": "object",
        "title": "Behavior",
        "properties": {
          "tone": { "enum": ["professional", "friendly", "casual"] },
          "language": { "type": "string", "default": "en" },
          "max_turns_before_escalation": { "type": "integer", "default": 5 }
        }
      },
      "escalation": {
        "type": "object",
        "title": "Human Handoff",
        "properties": {
          "enabled": { "type": "boolean", "default": true },
          "triggers": {
            "type": "array",
            "items": { "type": "string" },
            "default": ["speak to human", "talk to agent", "escalate"]
          },
          "handoff_url": { "type": "string", "format": "uri" }
        }
      },
      "widget": {
        "type": "object",
        "title": "Widget Settings",
        "properties": {
          "position": { "enum": ["bottom-right", "bottom-left"] },
          "theme": { "enum": ["light", "dark", "auto"] },
          "allowed_domains": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### Example: Simple Topic Assistant Template

```json
{
  "name": "Topic Assistant",
  "category": "assistants",
  "capabilities": ["api"],
  "config_schema": {
    "type": "object",
    "properties": {
      "personality": {
        "type": "object",
        "title": "Personality",
        "properties": {
          "name": { "type": "string" },
          "role": { "type": "string", "description": "e.g., 'Python Expert', 'Legal Advisor'" },
          "system_prompt": {
            "type": "string",
            "format": "textarea",
            "description": "Instructions for how the assistant should behave"
          },
          "avatar_url": { "type": "string", "format": "uri" }
        }
      },
      "capabilities": {
        "type": "object",
        "title": "Capabilities",
        "properties": {
          "multimodal": { "type": "boolean", "default": false },
          "languages": {
            "type": "array",
            "items": { "type": "string" },
            "default": ["en"]
          }
        }
      }
    }
  }
}
```

## Runtime Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CMP Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Agent Card   │  │ Config UI    │  │ Chat/Widget  │       │
│  │ (Subscribe)  │  │ (JSON Form)  │  │ (Runtime)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CMP Backend                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Agent Service                                       │    │
│  │  - Template registry                                 │    │
│  │  - Config validation (JSON Schema)                   │    │
│  │  - Runtime provisioning                              │    │
│  │  - Credit deduction                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ AnythingLLM   │  │ LangChain     │  │ Direct LLM    │
│ (Complex)     │  │ (Custom)      │  │ (Simple)      │
│               │  │               │  │               │
│ - RAG         │  │ - Workflows   │  │ - Chat only   │
│ - Multi-doc   │  │ - Tools       │  │ - No RAG      │
│ - Workspace   │  │ - Chains      │  │ - Low latency │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Implementation Plan

### Phase 1: Simple Assistants (Direct LLM)
- System prompt + personality config
- No RAG needed
- Use OpenAI/Anthropic API directly
- Fastest to implement

### Phase 2: Complex Agents (AnythingLLM)
- Deploy AnythingLLM instance
- Create workspace per tenant/subscription
- Upload documents for RAG
- Widget embed code generation

### Phase 3: Custom Agents (LangChain)
- For specialized use cases
- Custom tool integrations
- Workflow orchestration

## Frontend Configuration UI

Using JSON Schema + react-jsonschema-form:

```tsx
// AgentConfigForm.tsx
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const AgentConfigForm = ({ template, config, onSave }) => {
  return (
    <Form
      schema={template.config_schema}
      formData={config}
      validator={validator}
      onSubmit={({ formData }) => onSave(formData)}
      uiSchema={{
        'knowledge_base.sources': {
          'ui:widget': 'FileUploadWidget'
        },
        'branding.primary_color': {
          'ui:widget': 'ColorPickerWidget'
        },
        'personality.system_prompt': {
          'ui:widget': 'textarea',
          'ui:options': { rows: 10 }
        }
      }}
    />
  );
};
```

## Credit Consumption Model

| Capability | Credit Cost | Notes |
|------------|-------------|-------|
| Chat message | 1 credit | Base cost |
| RAG query | 2 credits | Includes embedding lookup |
| Web search | 3 credits | External API cost |
| Image generation | 10 credits | DALL-E/Midjourney |
| File processing | 5 credits | Per document for RAG |

## Next Steps

1. **Decision**: Confirm AnythingLLM as primary runtime for complex agents
2. **Backend**: Create AgentTemplate and AgentConfig models
3. **Frontend**: JSON Schema-based config UI
4. **Runtime**: AnythingLLM Docker deployment
5. **Integration**: CMP ↔ AnythingLLM API

## References

- [AnythingLLM GitHub](https://github.com/Mintplex-Labs/anything-llm) - MIT License
- [LLMStack GitHub](https://github.com/trypromptly/LLMStack)
- [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)
- [LangChain](https://github.com/langchain-ai/langchain) - MIT License
