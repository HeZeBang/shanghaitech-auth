# ShanghaiTech Auth

OAuth2/OpenID Connect Identity Provider for ShanghaiTech, built with Next.js and Ory Hydra.

Authenticates users against ShanghaiTech IDS and issues standard OAuth2 tokens with user claims (`sid`, `name`, `email`).

## Quick Start (Production)

### 1. Configure

```bash
cp env.example .env
```

Edit `.env` — set your domain URLs and generate secrets:

```bash
# Generate secrets
openssl rand -hex 32   # for SECRETS_SYSTEM
openssl rand -hex 32   # for OIDC_PAIRWISE_SALT
openssl rand -hex 32   # for CLIENT_SECRET
```

### 2. Deploy

```bash
docker compose up -d
```

This starts 3 services:
- **app** (Next.js) — login/consent UI + IDS authentication API
- **hydra** — OAuth2/OIDC protocol engine
- **register-client** — auto-registers the OAuth client (runs once, then exits)

### 3. Verify

```bash
# Check services
docker compose ps

# Check Hydra health
curl http://localhost:4444/health/alive

# Check OIDC discovery
curl http://localhost:4444/.well-known/openid-configuration
```

## Development

```bash
pnpm install

# Start Hydra only
docker compose up hydra -d

# Register client
pnpm register-client

# Start Next.js dev server
pnpm dev
```

## OAuth2 Integration

Any application supporting OAuth2/OIDC can authenticate users through this service.

### Register a Client

```bash
curl -X POST http://hydra-admin:4445/admin/clients \
  -H 'Content-Type: application/json' \
  -d '{
    "client_id": "my-app",
    "client_secret": "my-secret",
    "client_name": "My Application",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid profile email",
    "redirect_uris": ["https://my-app.com/callback"],
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

### Use OIDC Discovery

Most OAuth libraries support auto-configuration via:

```
https://<HYDRA_PUBLIC_URL>/.well-known/openid-configuration
```

Example with `next-auth`:

```ts
import NextAuth from "next-auth";

export const { handlers, auth } = NextAuth({
  providers: [{
    id: "shanghaitech",
    name: "ShanghaiTech",
    type: "oidc",
    issuer: "https://hydra.example.com/",
    clientId: "my-app",
    clientSecret: "my-secret",
  }],
});
```

### ID Token Claims

After authentication, the ID token contains:

```json
{
  "sid": "2024xxxxx",
  "name": "张三",
  "email": "zhangsan@shanghaitech.edu.cn"
}
```

## Architecture

```
Browser → Hydra (OAuth2) → Next.js (Login/Consent UI)
                                  ↓
                           ShanghaiTech IDS
                           (Authentication)
```

## Project Structure

```
├── src/app/
│   ├── api/auth/login/     POST /api/auth/login (IDS authentication)
│   ├── api/auth/userinfo/  POST /api/auth/userinfo (user data)
│   ├── login/              Login page + server action
│   ├── consent/            Consent page + server action
│   └── callback/           OAuth callback (demo token display)
├── hydra/hydra.yml         Hydra configuration
├── scripts/                Client registration script
├── Dockerfile              Multi-stage production build
└── docker-compose.yml      Full stack deployment
```

## Environment Variables

| Variable | Description |
|---|---|
| `APP_URL` | Next.js app public URL |
| `HYDRA_PUBLIC_URL` | Hydra public API URL |
| `CLIENT_ID` | OAuth client ID |
| `CLIENT_SECRET` | OAuth client secret |
| `SECRETS_SYSTEM` | Hydra system secret (token signing) |
| `OIDC_PAIRWISE_SALT` | Hydra pairwise subject salt |

See `env.example` for all options.
