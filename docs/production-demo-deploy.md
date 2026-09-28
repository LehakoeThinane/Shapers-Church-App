# Sunday demo deployment

The demo scope is intentionally limited to the custom API identity flow:

- `POST /internal/bootstrap`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /me`
- `GET /health`

The production migration applies only `apps/api/migrations/001_identity.sql`.
The public content/events/sermons/testimonies migration is preserved under
`apps/api/migrations/optional/` and is not applied for this demo.

## Render API service

`render.yaml` contains the native Node build/start configuration:

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter api build`
- Start: `pnpm --filter api start`
- Health check: `/health`

Set these variables in the Render service dashboard:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon/Postgres connection string, including `sslmode=require` if Neon requires it |
| `JWT_SECRET` | Random secret, at least 32 characters |
| `BOOTSTRAP_TOKEN` | Separate random secret, at least 32 characters |
| `CORS_ORIGIN` | `*` for this Expo-only demo (tighten before a public web client) |

Render provides `PORT` automatically. The API listens on `0.0.0.0` and uses
that value; do not set a localhost or LAN IP in Render.

## Run the production migration

From the repository root, after replacing the placeholder with the real Neon
connection string:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
pnpm --filter api db:migrate
Remove-Item Env:DATABASE_URL
```

If PowerShell reports `'tsx' is not recognized`, install dependencies from the
repository root first with `pnpm install`. As a direct fallback that
does not depend on pnpm's workspace binary shim, run:

```powershell
node .\node_modules\tsx\dist\cli.mjs .\apps\api\src\migrate.ts
```

Only use a real Neon/Postgres URL above; `USER`, `PASSWORD`, `HOST`, and `DB`
are placeholders. `org.shapers.church` belongs in `app.json`; it is not part
of the PowerShell environment-variable cleanup command.

The command creates the identity tables and records the applied migration in
`schema_migrations`. Run the bootstrap request only once, after the migration
and API deploy are healthy.

## EAS preview APK

Before building, replace the placeholder Render URL in
`apps/mobile/eas.json` if your service has a different hostname. Then run:

```powershell
npm install --global eas-cli
eas login
eas build -p android --profile preview
```

If you do not want a global install, the equivalent one-off commands are:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The Expo dashboard prints a build URL and QR code. When the build completes,
the page includes a direct APK download link that can be installed on an
Android device.
