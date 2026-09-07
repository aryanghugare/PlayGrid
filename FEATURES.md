# PlayGrid — Complete Feature Guide

This guide describes the features implemented in the current PlayGrid backend and frontend. It distinguishes features available in the interface from capabilities currently exposed only through the API.

## 1. Project overview

PlayGrid is a video-sharing and creator-community application. Users can discover videos, follow creators, publish their own videos and posts, comment, like videos, and organize their personal libraries.

The project includes:

- A Node.js and Express REST API.
- MongoDB persistence through Mongoose.
- A React and TypeScript frontend built with Vite.
- Cloudinary media integration and an optional local media mode.
- JWT authentication, account settings, and ownership checks.
- Backend integration tests and browser tests.

## 2. Who can use the application?

| User type | Available capabilities |
|---|---|
| Visitor | Browse and search published videos, watch published videos, view channels and subscriber lists, read community posts and video comments, copy video links, register, and sign in. |
| Signed-in user | All visitor features, plus subscriptions, likes, comments, community posts, history, private playlists, and account settings. |
| Creator | Any signed-in user can upload videos, manage their own content, and access their creator dashboard. There is no separate creator-approval process. |

A channel is a user account. Separate administrator, moderator, or paid-membership roles are not implemented.

## 3. Registration, login, and sessions

- Register with a full name, username, email, and password.
- Upload a required profile picture during registration.
- Optionally upload a channel cover image during registration.
- Validate usernames, email addresses, passwords, and required inputs.
- Check password confirmation in the registration interface.
- Reject duplicate usernames and email addresses.
- Sign in using either an email address or a username and password.
- Redirect users to login after successful registration; registration does not automatically sign them in.
- Load the current signed-in user's account information.
- Restore the browser session on application startup when its credentials remain valid.
- Use access and refresh JWTs in HttpOnly cookies.
- Refresh eligible failed API requests through a shared refresh operation and retry once.
- Reject reuse of a refresh token after it has been rotated or revoked.
- Sign out and clear authentication cookies.
- Invalidate earlier access sessions using a session version when signing in, signing out, or changing a password.
- Protect account, library, and creator pages from unauthenticated access.
- Remember a protected page's destination when redirecting its visitor to login.

The intended session policy is one active login per account. The frontend does not store refresh tokens in localStorage.

## 4. Profile and account settings

- View the current profile picture, full name, and username.
- Update the full name and email address.
- Replace the profile picture.
- Add a first channel cover image or replace an existing one.
- Preview an existing channel cover in settings.
- Change the password by providing the current and new passwords.
- Confirm the new password in the frontend before submitting it.
- Sign in again after a successful password change.
- Receive validation errors and save confirmations in the interface.

Changing the username, deleting an account, and removing a cover image without replacing it are not implemented.

## 5. Video discovery and search

- Browse published videos on the Discover page.
- Search video titles and descriptions by keyword.
- Sort discovery and search results by latest publication records or popularity based on view counts.
- Filter videos by creator through the channel page and owner-filter API.
- Navigate paginated video results.
- Open a video's watch page from its card.
- Open a creator's channel from a video card.
- Display video thumbnails, titles, creator names and avatars, durations, view totals, and creation dates.
- Show useful empty states when there are no videos or search matches.

The watch page also displays a small selection of other published videos under “Keep exploring.” This is a recent-video selection, not a personalized recommendation engine.

## 6. Video playback and sharing

- Watch accessible MP4 or WebM videos through the browser's native video player.
- Use browser-provided playback controls, such as play/pause, seeking, volume, and fullscreen where supported.
- Display a thumbnail as the player's poster before playback.
- View the title, description, creator identity, subscriber count, view count, and creation date.
- Display the viewer's video-like and channel-subscription state when available.
- Subscribe or unsubscribe from the creator on the watch page.
- Like or unlike the video.
- Save the video to a private playlist.
- Copy the watch-page URL to the clipboard, with success or error feedback.
- Read and write comments beneath the video.
- Show playback errors when media cannot be played.
- Record a playback event once per mounted player session in the frontend.
- Record the video in watch history when playback starts while signed in.

Actual playback depends on browser codec support. View totals count explicit playback events; they are not verified counts of unique viewers.

## 7. Uploading and managing videos

### Upload

- Upload a video file with a separate thumbnail.
- Provide a title and optional description.
- Read video duration metadata in the frontend, including a fallback for WebM recordings without a duration header.
- Choose draft or published visibility.
- Default new uploads to draft status.
- Display upload progress and a processing message while awaiting completion.
- Validate supported file types, file signatures, and size limits.
- Save media references and metadata in the database.
- Return to the creator dashboard after a successful upload.

