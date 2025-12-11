# ShanghaiTech Auth Demo

This is a demonstration of a custom Identity Provider using Ory Hydra, Next.js, and FastAPI that integrates with ShanghaiTech IDS.

## Prerequisites

- Docker & Docker Compose
- Node.js (v18+)
- Python 3.8+
- pnpm (or npm/yarn)

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Ory Hydra   │─────▶│  Next.js    │
│             │◀─────│  (OAuth2)    │◀─────│  Login UI   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            │                      ▼
                            │               ┌─────────────┐
                            │               │  FastAPI    │
                            │               │  Backend    │
                            │               └─────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────────────────────┐
                     │   ShanghaiTech IDS           │
                     │   (User Authentication)      │
                     └──────────────────────────────┘
```

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

### 2. Install Node.js Dependencies

```bash
pnpm install
```

### 3. Setup Python Backend

```bash
uv sync
```

### 4. Register OAuth2 Client

Run the helper script to register the demo client in Hydra:

```bash
pnpm register-client
```

This creates a client with:
- Client ID: `auth-code-client`
- Client Secret: `secret`
- Redirect URI: `http://localhost:3000/callback`

### 5. Start the Services

**Terminal 1 - FastAPI Backend:**
```bash
source .venv/bin/activate
pnpm api
```

The API will be available at `http://localhost:8000`.

**Terminal 2 - Next.js Frontend:**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 6. Test the Flow

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
├── api/
│   ├── main.py              # FastAPI application
│   ├── ids.py               # ShanghaiTech IDS authentication
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── app/
│   │   ├── login/           # Login UI & Server Actions
│   │   ├── consent/         # Consent UI & Server Actions
│   │   ├── callback/        # OAuth callback handler
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── login-form.tsx   # Login form component
│   │   └── ui/              # UI components
│   └── lib/
│       ├── hydra.ts         # Hydra Admin API client
│       └── hydra-public.ts  # Hydra Public API client
├── scripts/
│   ├── register-client.js   # OAuth client registration
│   └── setup-python.sh      # Python environment setup
└── docker-compose.yml       # Hydra & Postgres setup
```

## API Endpoints

### FastAPI Backend (`http://localhost:8000`)

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

- `GET /health` - Health check endpoint

## Environment Variables

Create a `.env.local` file in the root directory:

```env
HYDRA_ADMIN_URL=http://localhost:4445
NEXT_PUBLIC_HYDRA_PUBLIC_URL=http://localhost:4444
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

- **Next.js dev server**: `pnpm dev`
- **FastAPI dev server**: `pnpm api` (auto-reload enabled)
- **View API docs**: `http://localhost:8000/docs`
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

3. **Python dependencies issues**:
   ```bash
   pnpm setup:api
   ```

4. **Port conflicts**: Ensure ports 3000, 4444, 4445, 5432, and 8000 are available.
