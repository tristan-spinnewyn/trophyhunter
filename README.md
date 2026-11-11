# 🎮 TrophyHunter

A self-hosted game tracker for **Steam, Xbox, Epic Games and GOG**, plus games from other platforms added by hand: what you are playing, what is next, what you finished. Achievements come as a bonus, with checklists and French guides for the games you want to complete. The interface is in French and installs on a phone as a PWA.

---

## ✨ Features

* **Collection organised by status**: *Non trié*, *Backlog*, *En cours*, *En pause*, *Terminé*, *Abandonné*, *Pas intéressé*. Imported games land in *Non trié*; the backlog only holds games put there on purpose. *Pas intéressé* sets aside a game you will never launch (bundle filler): it sits on the last shelf and no longer counts as left to sort. In-progress games and the backlog come first; the rest (paused, unsorted, finished, abandoned, not interested) is folded. The unsorted shelf has a quick-sort mode: one game at a time, one key per shelf, with a status suggested from playtime and achievements. The backlog is a queue: "Jouer ensuite" on a backlog game puts it at the head of the shelf, and queued spines carry their position. With IGDB keys set (see below), backlog spines show how long each game takes to beat, and the game dialog spells out the quick, usual and 100 % times. The backlog shelf adds them up and, from the play sessions of the last 90 days, says how long the whole backlog takes at the current pace. Spines can also be dragged (mouse, touch or keyboard) to reorder the queue; a game dropped among queued ones joins the queue there. An in-progress game with no session for six weeks (the delay is set in the settings) is offered a pause, or kept in progress, which restarts the delay. When a sync finds a session on a backlog game played since it was queued, the collection offers to move it to *En cours*. Finished and abandoned games can be rated from 1 to 5 stars with a short review on their page; the rating also shows when a game is taken off the shelf. In-progress and paused games take a short resume note on their page (where you left off, what to do next); it is recalled on the in-progress card and when a paused game is taken off the shelf. The finished shelf is split by the year each game was finished, latest first; games finished before completion dates were recorded sit under *Date inconnue* until their finish date is set on the game page. Sorted by recent activity by default, using the real last session reported by the platform when available.
* **Yearly goals**: on *Mon année*, set a target for the year in games finished, hours played or games taken off the backlog (counted from the backlog size when the goal is set). Each goal shows a gauge and, for the current year, whether you are ahead of or behind a steady pace; the home page sums up the current year's goals.
* **Play journal**: each sync compares the playtime a platform reports with the previous one and records the difference as a play session. The collection opens on *Cette semaine*, the time played on each game over the last seven days. Steam and GOG report playtime; Xbox and Epic Games do not, so their games never show there.
* **Mon année**: a yearly review page with the games finished and abandoned that year, the hours played, the platform and game of the year, the games completed at 100 % and the best ratings; earlier years stay one click away.
* **Platform accounts** (Steam, Xbox, Epic Games, GOG): import your games, playtime and achievements without sharing a password. Optional keys or tokens (Steam API key, OpenXBL key, Epic authorization code, GOG session token) unlock private profiles and achievement details.
* **Games from other platforms**: Nintendo Switch, PlayStation and other (physical copies…) games are added by hand from the add-game dialog, through the Steam search or by typing their title. They get statuses, ratings and the year review like any other game, and their playtime is typed on their page; each increase counts as a play session.
* **Library views**: one tab per platform, PC Game Pass catalogue, cross-platform duplicates, wishlist and custom collections. The wishlist keeps games you do not own yet (with their name and cover); when a sync brings one into the collection, the library offers to put it in the backlog. Steam and GOG wishes show their current price in France, checked once a day by the server; set a target price and the collection tells you when it is reached.
* **Achievements as a bonus**: per-game checklist with rarity, missable and secret achievements (spoilers hidden), personal notes, an "active hunt" list of pinned targets, and links to the PSTHC guide, Steam guides and French YouTube videos.
* **Automatic sync**: in the settings, the server can sync every connected platform on its own every 6, 12 or 24 hours, using the stored keys and tokens (Epic Games needs a recent sign-in, since its tokens expire).
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
* **Time to beat (optional).** Durations on the backlog come from the [IGDB API](https://api-docs.igdb.com/). Create an application in the [Twitch developer console](https://dev.twitch.tv/console/apps) and set `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET`. Without them, no duration is shown. Steam and GOG games are matched by store id, the others by exact name; results are cached in the database (a month for found games, a week for unknown ones), and only signed-in users trigger lookups.
* **Automatic sync.** The server checks every 15 minutes for users whose automatic sync is due (off by default, chosen per user in the settings). Set `AUTO_SYNC_ENABLED=false` to turn the scheduler off for the whole instance.
* **Data volume.** The Docker image keeps the database and the generated key in `/app/data`; mount a volume there.

---

## 🛡️ Code quality and CI

* **Protected `main`**: no direct pushes; every change goes through a pull request, merged by squash, and the branch must be up to date with `main` before merging.
* **Required `ci` check**: lint, type check, unit tests with coverage, coverage of new code, production build and Docker build.
* **Coverage ≥ 80%**: Vitest and the diff coverage script require at least 80% of lines, statements and functions covered, on the whole code base and on new code.
* **Dependabot**: daily npm checks and weekly GitHub Actions and Docker checks; non-major updates are approved and merged automatically once CI is green.
