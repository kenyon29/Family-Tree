# Setting Up Your Family Tree (No Coding Required)

This guide walks you through the one-time setup. You'll create two free
accounts (Airtable and Vercel), connect them to this website's code, and
pick a shared passcode. After that, everyone just visits a web link — no
terminal, no installing anything.

Budget about 30–45 minutes the first time.

---

## Part 1: Create the Airtable database

Airtable is where all the people, dates, photos and notes actually live.
Airtable's screens change their exact wording every so often, so follow
these by what's on screen rather than the exact words if something looks
slightly different — the shapes (tabs, a **+** to add things, right-click
or hover-arrow menus) stay pretty stable even when labels move around.

1. Go to [airtable.com](https://airtable.com) and sign up for a **free**
   account.
2. Create a new base (from your home screen, this is usually a button like
   **+ Create** or **Start from scratch**) and name it "Family Tree". You'll
   land on a screen with one table already made for you (often called
   **Table 1**), pre-filled with sample columns like **Name, Notes,
   Assignee, Status** and a few blank numbered rows. That's normal — you're
   about to reshape it into the **People** table, not start from nothing.

### Set up the People table

1. **Rename the table.** Double-click the **Table 1** tab at the top
   (or click the small **▾** next to it and choose **Rename table**), and
   type **People**.
2. **Rename the "Name" column to "First Name".** Double-click the column
   header (or click the **▾** that appears when you hover/click it, then
   **Edit field**), change the name, and leave the field type as
   **Single line text**.
3. **Rename the "Notes" column to "Notes/Bio".** Same method. Leave its
   type as **Long text** — that already matches what's needed.
4. **Delete the "Assignee" and "Status" columns** — you won't need them.
   Click the **▾** on each column header → **Delete field**.
5. **Add the remaining fields.** At the right edge of the column headers
   there's a **+** button (scroll right if you don't see it) — click it to
   add each new field below. For each one, type the exact name, then pick
   the field type from the list Airtable shows you:

   | Field name              | Field type to pick |
   |--------------------------|---------------------|
   | Last Name                 | Single line text |
   | Birth Date                | Date |
   | Death Date                 | Date |
   | Photo                      | Attachment |
   | Father                       | Link to another record — when asked which table, choose **People** (this same table; Airtable allows a table to link to itself) |
   | Mother                        | Link to another record → **People** |
   | Show Notes On Print             | Checkbox — leave default (unchecked) |
   | Show Photo On Print              | Checkbox — after adding it, edit the field again and turn on **"Use this field's value as the default"** (or similar wording) set to **checked**, so new people default to showing their photo |

   Field names must match exactly what's in this table (including spaces
   and capitalization) — the app looks fields up by name.

   Your **People** table should now have 10 columns: First Name, Last Name,
   Birth Date, Death Date, Photo, Notes/Bio, Father, Mother, Show Notes On
   Print, Show Photo On Print.

### Add the Marriages table

1. Next to the **People** tab, click **+ Add or import** (this creates a
   new, blank table in the same base). Choose the blank-table option if
   asked (as opposed to importing a file).
2. Rename the new table to **Marriages** the same way you renamed the first
   one.
3. It will again come with a default first column (often "Name") —
   **leave that one as-is** (rename it to something like "Marriage" if
   you like, but don't change its type or delete it). Airtable doesn't
   allow a table's very first column to be a "Link to another record"
   field, so this leftover column just stays there unused — the app
   never reads it.
4. Delete any other sample columns Airtable added (Notes, Assignee,
   Status, etc.) the same way as before, then add these with the **+**
   button:

   | Field name      | Field type |
   |------------------|------------|
   | Spouse 1           | Link to another record → **People** |
   | Spouse 2           | Link to another record → **People** |
   | Marriage Date        | Date |
   | Divorce Date          | Date |

   You do **not** need a "Children" field anywhere — the app figures out
   children automatically from each person's Father/Mother links in the
   People table.

5. Back in **People**, add a few test people so you have something to look
   at once the site is live (First Name is the only field you must fill in).

### Get your Airtable API key and Base ID

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
   (you may need to sign in again). If your account menu has a
   **Developer hub** or **Builder hub** option instead, that also gets you
   here via **Personal access tokens**.
2. Click **Create new token** (or **Create token**).
   - Name it anything, e.g. "Family Tree Website".
   - Under **Scopes**, click **Add a scope** and add both:
     `data.records:read` and `data.records:write`.
   - Under **Access**, click **Add a base** and select the "Family Tree"
     base you just created.
   - Click **Create token**, then **copy the token** somewhere safe (it's
     shown only once, starts with `pat...`). This is your
     `AIRTABLE_API_KEY`.
3. **Find the Base ID** — the most reliable way regardless of what menus
   look like: open your "Family Tree" base so you're looking at its tables,
   then look at your browser's address bar. The URL looks like
   `https://airtable.com/appXXXXXXXXXXXXXX/...` — copy just the
   `appXXXXXXXXXXXXXX` part (starts with `app`, no slashes). That's your
   `AIRTABLE_BASE_ID`.

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
