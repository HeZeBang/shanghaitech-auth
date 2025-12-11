# ShanghaiTech Auth Demo

This is a demonstration of a custom Identity Provider using Ory Hydra and Next.js.

## Prerequisites

- Docker & Docker Compose
- Node.js (v18+)
- pnpm (or npm/yarn)

## Getting Started

### 1. Start Ory Hydra

Start the Hydra service and Postgres database using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Hydra Public API at `http://localhost:4444`
- Hydra Admin API at `http://localhost:4445`
- Postgres Database

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

### 4. Start the Next.js App

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 5. Test the Flow

1. Open `http://localhost:3000` in your browser.
2. Click the **Login with Hydra** button.
3. You will be redirected to the Login page (`/login`).
   - Enter any email (e.g., `user@example.com`) and password `password`.
4. You will be redirected to the Consent page (`/consent`).
   - Review the requested scopes and click **Allow**.
5. You will be redirected back to the Callback page (`/callback`).
   - You should see "Login Successful!" and the ID Token claims.

## Project Structure

- `src/app/login`: Custom Login UI & Logic
- `src/app/consent`: Custom Consent UI & Logic
- `src/app/callback`: Demo Client Callback Handler
- `src/lib/hydra.ts`: Hydra Admin API Client
- `docker-compose.yml`: Hydra & Postgres Setup
