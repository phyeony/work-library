# Work Library

A phone web app for putting picture books back on the shelf. Scan a book's barcode, search its title, or say it out loud, and the app tells you:

- **which bookcase**, **which row** (counted from the bottom) and **which month/week** it belongs to
- its **position** in the row (e.g. "#14 of 52")
- the books that go **to its left and right**

Books whose title appears in more than one place show every location.

## How it works

- **SvelteKit** (adapter-node) in one container, **SQLite** on a persistent volume.
- **Google login is required on every page.** Visitors are sent straight to Google sign-in. Only emails on the allowlist get in.
- **Super users** come from `ADMIN_EMAILS` (default: `phyeony@gmail.com`). Only they see the **Users** page to add or remove allowed emails, and super user status can't be granted from inside the app.
- The book lists come from the original Google Sheet, saved as CSV in [`seed/`](seed/), and are imported **once** on first start. After that, edit everything in the app. The app never contacts the sheet.
- **Barcodes:** the first time you scan a book, link it to its title. Do this one row at a time in **Shelves → 🔗 Link barcodes**. Open Library / Google Books suggest the title when they know the ISBN. Many Korean books aren't in those databases; you still link them the same way.
- **Search** and **speech** use fuzzy matching, so typos and partial titles still work. Speech uses the browser's built-in recognition (Safari, Chrome) with a 한국어/English toggle.

## Local development

```sh
cp .env.example .env      # set SESSION_SECRET (openssl rand -hex 32) and the Google client ID/secret
npx npm@11 install        # npm 10.9 crashes on this dependency tree
npm run dev
```

Sign-in uses Google even locally, so you need an OAuth client with the redirect URI `http://localhost:5173/login/google/callback` (see below). The seed data is imported into `local.db` on first start.

The camera and microphone need HTTPS, and Google sign-in doesn't accept private IP addresses like `192.168.x.x` as redirect URIs. So test scanning and speech on a phone against the deployed site (your real domain), not the Mac's LAN address.

Other commands:

```sh
npm test                    # unit tests
npm run check               # type check
npm run import -- --force   # re-import seed/*.csv into DATABASE_URL (replaces shelves and books, keeps barcode links and users)
```

## Google OAuth setup

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project. Under **APIs & Services → OAuth consent screen**, set it up as *External* with the app name and your email. Only the default `openid`, `email` and `profile` scopes are used. Either publish the app or add every family member under *Test users*.
2. Under **Credentials → Create credentials → OAuth client ID**, choose **Web application** and add these authorized redirect URIs:
   - `https://books.goshiwonseoul.com/login/google/callback`
   - `http://localhost:5173/login/google/callback` (for running locally)
3. Put the client ID and secret in `.env` for local use, and in `homelab/secrets/work-library.yml` for the cluster.

## Deploying (Argo CD + GitHub Actions)

The Kubernetes manifests live in the **homelab** GitOps repo at `apps/work-library/`, and the Argo CD Application is at `bootstrap/apps/work-library.yml`. This repo only builds the image.

```
push to main ──▶ GitHub Actions (.github/workflows/release.yml)
                   1. npm run check + npm test
                   2. build ghcr.io/phyeony/work-library:<sha> (linux/amd64) and push
                   3. commit `newTag: "<sha>"` to homelab/apps/work-library/kustomization.yml
                                   │
                                   ▼
                 Argo CD (auto-sync) ──▶ rolls out the new pod
```

Rolling back means reverting that commit in homelab.

### One-time setup

1. **GitHub repo:** create `phyeony/work-library` and push this code.
2. **Token for CI:** create a fine-grained personal access token with access to **only** `phyeony/homelab` and permission **Contents: Read and write**. Save it in this repo under *Settings → Secrets and variables → Actions* as `HOMELAB_TOKEN`.
3. **Image visibility:** after the first workflow run, open the `work-library` package on GitHub (*your profile → Packages*) and set it to **Public**, so the cluster can pull it without credentials. The image contains no secrets. Otherwise, add an `imagePullSecret`.
4. **App secret:** fill in the Google client ID/secret in `homelab/secrets/work-library.yml` (git-ignored; `SESSION_SECRET` is already generated), then run `kubectl apply -f secrets/work-library.yml`.
5. **Google OAuth:** add `https://books.goshiwonseoul.com/login/google/callback` to the client's redirect URIs.
6. **Cloudflare:** in your tunnel, add a public hostname `books.goshiwonseoul.com`, service type **HTTP**, URL `work-library.work-library.svc.cluster.local:80`. The tunnel goes straight to the app's Service. There's no Ingress or Traefik in the path.
7. **Push homelab.** The root app picks up `bootstrap/apps/work-library.yml`.

The first start runs the database migrations and imports the seed lists. The pod logs say `Imported 378 books from seed data`.

### Notes

- **One replica only** (SQLite). The deployment uses `strategy: Recreate`.
- **HTTPS is handled by Cloudflare.** The tunnel talks plain HTTP to the Service. The app assumes `https://` and takes the host name from the `Host` header, which the tunnel passes through. Don't set `PROTOCOL_HEADER`: it would report `http`, which breaks Google sign-in and form submissions.
- **Backups:** `work-library-backup` runs nightly and writes `/data/backups/library-YYYY-MM-DD.db`, keeping 14 days. Run one now with `kubectl -n work-library create job --from=cronjob/work-library-backup backup-now`, and copy one off the cluster now and then with `kubectl cp`.
- **Re-importing the lists** in the cluster: copy the database out with `kubectl cp`, run `DATABASE_URL=./library.db npm run import -- --force` locally, then copy it back and restart the pod.

## Project layout

| Path | What it is |
|---|---|
| `seed/*.csv`, `seed/mapping.ts` | The original sheet tabs and how their columns map to bookcases and rows |
| `src/lib/server/import.ts` | CSV → shelves/rows/books. `/` splits multi-book cells; `-` cells are skipped |
| `src/lib/server/library.ts` | Queries: locate a title, neighbors, edits, barcode links |
| `src/lib/order.ts`, `titleKey.ts`, `isbn.ts` | Pure logic (unit-tested) |
| `src/lib/components/` | Scanner (camera + barcode WASM, self-hosted), speech, search, location card |
| `src/routes/` | Find (`/`), Shelves, book edit, Link mode (`/rows/[id]/link`), Users (`/admin/users`), login |
| `drizzle/` | SQL migrations, applied on startup |
| `.github/workflows/release.yml` | Test, build, push the image, and bump the tag in homelab |
