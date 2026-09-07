# PlayGrid: backend research and frontend blueprint

Prepared 6 September 2026 for the project owner and frontend implementer. Reviewed local checkout `de15c39` and its working tree.

## Assessment

PlayGrid is an Express/MongoDB backend for a YouTube-style video and community application. It contains **29 JavaScript source files, seven database models, five mounted router groups, and 20 HTTP method/path combinations**. Account management is the largest implemented feature. Community posts, subscriptions, channel profiles, and basic creator statistics also have controllers. Video, comment, like, and playlist models exist, but their resource APIs do not. A complete video-platform frontend therefore needs backend development as well as UI implementation. [Application mounts](../src/app.js), [routes](../src/routes), [models](../src/models).

The recommended next milestone is a reliable account-and-channel application plus one complete video journey: upload → discover → watch. Build the UI shell while fixing the existing contracts; connect each screen only when its dependencies work. A frontend alone cannot supply the missing video functionality.

This review covers every application source file, package/configuration files, README, repository inventory, and the modeling image. It includes isolated local probes and primary documentation checks. It does not certify a deployed service, database contents, Cloudinary configuration, browser behavior, throughput, or uptime. Secret values were not read or copied. No backend implementation was changed.

## 1. Architecture and project organization

| Location | Responsibility | Implication |
|---|---|---|
| `src/index.js` | Loads configuration, connects DB, starts HTTP server | Server starts only after DB connection; default port 8000 |
| `src/app.js` | Express middleware and route mounting | JSON body limit 20kb; cookie parser; credentialed CORS; public static directory |
| `src/db/index.js` | Mongoose connection | Appends database name to `MONGODB_URI`; exits on connection failure |
| `src/constants.js` | Database name | Current database name is `videoyoutube` |
| `src/routes/` | Methods, paths, authentication, upload middleware | Defines the actual integration surface |
| `src/controllers/` | Queries, mutations, response generation | Most business behavior resides here |
| `src/models/` | Mongoose schemas, password/JWT methods | Seven models, without separate service/repository layers |
| `src/middlewares/` | JWT, Multer, error handler | Error handler exists but is not mounted and is defective |
| `src/utils/` | Async wrapper, response/error classes, Cloudinary helpers | Shared contracts need repair before frontend integration |
| `public/` | Static files and intended upload staging | Configured `public/temp` directory is absent in this checkout |

Evidence: [startup](../src/index.js), [app](../src/app.js), [database connection](../src/db/index.js), [constants](../src/constants.js), [upload middleware](../src/middlewares/multer.middleware.js).

Installed top-level versions inspected locally: Express 5.1.0, Mongoose 8.18.0, MongoDB driver 6.19.0, bcrypt 6.0.0, jsonwebtoken 9.0.2, Cloudinary 2.7.0, Multer 2.0.2, cors 2.8.5, cookie-parser 1.4.7, dotenv 17.2.2, mongoose-aggregate-paginate-v2 1.1.4, nodemon 3.1.10, Prettier 3.6.2. Runtime inspected: Node 22.22.0 / npm 10.9.4. These are checkout observations, not a dependency vulnerability audit. [Package manifest](../package.json), [lockfile](../package-lock.json).

There is only a `dev` script. No test, lint, build, or production start scripts; no test suite, OpenAPI spec, CI workflow, container setup, seed script, or frontend was found. The README describes OAuth, encoding, streaming optimization, recommendations, distributed architecture, and numeric performance improvements, but this checkout does not provide implementations or measurements supporting those claims. Treat those statements as unverified aspirations. JWT authentication is present; OAuth is not. [README](../readme.md), [package scripts](../package.json), [source tree](../src).

## 2. Product and data model

A channel is a user account, not a separate entity. There are no viewer/creator/admin roles: the same authenticated user can post, subscribe, and access their dashboard. [User model](../src/models/user.model.js), [dashboard controller](../src/controllers/dashboard.controller.js).

