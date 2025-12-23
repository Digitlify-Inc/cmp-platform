# Launch Checklist

Pre-launch verification for December 31, 2025 soft launch.

---

## Current Status (December 5, 2025)

### Infrastructure Ready ✅
- [x] ArgoCD GitOps operational
- [x] Keycloak SSO configured with OIDC clients
- [x] Kyverno security policies active (Audit mode)
- [x] Velero backup/DR operational
- [x] cert-manager and TLS configured
- [x] Traefik ingress operational
- [x] CloudNativePG databases running
- [x] External Secrets Operator configured

### Pending for GTM
- [ ] Sample customer support agent deployed
- [ ] Portal UI content populated
- [ ] Production deployment (Hetzner)
- [ ] Full UAT test suite passed

---

## T-7 Days (December 24)

### Platform Health
- [ ] All services healthy in production
- [ ] TLS certificates valid (>30 days)
- [ ] DNS resolving correctly
- [ ] Load balancer healthy

### Monitoring
- [x] Grafana dashboards configured
- [ ] Prometheus scraping all targets
- [ ] Alert rules active
- [ ] On-call schedule confirmed

### Backups
- [x] Database backups verified (Velero daily/weekly)
- [ ] Backup restore tested
- [x] Backup schedule documented

---

## T-3 Days (December 28)

### E2E Testing
- [ ] Customer signup flow passing
- [ ] Agent subscription flow passing
- [ ] API key generation working
- [ ] Agent API calls working
- [ ] Usage tracking working

### Launch Agents
- [ ] Customer Support Agent deployed
- [ ] Customer Support Agent tested
- [ ] Knowledge Base Agent deployed
- [ ] Knowledge Base Agent tested
- [ ] Lead Qualifier Agent deployed
- [ ] Lead Qualifier Agent tested

### Documentation
- [x] API documentation complete (https://api.dev.gsv.dev/api/docs/)
- [ ] Customer onboarding guide complete
- [ ] Widget integration guide complete
- [ ] FAQ published

---

## T-1 Day (December 30)

### Final Checks
- [ ] All E2E tests green
- [ ] No critical bugs open
- [ ] Performance acceptable (<3s response)
- [x] Security policies active (Kyverno Audit mode)

### Operations
- [ ] Runbook reviewed
- [ ] Incident response plan ready
- [ ] Support process documented
- [ ] Team briefed

### Marketing
- [ ] Landing page live
- [ ] Demo video ready
- [ ] Social media scheduled
- [ ] Beta users notified

---

## Launch Day (December 31)

### Morning (09:00)
- [ ] System health check
- [ ] Final E2E test run
- [ ] Team standup

### Launch (12:00)
- [ ] Remove beta gates
- [ ] Enable public signup
- [ ] Post launch announcement
- [ ] Monitor metrics

### Afternoon (15:00)
- [ ] Check first signups
- [ ] Monitor error rates
- [ ] Respond to issues

### Evening (18:00)
- [ ] Day 1 summary
- [ ] Issue triage
- [ ] On-call handoff

---

## Post-Launch (Week 1)

### Day 1-2
- [ ] Monitor closely
- [ ] Fix critical issues
- [ ] Respond to feedback

### Day 3-5
- [ ] First user interviews
- [ ] Performance review
- [ ] Bug triage

### Day 6-7
- [ ] Week 1 retrospective
- [ ] Prioritize improvements
- [ ] Plan Week 2

---

## Rollback Plan

### Triggers
- Error rate > 10%
- Platform unresponsive
- Data corruption detected
- Security incident

### Steps
1. Announce maintenance mode
2. Disable new signups
3. Identify failing component
4. Rollback via ArgoCD
5. Verify restoration
6. Announce recovery

### Commands
```bash
# Quick rollback
argocd app rollback <app-name> <revision>

# Full platform rollback
argocd app sync platform-root --revision <last-good-commit>

# Check sync status
argocd app list

# Velero restore (if needed)
velero restore create --from-backup <backup-name>
```

---

## Quick Access

### Service URLs (Dev Environment)
| Service | URL |
|---------|-----|
| ArgoCD | https://argocd.dev.gsv.dev |
| Keycloak SSO | https://sso.dev.gsv.dev |
| Agent Registry API | https://api.dev.gsv.dev |
| AgentStudio | https://studio.dev.gsv.dev |
| AgentRuntime | https://runtime.dev.gsv.dev |
| Portal (CMP) | https://portal.dev.gsv.dev |
| Backstage IDP | https://idp.dev.gsv.dev |
| Grafana | https://grafana.dev.gsv.dev |
| Website | https://dev.gsv.dev |

### Credentials
| Service | Username | Password |
|---------|----------|----------|
| CMP | admin | AdminPass123 |
| Keycloak User | admin | Admin123! |
| ArgoCD | admin | `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' \| base64 -d` |

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Platform Lead | TBD | 24/7 Dec 31 - Jan 2 |
| Backend Lead | TBD | On-call |
| Support Lead | TBD | 09:00-21:00 |

---

## Success Criteria

### Day 1
| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Critical bugs | 0 |
| Sign-ups | 1+ |
| API calls | 10+ |

### Week 1
| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Active users | 5+ |
| API calls | 100+ |
| NPS (if surveyed) | >0 |

---

*Last Updated: December 5, 2025*
