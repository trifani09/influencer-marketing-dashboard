# Influencer Marketing Dashboard

React/Vite frontend in this folder and a separate Node.js profile API in [`../backend/`](../backend/). The API uses Node's built-in HTTP server and has no extra package dependencies. Provider credentials stay on the backend.

## Run locally

1. Install packages with `npm install`.
2. Copy this folder's `.env.example` to `frontend/.env` and `../backend/.env.example` to `backend/.env`; add your Supabase project values to both.
3. Start the frontend with `npm run dev`.
4. In a second terminal, start the profile API with `npm run dev:api`.
5. Run automated API/provider tests with `npm test`; create a production frontend bundle with `npm run build`.

Vite proxies `/api` requests to `localhost:3001` for local development. See [`../backend/README.md`](../backend/README.md) for separate deployment configuration. The influencer database still uses the project's existing `localStorage` storage and stays in that browser. OAuth tokens are exchanged and used on the server, then discarded; this implementation does not persist provider tokens. Refreshing an official-API profile therefore asks the account owner to authorize again.

## Login setup

The dashboard uses Supabase Auth email/password sign-in. Create a Supabase project and enable email authentication. Add the project URL and publishable/anon key to `frontend/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; add the same values to `backend/.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. These are public project values, not service-role secrets. Never put a service-role key in the frontend. Add `http://localhost:5173` to Supabase Auth's allowed redirect URLs for local signup confirmation. New users may need to confirm their email before signing in.

The backend checks the Supabase access token for profile-import requests. Influencer and campaign rows remain in browser storage, namespaced by the signed-in user; authentication accounts are managed by Supabase.

## Profile import behavior

- The **Add influencer** header action opens the TikTok/Instagram URL importer. Platform detection and strict URL validation happen in the browser for feedback and again on the server for enforcement.
- `POST /api/profiles/fetch` returns a real profile only when a configured provider can return it. Missing credentials return `SETUP_REQUIRED`; official APIs return an authorization link when the account owner has not yet consented.
- OAuth state is random, short-lived, one-use, and kept server-side. Provider tokens and secrets stay in the Node process. OAuth identity must match the profile URL before the preview is accepted.
- Import saves the provider response and its source/provenance beside the existing influencer record. Duplicate imports match normalized platform/profile URL or provider creator ID. Existing notes, contact, rate card, niche, country, campaign IDs, and status are preserved on refresh.
- Fields that the provider does not return stay `null` in `externalProfile`; the UI displays them as unavailable. Engagement is calculated only when a complete recent-content sample and follower count exist.
- Profile data older than seven days is marked stale. Use **Refresh Profile Data** in the saved profile. Provider errors leave the last successful saved snapshot intact and offer retry/reauthorization.

## Provider setup and availability

### Official TikTok API

Set `PROFILE_PROVIDER=official`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, and `TIKTOK_REDIRECT_URI` in the backend environment. TikTok web Login Kit requires a registered HTTPS redirect URI; for local development, expose the app through an HTTPS development tunnel and register the backend callback URL. Request approval for `user.info.basic`, `user.info.profile`, `user.info.stats`, and `video.list`. TikTok requires the account owner to sign in and consent. The app checks that the account returned by TikTok matches the URL; it cannot fetch arbitrary creators from their URL alone. When `video.list` is granted, recent public video metadata and available view/like/comment/share counts are requested. TikTok tokens are never sent to the browser.

### Official Instagram API / Business Discovery

The default `INSTAGRAM_API_MODE=business-discovery` uses Meta Facebook Login and Instagram Business Discovery. Set `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, and `META_GRAPH_API_VERSION` in the backend environment. `META_REDIRECT_URI` must point to the backend callback. The agency user signs into Meta and must have a Facebook Page linked to an Instagram Business or Creator account. The API uses that connected professional account as the caller to look up the URL username. The target creator does not need to sign in, but Meta only returns eligible **public Business/Creator** accounts; personal/private accounts cannot be fetched this way. Request `instagram_basic`, `pages_show_list`, and `pages_read_engagement` as needed, add the Instagram Graph API product, and obtain Meta App Review/Advanced Access when required. Available profile and public media fields are stored; data unavailable for the target remains null. This is an official public-profile discovery route, not a promise of access to every Instagram URL.

Platforms offering broad creator search may use a commercial data provider or other approved data access. This app uses Meta's documented route and does not assume every public Instagram account is available.

To fetch only the account owner’s connected profile instead, set `INSTAGRAM_API_MODE=instagram-login` and configure `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`, and `INSTAGRAM_GRAPH_API_VERSION`. That mode uses Instagram Login with `instagram_business_basic` and does not query arbitrary creators.

### Third-party provider

Set `PROFILE_PROVIDER=third-party`, `CREATOR_DATA_PROVIDER_URL`, and `CREATOR_DATA_PROVIDER_TOKEN`. The API makes a server-to-server HTTPS `POST` to that configured endpoint with `{ "profileUrl": "...", "platform": "TikTok|Instagram" }` and a bearer token. The provider must be authorized for the requested data and return either `{ "profile": { ... } }` or the profile object itself using the canonical fields in `../backend/providers.js` (`username`, `displayName`, `profilePictureUrl`, `bio`, `followerCount`, `followingCount`, `contentCount`, and `recentContent`). `recentContent` items may include `id`, `url`, `caption`, `publishedAt`, `mediaType`, `views`, `likes`, `comments`, and `shares`. No paid provider is bundled; its availability, terms, and fees depend on the provider you select.

### Local mock provider

For UI development only, set `PROFILE_PROVIDER=mock`. It returns only the labeled `@samplecreator` fixture on TikTok or Instagram, with `dataSource: local-fixture`; unknown URLs return unavailable. The mock is disabled when `NODE_ENV=production`. Fixture-backed tests do not represent a real social API call.

## Storage recommendation

There was no backend or server database in the inspected project. The Node API added here handles validation, OAuth, provider requests, timeouts, and rate limiting, while profile rows continue to use the existing `localStorage` store. For shared agency data and durable OAuth refresh tokens, use PostgreSQL (for example, Supabase) with encrypted token storage, per-workspace access control, consent revocation, and retention/deletion workflows. That database migration is not included, so tokens are intentionally discarded after each authorized fetch.

## Security and limitations

- The API validates supported HTTPS profile URLs; it does not scrape social websites, bypass authentication, or handle CAPTCHAs.
- The third-party endpoint is server configuration, never user-controlled, and must use HTTPS outside development/test.
- Requests have an eight-second timeout, a small JSON body limit, and a per-IP API request limit. Provider 401/403, 404, 429, timeout, and network failures map to safe client messages without leaking response bodies or tokens.
- Official API support is implemented but is **not active until you configure valid credentials, approved scopes, a connected professional caller account, and callback URLs**. This workspace currently has no configured Meta credentials, so no real provider request has succeeded yet.