| Entity | Main fields and relationships | Frontend meaning |
|---|---|---|
| User | `username`, `email`, `fullName`, `avatar`, `coverImage`, `watchHistory[] → Video`, password hash, refresh token | Account, channel identity, session, history |
| Video | `videoFile`, `thumbnail`, `title`, **`decription`**, `duration`, `views`, `isPublished`, `owner → User` | Future video cards, player, studio |
| Tweet | `content`, `owner → User`, `name` | Text community post; `name` is a username snapshot |
| Subscription | `subscriber → User`, `channel → User` | Directional follow relationship |
| Comment | `content`, `video → Video`, `owner → User` | Future video discussion |
| Like | `likedBy → User`, optional video/comment/tweet references | Future reactions |
| Playlist | `name`, `description`, `videos[] → Video`, `owner → User` | Future saved collections |

All models use timestamps and MongoDB IDs. Username/email are lowercased and trimmed; avatar is required. Video `decription` is a real schema typo, whereas the modeling image uses `description`. Duration units are not enforced or documented. Most relationship fields are optional; references do not establish application-level ownership or existence validation. Likes do not enforce exactly one target. Subscriptions have no unique subscriber/channel constraint. The pagination plugin is attached to Video and Comment but is not used by mounted list APIs. [Models](../src/models), [modeling image](../src/assets/PlayGrid%20Modelling.png).

Frontend types should distinguish private account data from public channel data. Never put password hashes or refresh tokens in account state. New video contracts should use `description`; existing database data needs inspection and possibly migration before renaming the stored field.

## 3. Complete existing API inventory

All paths below are relative to `/api/v1`. “Protected” means an access-token cookie or bearer JWT is required. These are code-derived success contracts, not claims of successful live DB execution.

The intended envelope is `{statusCode, data, message, success}`. HTTP status and body `statusCode` often differ. Use HTTP status for transport handling; repair the inconsistencies instead of copying them into every component. Errors do not currently share a dependable JSON envelope. [Response helper](../src/utils/ApiResponses.js), [app](../src/app.js).

### Account APIs

| Method and path | Access and input | Success result / integration issue |
|---|---|---|
| `POST /users/register` | Public; multipart `fullName`, `email`, `username`, `password`, required `avatar`, optional `coverImage` | HTTP 201/body 200; user without password/refresh token; registration does **not** log in |
| `POST /users/login` | Public; JSON `password` and `username` or `email` | HTTP 200/body 202; `{user, accessToken, refreshToken}`; sets both cookies |
| `POST /users/logout` | Protected; no body | HTTP 200/body 202; `{}`; clears cookies and stored refresh token |
| `POST /users/refresh-token` | Refresh cookie, or JSON `{refreshToken}` | HTTP/body 200; `{accessToken, refreshToken}` and replacement cookies |
| `POST /users/change-password` | Protected; `{oldPassword,newPassword}` | HTTP/body 200; success text in `data` |
| `PATCH /users/updateDetails` | Protected; **`{fullname,email}`** | HTTP 200/body 202; updated user; excludes password but not refresh token |
| `GET /users/current-user` | Protected | HTTP 200/body 202; user without password/refresh token |
| `PATCH /users/avatar` | Protected; multipart `avatar` | HTTP 200/body 202; updated user; upload failure handling defective |
| `PATCH /users/cover-image` | Protected; multipart `coverImage` | HTTP/body 200; updated user; first cover upload has a failure path |
| `GET /users/c/:username` | Protected, even for viewing another channel | HTTP 200/body 202; channel summary and subscription state |
| `GET /users/history` | Protected | Currently fails; intended `data` is an aggregated user containing history, not a video array |

Exact declarations: [user routes](../src/routes/user.routes.js). Implementations: [user controller](../src/controllers/user.controller.js), particularly lines 39, 197, 261, 309, 352, 389, 404, 444, 510, 562, and 640.

Channel summary fields: `_id`, `fullName`, `username`, `subscribersCount`, `channelSubscribedToCount`, `isSubscribed`, `avatar`, `email`, `coverImage`. The frontend can use `_id` from this lookup for subscription/post endpoints. Decide whether email belongs in a publicly viewable channel contract before exposing it. No bio, channel links, verification badge, or categories are modeled.

### Community, subscriptions, dashboard, health