### Manage existing content

- View a paginated list of your own videos.
- Open your own drafts from the studio.
- Edit a video's title and description.
- Replace its thumbnail or keep the existing thumbnail.
- Publish a draft or return a published video to draft status.
- Delete your own videos through a confirmation dialog.
- Clean up associated comments, likes, playlist memberships, and history references during video deletion.
- Attempt removal of the stored video and thumbnail assets during deletion.

Only the owner can edit, publish, unpublish, or delete a video. Drafts are excluded from public discovery and cannot be opened through another user's video-detail request. Replacing the underlying video file on an existing video is not implemented.

## 8. Creator dashboard

The creator studio provides:

- Total owned-video count, including drafts.
- Published-video count.
- Total views across owned videos.
- Channel subscriber count.
- Total likes received on owned videos.
- A content table with thumbnails, titles, visibility, creation dates, and view counts.
- Shortcuts to upload, watch, edit, change visibility, and delete videos.
- Pagination for the content list.
- An empty state for creators who have not uploaded anything yet.

Statistics are aggregate totals. Time-series charts, revenue, watch-time analytics, retention reports, and historical growth comparisons are not implemented.

## 9. Channels and subscriptions

- View a public channel by username.
- Display its cover image, profile picture, full name, username, and subscriber count.
- Show a decorative fallback when a channel has no cover image.
- Browse the channel's published videos.
- Read its community posts.
- View its subscriber list with public user identities.
- Subscribe or unsubscribe from another channel.
- Show the current subscription state on channel and watch pages.
- Prevent self-subscription and subscriptions to nonexistent channels.
- Avoid duplicate subscription records through a unique subscriber/channel index.
- Use explicit subscribe/unsubscribe API operations that are safe to repeat.
- Retain the original subscription-toggle endpoint for compatibility.
- List the channels followed by the signed-in user.
- Display followed creators and their published-video feed on the Subscriptions page.
- Expose the number of channels a creator follows in the channel-profile API.

Public channel and subscriber responses omit private account email addresses.

## 10. Community posts

- Browse a public community feed.
- Browse posts belonging to a specific channel.
- Create text posts while signed in.
- Display post authors, avatars, usernames, timestamps, and content.
- Edit your own posts.
- Delete your own posts after confirmation.
- Reject another user's attempts to edit or delete your posts.
- Validate post content and apply a 2,000-character limit.
- Paginate post lists with a stable creation-time and ID ordering.
- Keep post IDs in responses so frontend edit/delete actions can address the correct post.
- Remove associated post-like records when a post is deleted.

Community posts currently contain text. Image attachments, video attachments, threaded replies, and reposts are not implemented.

## 11. Comments and reactions

### Comments

- Read paginated comments on accessible videos.
- Add a comment while signed in.
- Display comment author identity and creation date.
- Edit your own comments.
- Delete your own comments after confirmation.
- Enforce comment ownership on mutations.
- Validate comment content and apply a 2,000-character limit.
- Remove associated comment-like records when a comment is deleted.

### Reactions

- Like and unlike videos from the watch page.
- Display a video's like total and the current user's like state.
- Browse liked videos in a dedicated library page.
- Avoid duplicate likes for the same user and target through unique indexes.
- Support liking and unliking **comments and community posts through the API**.

Comment/post like buttons are not currently present in the frontend. Dislikes and emoji reactions are not implemented.

## 12. Playlists

- Create private playlists with a name and optional description.
- Browse your own playlists.
- Display playlist names, descriptions, and stored membership counts.
- Open a playlist and browse its accessible videos with pagination.
- Save a video to an existing playlist from the watch page.
- Create a playlist and save the current video in the same frontend flow.
- Prevent duplicate membership when adding the same video repeatedly.
- Remove a video from a playlist.
- Move a video to the top of the playlist through the interface.
- Submit a complete custom video order through the playlist API.
- Edit a playlist's name and description.
- Delete a playlist after confirmation without deleting its underlying videos.
- Restrict playlist access and changes to its owner.
- Limit a playlist to 500 videos.

Public, shared, and collaborative playlists are not implemented. Playlist views filter out videos that are no longer accessible to the viewer.

## 13. Watch history and personal library

