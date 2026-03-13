# ShanghaiTech Auth Demo

This is a demonstration of a custom Identity Provider using Ory Hydra and Next.js that integrates with ShanghaiTech IDS.

## Prerequisites

- Docker & Docker Compose
- Node.js (v18+)
- pnpm (or npm/yarn)

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Ory Hydra   │─────▶│  Next.js    │
│             │◀─────│  (OAuth2)    │◀─────│  App        │
└─────────────┘      └──────────────┘      └─────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────────────────────┐
                                           │   ShanghaiTech IDS           │
                                           │   (User Authentication)      │
                                           └──────────────────────────────┘
```

## Getting Started

### 1. Start Ory Hydra

Start the Hydra service using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Hydra Public API at `http://localhost:4444`
- Hydra Admin API at `http://localhost:4445`

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Register OAuth2 Client

Run the helper script to register the demo client in Hydra:

```bash
pnpm register-client
```

This creates a client with:
- Client ID: `auth-code-client`
- Client Secret: `secret`
- Redirect URI: `http://localhost:3000/callback`

### 4. Start the App

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 5. Test the Flow

1. Open `http://localhost:3000` in your browser.
2. Click the **Login with Hydra** button.
3. You will be redirected to the Login page (`/login`).
   - Enter your ShanghaiTech student ID and password.
4. You will be redirected to the Consent page (`/consent`).
   - Review the requested scopes and click **Allow**.
5. You will be redirected back to the Callback page (`/callback`).
   - You should see "Login Successful!" and the ID Token claims with your student info.

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/auth/          # Next.js API routes (IDS authentication)
│   │   │   ├── login/         # POST /api/auth/login
│   │   │   └── userinfo/      # POST /api/auth/userinfo
│   │   ├── login/             # Login UI & Server Actions
│   │   ├── consent/           # Consent UI & Server Actions
│   │   ├── callback/          # OAuth callback handler
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── login-form.tsx     # Login form component
│   │   └── ui/                # UI components
│   └── lib/
│       ├── hydra.ts           # Hydra Admin API client
│       ├── hydra-public.ts    # Hydra Public API client
│       └── session-store.ts   # In-memory session store
├── scripts/
│   └── register-client.js     # OAuth client registration
└── docker-compose.yml         # Hydra setup
```

## API Endpoints

### Next.js API Routes

- `POST /api/auth/login` - Authenticate user against ShanghaiTech IDS
  ```json
  {
    "username": "student_id",
    "password": "password"
  }
  ```

- `POST /api/auth/userinfo` - Get user information for consent flow
  ```json
  {
    "subject": "student_id"
  }
  ```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
HYDRA_ADMIN_URL=http://localhost:4445
NEXT_PUBLIC_HYDRA_PUBLIC_URL=http://localhost:4444
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Development

- **Next.js dev server**: `pnpm dev`
- **Hydra Admin API**: `http://localhost:4445`

## Troubleshooting

1. **Docker containers not starting**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Client registration failed**:
   ```bash
   pnpm register-client
   ```

3. **Port conflicts**: Ensure ports 3000, 4444, and 4445 are available.
