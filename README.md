# Country Feature Voting

A no-backend Trello Power-Up MVP for structured internal country voting on feature request cards.

Country managers can vote directly on Trello cards, Trello card fronts show compact voting badges, card backs show vote details, and board users can export a CSV report for monthly prioritization.

## Features

- Card button: **Vote as Country**
- One vote per Trello member per card
- Vote types: Support, Blocker, Nice to have
- 200 character limit on vote comments
- Compact internal vote storage to reduce Trello plugin data usage
- Card badge with total votes and unique country count
- Red badge when any country has voted Blocker
- Card back vote summary table
- Board-level voting report
- CSV export for prioritization reporting
- Board settings for allowed countries
- No REST API auth, backend, database, or paid services

## File Structure

```text
public/
  icon.svg
src/
  index.html       Power-Up connector page
  main.ts          TrelloPowerUp.initialize capabilities
  vote.html        Card voting popup
  vote.ts          Vote save/remove workflow
  section.html     Card back vote summary iframe
  section.ts       Card back table rendering
  report.html      Board report modal
  report.ts        Report aggregation and export trigger
  settings.html    Board settings modal
  settings.ts      Allowed country settings
  storage.ts       t.get/t.set helpers and vote model mapping
  csv.ts           CSV generation and download
  styles.css       Shared UI styles
```

## Data Model

Votes are stored on the card using Power-Up card scoped shared plugin data:

```ts
await t.set('card', 'shared', 'votes', votes);
```

To reduce Trello plugin data usage, the stored fields are compact:

```json
{
  "m": "abc123",
  "n": "Jane Smith",
  "c": "South Africa",
  "v": "b",
  "x": "Needed for a key customer renewal",
  "ca": "2026-04-28T10:00:00.000Z",
  "ua": "2026-04-28T10:00:00.000Z"
}
```

Field mapping:

- `m`: member id
- `n`: member name
- `c`: country
- `v`: vote type code, where `s` = Support, `b` = Blocker, `n` = Nice to have
- `x`: optional comment
- `ca`: created at
- `ua`: updated at

Allowed countries are stored on the board:

```ts
await t.set('board', 'shared', 'allowedCountries', countries);
```

Default countries:

- South Africa
- Italy
- Brazil
- United States

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

For Trello testing, the connector must be served over HTTPS. A simple MVP option is to expose the local server with a secure tunnel such as ngrok or Cloudflare Tunnel, then use the HTTPS URL as the Power-Up iframe connector URL.

Example connector URL:

```text
https://your-secure-tunnel.example.com/
```

## Build

```bash
npm run build
```

The production build is written to `dist/`.

Preview the build locally:

```bash
npm run preview
```

## Deployment

Host the built `dist/` folder on any static HTTPS host, for example:

- Netlify
- Vercel
- Cloudflare Pages
- Azure Static Web Apps
- AWS S3 plus CloudFront

The deployed URL must be HTTPS because Trello loads Power-Up connector pages inside Trello.

## Trello Power-Up Admin Setup

1. Go to https://trello.com/power-ups/admin.
2. Create a new Power-Up.
3. Set the iframe connector URL to your deployed HTTPS URL, for example `https://your-domain.example.com/`.
4. Enable these capabilities:
   - `card-buttons`
   - `card-badges`
   - `card-back-section`
   - `card-detail-badges`
   - `board-buttons`
   - `show-settings`
5. Save the Power-Up configuration.
6. Add the Power-Up to your Trello feature request board.
7. Use the board button **Voting Settings** to edit the allowed countries if needed.

## CSV Export

The board report exports one row per vote with these columns:

- Card ID
- Card Name
- List Name
- Card URL
- Total Votes
- Countries
- Blocker Count
- Voter Name
- Voter Country
- Vote Type
- Comment
- Updated At

This is intended for a BA preparing a monthly product prioritization report.

## MVP Limitations

Board reporting only includes visible cards: open cards in open lists. Archived cards and cards inside archived lists are not included by Trello's `t.cards()` client library method.

Trello shared plugin data writes are not atomic. Rare simultaneous vote saves on the same card can collide, where the later write may overwrite a previous write that happened at nearly the same time.

Trello Power-Up plugin data has a 4096 character limit for each scope and visibility pair. This MVP limits comments to 200 characters and uses compact field names, but cards with many votes can still eventually hit the limit. When Trello rejects a save for this reason, the UI shows a friendly storage-limit error.

The MVP does not use Trello REST API auth, external storage, or a backend. That keeps setup simple, but it means reporting depends on what the Power-Up client library can access in the current board context.

## Future Improvements

- Optional backend or REST-authenticated report export for archived-card reporting.
- Conflict-resistant vote updates with server-side storage.
- Board-level snapshots for historical month-end reporting.
- Role-based country assignment to reduce manual country selection.
- Filters by list, country, blocker status, or updated date.
- Chart summaries for blocker trends and country coverage.