- View recently watched videos while signed in.
- Automatically record history when a signed-in user starts playback.
- Keep the most recently watched video first.
- Deduplicate repeat watches instead of adding duplicate entries.
- Retain up to 500 distinct recent videos.
- Paginate history results.
- Clear the complete watch history through the interface.
- Remove an individual history entry through the API.
- Exclude videos the viewer can no longer access.
- Keep private user fields out of history responses.
- Access liked videos and private playlists from the main navigation.

Individual history-removal buttons, playback-position resume, and a pause-history setting are not currently implemented in the frontend.

## 14. Media storage and file handling

| Capability | Current behavior |
|---|---|
| Video formats | MP4 and WebM uploads. |
| Image formats | JPEG, PNG, and WebP. |
| Video upload size | Up to 250 MB per video file. |
| Image upload size | Up to 10 MB per image. |
| Video duration validation | Greater than zero and at most 86,400 seconds. |
| Cloud storage | Cloudinary integration for media upload and deletion. |
| Local storage | Optional development storage under `data/media`, or a configured directory. |
| Temporary uploads | Unique filenames in a staging directory outside public static assets. |
| File validation | MIME allowlists plus basic file-header checks. These do not fully decode or scan the file. |
| Cleanup | Temporary-file cleanup after completed responses and cleanup attempts for failed upload workflows. |
| Asset replacement | Store new asset references before attempting old-asset removal. |
| Local draft delivery | Owner authentication is required to retrieve a local draft video file. |
| Legacy descriptions | Read compatibility for the original `decription` field. |

Cloudinary delivery URLs are not signed private-media URLs. Restricting draft metadata does not make a known unsigned Cloudinary URL private. Media cleanup is best-effort; durable retry queues are not implemented.

## 15. Frontend experience

- Responsive desktop, tablet, and mobile layouts.
- Desktop sidebar and collapsible mobile navigation.
- Active navigation indicators.
- Global video search.
- Creator shortcuts and account access in the header.
- Reusable video cards, avatars, forms, pagination, and dialogs.
- Avatar initials as a fallback when an image is missing or fails to load.
- Loading indicators, empty states, validation errors, and success feedback.
- Confirmation dialogs for video, post, comment, and playlist deletion.
- Disabled submit controls during many ongoing mutations.
- Upload progress feedback.
- Labeled inputs, keyboard-operable controls, visible focus styles, and a skip-to-content link.
- Native modal dialogs for playlist actions and confirmations.
- Reduced-motion styling for users who request it.
- Cached API data and targeted cache refreshes after mutations.
- Cancellation support for eligible data requests.
- A not-found screen for unknown frontend routes.
- Direct-link and browser-refresh support when served by the backend's frontend fallback.

These are implemented accessibility provisions, not a certification of accessibility compliance.

## 16. Frontend page inventory

| Route | Page |
|---|---|
| `/` | Discover videos. |
| `/search?q=...` | Search results. |
| `/register` | Registration. |
| `/login` | Login. |
| `/watch/:videoId` | Video player, metadata, reactions, comments, and playlist saving. |
| `/channel/:username` | Channel profile, videos, community posts, and subscribers. |
| `/community` | Community feed and post composer. |
| `/subscriptions` | Followed channels and their published videos. |
| `/history` | Watch history. |
| `/liked` | Liked videos. |
| `/playlists` | Private playlist library. |
| `/playlist/:playlistId` | Playlist contents and management. |
| `/studio` | Creator statistics and video management. |
| `/studio/upload` | Video upload. |
| `/studio/edit/:videoId` | Video metadata and thumbnail editing. |
| `/settings` | Profile, images, and password settings. |

## 17. Backend and API capabilities

- Versioned REST endpoints under `/api/v1`.
- Routers for users, videos, community posts, subscriptions, dashboard, comments, likes, playlists, and health checks.
- JSON and multipart form handling.
- Cookie parsing and authenticated route middleware.
- Optional authentication on supported public reads for viewer-specific information.
- Shared JSON response envelopes with status, data, message, and success fields.
- Centralized error handling for validation, duplicate records, malformed JSON, invalid IDs, and upload failures.
- Pagination with a default of 12 items and a maximum of 100 per request.
- ObjectId, text, email, password, and boolean validation helpers.
- Ownership checks for content and private-library mutations.
- Password hashing using bcrypt.
- JWT signature verification and refresh-token comparison/rotation.
- Credentialed CORS with configurable allowed origins.
- Origin checks for browser write requests.
- In-process request limits for general API traffic and selected authentication, upload, and view endpoints.
- `Retry-After` information when the rate limiter rejects requests.
- A `nosniff` response header and removal of the Express identification header.
- A public application health endpoint and a MongoDB readiness endpoint.
- Optional serving of built frontend assets from the backend.
- Preservation of the original backend controller structure and learning comments, with targeted enhancements and separate controllers for new capabilities.

