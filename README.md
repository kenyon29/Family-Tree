# Family Tree

A web app for maintaining and printing a large family tree together.
Read-only browsing (pan/zoom/search/print) needs no login; a shared
passcode unlocks "Edit Mode" for adding and editing people.

**First time setting this up?** See [SETUP.md](./SETUP.md) — written for
non-programmers, no terminal needed.

## How it's built

- **Frontend:** React + Vite, plain SVG for the tree (custom pan/zoom,
  click-to-collapse/expand, search-and-center) — no charting/canvas
  library, so it renders identically on screen and in exported PDFs.
- **Backend:** a few small Vercel serverless functions under `api/` that
  proxy requests to the Airtable REST API. The Airtable API key lives only
  in a server-side environment variable; the browser never sees it. Writes
  (`POST`/`PATCH`) additionally require an `x-editor-passcode` header
  checked against the `EDITOR_PASSCODE` environment variable.
- **Data:** Airtable, two linked tables — `People` and `Marriages`. There
  is no separate "children" list: a person's children are derived by
  scanning for other people whose `Father` or `Mother` link points back to
  them (see `src/lib/familyData.js`).
- **PDF export:** `src/lib/pdfExport.js` builds a real, detached SVG
  document from the same layout engine used for the on-screen view, then
  hands it to `jspdf` + `svg2pdf.js`, which draws it into the PDF as vector
  paths/text (not a screenshot). Photos are embedded as raster images
  inside that vector page, same as any print-ready PDF with photographs.
  - **Export Full Tree** sizes one poster page to the tree's full
    width/height (capped near the ~200in ceiling PDF pages support).
  - **Export Branch** lays out just one person's descendants and tiles
    that across Letter pages automatically.

## Local development

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. The `api/` serverless
functions need Vercel's dev runtime to work locally — install the Vercel
CLI (`npm i -g vercel`) and run `vercel dev` instead of `npm run dev` once
you've set up a `.env` file (copy `.env.example`) with your Airtable
credentials and passcode.

## Free-tier limits to be aware of

Everything here is designed to run on Vercel's and Airtable's free plans.
For a tree of 200–500 people this should comfortably fit, but a few things
are worth knowing if the family tree keeps growing:

- **Airtable free plan:** 1,000 records per base and 1GB of attachment
  storage (shared across the whole base) at the time of writing. With two
  tables (`People` + `Marriages`), 500 people plus a similar number of
  marriage records stays well under the record limit. Attachment storage
  is the more likely thing to watch — a few hundred portrait photos will
  add up. If you get close to the attachment limit, keep photos modestly
  sized (Airtable also auto-generates smaller thumbnails, which is what
  the app displays on screen to keep things fast).
- **Airtable API rate limit:** 5 requests/second per base. The app fetches
  everyone in one bulk paginated request when the tree loads, so normal
  browsing is nowhere near this limit; it would only matter if many family
  members were saving edits at the exact same second.
- **Vercel free (Hobby) plan:** generous serverless function invocation
  and bandwidth allowances for a low-traffic family site; you're very
  unlikely to hit these limits with a handful of relatives using the site.
- **Large poster PDFs:** a very large tree (hundreds of generations wide)
  produces a very large PDF page. The export caps the page size near PDF's
  own maximum page dimension (~200 inches) rather than failing outright,
  but at that point printing may require a large-format print shop capable
  of poster-size prints regardless of file format.

## Project structure

```
api/                  Vercel serverless functions (Airtable proxy, auth, photo upload)
src/
  api/client.js        Frontend fetch wrappers for the api/ functions
  context/              Edit-mode (passcode) React context
  lib/
    familyData.js        Normalizes Airtable records; derives children/partners
    treeLayout.js         Pure layout algorithm (positions + connector lines)
    pdfExport.js           Builds a vector SVG and exports it to PDF
  components/            UI: tree view, person boxes, forms, export dialog, etc.
```
