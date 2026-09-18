# Setting Up Your Family Tree (No Coding Required)

This guide walks you through the one-time setup. You'll create two free
accounts (Airtable and Vercel), connect them to this website's code, and
pick a shared passcode. After that, everyone just visits a web link — no
terminal, no installing anything.

Budget about 30–45 minutes the first time.

---

## Part 1: Create the Airtable database

Airtable is where all the people, dates, photos and notes actually live.

1. Go to [airtable.com](https://airtable.com) and sign up for a **free** account.
2. Click **Create a base** → **Start from scratch**. Name it "Family Tree".
3. Airtable creates a default table for you. Rename it to **People**
   (double-click the table name tab at the top).
4. Delete the default columns Airtable created except the first one, then
   set up these fields in **People** (use **+** at the right of the column
   headers to add a field, and choose the field type shown):

   | Field name              | Field type          | Notes |
   |--------------------------|---------------------|-------|
   | First Name               | Single line text    | rename Airtable's default "Name" field to this |
   | Last Name                 | Single line text    | |
   | Birth Date                | Date                | |
   | Death Date                 | Date                | |
   | Photo                      | Attachment          | |
   | Notes/Bio                   | Long text          | |
   | Father                       | Link to another record → **People** (this same table) |
   | Mother                        | Link to another record → **People** (this same table) |
   | Show Notes On Print             | Checkbox, default **unchecked** |
   | Show Photo On Print              | Checkbox, default **checked** |

   Field names must match exactly (including capitalization) — the app
   looks them up by name.

5. Create a second table (click the **+** next to the table tabs). Name it
   **Marriages**. Add these fields:

   | Field name      | Field type |
   |------------------|------------|
   | Spouse 1          | Link to another record → **People** |
   | Spouse 2           | Link to another record → **People** |
   | Marriage Date        | Date |
   | Divorce Date          | Date |

   You do **not** need a "Children" field anywhere — the app figures out
   children automatically from each person's Father/Mother links.

6. Add a few test people so you have something to look at (First Name is
   the only field you must fill in).

### Get your Airtable API key and Base ID

1. Click your account icon (top right) → **Developer hub**, or go to
   [airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Click **Create new token**.
   - Name it anything, e.g. "Family Tree Website".
   - Under **Scopes**, add: `data.records:read`, `data.records:write`.
   - Under **Access**, add the "Family Tree" base you just created.
   - Click **Create token**, then **copy the token** somewhere safe (it's
     shown only once). This is your `AIRTABLE_API_KEY`.
3. Open your base, click **Help** (top right) → **API documentation** (or
   visit [airtable.com/api](https://airtable.com/api) and pick your base).
   The Base ID is shown near the top and looks like `appXXXXXXXXXXXXXX`.
   This is your `AIRTABLE_BASE_ID`.

Keep both values handy — you'll paste them into Vercel in Part 3.

---

## Part 2: Push this code to GitHub

If someone already created the GitHub repository and pushed this code for
you, skip to Part 3.

1. Create a free account at [github.com](https://github.com) if you don't
   have one.
2. Create a new, empty repository (no README/license) named e.g.
   `family-tree`.
3. Follow GitHub's "push an existing repository" instructions shown on that
   empty repo's page — they'll look like:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/family-tree.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 3: Deploy to Vercel

Vercel hosts the website for free and automatically re-deploys it whenever
new code is pushed to GitHub.

1. Go to [vercel.com](https://vercel.com) and sign up using **"Continue
   with GitHub"** — this is the one-time authorization step: Vercel will
   ask permission to access your GitHub account/repositories. Approve it
   (you can limit it to just this one repository if you prefer).
2. On the Vercel dashboard, click **Add New… → Project**.
3. Find and **Import** your `family-tree` repository.
4. Vercel will auto-detect this as a Vite project. Before clicking Deploy,
   open **Environment Variables** and add these three:

   | Name | Value |
   |------|-------|
   | `AIRTABLE_API_KEY` | the token you copied in Part 1 |
   | `AIRTABLE_BASE_ID` | the `appXXXXXXXXXXXXXX` id from Part 1 |
   | `EDITOR_PASSCODE` | any word/phrase your family will use to unlock editing, e.g. `Grandpa1952` |

5. Click **Deploy**. After a minute or two you'll get a live URL like
   `https://family-tree-yourname.vercel.app`.

That's it — the site is live. From now on, any time new code is pushed to
the GitHub repository's main branch, Vercel automatically rebuilds and
redeploys the site within a minute or two.

---

## Part 4: Share the link and the passcode

- **The view link** (e.g. `https://family-tree-yourname.vercel.app`) is
  what you share with the whole family. Anyone with the link can browse,
  search, pan/zoom, and print/export the tree — no passcode needed.
- **The passcode** (`EDITOR_PASSCODE`) is only for the few relatives who
  will be adding/editing people. Share it privately (text message, not a
  public group chat) with just those people. On the site, they click
  **"Unlock Edit Mode"** in the top toolbar and type it in once per visit.
- If the passcode ever leaks or you want to change it: go to your Vercel
  project → **Settings → Environment Variables**, edit `EDITOR_PASSCODE`,
  then go to the **Deployments** tab and **Redeploy** the latest deployment
  for the change to take effect.

## Changing the passcode or Airtable credentials later

1. Vercel dashboard → your project → **Settings → Environment Variables**.
2. Edit the value.
3. **Deployments** tab → click the **⋯** menu on the latest deployment →
   **Redeploy**.

## If something looks broken

- A red "Couldn't load the family tree" message on the site usually means
  `AIRTABLE_API_KEY` or `AIRTABLE_BASE_ID` is missing or wrong in Vercel's
  Environment Variables (see above to fix and redeploy).
- Make sure your Airtable field names match the tables in Part 1 exactly —
  the app reads fields by name (e.g. `First Name`, not `first name`).
- "Incorrect passcode" when unlocking Edit Mode means `EDITOR_PASSCODE` in
  Vercel doesn't match what was typed.
