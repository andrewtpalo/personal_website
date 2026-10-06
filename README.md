# andrewtpalo.com

Personal site of Andrew Palo, Senior Cybersecurity Engineer. Built with Vue 3, Vite, and TypeScript, with no UI framework and no third-party requests.

## What's in it

- **Interactive terminal** (`src/lib/shell.ts`): a small command interpreter with tab completion, history, a virtual filesystem, and clickable output. Type `help`, or press `/` anywhere on the page to focus it.
- **Platform architecture**: the security analytics platform as an animated data-flow diagram plus a CI/CD pipeline.
- **HITL agent pattern**: a simulated human-in-the-loop multi-agent run with an append-only audit log.
- **Live Kalman filter** (`src/lib/kalman.ts`): a constant-velocity filter tracking a noisy sonar range during an echoic-flow (τ̇ = 0.5) approach, with tunable noise and live RMSE.
- **Self-audit** (`src/lib/audit.ts`): the page checks its own CSP, Trusted Types, cookies, and third-party requests in your browser. It can also actively try `eval` and a raw `innerHTML` write to show that both get blocked.
- **Fingerprint demo** (`src/lib/fingerprint.ts`): shows the passive signals a browser exposes and hashes them with SHA-256. It runs entirely locally.

All content lives in [`src/data/profile.ts`](src/data/profile.ts).

## Security posture

Production builds inject a strict Content-Security-Policy `<meta>` (see `vite.config.ts`):
`default-src 'none'`, same-origin scripts and styles only, no inline script, no `eval`, `object-src 'none'`, and **Trusted Types required**.
Fonts are self-hosted through Fontsource, so nothing loads from a CDN.

A few protections only work as real HTTP response headers (`frame-ancestors`, HSTS, `nosniff`, `Permissions-Policy`, COOP/CORP). `firebase.json` sets them at the host, along with immutable caching for hashed `/assets/**`.

## Develop

Requires Node ≥ 22.12.

```sh
npm install
npm run dev        # dev server (CSP is not injected in dev)
npm test           # vitest: shell + Kalman filter
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally
```

## Deploy

Hosted on Firebase Hosting (project `personal-website-3621c`, serving andrewtpalo.com).

```sh
npm run deploy     # test + type-check + build + firebase deploy --only hosting
```

To check a build on a temporary URL first: `firebase hosting:channel:deploy preview --expires 1d`.
To roll back, use Hosting → Release history in the Firebase console.

The resume PDF is gitignored because it contains contact details. Put the current `Andrew_Palo_Resume.pdf` in `public/` before building.
