# Testing

## Smoke Tests

This project includes lightweight smoke checks for core auth/settings behavior.

### 1) Fast local smoke checks

Runs hashing and password verification checks without starting the app:

```bash
npm run test:smoke
```

### 2) API smoke checks

Runs auth/settings endpoint checks against a running app.

Start the app in another terminal:

```bash
npm run dev
```

Then run:

```bash
npm run test:smoke:api
```

Optional custom base URL:

```bash
APP_BASE_URL=http://127.0.0.1:3000 npm run test:smoke:api
```

## What these checks cover

- Password hash generation and verification in `lib/password.ts`
- `/api/settings` denies unauthenticated requests
- Login sets auth cookie using default seeded practitioner
- Authenticated requests to `/api/settings` and `/api/settings/practitioners` succeed
