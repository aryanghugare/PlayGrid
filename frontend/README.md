# PlayGrid frontend

React + TypeScript + Vite + Tailwind CSS, with React Router and TanStack Query. All video feeds and user content come from the backend. The public homepage uses original AI-generated promotional artwork stored locally in `public/images/home/`; it does not represent uploaded videos or real members. There are no seed accounts or placeholder videos in the application.

## Development

From the project root, install backend dependencies with `npm install` and frontend dependencies with `npm install --prefix frontend`.

Choose one backend mode:

- `npm run dev`: use your existing `.env` and MongoDB/Cloudinary configuration.
- `npm run dev:local`: use an isolated local development database and local media. It does not read `.env`. Files persist under `data/`; signing keys change on restart, requiring a new login. The first run downloads a MongoDB executable.

In a second terminal run `npm run dev --prefix frontend`, then open `http://localhost:5173`. Vite proxies `/api` and `/media` to port 8000, so browser cookies use one origin.

Create an account with a profile image, sign in, open Creator studio, and upload an MP4/WebM with a thumbnail. Select Published to make it appear on Discover. The default visibility is Draft.

## Build and tests

- `npm run build --prefix frontend`: TypeScript checks and production assets.
- Start/restart the backend after building to serve the frontend directly at `http://localhost:8000`.
- `npm test`: isolated backend integration suite.
- `npm run test:e2e --prefix frontend`: Chrome browser tests using a temporary MongoDB and media folder. Build first. Uses installed Google Chrome; change `channel` in `playwright.config.ts` if needed.

Browser tests create their own account and generate a short playable WebM in the browser. They exercise registration, login, upload/publish, playback, likes, comments, playlists, post editing, settings, logout, protected routes, mobile navigation, search and deep-link refresh. Test artifacts are ignored by Git.

## Screens

Public homepage at `/` with feature descriptions, keyboard-accessible use-case tabs, and Explore links to the existing discovery page at `/explore`.

Discover/search; login/register; channels and subscribers; community; watch with comments, likes and save-to-playlist; subscription feed; history; liked videos; private playlists with edit/delete, membership removal and ordering; creator dashboard/upload/edit/publication/delete; profile/images/password settings.

Session cookies are HttpOnly. The API client shares refresh requests and never puts refresh tokens in localStorage. Inputs and pages include loading/error/empty states. The responsive layout uses keyboard-accessible links, buttons and native dialogs. Fonts are loaded from Google Fonts with system fallbacks.

## Scope

This is an MVP for the implemented REST APIs. It does not add password reset, email verification, OAuth, transcoding, recommendation ranking, notifications, or streaming analytics. See `../docs/BACKEND_IMPLEMENTATION.md` for media privacy and deployment boundaries.

## Styling

Use Tailwind utilities for new UI. Tailwind is compiled through `@tailwindcss/vite`; `src/tailwind.css` imports the theme and utilities without Preflight to preserve the existing app reset. The homepage uses utilities directly in `Home.tsx`, including responsive and interaction variants. Its `home-*` classes are section markers, not a separate stylesheet. Existing screens retain their styles in `src/styles.css`.

Vite integration follows the [official Tailwind guide](https://tailwindcss.com/docs/installation/using-vite); the reset is omitted as described in [Preflight documentation](https://tailwindcss.com/docs/preflight).
