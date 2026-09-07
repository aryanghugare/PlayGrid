# Backend additions

The original controllers, route files, model files, and learning comments are retained. Existing functions received targeted validation, authorization, pagination, privacy and error fixes. New resource controllers contain the new functionality. The earlier research report describes the pre-implementation snapshot; this document describes the current API.

## Run and test

Use Node 22.12 or newer. Install dependencies with `npm install`. Use `.env.example` as a configuration reference; do not overwrite an existing `.env` containing your credentials. Start with `npm run dev` (or `npm start`). The connection helper now selects `MONGODB_DATABASE` separately so URI query parameters remain valid.

`npm test` runs 10 integration scenarios against a disposable MongoDB process. It never connects to your configured database. The first run may download a MongoDB binary. Tests use local media fixtures and exercise real database operations, cookie authentication, token replay rejection, cross-user mutation protection, concurrent subscriptions, upload validation, draft visibility, history, engagement and cascade cleanup. The tiny video fixture validates the HTTP upload contract, not media decoding.

`npm run migrate` is an explicit maintenance action for existing data. Back up the database first. It copies legacy `decription` to `description` while retaining the original field, initializes missing session versions, and creates indexes. It stops on duplicate subscriptions rather than deleting existing records. Duplicate likes may also cause unique index creation to fail and require reconciliation. No migration has been run against your database.

## Existing functionality enhanced

- Existing registration/login/logout/password/profile/avatar/cover controller functions remain. Registration still requires an avatar and does not log in.
- All original explanation comments and commented teaching examples remain.
- Tokens are set in HttpOnly cookies. User JSON omits secrets. Refresh compares the stored token, atomically replaces it, and rejects replay. Login/logout/password changes update a session version to invalidate old access tokens. One active login per account is intended.
- Browser writes check allowed origins. Configure `CORS_ORIGIN` (comma-separated exact origins) and `APP_ORIGIN` for the deployment. Production cookies require HTTPS. Use `COOKIE_SAME_SITE=lax` for same-site deployments; `none` requires HTTPS and a deliberate cross-site deployment policy.
- Post updates/deletes enforce ownership; listing includes IDs, safe owners and timestamps. Original `/tweet` routes remain.
- Channel and subscriber reads expose public identity, not email. Channel reads no longer require login.
- Dashboard counts are under `data`; own video listing includes player/studio fields.
- History retains the original aggregation, adds safe projections and visibility checks, and returns a paginated list.
- Image staging uses unique filenames outside `public`; validation rejects unsupported formats and cleanup runs after failed requests.
- Original JWT/Cloudinary helpers remain, with necessary fixes and support for the new media service.

## Shared contract

Base: `/api/v1`. Success and error responses use `{statusCode, data, message, success}`; errors also provide `errors`. Lists use `data: {items, page, limit, total, hasNextPage}`. Default page=1, limit=12, maximum limit=100. IDs are MongoDB ObjectId strings. Cookie requests use `credentials: 'include'`.

Retained account paths: POST `/users/register`, `/users/login`, `/users/logout`, `/users/refresh-token`, `/users/change-password`; GET `/users/current-user`, `/users/c/:username`, `/users/history`; PATCH `/users/updateDetails`, `/users/avatar`, `/users/cover-image`. Profile updates accept both `fullName` and legacy `fullname`. Image field names stay `avatar` and `coverImage`.

## Added APIs

| Method | Path | Input / behavior |
|---|---|---|
| GET | `/videos` | Public published videos; `q`, `owner`, `sort=popular`, page/limit |
| GET | `/videos/feed/subscriptions` | Signed-in user's followed channels' published videos |
| GET | `/videos/:videoId` | Published video, or owner's draft; safe owner, likes/subscriber state |
| POST | `/videos` | Auth; multipart `video` (MP4/WebM), `thumbnail` (JPEG/PNG/WebP), `title`, `description`, `durationSeconds`, `isPublished`; drafts by default |
| PATCH | `/videos/:videoId` | Owner; JSON title/description, or multipart including optional thumbnail |
| PATCH | `/videos/:videoId/publication` | Owner; `{isPublished: boolean}` |
| DELETE | `/videos/:videoId` | Owner; removes video, media and associated comments/likes/library references |
| POST | `/videos/:videoId/views` | Accessible video; explicit playback event counter |
| GET / POST | `/videos/:videoId/comments` | Public accessible listing / signed-in `{content}` creation |
| PATCH / DELETE | `/comments/:commentId` | Comment owner; update `{content}` or delete |
| PUT / DELETE | `/likes/:target/:targetId` | Auth; target is video/comment/tweet; explicit like/unlike |
| GET | `/likes/videos` | Auth; liked videos still visible to viewer |
| GET / POST | `/playlists` | Auth; private collection listing / `{name,description}` creation |
| GET / PATCH / DELETE | `/playlists/:playlistId` | Owner only; metadata, paginated videos, edit or delete |
| PUT / DELETE | `/playlists/:playlistId/videos/:videoId` | Owner; add/remove membership |
| PUT / DELETE | `/users/history/:videoId` | Auth; record/remove viewed video |
| DELETE | `/users/history` | Auth; clear history |
| PUT / DELETE | `/subscriptions/c/:channelId` | Auth; explicit subscribe/unsubscribe, returns `{isSubscribed,subscribersCount}` |
| GET | `/subscriptions/me` | Auth; followed channels |
| GET | `/tweet` | Public paginated community feed |
| GET | `/healthcheck/ready` | Database readiness |

Legacy POST subscription toggle remains. Use PUT/DELETE in new clients to avoid reversing state on retry. Playlists are private and capped at 500 items. To reorder, PATCH a playlist with `videoIds` containing every current member exactly once. History stores at most 500 distinct recent videos. Video DTOs add `durationSeconds` and normalize legacy descriptions while retaining the original `duration` field.

## Media and deployment boundaries

`MEDIA_DRIVER=local` is a development option using `data/media`; local draft videos require owner authentication. `MEDIA_DRIVER=cloudinary` uses the configured Cloudinary account. Cloudinary uploads return delivery URLs; draft metadata visibility does not make an unsigned Cloudinary URL private. Signed/private media delivery, transcoding, adaptive streaming, unique-view fraud prevention, distributed rate limits, and transactional/outbox recovery for interrupted multi-collection deletes are not implemented. View totals count explicit playback events, not unique viewers. The in-process rate limiter resets on restart.

The app can serve a built `frontend/dist` with SPA fallback. For separate frontend hosting, configure credentialed CORS and route `/media` to the backend in local development. Production should use a deliberate same-origin proxy or cookie policy. Cloudinary live uploads and the project's existing database were not used by integration tests.
