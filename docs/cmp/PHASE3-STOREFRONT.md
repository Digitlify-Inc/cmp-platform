# Phase 3: Storefront Implementation

## Overview

This document covers the implementation of the Saleor Storefront for the Cloud Marketplace Platform (CMP).

## Architecture

```
Browser --> Storefront (Next.js) --> Saleor API (GraphQL)
                                        |
                                   Provisioner (Webhook)
                                        |
                                   Control Plane
```

## Implementation Details

### Technology Stack

- **Framework**: Next.js 16 with App Router and React 19
- **Styling**: Tailwind CSS
- **API**: GraphQL with TypeScript codegen
- **Runtime**: Node.js 22 (required for Next.js 16)

### Source Repository

The storefront is based on the official Saleor storefront template:
- Source: https://github.com/saleor/storefront
- Location: `gsv-platform/services/storefront/`

### Docker Image

Built with multi-stage Dockerfile:
```
# Build
docker build   --build-arg SALEOR_SCHEMA_URL=https://storefront1.saleor.cloud/graphql/   --build-arg NEXT_PUBLIC_STOREFRONT_URL=http://storefront.dev.gsv.dev   --build-arg NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel   -t cmp-storefront:v0.1.2 .

# Load to KinD
kind load docker-image cmp-storefront:v0.1.2 --name kind-gsv
```

### Kubernetes Resources

Located in: `gsv-gitops/platform/base/cmp-storefront/`

- `namespace.yaml` - CMP namespace
- `configmap.yaml` - Environment configuration
- `deployment.yaml` - Storefront deployment
- `service.yaml` - ClusterIP service on port 3000
- `ingress.yaml` - Nginx ingress for storefront.dev.gsv.dev
- `kustomization.yaml` - Kustomize configuration

### Deployment

```bash
# Apply manifests
kubectl apply -k platform/base/cmp-storefront/

# Check status
kubectl get pods -n cmp -l app.kubernetes.io/name=cmp-storefront
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_SALEOR_API_URL | Saleor GraphQL endpoint | http://cmp-commerce-api.cmp:8000/graphql/ |
| NEXT_PUBLIC_STOREFRONT_URL | Storefront public URL | http://storefront.dev.gsv.dev |
| NEXT_PUBLIC_DEFAULT_CHANNEL | Default Saleor channel | default-channel |
| HOSTNAME | Bind address | 0.0.0.0 |
| PORT | Listen port | 3000 |

## Known Issues

### Schema Generation at Build Time

The Saleor storefront uses GraphQL codegen to generate TypeScript types at build time. This requires access to a Saleor GraphQL endpoint during the Docker build.

**Solution**: Build with a public Saleor Cloud demo endpoint for schema generation, then override the API URL at runtime via environment variables.

```dockerfile
# Build time - use public API for schema
ARG SALEOR_SCHEMA_URL=https://storefront1.saleor.cloud/graphql/
ENV NEXT_PUBLIC_SALEOR_API_URL=${SALEOR_SCHEMA_URL}

# Runtime - use local API
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
```

### Node.js Version

Next.js 16 requires Node.js 22+. Earlier versions cause:
```
TypeError: controller[kState].transformAlgorithm is not a function
```

### Port Binding

Next.js standalone server binds to the pod's IP by default. Set HOSTNAME=0.0.0.0 to bind to all interfaces:
```dockerfile
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
```

## Next Steps

1. **Connect to Local Saleor**: Rebuild with local Saleor API URL for runtime
2. **Customize Branding**: Update logo, colors, and content
3. **Add AI Agent Categories**: Modify navigation for AI agents marketplace
4. **Implement Checkout Integration**: Connect Stripe/Adyen for payments
5. **Add Agent Demo**: Integrate agent trial/demo functionality

## URLs

| Service | URL |
|---------|-----|
| Storefront | http://storefront.dev.gsv.dev |
| Saleor Dashboard | http://admin.dev.gsv.dev |
| Saleor API | http://store.dev.gsv.dev/graphql/ |

## Testing

```bash
# Port forward for local testing
kubectl port-forward svc/cmp-storefront -n cmp 3002:3000

# Access at http://localhost:3002
```
