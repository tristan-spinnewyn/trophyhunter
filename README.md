# 🎮 TrophyHunter

A self-hosted game tracker for **Steam, Xbox, Epic Games and GOG**: what you are playing, what is next, what you finished. Achievements come as a bonus, with checklists and French guides for the games you want to complete. The interface is in French and installs on a phone as a PWA.

---

## ✨ Features

* **Collection organised by status**: *Non trié*, *Backlog*, *En cours*, *En pause*, *Terminé*, *Abandonné*. Imported games land in *Non trié*; the backlog only holds games put there on purpose. In-progress games and the backlog come first; the rest (paused, unsorted, finished, abandoned) is folded. The unsorted shelf has a quick-sort mode: one game at a time, one key per shelf, with a status suggested from playtime and achievements. The backlog is a queue: "Jouer ensuite" on a backlog game puts it at the head of the shelf, and queued spines carry their position. When a sync finds a session on a backlog game played since it was queued, the collection offers to move it to *En cours*. Sorted by recent activity by default, using the real last session reported by the platform when available.
* **Platform accounts** (Steam, Xbox, Epic Games, GOG): import your games, playtime and achievements without sharing a password. Optional keys or tokens (Steam API key, OpenXBL key, Epic authorization code, GOG session token) unlock private profiles and achievement details.
* **Library views**: one tab per platform, PC Game Pass catalogue, cross-platform duplicates, wishlist and custom collections.
* **Achievements as a bonus**: per-game checklist with rarity, missable and secret achievements (spoilers hidden), personal notes, an "active hunt" list of pinned targets, and links to the PSTHC guide, Steam guides and French YouTube videos.
* **Backup**: export and import your data as JSON from the settings.

---

## 🚀 Commands (pnpm)

```bash
pnpm dev            # development server on http://localhost:3000
pnpm build          # production build
pnpm start          # production server
pnpm test           # unit tests
pnpm test:coverage  # unit tests with the 80% coverage gate
```

---

## 📱 Install it on your phone

1. Connect your phone to the same Wi-Fi network as the machine running the app.
2. Open `http://<your-machine-local-ip>:3000` in the phone's browser.
3. Add it to the home screen: **Share → Add to Home Screen** in Safari (iPhone), or **⋮ → Install app** in Chrome (Android). It then opens full screen like a native app.

---

## 🔐 Self-hosting notes

* **Run it behind a reverse proxy.** The login and registration rate limiter keys clients on the right-most `X-Forwarded-For` entry, i.e. the one appended by the proxy. If port 3000 is exposed directly, clients can forge that header to bypass the limit, and clients without it share a single bucket.
* **Encryption key.** Stored platform tokens are encrypted with a key read from `APP_ENCRYPTION_KEY` (64 hex chars, or any passphrase hashed with SHA-256). Without it, a key is generated in `data/.encryption_key`, in the same volume as the database, so a copy of the volume is enough to decrypt the tokens. Set `APP_ENCRYPTION_KEY` from a secret store in production, and keep it: changing it makes stored tokens unreadable.
* **Registration.** Sign-up is open only until the first account exists, so whoever reaches a fresh instance first becomes its owner: create your account right after deploying. Set `ALLOW_REGISTRATION=true` to keep sign-up open.
* **Data volume.** The Docker image keeps the database and the generated key in `/app/data`; mount a volume there.

---

## 🛡️ Code quality and CI

* **Protected `main`**: no direct pushes; every change goes through a pull request, merged by squash, and the branch must be up to date with `main` before merging.
* **Required `ci` check**: lint, type check, unit tests with coverage, coverage of new code, production build and Docker build.
* **Coverage ≥ 80%**: Vitest and the diff coverage script require at least 80% of lines, statements and functions covered, on the whole code base and on new code.
* **Dependabot**: daily npm checks and weekly GitHub Actions and Docker checks; non-major updates are approved and merged automatically once CI is green.
