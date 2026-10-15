# ICT Support — employee mobile app

React Native + Expo (SDK 57) app for Leonio Group employees to request IT help, track
requests, chat with IT and confirm fixes. It talks to the ticketing system's
`/api/mobile/*` endpoints. The reference for those is in the backend repo, at
`docs/api/employee-mobile-api.md`.

## Develop

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"   # Node 22
npm install
cp .env.example .env.local                          # Azure IDs for Microsoft sign-in (optional)
npx expo start --tunnel                             # open in Expo Go, or in the development build for push
```

Before committing, run `npx tsc --noEmit` and `npx expo lint`. See `AGENTS.md` for Expo conventions.

## Layout

| Path | What |
|---|---|
| `src/app/` | Screens (Expo Router). `login`, `setup`, `(app)/(tabs)` (My Requests, Updates, Profile), `(app)/ticket/*` |
| `src/api/` | API client, endpoint functions, TanStack Query hooks, response types |
| `src/auth/` | Session (token in secure storage), Microsoft sign-in |
| `src/notifications/` | Push registration and tap handling |
| `src/components/`, `src/lib/` | Shared UI, file pick/open helpers, date formatting |

## Release

See [RELEASE.md](./RELEASE.md) for one-time setup, builds, over-the-air updates and the pilot test checklist.
