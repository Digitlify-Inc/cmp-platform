# GitHub Actions Optimization Report

**Date:** December 16, 2025
**Issue:** 6,000+ GitHub Actions minutes consumed in 2 weeks (~$48)
**Target:** Reduce by 50-70%

---

## Usage Analysis

### GSVDEV Organization ($23.79 consumed)

| Repository | Cost | Issues Found |
|------------|------|--------------|
| gsv-gitops | $16.68 | Broad path filters (`**/*.yaml`), missing concurrency |
| gsv-agentregistry | $5.48 | Deprecated repo still running CI |
| gsv-idp-dev | $0.77 | Reasonable |
| gsv-idp-test | $0.67 | Reasonable |
| gsv-website | $0.19 | Missing path filters, no concurrency |

### Digitlify-Inc Organization ($24.13 consumed)

| Repository | Cost | Issues Found |
|------------|------|--------------|
| cmp-frontend | $10.45 | Expected (most active repo) |
| cmp-studio | $6.09 | 37 workflows from Langflow upstream, many unnecessary |
| cmp-runtime | $4.55 | 37 workflows from Langflow upstream, many unnecessary |
| cmp-backend | $1.36 | Reasonable |
| idp-dev | $0.62 | Reasonable |

---

## Changes Made

### 1. gsv-gitops/lint.yaml

**Before:**
```yaml
paths:
  - '**/*.yaml'   # PROBLEM: Triggers on ANY yaml file
  - '**/*.yml'
```

**After:**
```yaml
paths:
  - 'platform/**/*.yaml'   # Only platform configs
  - 'bootstrap/**/*.yaml'
  - 'charts/**/*.yaml'

concurrency:
  group: lint-${{ github.ref }}
  cancel-in-progress: true
```

**Estimated Savings:** 30-40% of gsv-gitops runs

### 2. gsv-gitops/ci.yaml

**Added:**
- Concurrency control with cancel-in-progress
- Timeout limits on all jobs
- Helm repo caching
- pip caching for Python

**Estimated Savings:** 20-30% from cancelled duplicate runs

### 3. gsv-website/build-and-push.yml

**Added:**
- Path filters (ignore markdown, docs)
- Concurrency control
- Timeout limit

**Estimated Savings:** 30-40% from skipped doc-only changes

### 4. cmp-studio & cmp-runtime Workflows

**Disabled (renamed to .disabled):**
- `auto-update.yml` - Ran on EVERY push to main
- `community-label.yml` - Not needed for fork
- `add-labels.yml` - Not needed for fork
- `codeflash.yml` - AI optimization service, unnecessary
- `request-docs-review.yml` - Not needed for fork

**Optimized:**
- `codeql.yml` - Changed from daily + every push/PR to weekly only

**Estimated Savings:** 50-60% of cmp-studio/cmp-runtime runs

---

## Summary of Optimizations

| Optimization | Impact | Files Changed |
|--------------|--------|---------------|
| Restrict path filters | HIGH | gsv-gitops/lint.yaml |
| Add concurrency control | MEDIUM | All modified workflows |
| Add timeout limits | LOW | All modified workflows |
| Disable upstream workflows | HIGH | 10 files across cmp-studio/cmp-runtime |
| Change to weekly schedules | MEDIUM | codeql.yml |
| Add caching | LOW | ci.yaml |

---

## Files Modified

### GSVDEV Org
- `gsv-gitops/.github/workflows/lint.yaml`
- `gsv-gitops/.github/workflows/ci.yaml`
- `gsv-website/.github/workflows/build-and-push.yml`

### Digitlify-Inc Org
- `cmp-studio/.github/workflows/auto-update.yml.disabled`
- `cmp-studio/.github/workflows/community-label.yml.disabled`
- `cmp-studio/.github/workflows/add-labels.yml.disabled`
- `cmp-studio/.github/workflows/codeflash.yml.disabled`
- `cmp-studio/.github/workflows/request-docs-review.yml.disabled`
- `cmp-studio/.github/workflows/codeql.yml`
- `cmp-runtime/.github/workflows/auto-update.yml.disabled`
- `cmp-runtime/.github/workflows/community-label.yml.disabled`
- `cmp-runtime/.github/workflows/add-labels.yml.disabled`
- `cmp-runtime/.github/workflows/codeflash.yml.disabled`
- `cmp-runtime/.github/workflows/request-docs-review.yml.disabled`
- `cmp-runtime/.github/workflows/codeql.yml`

---

## Expected Results

| Metric | Before | After (Est.) |
|--------|--------|--------------|
| Monthly minutes | ~12,000 | ~4,000-5,000 |
| Monthly cost | ~$96 | ~$32-40 |
| Reduction | - | **50-65%** |

---

## Remaining Recommendations

### High Priority (Do Soon)

1. **Disable gsv-agentregistry CI** - Deprecated repo still consuming $5.48/2 weeks
2. **Review cmp-studio/cmp-runtime necessity** - Consider if 37 workflows are needed for forks

### Medium Priority

3. **Consolidate idp-dev/idp-test workflows** - Duplicate workflows could share via workflow reuse
4. **Add path filters to remaining workflows** - Any workflow without path filters wastes runs

### Low Priority

5. **Consider self-hosted runners** - cmp-website already uses ARC, others could benefit
6. **Stagger scheduled jobs** - Multiple daily jobs at similar times cause peaks

---

## Monitoring

Check GitHub billing page in 2 weeks to validate savings:
- Settings > Billing > Actions

---

*Document created: December 16, 2025*