Detailed endpoint methods, paths, and request contracts are listed in [Backend Implementation](docs/BACKEND_IMPLEMENTATION.md).

## 18. Database features

| Model | Responsibility |
|---|---|
| User | Account details, password hash, session data, profile media, and history references. |
| Video | Media references, title, description, duration, views, publication state, and ownership. |
| Subscription | Relationship between a subscriber and a creator. |
| Tweet | Text community posts and their authors. |
| Comment | Video comments and their authors. |
| Like | User reactions targeting videos, comments, or community posts. |
| Playlist | Private collections, metadata, owner, and ordered video references. |

The models use MongoDB IDs and creation/update timestamps. Added indexes support video queries and prevent duplicate subscriptions and per-target likes. Existing databases may need the explicit migration/index setup before these constraints are fully available.

## 19. Development and testing features

### Run modes

| Command, from the project root | Purpose |
|---|---|
| `npm run dev` | Run the configured backend with automatic restarts. |
| `npm start` | Start the configured backend without nodemon. |
| `npm run dev:local` | Run a separate local development database and local media without loading the existing `.env`. |
| `npm run dev --prefix frontend` | Start the frontend development server with API/media proxying. |
| `npm run build --prefix frontend` | Check TypeScript and build production frontend assets. |
| `npm test` | Run backend integration tests. |
| `npm run test:e2e --prefix frontend` | Run browser-flow tests against a temporary backend and database. |
| `npm run migrate` | Run the explicit legacy-description/session-field migration and index setup. |

Install backend and frontend dependencies before using these commands. Browser tests require the frontend build and installed Chrome as configured in the test setup.

### Local development support

- Persistent local development database and media under `data/`.
- No need to use the project's existing hosted database or Cloudinary account in local mode.
- No built-in demo accounts or placeholder videos in the application.
- A secret-free `.env.example` configuration reference.
- Backend serving of a built frontend at port 8000.
- Vite development proxying from port 5173 to the backend on port 8000.
- Ignored database files, media, build output, and browser-test artifacts.
- Retained legacy description data during migration rather than automatic deletion.
- Detection of duplicate subscriptions before migration index creation.

### Automated verification

The implemented suite contains **10 backend integration scenarios and 2 browser-flow scenarios**. These passed during the implementation verification; they were not rerun solely for this documentation update.

Backend coverage includes account validation, cookie sessions, refresh replay rejection, password changes, ownership checks, concurrent subscription requests, publication visibility, uploads, comments, likes, playlists, history, and deletion cleanup.

Browser coverage includes registration, login, generating and uploading a playable WebM, publishing, playback, video likes, playlist saving, comments, post editing, profile changes, logout, protected-page redirects, mobile navigation, search, and direct-link refresh.

Tests use temporary databases and test media rather than the project's existing account data. Desktop and mobile screenshots and failure traces are supported by the browser-test setup.

## 20. Features not currently implemented

These should not be presented as working features:

- OAuth or social-provider login.
- Password recovery/reset and email verification.
- Account deletion or username changes.
- Administrator/moderator dashboards, content reporting, or moderation queues.
- Notifications, direct messages, or live chat.
- Livestreaming, dedicated short-video feeds, or scheduled publishing.
- Automatic video encoding/transcoding or adaptive-quality streaming.
- Uploaded subtitles, automatic captions, transcripts, or caption management.
- Personalized recommendations, semantic search, or category/tag filters.
- Watch-time, retention, revenue, or historical-growth analytics.
- Verified unique-view counting or view-fraud detection.
- Public/collaborative playlists and drag-and-drop playlist ordering.
- Community attachments, threaded replies, reposts, dislikes, or emoji reactions.
- A dedicated download-video feature or offline playback.
- Payments, subscriptions with billing, advertising, or monetization.
- Signed private Cloudinary video delivery.
- Distributed rate limiting, background cleanup jobs, or transactional recovery for interrupted multi-collection deletes.

The older README's numeric performance, recommendation-accuracy, streaming-latency, and uptime claims were not established by this implementation and are not verified project features.

## Related documentation

- [Backend implementation and API contracts](docs/BACKEND_IMPLEMENTATION.md)
- [Frontend setup and commands](frontend/README.md)
- [Original backend research and frontend blueprint](docs/PLAYGRID_FRONTEND_RESEARCH.md) — describes the earlier research snapshot, before the implementation additions.