| Method and path | Input/access | Actual success result |
|---|---|---|
| `POST /tweet/` | Protected; `{content}` | HTTP 200/body 202; new Tweet document including ID |
| `GET /tweet/user/:userId` | Protected; user ID | HTTP/body 200; `[{content}]`; IDs and timestamps are removed |
| `PATCH /tweet/:tweetId` | Protected; `{content}` | HTTP 200/body 202; `{_id,content}` or null; missing ownership enforcement |
| `DELETE /tweet/:tweetId` | Protected | HTTP 200/body 202; deletion text in `data`; missing ownership enforcement |
| `POST /subscriptions/c/:channelId` | Protected; target user ID | HTTP 200/body 202; Subscription on subscribe, text on unsubscribe |
| `GET /subscriptions/u/:subscriberId` | Protected | HTTP/body 200; subscriber users `{_id,username,email}`; parameter actually means **channel ID** |
| `GET /dashboard/stats` | Protected; current user | HTTP/body 200; **`data` is text, `message` contains `{subscribers,videos}`** |
| `GET /dashboard/videos` | Protected; current user | HTTP/body 202; own video summaries, no pagination |
| `GET /healthcheck/` | Public | HTTP/body 200; `data: []`; constant liveness response |

Evidence: [tweet routes](../src/routes/tweet.routes.js), [tweet controller](../src/controllers/tweet.controller.js), [subscription routes](../src/routes/subscription.routes.js), [subscription controller](../src/controllers/subscription.controller.js), [dashboard routes](../src/routes/dashboard.routes.js), [dashboard controller](../src/controllers/dashboard.controller.js), [health route](../src/routes/healthcheck.routes.js), [health controller](../src/controllers/healthcheck.controller.js).

The subscriber endpoint lists people following a channel; it does not list channels the current user follows. Dashboard stats only count subscriber records and owned video documents. They do not provide views, likes, watch time, revenue, trends, or chart series. Dashboard video summaries select `_id`, `title`, `description`, `owner`, `thumbnail`; the schema typo normally leaves description absent. They omit playback URL, duration, views, publication state, and timestamps. None of the existing lists implements explicit ordering or pagination.

## 4. Backend fixes that affect frontend work

### Fix before connecting real user sessions and mutations

