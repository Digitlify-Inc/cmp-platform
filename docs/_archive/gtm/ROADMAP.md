# GTM Roadmap

**Target Launch:** December 31, 2025  
**Feature Complete:** December 20, 2025  
**Status:** In Progress

---

## Vision

**"Software Factory"** - Build AI Agents like ordering pizza:
1. Pick ingredients (components)
2. Customize (configure)
3. Deploy (publish)
4. Profit (monetize)

---

## Timeline

```
Nov 27 ─────────────────────────────────────────────────────── Dec 31
   │                                                              │
   ▼                                                              ▼
┌──────────┬──────────┬──────────┬──────────┬──────────┐    ┌────────┐
│  Week 1  │  Week 2  │  Week 3  │  Week 4  │  Week 5  │    │ LAUNCH │
│ Platform │  Agent   │   CMP    │ Customer │  Polish  │    │   🚀   │
│Validation│ Registry │Integration│  Ready  │ & Launch │    │        │
└──────────┴──────────┴──────────┴──────────┴──────────┘    └────────┘
```

---

## Week 1: Platform Validation (Nov 27 - Dec 3)

### Goals
- [ ] Validate Kind deployment on MacBook
- [ ] Validate Kind deployment on WSL2/Ubuntu
- [ ] Create devcontainer for development
- [ ] Document multi-OS setup process

### Deliverables
| Item | Status | Owner |
|------|--------|-------|
| MacBook Kind cluster | 🔄 | Platform |
| WSL2 Kind cluster | 🔄 | Platform |
| Devcontainer setup | 🔄 | Platform |
| OS setup docs | 🔄 | Platform |

### Success Criteria
- All services running on both platforms
- Developer can start coding in devcontainer
- No manual intervention after initial setup

---

## Week 2: Agent Registry MVP (Dec 4 - 10)

### Goals
- [ ] Django project scaffold
- [ ] Core data models implemented
- [ ] FastMCP server running
- [ ] Basic provisioning working

### Deliverables
| Item | Status | Owner |
|------|--------|-------|
| Django project structure | ⬜ | Backend |
| AgentTenant, AgentInstance models | ⬜ | Backend |
| MCP server with 3 core tools | ⬜ | Backend |
| Shared provisioning | ⬜ | Backend |
| API key generation | ⬜ | Backend |

### Success Criteria
- Can create tenant via MCP
- Can provision agent to Runtime
- Can generate API key
- Basic E2E flow works

---

## Week 3: CMP Integration (Dec 11 - 17)

### Goals
- [ ] Waldur webhook integration
- [ ] Offering creation automation
- [ ] Subscription workflow
- [ ] Usage tracking

### Deliverables
| Item | Status | Owner |
|------|--------|-------|
| Waldur webhook handler | ⬜ | Backend |
| Auto-create offerings | ⬜ | Backend |
| Order → Provision flow | ⬜ | Backend |
| Usage metering | ⬜ | Backend |
| Billing sync | ⬜ | Backend |

### Success Criteria
- Customer can order agent in CMP
- Order triggers automatic provisioning
- API key delivered to customer
- Usage tracked and visible

---

## Week 4: Customer Ready (Dec 18 - 24)

### Goals
- [ ] Launch agents published
- [ ] Widget/embed ready
- [ ] Customer documentation
- [ ] Demo environment

### Deliverables
| Item | Status | Owner |
|------|--------|-------|
| Customer Support Agent | ⬜ | Product |
| Knowledge Base Agent | ⬜ | Product |
| Lead Qualification Agent | ⬜ | Product |
| Embed widget | ⬜ | Frontend |
| Customer docs | ⬜ | Docs |
| Demo video | ⬜ | Marketing |

### Success Criteria
- 3 agents available in marketplace
- Customer can embed widget
- Documentation complete
- Demo ready to show

---

## Week 5: Polish & Launch (Dec 25 - 31)

### Goals
- [ ] E2E testing complete
- [ ] Bug fixes
- [ ] Performance tuning
- [ ] Soft launch

### Deliverables
| Item | Status | Owner |
|------|--------|-------|
| E2E test suite passing | ⬜ | QA |
| Critical bugs fixed | ⬜ | Dev |
| Load testing | ⬜ | Ops |
| Monitoring dashboards | ⬜ | Ops |
| **Soft Launch** | ⬜ | All |

### Success Criteria
- All E2E tests passing
- No critical bugs
- First customer can complete journey
- Team on-call for issues

---

## Launch Readiness Checklist

### Technical
- [ ] All services healthy
- [ ] TLS certificates valid
- [ ] Database backups working
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

### Product
- [ ] Launch agents published
- [ ] Pricing plans configured
- [ ] Customer journey tested
- [ ] Widget documentation ready

### Operations
- [ ] On-call schedule set
- [ ] Incident response plan
- [ ] Support process defined
- [ ] FAQ prepared

### Marketing
- [ ] Landing page ready
- [ ] Demo video published
- [ ] Social media scheduled
- [ ] Beta user list ready

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Agent Registry delays | High | Medium | MVP scope, parallel work |
| Integration issues | Medium | Medium | Early integration testing |
| Performance issues | Medium | Low | Load testing Week 5 |
| Security concerns | High | Low | Security review Week 4 |

---

## Post-Launch Roadmap (Q1 2026)

### January
- Usage-based billing refinement
- Additional agent templates
- Customer feedback integration

### February
- Dedicated tenancy implementation
- Advanced analytics
- Partner API

### March
- Backstage integration
- Self-service agent creation
- Enterprise features

---

## Success Metrics (Launch Day)

| Metric | Target |
|--------|--------|
| Services uptime | 99.5% |
| E2E tests passing | 100% |
| Launch agents available | 3 |
| Documentation coverage | 90% |
| Critical bugs | 0 |

---

*Updated: November 27, 2025*
