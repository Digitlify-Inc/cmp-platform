# GTM OSS Stack Options for Agents & Assistants

## Overview

For GTM, we need multi-tenant capable platforms that can:
1. Host AI agents/assistants with per-tenant isolation
2. Provide RAG/knowledge base per tenant (vector DB)
3. Support configurable system prompts, branding
4. Expose APIs for integration with CMP
5. **Have SaaS-friendly licensing (MIT/Apache 2.0)**

## License Considerations for SaaS

**Critical**: Many "open source" LLM platforms have restrictive licenses for SaaS use:

| Platform | License | SaaS Friendly? |
|----------|---------|----------------|
| Dify | Apache 2.0 (core) + Proprietary (enterprise) | **No** - Restrictive for commercial SaaS |
| AnythingLLM | **MIT** | **Yes** - Fully permissive |
| Flowise | Apache 2.0 | Yes |
| OpenWebUI | **MIT** | **Yes** - Fully permissive |
| LangChain | MIT | Yes |
| Langflow | MIT (DataStax owned) | Yes, but uncertain future |

## Recommended Options

### 1. AnythingLLM (Recommended for GTM)

**GitHub**: https://github.com/Mintplex-Labs/anything-llm
**License**: **MIT** - Fully permissive for SaaS
**Stars**: 30k+

**Pros**:
- MIT License - no restrictions for commercial SaaS
- Multi-user support with permissions
- Built-in RAG with document processing
- No-code agent builder
- Workspace-based tenant isolation
- Full REST API
- Embeddable chat widget
- Supports all major LLM providers

**Cons**:
- Workspace isolation (not true multi-tenant at database level)
- May need customization for advanced use cases

**Best For**: Customer Support Agents, Knowledge Base Q&A, RAG-based assistants

---

### 2. LLMStack

**GitHub**: https://github.com/trypromptly/LLMStack
**License**: Check LICENSE file (appears permissive)
**Stars**: 8k+

**Pros**:
- Built as multi-tenant from the ground up
- Organizations with user management
- No-code agent builder
- Built-in RAG pipeline
- API access for all apps

**Cons**:
- Smaller community than alternatives
- License needs verification for SaaS use

**Best For**: Organizations needing true multi-tenancy

---

### 3. ~~Dify~~ (NOT Recommended for SaaS)

**GitHub**: https://github.com/langgenius/dify
**License**: Apache 2.0 (core) + **Proprietary enterprise features**

**Why Not Recommended**:
- Enterprise features (needed for production) require commercial license
- License terms restrict SaaS deployment
- Risk of license compliance issues

---

### 4. Custom Build with LangChain/LangGraph

**GitHub**: https://github.com/langchain-ai/langchain
**License**: **MIT** - Fully permissive

**Pros**:
- Complete control over architecture
- True multi-tenant from ground up
- Maximum flexibility
- Large ecosystem of tools

**Cons**:
- Significant development effort
- Need to build RAG, UI, etc.

**Best For**: Custom agents, specialized workflows, maximum control

---

### 5. OpenWebUI (For Simple Assistants)

**GitHub**: https://github.com/open-webui/open-webui
**License**: **MIT** - Fully permissive
**Stars**: 40k+

**Pros**:
- ChatGPT-like interface
- Multi-user support
- RAG capabilities
- Easy deployment

**Cons**:
- More UI-focused than API-first
- Limited agent builder

**Best For**: Simple assistants, internal chat interfaces

---

## GTM Architecture Decision

### Recommended Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CMP Platform                            │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ AnythingLLM   │  │ Custom        │  │ Direct LLM    │
│ (MIT License) │  │ LangChain     │  │ API           │
│               │  │ (MIT License) │  │               │
│ Complex       │  │ Specialized   │  │ Simple        │
│ Agents with   │  │ Workflows     │  │ Assistants    │
│ RAG           │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

### Agent Type → Runtime Mapping

| Agent Type | Runtime | Why |
|------------|---------|-----|
| Customer Support | AnythingLLM | RAG, Knowledge base, Widget |
| Research Agent | LangChain | Web search, Custom tools |
| Topic Assistant | Direct LLM API | Simple, fast, low cost |
| Code Assistant | Direct LLM API | No RAG needed |

## Multi-Tenant Isolation

### AnythingLLM Approach
- Create workspace per subscription
- Documents uploaded to workspace-specific vector store
- API keys scoped to workspace

### CMP Integration
```python
class AgentConfig(models.Model):
    resource = models.ForeignKey('marketplace.Resource')

    # Runtime selection
    runtime_type = models.CharField()  # 'anythingllm', 'langchain', 'direct'

    # AnythingLLM specific
    workspace_slug = models.CharField(null=True)
    workspace_api_key = models.CharField(null=True)

    # LangChain specific
    chain_config = models.JSONField(null=True)

    # Common config
    display_name = models.CharField()
    system_prompt = models.TextField()
    avatar_url = models.URLField(null=True)
```

## Cost Comparison

| Runtime | Infrastructure | LLM Cost | Total (100 users) |
|---------|---------------|----------|-------------------|
| AnythingLLM | ~$50/mo | Usage | ~$100-200/mo |
| Direct LLM | $0 | Usage | ~$50-100/mo |
| Custom LangChain | ~$30/mo | Usage | ~$80-150/mo |

## Implementation Plan

### Phase 1: Simple Assistants (Week 1-2)
- Direct LLM API integration
- System prompt configuration
- Basic chat UI (already built)

### Phase 2: Complex Agents (Week 3-4)
- Deploy AnythingLLM
- Workspace provisioning API
- RAG document upload
- Widget embed code

### Phase 3: Custom Workflows (Week 5+)
- LangChain integration for specialized agents
- Custom tool development

## References

- [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) - MIT License
- [LLMStack](https://github.com/trypromptly/LLMStack)
- [LangChain](https://github.com/langchain-ai/langchain) - MIT License
- [OpenWebUI](https://github.com/open-webui/open-webui) - MIT License

---

**See also**: [GTM-AGENT-ARCHITECTURE.md](./GTM-AGENT-ARCHITECTURE.md) for capability-based configuration details.