1. **Refresh-token revocation is ineffective.** `user.controller.js:320` constructs an error without throwing when the stored and incoming refresh tokens differ. A still-valid signed token can refresh after replacement or logout. Confirmed in an isolated probe with real JWT verification and mocked user persistence. Throw on mismatch, standardize failure to 401, and test rotation/logout/replay.
2. **Any authenticated user can modify another user's post by ID.** Update and delete query only by tweet ID (`tweet.controller.js:56`, `:73`). Add owner to the database filter and handle missing/unauthorized resources. Hiding edit buttons does not enforce authorization.
3. **Error handling is unusable for a consistent API client.** The custom middleware is absent from `app.js`; if mounted unchanged, it calls `ApiError` as a function and crashes (`error.middleware.js:17`, confirmed). Its status expression on line 8 also groups incorrectly. Repair it, mount after routes, and add a JSON 404 response. Express otherwise uses its default error response, which may include a stack outside production. [Express error-handling documentation](https://expressjs.com/en/guide/error-handling/).
4. **Authentication uses inconsistent status codes.** `verifyJWT` converts all failures to 489 (`auth.middleware.js:39`, confirmed). Incorrect login password uses 444; refresh failures collapse to 404; password-change failures collapse to 412. Define 400 validation, 401 unauthenticated, 403 forbidden, 404 missing, 409 conflict, and 500 unexpected failure, with stable machine-readable error codes.
5. **Sensitive fields escape intended response boundaries.** Account/avatar/cover updates exclude only password and can return the stored refresh token (`user.controller.js:416`, `:493`, `:553`). History currently fails due to an unimported `mongoose` (`:644`, confirmed); merely importing it would return a full user and full video-owner records without safe projection (`:658`, `:683`). Fix projections and history shape together. Subscriber/channel APIs also expose email; agree on a public-field allowlist.

Sources: [user controller](../src/controllers/user.controller.js), [tweet controller](../src/controllers/tweet.controller.js), [auth middleware](../src/middlewares/auth.middleware.js), [error middleware](../src/middlewares/error.middleware.js), [app](../src/app.js), [subscription controller](../src/controllers/subscription.controller.js).

### Fix for functional forms, lists, and uploads

| Finding | Consequence | Needed change |
|---|---|---|
| Tweet list strips `_id` (`tweet.controller.js:48`) | Cannot edit/delete fetched posts or create stable identity-aware cards | Return ID, content, safe owner, created/updated timestamps |
| Stats constructor arguments reversed (`dashboard.controller.js:17`) | Counts end up under `message`; confirmed by mock-count probe | Return `{subscribers,videos}` under `data` |
| `decription` schema typo (`video.model.js:22`) | Description contract disagrees with model and dashboard | Migrate/normalize field with awareness of existing records |
| Registration/update input guards incomplete | Missing fields can produce TypeErrors rather than form errors | Validate types, required fields, files, length and format before DB/cloud work |
| Cover URL can be empty (`user.controller.js:532`) | Adding first cover fails after upload | Skip old-asset deletion when absent |
| Upload results can be null but `.url` is dereferenced | Failed uploads crash handlers | Guard result before access and return explicit error |
| Uploads use original filenames without limits/filter | Collisions, oversized or unexpected uploads, leftover public temp files | Unique names; private staging; limits/type validation; cleanup on all outcomes |
| Missing `public/temp` | Upload staging unavailable in this checkout | Create staging at startup or provision it explicitly |
| Cloudinary public ID reconstructed from URL | Folder paths can produce incorrect deletion IDs | Store `public_id` and resource type with secure URL |
| Old image deleted before DB update | DB failure can leave a broken old reference | Define replace/rollback/cleanup lifecycle |
| Subscription find/create lacks unique constraint | Concurrent toggles can create duplicate records | Validate target, add compound unique index, use dependable mutation semantics |
| Subscription accepts self/nonexistent valid-format targets | Bad channel counts and relationships | Validate target existence and self-subscription policy |
| Tweet updates lack validation and missing-resource checks | Empty/invalid data or successful null response | Validate mutations and return controlled errors |
| List endpoints have no pagination/sort | Growing responses and unstable ordering | Define limits, stable ordering, and page/cursor metadata |

Sources: [tweet controller](../src/controllers/tweet.controller.js), [dashboard controller](../src/controllers/dashboard.controller.js), [video model](../src/models/video.model.js), [user controller](../src/controllers/user.controller.js), [Multer](../src/middlewares/multer.middleware.js), [Cloudinary upload](../src/utils/cloudinary.js), [Cloudinary deletion](../src/utils/deleteCloudinary.js), [subscription model](../src/models/subscription.model.js), [subscription controller](../src/controllers/subscription.controller.js).

Further hardening: rate limits for login/register and writes, session policy after password change, consistent validation, removal of content/profile debug logging, and tests for concurrent subscription changes. A single refresh token is stored per account; define the desired multi-device behavior. The async password save hook mixes callback and promise styles; inspect this during real DB authentication tests rather than assuming a hang from static analysis. [User model](../src/models/user.model.js), [user controller](../src/controllers/user.controller.js).

## 5. Authentication and browser integration

Recommended browser flow after repairs:

1. On application startup, fetch `/users/current-user` with credentials and show a neutral loading state until resolved.
2. On a standardized 401, perform one shared refresh request; retry the original eligible request once. Concurrent failures should share the refresh operation. Never recursively refresh the refresh endpoint.
3. If refresh fails, clear cached private data and present login. Preserve the intended destination.
4. Register with FormData, then take the user to login; current registration does not create a session.
5. On logout, call the endpoint and clear account/server-state caches. Backend revocation must work first.

Access-cookie precedence over bearer headers means mixing the two modes can let a stale cookie override a valid header. Prefer one browser session strategy. Do not persist returned refresh tokens in localStorage. Existing HttpOnly cookies are useful, but returning those tokens in JSON/update responses weakens that boundary. [Auth middleware](../src/middlewares/auth.middleware.js), [user controller](../src/controllers/user.controller.js).

The server enables credentials in CORS with `CORS_ORIGIN`. Frontend requests must include credentials. Cookies currently set `httpOnly: true, secure: true` without explicit SameSite or lifetime. For a production browser app, prefer a same-origin `/api` reverse proxy and deliberate cookie settings. If deploying genuinely cross-site, evaluate `SameSite=None; Secure`, browser third-party-cookie restrictions, and CSRF protection. Cross-origin and cross-site are different concepts; different localhost ports alone do not prove cross-site behavior. Test the actual development and production origins. [App CORS](../src/app.js), [cookie creation](../src/controllers/user.controller.js), [MDN Set-Cookie reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

Use an API module that builds URLs, includes credentials, distinguishes JSON from multipart, checks content type before parsing errors, and converts API DTOs to UI types. Let the browser set the multipart boundary. Map `fullName` to the existing `fullname` update input explicitly until the backend is standardized. Avoid retrying subscription toggles automatically: a repeat can reverse the intended action.

## 6. Frontend page and feature blueprint

The following routes are **proposed frontend routes**, not existing backend paths. Visual styling is still open; this research establishes behavior and dependencies.

| Screen / proposed route | Main UI | Backend readiness |
|---|---|---|
| Login `/login` | Username/email, password, errors, return destination | Existing API; auth/error repairs needed |
| Register `/register` | Name, username, email, password, required avatar, optional cover | Existing API; upload/validation repairs needed |
| Account `/settings/profile` | Name/email form, avatar and cover editors | Existing endpoints; data-leak/upload fixes needed |
| Password `/settings/security` | Old/new/confirm password | Existing endpoint; confirm is client-side; session/error policy needed |
| Channel `/channel/:username` | Cover, avatar, name, counts, subscribe, Videos/Community tabs | Summary exists and requires login; public video list absent |
| Community tab | Composer, post list, edit/delete own post | APIs exist; IDs, authorization, timestamps and pagination need fixes |
| Subscribers `/channel/:username/subscribers` | Safe subscriber identity list | Existing API; privacy/field decision needed |
| Creator overview `/studio` | Video/subscriber totals | Existing stats needs corrected envelope; no chart data |
| Creator content `/studio/videos` | Thumbnail/title, status, views, edit/delete | Partial read only; richer fields and mutations missing |
| Home `/` | Browseable video grid and loading/empty states | Missing video listing API |
| Search `/search?q=...` | Query, results, pagination | Missing search API |
| Watch `/watch/:videoId` | Player, metadata, channel, subscribe, reactions, comments | Missing video detail, views, comments, likes APIs |
| Upload `/studio/upload` | Video/thumbnail, metadata, progress, publish | Missing upload/publish APIs |
| Subscriptions `/subscriptions` | Followed channels and their videos | Existing subscribers endpoint does not provide this |
| History `/history` | Recently watched cards, remove/clear | Read endpoint broken; write/remove/clear absent |
| Playlists `/playlists` and `/playlist/:id` | Collections and membership controls | Model only |
| Liked videos `/liked` | Saved reaction library | Model only |

Sources for readiness: [mounted routes](../src/app.js), [user routes](../src/routes/user.routes.js), [community routes](../src/routes/tweet.routes.js), [dashboard controller](../src/controllers/dashboard.controller.js), [models](../src/models).

Do not present unavailable actions as working features. During development, keep fixtures clearly separated from live API responses. A complete video MVP should provide real empty states and real uploaded content rather than permanent placeholder videos.

Shared components: application header, desktop sidebar/mobile navigation, account menu, form field/error, file picker and preview, confirmation dialog, toast, loading skeleton, empty/error state, channel header, subscription button, post card/composer, video card/grid, player shell, and studio table. Start with profile/channel/community components; video components can be designed against an agreed DTO while APIs are built.

Every screen needs loading, empty, error, success, expired-session, and permission states where relevant. Forms need associated labels, visible focus, keyboard support, clear inline validation, and duplicate-submit prevention. Video controls need keyboard access; captions require an actual caption source, currently unmodeled. Small screens should collapse navigation and reduce grid columns without hiding essential actions.

## 7. Suggested frontend architecture

**Recommendation:** React + TypeScript + Vite, React Router, and TanStack Query, in a new `frontend/` directory. This suits an existing standalone REST backend and keeps the first milestone focused. React documents Vite's React/TypeScript path, React Router supports declarative client routing, and TanStack Query provides server-state query/mutation tooling. These are recommendations, not dependencies already present. [React setup](https://react.dev/learn/build-a-react-app-from-scratch), [React Router setup](https://reactrouter.com/start/declarative/installation), [TanStack Query installation](https://tanstack.com/query/latest/docs/framework/react/installation?from=reactQueryV3).

If search-engine indexing of public watch/channel pages becomes a core requirement, assess a server-rendered React framework before committing to the routing architecture. The current brief does not establish that requirement.

Proposed organization:

```text
frontend/
  src/
    app/                 # router, providers, layout
    api/                 # HTTP client, response/error handling
    features/
      auth/              # session, login, registration
      account/           # profile, password, images
      channels/          # channel profile, subscriptions
      community/         # posts and ownership actions
      videos/            # browse, search, watch
      studio/            # dashboard and upload/manage
      library/           # history, playlists, liked videos
    components/          # shared presentation components
    styles/              # tokens, layout, responsive rules
    types/               # shared public DTOs
```

Use query caching for server data and local component state for menus/forms/dialogs. Suggested keys: `['session']`, `['channel', username]`, `['posts', userId, page]`, `['subscribers', channelId, page]`, `['studio','stats']`, `['videos', filters]`, `['video', videoId]`. Invalidate channel counts and relevant lists after subscriptions; session and channel data after account changes; posts after mutations. Clear private queries on logout. Pagination keys are forward-looking because the current APIs lack pagination.

Begin with a small CSS token system for color, type, spacing, radius and focus. A dark video-browsing interface is an optional direction, not a confirmed preference. A large global state library or full component system is not needed to resolve the current backend integration gaps.

## 8. Missing backend contracts to agree before building video screens

These are **proposals only**. None should be treated as an existing endpoint.

| Proposed API group | Required operations |
|---|---|
| `/videos` | Paginated published listing/search; authenticated multipart creation |
| `/videos/:videoId` | Safe detail/playback metadata; owner-only edit/delete |
| `/videos/:videoId/publication` | Owner-only explicit publication state |
| `/videos/:videoId/views` | Controlled view tracking with agreed counting policy |
| `/videos/:videoId/comments` and `/comments/:commentId` | Paginated discussion and owner-authorized mutations |
| `/videos/:videoId/like` | Explicit like/unlike and counts/current-user state |
| `/playlists` and `/playlists/:playlistId` | Collection CRUD, access policy, item membership/order |
| `/users/me/subscriptions` | Channels the viewer follows |
| `/feed/subscriptions` | Published videos from followed channels |
| `/users/history` | Safe paginated history read, record, remove, clear |

Agree on video DTO fields: `_id`, `title`, `description`, `thumbnail`, `videoFile` or playback descriptor, `durationSeconds`, `views`, `isPublished`, `createdAt`, and safe owner summary `{_id,username,fullName,avatar}`. Include optional viewer reaction state only when defined. Decide publication visibility, upload size/type limits, delete cleanup, pagination semantics, supported media formats, and whether transcoding is in scope.

For an MVP, direct supported media playback may be sufficient. Adaptive streaming, recommendation ranking, encoding jobs, and processing-state UX require explicit backend contracts; they cannot be inferred from the Video model or README. Video duration and view counting need documented units/semantics before UI formatting and analytics are implemented.

Target a consistent paginated response such as `data: {items, page, limit, total, hasNextPage}` or a cursor alternative. Target mutation responses with explicit state, for example `data: {isSubscribed, subscribersCount}`. Do not permanently support the dashboard's reversed envelope as the preferred contract.

## 9. Setup and configuration checklist

Configuration names referenced by source, without secret values:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; code falls back to 8000 |
| `MONGODB_URI` | Connection base; database name appended by connection helper |
| `CORS_ORIGIN` | Browser origin allowed by CORS |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Access JWT signing and lifetime |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Refresh JWT signing and lifetime |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET_KEY` | Media service configuration |
| `NODE_ENV` | Intended environment-sensitive error output |

Sources: [startup](../src/index.js), [DB](../src/db/index.js), [JWT model methods](../src/models/user.model.js), [app](../src/app.js), [Cloudinary configuration](../src/utils/cloudinary.js), [error middleware](../src/middlewares/error.middleware.js).

Before live integration: add a secret-free `.env.example`; verify URI construction for any query parameters; provision upload staging; verify MongoDB and Cloudinary independently; run the existing `npm run dev`; then exercise health, registration, login, current user, and upload through the actual browser origin. Add a frontend API-base setting or proxy when scaffolding. Never put database credentials, JWT secrets, or Cloudinary secrets in frontend environment variables.

The dev command preloads dotenv before module imports. Some configuration is consumed at module evaluation, so preserve early configuration loading when adding a production start command. Add a supported runtime declaration, production start script, readiness checks, and SPA route fallback at the chosen hosting layer. The current health endpoint only returns a constant response; it is not a dependency health check.

## 10. Implementation sequence and acceptance criteria

1. **Stabilize backend contracts.** Repair token checks, ownership, response privacy, JSON errors/statuses, upload guards, post IDs, stats, and history. Acceptance: unauthorized mutations fail; revoked refresh tokens fail; safe response fields only; all errors parse as JSON.
2. **Build frontend foundation.** Scaffold frontend, routing, API client, query provider, layout and shared form states. Acceptance: API failures and expired sessions render predictably; responsive keyboard navigation works.
3. **Deliver account/channel/community flows.** Registration, login/logout, settings, channel summary, subscriptions and posts. Acceptance: avatar signup succeeds; first cover upload works; persisted posts can be edited/deleted only by their owner; counts refresh.
4. **Deliver the video vertical slice.** Implement video create/list/detail/publish/edit/delete and then upload, home, watch, and studio content screens. Acceptance: a creator uploads and publishes a video; another user discovers and plays it; private/unpublished access follows the agreed policy.
5. **Add library and engagement.** Comments, likes, playlists, followed-channel feed, and full history lifecycle. Acceptance: pagination is stable; ownership enforced; mutations update visible state and survive reloads.
6. **Validate release behavior.** Test real browser cookies/CORS, direct-link refreshes, upload failures, empty databases, session expiry, responsive layouts and accessibility. Add richer analytics only when events and aggregates exist.

Highest-value future integration tests: signup missing/invalid files; login wrong password; access expiry/refresh; refresh mismatch and logout replay; cross-user tweet edit/delete; history sensitive-field exclusion; first cover upload; upload cleanup failure; concurrent subscriptions; nonexistent channel/video IDs; and published versus unpublished video visibility. These are proposed tests, not completed tests.

## 11. Verification performed and research limits

Completed checks:

- Syntax-checked all 29 source JavaScript files: passed.
- Imported `src/app.js` without connecting a database: passed.
- Inspected Express router registrations: five mounted groups, 20 method/path combinations.
- Invoked unauthenticated JWT middleware: returned error status 489.
- Invoked history handler before DB execution: reproduced `mongoose is not defined`.
- Invoked custom error middleware: reproduced class-constructor invocation failure.
- Exercised refresh with a valid locally signed JWT and mismatched mocked stored token: incorrectly accepted with HTTP 200.
- Exercised stats with mocked counts: confirmed counts appear in `message` and text in `data`.
- Inspected installed dependencies, scripts, tracked files, upload directory presence, schema image, and source references.

The isolated probes used no real account, DB write, Cloudinary upload, or external mutation. They establish specific control-flow defects, not end-to-end service readiness. No repository test suite exists. Browser and live database/media tests remain necessary. A documentation overview fetch for TanStack Query timed out twice; the accessible official installation page was used for the limited tooling recommendation. Research stopped after the complete source inventory and consequential integration claims were covered or explicitly bounded.

The proposed frontend architecture and routes are design recommendations. Existing API behavior is backed by the linked local source files and the checks above. The README's performance claims remain unverified. No deployment availability, dependency-security assessment, or live data migration safety is asserted.
