# OpenLP Service Planner v1.76.31

Current release: **v1.76.31**, a security, restore-integrity and Cloudflare/Debian portability consolidation. Historical release notes are retained below for development reference.

## v1.76.31 — automatic published ChurchSuite refresh with visible progress

- The published ChurchSuite Plans page now considers its cache stale after **15 minutes**.
- Any authenticated viewer may cause a stale cache to refresh, but only through the automatic stale-refresh path; Service-list-only users still cannot manually force a re-sync.
- The page renders immediately using the current cached list, then shows **Syncing ChurchSuite…** with an animated progress indicator while the slow server refresh runs.
- When the refresh completes, the page reloads with the new list. If another sync is already running, the page says so and checks again shortly.
- Planner/Administrator users retain the manual **Re-sync** button and its existing 5-minute cooldown.

## v1.76.30 — security, permission and consistency audit

- Restricts clearing service activity/audit history to Administrators, both in the UI and server authorization gate.
- Enforces ChurchSuite Off on plan-list/scan APIs and fixes Level-1 routing for the current ChurchSuite `on` mode.
- Prevents a disabled ChurchSuite Plans route from falling through to static-file handling.
- Adds separate ordinary-request body limits on Debian VPS, caps pathological local-password input length, and restricts inline media rendering to expected passive media types.
- Restores public-repository `.gitignore` protections for local secrets, dependencies and generated files.
- See `docs/SECURITY-QUALITY-AUDIT-v17630.md` for findings, remaining hardening items and validation limits.

## v1.76.28 — fix ChurchSuite Plans page routing

- Fixes **ChurchSuite Plans** opening as a downloaded/static file instead of the published plans web page.
- The extension setting is now `on`, but the Worker-side published-directory route was still requiring the old literal `auto` value. The browser therefore linked to the correct path while the Worker failed to claim that route.
- The Worker directory route and low-access service-list availability check now recognise `on`, while retaining compatibility with legacy `manual` and `auto` values.

## v1.76.27 — statistics deletion and final ChurchSuite-Off Song wording

- Settings now includes **Song statistics data** controls for deleting either a selected inclusive date range or the complete song-usage history.
- Before deletion the Planner counts the affected usage entries, shows that count, then requires a second themed final confirmation. Songs and service plans are not deleted.
- The deletion endpoint is under `/api/admin/`, so the existing server authorization gate restricts it to Administrators on both Cloudflare and VPS deployments.
- Invalid or reversed date ranges are rejected both in the browser and on the server.
- When ChurchSuite is Off, a stored template Song placeholder now displays **Empty Song position** under the song title instead of the stored **Not yet assigned in ChurchSuite** detail.

## v1.76.26 — complete ChurchSuite-Off visibility cleanup

- The published **ChurchSuite services** link is now hidden whenever the ChurchSuite extension is Off, even if directory settings were previously enabled.
- Service-item chips and statuses no longer expose ChurchSuite state while Off: pending update, extra ChurchSuite song, retained-on-sync and excluded-from-sync labels are hidden.
- Empty template Song slots use the generic **Empty Song position** wording instead of **Awaiting ChurchSuite song** when ChurchSuite is Off.
- Song editor warnings likewise become generic library/template wording while ChurchSuite is Off; ChurchSuite-specific replace-song controls are hidden.
- Service-level ChurchSuite out-of-sync notices are hidden when the extension is Off.
- Template creation wording is also ChurchSuite-free while the extension is Off.
- Underlying ChurchSuite metadata is retained so turning the extension back On restores the relevant links/statuses without data loss.

## v1.76.25 — simplify ChurchSuite extension to Off / On

- Removes the confusing **ChurchSuite manual / automatic** mode split from Settings. ChurchSuite is now simply **Off** or **On**.
- Existing installations using legacy `manual` or `auto` values are migrated in the browser to **On**, so no saved configuration is lost.
- When ChurchSuite is On, published-plan / multi-service sync tools are available and individual services can still use **Add/Edit ChurchSuite Plan Page URL** manually.
- The Plan Page base address and published-plan directory settings remain available under the single enabled state.
- When ChurchSuite is Off, all sync/import/view-plan UI remains hidden while Templates continue to work without ChurchSuite wording.

## v1.76.24 — ChurchSuite truly optional

- When the ChurchSuite extension is **Off**, ChurchSuite sync/import buttons, View Plan links, linked-plan warnings and related status controls are hidden even if older services still contain saved ChurchSuite metadata.
- ChurchSuite entry points now safely return without doing anything if invoked while the extension is Off, preventing stale controls or old URLs from starting a sync flow.
- **Service Templates remain fully available** with ChurchSuite Off, but their Library/editor/save wording becomes generic and contains no ChurchSuite references.
- With ChurchSuite Off, templates are treated as reusable service order/theme/local-item structures. Song positions remain available, while the generic ChurchSuite-item add option is hidden.
- Re-enabling ChurchSuite does not destroy previously saved template sync metadata; ChurchSuite-specific template controls and wording simply become available again.
- Per-service template choices remain available independently of ChurchSuite.

## v1.76.23 — dialog close audit and v1.76 tidy-up

- Every `openSheet()` render now resets the sheet **×** to a fresh safe close handler before a screen optionally overrides it. This prevents stale or dead × handlers leaking from a previous dialog.
- **×** now mirrors the intended exit action in the main Template and ChurchSuite flows: **Done**, **Back** or **Cancel** as appropriate.
- Template creation, template editing, template selection, ChurchSuite type selection, ChurchSuite scan/preview, batch confirmation/import and Media Library navigation received explicit close-path handling.
- Batch ChurchSuite processing maps **×** to the same cancellation action as the visible **Cancel** button rather than allowing another navigation path while work is active.
- Added quality-check regression guards for dialog-close reset, the shared theme helper, and the separate first-class Template Song item.
- Existing checks continue to confirm no native browser dialogs, local PDF.js use, CSP restrictions, Debian auth/recovery parity and migration integrity.

## v1.76.22 — restore template editing theme selector

- Fixes `availableThemes is not defined` when opening a Service Template editor.
- Theme names now come from one shared `plannerThemeNames()` helper used outside Settings, so Template editing and Save-as-template can safely use the same OpenLP theme list.
- The existing Settings theme editor keeps its own draft-aware list while settings are being edited.

## v1.76.21 — restore Template editing and separate Song positions

- The Service Template editor now normalizes older/mixed template records before rendering, restoring editing for templates created across the v1.76 template iterations.
- **Song** is now its own first-class **Add item** choice in the Template Library.
- Song is removed from the generic **ChurchSuite item** picker. The generic picker is now only for non-song ChurchSuite Types such as Bible Reading, Notices and Sermon.
- Adding **Song** creates an ordered Song position directly; ChurchSuite fills these positions sequentially and empty positions remain visible.
- Older Song entries are transparently upgraded to the same Song-slot semantics when opened in the editor.
- Template Edit now reports a themed error instead of failing silently if malformed legacy data is encountered.

## v1.76.20 — make every template Song position a durable Song slot

- Any template position whose Planner type is **Song** is now always treated as a positional ChurchSuite Song slot, regardless of how an older template saved its Sync/Keep flag.
- Blank Songs saved from an ordinary service are automatically converted to **Song slot · next ChurchSuite song** when the service is saved as a template.
- With no ChurchSuite songs assigned, every Song position remains as **Awaiting ChurchSuite song** in its original template order.
- If a local song was manually chosen for an empty template Song position, it remains there until ChurchSuite supplies a song for that slot.
- The Template editor now makes the special Song-slot behaviour explicit and prevents changing a Song slot to the ambiguous old Keep mode.

## v1.76.19 — OpenLP theme in service templates

- Service Templates now expose an **OpenLP theme** as a first-class template setting.
- **Save as template** includes a theme selector, initially set to the source service's current theme.
- **Library → Service Templates → Edit** lets the template theme be changed directly.
- Using a template for a new ChurchSuite import applies the template theme to the new service.
- Re-syncing an existing service with a template reapplies that template's theme; non-template ChurchSuite syncs continue to preserve the service's individual theme.
- The final multi-service confirmation shows the theme that each selected template will apply.

## v1.76.18 — retain empty Song slots during template sync

- A template **Song** slot is no longer removed when ChurchSuite has no song assigned for that position yet.
- Empty Song positions remain in their template order as visible placeholders marked **Awaiting ChurchSuite song**.
- The placeholder is replaced automatically by the next available ChurchSuite song on a later sync.
- The song editor explains that the slot is intentionally waiting for ChurchSuite, while still allowing a local song to be chosen if necessary.

## v1.76.17 — ordered ChurchSuite Song slots in templates

- Template **Song** sync slots are now positional: first Song slot gets the first ChurchSuite song, second gets the second, and so on.
- Song slots no longer depend on a ChurchSuite Type mapping; songs remain a built-in ChurchSuite item class.
- If ChurchSuite contains more songs than the template has Song slots, the remaining songs are appended in ChurchSuite order and marked **Extra ChurchSuite song** for review.
- Extra songs are preserved rather than silently dropped, while unmatched non-song ChurchSuite items remain excluded by the authoritative template structure.
- Creating a Song sync slot in the Template Library now defaults its ChurchSuite label to **Song** and explains the ordered-song behaviour.

## v1.76.16 — set or replace default template during sync

- The multi-service **Confirm templates** screen now explicitly offers **Make selected template the default for [service type]** when no default exists.
- If a default already exists, the wording becomes **Make selected template the new default…** so it is clear that the old default will be replaced.
- The checkbox becomes available as soon as a template is selected and is disabled while **Choose template…** is still selected.
- Service-type matching for this purpose now tolerates spacing/punctuation differences such as **Night Church** versus **NightChurch**.

## v1.76.15 — missing-default template sync recovery

- Multi-service template choices now survive ChurchSuite scanning by plan ID, stable identifier, and title/date fallback rather than relying on one numeric ID only.
- A service with no default template now remains on the **Confirm templates** screen with **Choose template…**, where a template can be selected and optionally made the service-type default.
- The later import stage no longer shows a dead-end **No default template is assigned** alert. Any unresolved template returns to the confirmation screen with prior choices preserved.
- Cancelling or closing the scanning step clears the active ChurchSuite operation and returns to a stable template-selection screen rather than leaving an orphaned spinner.

## v1.76.14 — confirm templates before multi-service sync

- Choosing **Use a Template** for multiple ChurchSuite services now opens a dedicated template-confirmation screen before scanning/importing.
- Each selected service shows its current/default template and can be changed independently for this import.
- A **Make default** checkbox can update the recurring service type’s default template directly from this screen.
- A one-off template choice for this batch does not change the default unless **Make default** is selected.
- Only after template choices are confirmed does the Planner scan the selected ChurchSuite services, with progress and Cancel available.

## v1.76.13 — ChurchSuite template transition / cancel fix

- Restores the ChurchSuite operation-guard functions that v1.76.12 referenced but did not include, fixing the `beginChurchSuiteOperation is not defined` error.
- Selecting **Use a Template** in multi-service sync no longer leaves a disabled screen with no escape route.
- **Back** changes to **Cancel** while the choice is advancing and remains usable; the sheet **×** performs the same cancellation.
- Cancelling invalidates the pending transition so an old delayed callback cannot later open or start a second import.
- A newly-started foreground ChurchSuite operation supersedes any stale operation left by previous navigation.

## v1.76.12 — Library close behaviour and adding template items

- The main **Library** dialog now resets the sheet **×** so it behaves like **Done** and closes the Library reliably.
- The **Service Templates** library likewise makes **×** follow the same return path as **Done**.
- Template editing now includes **＋ Add item**, including when the template is completely empty.
- New template positions can be explicit **ChurchSuite sync slots** or local Planner items such as Sermon Images, Images/Notices, Bible, Video, PDF and Text.
- A ChurchSuite sync slot records the ChurchSuite Type/position name plus the Planner item type to create when it is filled.

## v1.76.11 — create templates from the Template Library

- **Library → Service Templates** now includes **Create template**.
- The creation flow lets you choose any existing service and immediately save it as a template.
- If no suitable service exists, the same screen explains why templates are service-based and provides **Create a service** to start one.
- The empty Template Library now offers the same guided creation route rather than only displaying instructions.

## v1.76.10 — template editor return path

- Closing a Service Template editor now returns to the **Service Templates** library it was opened from.
- The editor **×** and **Back** controls use the same return path.
- If the template has unsaved changes, both controls show the same themed leave-without-saving confirmation before returning.
- Templates opened from Settings return to the Settings template manager instead.

## v1.76.9 — Service Template Library and per-service template overrides

- **Library → Service Templates** is now the main place to manage templates.
- Templates can be opened and edited directly: reorder positions, rename positions, change **Sync from ChurchSuite / Keep in template**, and remove positions.
- Settings → Services still assigns the default template for each recurring service type.
- Each individual service now has a **Template: …** button beside **Save as template**. It can use the service-type default, override it with another template, or use no template for that service only.
- Per-service overrides are stored in shared Planner settings so they survive reloads, Cloudflare/Debian use, backups and restores.
- Deleting a template clears defaults and service-specific overrides that referred to it.

## v1.76.8 — ChurchSuite import operation locking

- ChurchSuite import/sync screens now reject double-clicks and repeated submissions once a step begins.
- Template, import-mode and type-selection choices lock immediately while advancing.
- Multi-service scanning shows explicit progress and a **Cancel** button.
- The final batch import also locks all confirmation controls and exposes **Cancel**; cancellation stops before the next service, while services already completed remain safely saved.
- Stale/older navigation operations are invalidated so returning through earlier screens cannot later complete a second import in the background.

## v1.76.7 — ChurchSuite service subset selection

- The multi-service ChurchSuite sync screen now offers one-click selection by detected service prefix/type, such as **Morning Church** or **NightChurch**.
- Service grouping uses the configured recurring service names at the start of each ChurchSuite title, with a conservative title-prefix fallback for unmapped services.
- Choosing a service subset replaces the current selection; individual checkboxes can then be adjusted for exceptions.
- The toolbar also includes **Select all**, **Clear**, and a live selected-service count.

## v1.76.6 — preserve local attachments on ChurchSuite sync

- Re-syncing ChurchSuite now preserves locally attached images/files on every matching service item, not only ordinary image items.
- This includes sermon items, notices/images, video and PDF items.
- Template-kept items also carry forward media attached to the current service rather than reverting to the template's original media state.
- ChurchSuite can still refresh the item's plan metadata while the Planner keeps its local projection assets and media settings.

## v1.76.5 — refresh after item editing

- Closing a service-item editor now refreshes the service view immediately.
- This applies to **Done**, confirmed **Exit without saving**, and the editor **×** close control.
- The × control now follows the same unsaved-change confirmation behaviour as **Done** instead of bypassing it.

## v1.76.4 — authoritative template sync

- **Use a Template** now treats the template as authoritative for ChurchSuite-driven service structure.
- Only ChurchSuite items consumed by explicit **Sync from ChurchSuite** template slots are included.
- Unmatched incoming ChurchSuite items are no longer appended to the bottom of the service.
- Previously imported ChurchSuite items that are not represented by the template are not resurrected during template sync.
- Template-kept/local items remain in their template positions.

## v1.76.2 — template slot replacement fix

- **Save as template** is now available while editing an individual service, beside the service theme.
- A **Keep in template** item now consumes/replaces its corresponding ChurchSuite service role instead of leaving that incoming item to be appended at the bottom.
- Role matching understands common local presentation names such as **Sermon Images** versus ChurchSuite **Sermon**, and **Notices Images** versus **Notices**.
- Genuinely new ChurchSuite items that do not correspond to any template position are still appended so they are not silently lost.

## v1.76.1 — template sync duplicate fix

- Fixed first template sync of an existing service preserving the old local copy of a template-kept item and appending it at the bottom.
- Kept template items now remember their source service-item ID. Existing v1.76 templates also use a type/title fallback so the next template sync recognises and removes the stray pre-template local copy.
- Unrelated local service items continue to be preserved.

## v1.76 — service templates

- ChurchSuite import/sync now offers **Use a Template** first whenever templates exist.
- A service can be saved as a reusable template. Each template position is either **Sync from ChurchSuite** or **Keep in template**.
- Repeated ChurchSuite slots such as Songs are filled in order; template-local items retain their position, projection settings, notes and local content.
- Kept media is promoted to durable Planner-library media when necessary. If all media in a kept item comes from one Planner library folder, the template remembers that folder and uses its current contents on future services.
- Regular service types can have a **Default template** in Settings → Services. Template selection highlights that default, and batch ChurchSuite import can apply each service type’s own default automatically.
- Template-protected service items receive a subtle grey treatment and a small **Template** marker.
- Templates can be renamed or deleted from Settings → Services → Service templates.

## v1.75 — service-item editing and ChurchSuite retention

- Fixed wrapping/overlap in the OpenLP export footer, including the downloaded-status checkbox and incomplete-export note.
- Service-item editors now make **Save changes** visually primary only when changes exist. **Done** never silently saves dirty edits: first click arms **Exit without saving?** briefly; a second click confirms discard.
- ChurchSuite-linked items expose **Keep local changes after ChurchSuite sync** when the ChurchSuite extension is enabled. It is checked by default when editing; saving an item with it enabled preserves that local item on later syncs.
- Retained ChurchSuite items have a subtle grey service-plan treatment and a small **Kept on ChurchSuite sync** marker.

## v1.71 (historical)

- First successful sign-in now shows a one-time welcome/access notice. New self-enrolled accounts are told that they begin at the lowest access level and should ask a current Administrator if they need Planner or Administrator access.
- If a level-1 account signs in while the optional ChurchSuite Service list is unavailable, the existing restricted-access page now clearly says **More access required** and explains that there is currently nothing available at that access level.
- At v1.71 Microsoft SSO was still configuration-driven without a UI toggle; later releases added an Administrator toggle. My ChurchSuite already had its Administrator enable/disable setting.
- Fixed the restricted-access screen so **Sign out** submits the required POST logout request instead of a broken GET link.

## v1.70

- Sign-in page labels are now **Sign in with My ChurchSuite**, **Sign in with @kpc.org.au SSO**, and **Sign in with OpenLP Planner User**.
- When neither My ChurchSuite nor Microsoft SSO is available, the OpenLP Planner User form is shown first and expanded instead of hidden in a disclosure.
- Added `npm run validate` as the repeatable full-project validation command: Cloudflare types + TypeScript + local migrations + Wrangler dry-run, followed by the VPS build and smoke test.
- Authentication hardening: ChurchSuite `sub` is now the only automatic ChurchSuite account-link key; matching email alone can no longer inherit an existing Planner account. OIDC nonce validation is strict, stable external identity columns are protected by unique indexes, and local-account lockouts can no longer be extended indefinitely by repeated failed requests.

## What changed from v10

- The **whole service title** now opens the same service switcher as the dropdown.
- Settings includes a **Services** link back to the service switcher.
- The v7 drag/reorder interaction and the v10 warnings/theme handling are preserved.
- The UI still works as a static/local prototype using browser storage.
- When served by the included Cloudflare Worker, it automatically detects `/api/bootstrap`
  and switches to D1-backed persistence.
- D1 writes use a revision number. If another editor has saved a newer state, the app
  reports **Changed elsewhere** rather than silently overwriting it.
- R2 is bound in the project and a `media_assets` table is created, ready for the next
  upload/media phase.

## Cloudflare setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the D1 database:

   ```bash
   npx wrangler d1 create openlp-service-planner
   ```

   Put the returned database ID into `wrangler.toml`.

3. Create the R2 bucket:

   ```bash
   npx wrangler r2 bucket create openlp-service-planner-media
   ```

4. Apply the database migration locally:

   ```bash
   npm run db:local
   ```

5. Run locally:

   ```bash
   npm run dev
   ```

6. Check TypeScript:

   ```bash
   npm run check
   ```

7. When ready, apply the migration remotely and deploy:

   ```bash
   npm run db:remote
   npm run deploy
   ```

## Persistence model in this phase

For this first D1 phase, the planner stores the complete plan/settings document in one
versioned D1 row. This deliberately minimizes UI rewrites while we establish the real
Cloudflare deployment.

It is **not** the final collaboration model. The next phase should split service/item
writes so two editors can safely work on different items at the same time, and add
per-user audit records.

## Media

R2 is configured but uploads are not yet wired. This is intentional. Large video/image
uploads need a separate upload path that does not force bulky files through ordinary
planner-state saves.

## Song library

`songs.json` remains bundled in this build as the initial library snapshot. The settings
screens for `songs.sqlite` import/export remain in place; wiring that library into D1 and
implementing compatible SQLite import/export is a later persistence step.


## v12 — projector-copy state and corrected Cloudflare setup

### Projector copy workflow

Each service can now be explicitly marked **Downloaded for device**.

- Orange background = the current service was marked as downloaded and has not changed since.
- Red/pink background = the service has changed since the projector copy was marked, so the projector copy is out of date.
- The Projector Copy sheet suggests either:
  - a USB drive; or
  - [LocalSend](https://localsend.org) for direct local-network transfer.

The projection laptop still does not need internet access.

### Cloudflare package correction

v11 incorrectly pinned a non-existent `@cloudflare/workers-types` package version.

Current Cloudflare Workers guidance is to generate runtime types with Wrangler instead:

```bash
npm install
npm run types
npm run check
```

This package therefore no longer depends on `@cloudflare/workers-types`.

Your actual resources are already placed into `wrangler.toml`:

- D1 database: `607e3f14-9fa8-411b-9603-fe990cf0cf70`
- R2 bucket: `openlp-service-planner-media`

The bindings remain `DB` and `MEDIA` because those names match the Worker code; binding names do not need to match Wrangler's suggested names.

### From your current terminal position

After replacing the v11 project files with v12, run:

```bash
cd /Users/steve/openlp-service-planner
npm install
npm run types
npm run db:local
npm run dev
```

If local development opens correctly, then:

```bash
npm run db:remote
npm run deploy
```


## v13 — structured collaboration + first media uploads

This phase moves beyond the single JSON planner row.

### D1

New tables:

- `services`
- `service_items`
- `service_audit`

The browser now saves item edits, deletes and reorder operations independently. Two editors working on different service items no longer need to overwrite the whole service document.

### Audit

Service changes can now be appended to a D1 audit table with actor/action/detail.

### R2 uploads

Image/video item creation now includes file inputs. When running against the Cloudflare Worker, selected media is uploaded into R2 and recorded in `media_assets`.

The browser still remains usable in local/static mode without Cloudflare; media uploads simply require the Worker.

### Apply new migration

After updating the files:

```bash
npm install
npm run types
npm run db:local
npm run dev
```

For the deployed database:

```bash
npm run db:remote
npm run deploy
```


## v14 — unified export / projector-copy workflow

`Export OpenLP` and `Projector copy` are now one workflow.

- There is one OpenLP export action.
- A checkbox controls whether the downloaded file should be recorded as the projector copy.
- Two clearly-labelled actions are offered:
  - Download only
  - Download & mark projector copy
- The orange/red projector-copy background logic is preserved.
- If the service changes after a marked projector export, it becomes stale/red.
- USB and LocalSend transfer guidance remains in the export sheet.


## v15 — real streamed `.osz` export

The OpenLP export endpoint is now implemented.

### Export workflow

There are always two buttons:

- **Download without marking**
- **Download & mark projector copy**

There is no checkbox. Both produce the same `.osz`; the second records the downloaded version as the projector copy.

LocalSend is now a normal link in the explanatory text rather than a separate button.

### Endpoint

```text
GET /api/services/:serviceId/export-check
GET /api/services/:serviceId/export.osz
GET /api/services/:serviceId/export.osz?markProjector=1
```

The export targets the OpenLP 3.1.7 service structure already proven with the earlier prototype.

Currently exported:

- songs, including lyrics and selected verse order
- ordered JPG/PNG image presentations
- image autoplay/loop and interval
- video
- video auto-start
- service theme
- media from R2

Plan-only/text items do not enter the OpenLP service.

Projected item types that are not implemented yet (for example Bible/PDF/PowerPoint) block export and are shown in the preflight check so they are never silently omitted.

### Large video handling

The Worker streams the ZIP response and uses ZIP pass-through entries for already-compressed media instead of assembling the entire `.osz` in memory. This is important for large video files.

### Deployment from the existing project folder

You do not need to deploy v14 first. Replace the project contents with v15, then:

```bash
cd /Users/steve/openlp-service-planner

rm -rf node_modules package-lock.json
npm install
npm run types
npm run check

npm run db:local
npm run dev
```

Test locally first.

Then apply the D1 migrations to the real Cloudflare database and deploy:

```bash
npm run db:remote
npm run deploy
```

Your `wrangler.toml` already contains:

- D1 database ID `607e3f14-9fa8-411b-9603-fe990cf0cf70`
- R2 bucket `openlp-service-planner-media`


## v16 — TypeScript/Cloudflare runtime type fix

The previous check loaded both TypeScript's built-in `lib.webworker.d.ts` and
Cloudflare's generated `worker-configuration.d.ts`, causing duplicate declarations.

v16 fixes that by:

- removing `WebWorker` from `compilerOptions.lib`
- using Cloudflare's generated `worker-configuration.d.ts` as the Worker runtime type source
- adding `@types/node`, as requested by `wrangler types`

After replacing the project with v16:

```bash
rm -rf node_modules package-lock.json worker-configuration.d.ts
npm install
npm run types
npm run check
```

Then continue with:

```bash
npm run db:local
npm run dev
```


## v17 — remove unnecessary Node type declarations

The v16 check showed that `@types/node` itself was now colliding with
Wrangler's generated Worker runtime declarations (`Buffer`, `Blob`, `File`,
streams, URL, EventTarget, crypto, performance, etc.).

This project does **not** enable `nodejs_compat` and does not need Node runtime
types for the OpenLP exporter. v17 therefore:

- removes `@types/node`
- removes `"node"` from `compilerOptions.types`
- keeps `worker-configuration.d.ts` as the sole Worker runtime type source
- keeps `ES2022` as the language library

Run:

```bash
rm -rf node_modules package-lock.json worker-configuration.d.ts
npm install
npm run types
npm run check
```


## v18 — missing `planner_settings` migration

Earlier builds referenced `planner_settings` in the Worker but did not create it in
the D1 migrations. Wrangler therefore correctly reported that all known migrations
were applied while `/api/bootstrap` still failed.

v18 adds:

```text
migrations/0003_planner_settings.sql
```

After replacing the project files with v18, simply run:

```bash
npm run db:local
npm run dev
```

There is no need to delete `.wrangler/state`; Wrangler should apply only the new
`0003_planner_settings.sql` migration to the existing local database.


## v19 — song lyric export fix, delete service, incomplete export

- Song export now falls back from the service-specific verse order to the library's
  usual verse order, and finally to all available lyric sections. A song can no longer
  export with zero slides just because its service item has no verse-order string.
- Services can now be deleted from the service switcher with confirmation.
- If a service is incomplete, the normal complete-export buttons remain blocked, but
  **Download incomplete service** becomes available.
- Incomplete export omits missing/unsupported projected items and records that the
  exported service was incomplete.


## v20 — item lifecycle polish + next projected type

- Each planner row now has a direct delete/bin control.
- First click arms the delete control (`Delete?`); second click within 3 seconds confirms.
- Adding image/video items now closes the dialog immediately after creating the item,
  preventing accidental duplicate additions while uploads continue in the background.
- Edit dialogs now use **Save changes**, initially disabled; it enables only after a field changes.
- PDF is now exposed as the next projected item type in the planner UI and upload path.
  OpenLP PDF export support is being built next; until then the export preflight still treats it as unsupported.


## v21 — media defaults and editing

- Inline planner delete control now uses a proper trash-bin icon.
- New image presentations default to:
  - Auto play: ON
  - Loop: ON
  - Interval: 7 seconds
  Users can turn either option off before adding the item.
- Existing image items can now:
  - remove uploaded images
  - add more images
  - retain/edit autoplay, loop and interval settings
- Existing video items can now replace their uploaded video.
- Removing/replacing media also removes the old object from R2 and its D1 media record.


## v22 — editor identity and ordered image editing

- Settings now includes **Your name**.
- The name is stored in that browser/device and is used for item `by` fields and activity/audit entries.
- Existing image presentations now show thumbnails and filenames.
- Image slides can be reordered directly by dragging their `≡` handles.
- The reordered `item.media` array is saved, and the `.osz` exporter already respects that array order.
- Existing add/remove image support is preserved.


## v23 — image drag feedback + edit button state

- Image reordering now matches service-item dragging more closely:
  - floating drag ghost follows the pointer/finger
  - original row fades in place
  - strong insertion line shows the destination
  - moved row briefly highlights after release
- Edit dialogs now start with **Done**.
- As soon as any editable field changes, the button becomes **Save changes**.
- Clicking **Done** without changes simply closes the dialog.


## v24 — image-delete confirmation + service readiness visibility

- Removing an image now uses the same trash-bin icon and two-step `Delete?` confirmation
  as deleting an item from the service plan.
- Service switcher now shows projection readiness (`ready / total`) for each service.
- Service switcher also indicates whether a projector copy is current or outdated.
- Export panel can clear the projector-copy mark.
- Incomplete exports now offer both:
  - Download incomplete without marking
  - Download incomplete & mark projector copy


## v25 — OpenLP title + last-edited metadata

- Product title is now **OpenLP Service Planner**.
- Current service header shows:
  - last edited date/time
  - editor name
- Meaningful service changes update the stamp.
- New D1 migration `0004_service_last_edited.sql` stores the edit metadata.


## v26 — shared D1 song library + header refinement

- `Last edited ... by ...` moved below the readiness/progress bar.
- Last-edited text now uses a subtle orange tint.
- New D1 `songs` table stores the shared song library.
- On first use, the Worker seeds D1 from the bundled OpenLP song snapshot.
- SongSelect imports persist to D1 and become available to all editors.
- Library song edits (lyrics, verse order, metadata, music note) persist to D1.
- `.osz` export now reads songs from the shared D1 library rather than directly from bundled `songs.json`.
- `songs.json` remains only as the initial seed/fallback.


## v27 — image drag-state fix

- Image drag now uses document-level pointer tracking.
- Floating ghost is always removed on pointer up/cancel.
- The faded source state is always cleared on release.
- Final image order is committed immediately on release.
- Closing the edit dialog clears any stale drag visual state.
- Reopening the image dialog reflects the saved/committed order.


## v28 — Bible + PDF export + Cloudflare Access identity

### Add Item guidance
- Add Item cards now explain what each type does.
- Images note that smaller files improve OpenLP remote preview loading.
- PowerPoint is visibly disabled and deferred to a later version.

### Bible passages
- Bible items now include:
  - passage/reference
  - translation
  - pasted passage text
- Bible text is embedded in the `.osz`, so the projection laptop does not need
  internet access or the same Bible database installed.
- Bible items now participate in export preflight and `.osz` export.

### PDF presentations
- PDF files now participate in export preflight and `.osz` generation.
- The original PDF is embedded in the service.
- The exporter creates an OpenLP `presentations` command item using the `Pdf`
  presentation processor and estimates the PDF page count for OpenLP's slide list.
- This is the first PDF-export implementation and should be tested in OpenLP 3.1.7
  before being treated as a release baseline.

### User identity / login
- New `users` D1 table (`0006_users.sql`).
- When deployed behind Cloudflare Access, the Worker reads
  `Cf-Access-Authenticated-User-Email`.
- The first login creates a simple user profile; Settings can choose the display name.
- Audit entries, media uploads and export actions use the authenticated display name.
- Local `wrangler dev` continues to use the local-development editor name.

After deployment, protect the Worker URL with Cloudflare Access. Cloudflare supports
enabling Access directly for workers.dev/preview routes from Worker Settings >
Domains & Routes, or using a normal Access application for a custom hostname.


## v29 — v28 startup regression fix

v28 used `currentEditor()` while constructing the initial service data before
`authenticatedUser` had been initialised. That caused `app.js` to stop executing
during startup, leaving the static shell visible but all buttons and service rows dead.

v29:

- moves identity initialisation before `defaultServices`
- preserves Bible export, PDF export, D1 songs and Cloudflare Access identity work
- makes remote bootstrap more fail-soft so a future API failure does not disable the
  already-rendered local interface


## v30 — Bible paste guidance, PDF compatibility warning, header status placement

- Bible Add Item guidance now explicitly says to omit footnotes, study notes,
  cross-references and other non-passage text.
- PDF remains exported as an OpenLP presentation item.
- PDF UI now warns that the projector laptop must have:
  - Presentations plugin active
  - Pdf controller enabled/available
- Last-edited information now sits directly below Run sheet / Export OpenLP.
- When the page is orange, a note explains that the projector copy is current.
- When the page is red, a note explains that the service has changed since the
  projector copy was downloaded.


## v31 — unified service status + PDF-as-images

### Status
All operational status now sits beneath **Projection items ready**:
- last edited time/editor
- projector-copy current explanation (orange)
- projector-copy outdated explanation (red)

### PDF strategy changed
OpenLP 3.1.7's Pdf controller is only available when PyMuPDF is available in that
OpenLP installation. Because the test projector laptop rejected the correctly embedded
PDF presentation item, v31 no longer relies on that controller.

Instead:
1. the browser renders each PDF page with Mozilla PDF.js;
2. each page is converted to a reasonably-sized JPEG;
3. those pages are uploaded to R2;
4. the `.osz` exports the PDF as a standard OpenLP image presentation.

This uses the same image-service path already proven to work on the projector laptop.

PDF conversion currently loads PDF.js from jsDelivr while planning, so the planning
device needs internet access when a PDF is first added. Once converted/uploaded, the
projector laptop remains fully offline.


## v32 — BibleGateway guidance + direct shared song-library editing

### Bible
- Add Item > Bible passage now includes a direct BibleGateway.com link opening in a new tab.
- Guidance explicitly recommends disabling/removing headings, footnotes, verse-number/cross-reference clutter and other extras before copy/paste.

### Song library
- Settings now includes **Open song library**.
- Song picker includes **Manage song library**.
- Shared library can be searched by title, alternate title or author.
- Songs can be edited directly without first adding them to a service.
- Existing library editor persists:
  - title
  - authors
  - lyrics/sections
  - section keys
  - usual verse order
  - usual music note
  - CCLI song number
  - copyright
- In Cloudflare mode, edits continue to persist to the shared D1 song library.


## v33 — floating Add Item + song-editor button fix

- `+ Add item` is now a draggable floating action button.
- Position is remembered per browser/device.
- It is clamped to the viewport after resize.
- If it overlaps a newly-focused control, it nudges away from that focus area.
- Dragging the button does not accidentally open Add Item.

### Song library editor
- Edit button now follows the same pattern as service-item editing:
  - **Done** when nothing has changed
  - **Save changes** after any field is modified
- **Done** closes without saving.
- **Save changes** persists the song and closes the dialog.
- **Back to library** explicitly returns to the searchable library list.


## v34 — floating Add Item fix, wider dialogs, visible Library hub

- Fixed floating `+ Add item` so it is explicitly visible, positioned after layout settles,
  clamped to the viewport and kept above the planner with a high z-index.
- Right-side dialogs are about 1.5× wider on desktop.
- Added **Library** beside Run sheet.
- Library hub exposes:
  - Song library
  - Video library
  - Image library
  - PDF library
- Song library remains shared/editable.
- Media libraries list media already used in service plans; reuse/add-to-service is the next stage.


## v35 — real floating Add Item, true wider sheets, guarded library deletion, OpenLyrics export

### Floating Add Item
- The old inline Add Item row is removed.
- A Gmail-style floating pill sits at the lower-right by default.
- `+ Add Item` opens the chooser.
- A separate `⠿` grab handle moves the floating control on desktop or touch.
- Position is remembered and kept inside the viewport.

### Right-side dialogs
- The actual `.sheet-card` is now 720px wide on desktop (previously 480px), i.e. 1.5× wider.
- Mobile remains full-width.

### Media library deletion
- Image/video/PDF library entries have trash controls.
- If a media entry is used by a current/upcoming service, delete is disabled.
- Older unused media can be deleted only through a warning + permanent-delete confirmation.
- Confirmed deletion removes R2/D1 media and clears its references from past service items.

### Song export
OpenLP 3.1.7 officially exports/imports songs using OpenLyrics XML.

- Each song has **Export XML**.
- Multiple songs can be selected and exported as an OpenLyrics ZIP transport bundle.
- Settings adds **Export OpenLyrics ZIP** for the entire shared song library.
- ZIP bundles should be unzipped before OpenLP import:
  File → Import → Song → OpenLyrics → Add Files, then select the XML files.
- Existing `songs.sqlite` export remains a separate planned database export.


## v37 — exact correction of the v36 navigation/status request

- No Notifications button.
- Existing status text (last edited and orange/red projector-copy explanation) is now in the top bar immediately left of Activity.
- Services is beside Library, not in Settings.
- The standalone Song Library section is removed from Settings.
- The OpenLP song-library import/export section remains in Settings.
- Song-library footer says “shared song library”, not D1.
- Activity can be cleared with warning + confirmation, including persisted audit history.
- Floating Add Item is smaller and translucent.
- Its untouched default position is just right of screen centre and in the lower third.
- Once the user drags it, the remembered position continues to take precedence.


## v38 — export binding / floating translucency / Bible tile consistency

- Restored the missing `Export OpenLP` click binding.
- Floating `+ Add Item` now uses a visibly translucent blurred surface.
- Bible Passage Add Item tile now uses the same background/border treatment as the other Add Item choices.
- Existing BibleGateway link remains available inside the Bible option.


## v39 — shorter stale-copy text + long-press Add Item drag

- Red projector-copy explanation is now:
  `This service has changed since it was downloaded.`
- Floating `+ Add Item` can be moved in two ways:
  - drag immediately from the grab area
  - long-press anywhere on the rest of the pill, then drag
- A normal tap still opens Add Item.


## v40 — Services layout, title cleanup, verse-order help, SongSelect link

- Service Plans heading now sits above the service controls/list so the wider sheet does not overflow left.
- Removed the `Saved` note under the service title.
- Removed the down-arrow button beside the service title; the service title itself remains clickable to open Services.
- Song library editing now explains OpenLP verse-order keys with examples such as:
  - `v1` = Verse 1
  - `c1` = Chorus 1
  - `b1` = Bridge 1
  - `v1 c1 v2 c1` = Verse 1, Chorus 1, Verse 2, Chorus 1
- SongSelect paste import now includes a clickable SongSelect link opening in a new tab.


## v41 — shorter projector-current text + ordered image/PDF export filenames

- Current projector-copy note now says:
  `This version has been downloaded for the projection laptop.`
- Image presentations now export each slide with a zero-padded three-digit prefix:
  - `001-...`
  - `002-...`
  - `003-...`
- Prefix order follows the order saved in the image-edit dialog.
- PDF presentations use the same naming because PDFs are converted to image slides before export.
- The `service_data.osj` image references and ZIP filenames use the same ordered names.


## v42 — pre-ChurchSuite tidy-up

- Full-screen Services manager with desktop table and mobile cards.
- Reserved ChurchSuite plan link, last-updated and import-rule fields.
- Settings → Extensions: Off / ChurchSuite manual / ChurchSuite automatic.
- Manual mode supports a ChurchSuite URL and per-service import rules.
- Automatic mode exposes API configuration placeholders and a Sync placeholder.
- With ChurchSuite manual/automatic enabled, Services becomes the initial home screen.
- Small-screen layout tidy-up.
- Settings suggests disabling OpenLP's Presentations plugin if otherwise unused.


## v43 — ChurchSuite scaffolding tidy-up

- Services table header now says **ChurchSuite import rules**.
- When ChurchSuite is Off, all three ChurchSuite columns are hidden completely.
- When ChurchSuite manual/automatic is enabled, the three columns appear.
- Extension settings remain visible to all users.
- Stored ChurchSuite secrets are represented only by an obscured placeholder after entry.
- Secret values are never persisted in browser/local settings and are not displayed back in plain text.


## v44 — Services/Settings tidy-up

- ChurchSuite columns remain completely absent from view when the extension is Off; no “Extension off” or dash placeholders are shown.
- Settings now has a **Done** button near the top-right as well as at the bottom.
- Both Settings buttons change to **Save changes** after any setting changes, including ChurchSuite extension changes.
- Extensions now includes a **Sample ChurchSuite service plan URL**.
- A sample-plan component selector lets users define the default ChurchSuite import rules (songs, Bible, text/run-sheet, media/presentation references) before the API connection is implemented.

- ChurchSuite automatic mode now explicitly states **Not implemented yet** in Settings and the sync placeholder.

- Sample ChurchSuite plan URL/component controls are now shown only when ChurchSuite Manual or Automatic mode is selected.


## v45 — ChurchSuite public-plan component mapper

- Sample plan URL now opens a real component mapper.
- Rows show order, title/type, a content preview and mapping: Ignore/Text/Song/Bible/Images/Video/PDF.
- Settings mapping is the default; Services can override it per service.
- Manual public-plan preview is fetched through the Worker.
- If the ChurchSuite public page only exposes a client-rendered shell, the mapper offers a paste-plan fallback using the same mapping UI.
- The same mapper is ready to accept Core API data later.


## v46 — ChurchSuite Manual mapper simplified to component titles

The public ChurchSuite plan page is client-rendered and its server HTML contains page
controls/metadata rather than the real service running order. v45 therefore produced
false components such as Details, Key, Tempo and modal markup.

v46 deliberately stops scraping the public page for Manual mode.

Manual workflow:
1. Open the published ChurchSuite plan from the supplied link.
2. Copy the visible running-order/service-component list.
3. Paste it into the mapper.
4. The planner filters UI metadata/code and keeps concise component titles.
5. Each title maps to Ignore / Text / Song / Bible / Images / Video / PDF.

Settings stores the default mapping and an individual service can override it.
The Core API will later feed structured titles directly into the same mapper.


## v47 — ChurchSuite URL-only Manual mode using Cloudflare Browser Run

The paste fallback has been removed.

ChurchSuite Plan Pages are JavaScript-rendered. v47 uses Cloudflare Browser Run to
load the published Plan Page in headless Chrome and then CSS-scrape links belonging
to that plan after rendering.

The mapper now works from the URL alone:

1. Browser Run renders the ChurchSuite Plan Page.
2. The Worker scrapes plan-related anchors from the rendered DOM.
3. The base Plan Page link and generic UI links are discarded.
4. Remaining link text becomes the ordered service-component title list.
5. Each title can map to Ignore / Text / Song / Bible / Images / Video / PDF.

A new Browser Run binding is included in `wrangler.toml`:

```toml
[browser]
binding = "BROWSER"
remote = true
```

Cloudflare Browser Run is available on the Workers Free plan, currently including
10 minutes of browser runtime per day. This should be ample for occasional manual
plan loads and later sync checks.


## v48 — ChurchSuite Type-based mapping

The public-page scraping approach has been removed.

ChurchSuite itself already provides the taxonomy we need:

- Songs
- user-defined Service Plan Types

Settings now asks the planner administrator to maintain the ChurchSuite Types their
church actually uses and map each one to a planner component type.

Example defaults:

- Scripture Reading → Bible
- Announcements → Text
- Transition → Text
- Welcome → Text

Available mappings:

- Ignore
- Text
- Bible
- Images
- Video
- PDF

ChurchSuite Songs are always treated as Song items and do not need a Type mapping.

The Services screen no longer exposes mapping/import-rule columns. These mappings are
configuration and will be applied behind the scenes when Manual or Automatic
ChurchSuite import/sync is implemented.

Browser Run and the public-plan scraper have been removed from this build.


## v49 — Settings/ChurchSuite Types regression fix

- Rebuilt the Settings event wiring in a clean order.
- Top and bottom **Done** buttons both work again.
- Any setting change changes both buttons to **Save changes**.
- ChurchSuite Manual/Automatic mode correctly shows the Types manager.
- Add Type, edit Type name, change mapping and remove Type all work and mark Settings dirty.
- Saving Settings persists the ChurchSuite Type list and returns to Services when ChurchSuite is enabled.


## v50 — Settings runtime regression fixed

Two concrete JavaScript runtime errors in v49 were fixed:

- `DEFAULT_CHURCHSUITE_TYPES` was referenced by Settings but never defined.
  This caused `openSettings()` to stop before Done/Save buttons and ChurchSuite
  visibility handlers were bound.
- The Add Type focus code used an undefined `$$` helper. It now uses
  `document.querySelectorAll()` directly.

No other ChurchSuite/UI behaviour was intentionally changed.


## v51 — ChurchSuite-first Add Service workflow

When ChurchSuite Manual or Automatic is enabled:

- Add Service shows ChurchSuite service-plan URL first.
- If no URL is entered, title/date/type work exactly as normal and date remains required.
- Once a ChurchSuite URL is entered:
  - title/date/type become optional and visually de-emphasised
  - the primary button changes from **Add service** to **Scan ChurchSuite plan**
  - the ChurchSuite scan path becomes responsible for obtaining service metadata and items
- A scan placeholder screen is included ready for the actual ChurchSuite plan reader/importer.

The next ChurchSuite implementation step is to make Scan read the plan and present a mapped import preview before creating the service.


## v52 — ChurchSuite scan/insert confirmation

- ChurchSuite scan is explicitly preview-first.
- Nothing is inserted, deleted or replaced during the scan step.
- Before insert, the confirmation screen shows detected title/date/item count.
- When scanning into an existing service, any title/date changes and previously imported
  ChurchSuite items that may be replaced/removed are listed.
- Destructive updates require an explicit confirmation checkbox before Insert is enabled.
- No existing service details/items are silently deleted.


## v53 — OpenLP theme retained independently of ChurchSuite

- Add Service always includes an OpenLP theme selector.
- When ChurchSuite is Off, no ChurchSuite URL field or ChurchSuite wording appears.
- When a ChurchSuite URL is supplied, title/date/type may be sourced from ChurchSuite,
  but the OpenLP theme remains the locally selected value.
- The ChurchSuite scan and confirmation screens display and carry the selected OpenLP theme.
- ChurchSuite never sets or overwrites the OpenLP theme.
- The existing per-service OpenLP theme control on the planner remains available for later changes.


## v54 — real ChurchSuite Manual scan

The ChurchSuite scan is no longer placeholder data.

- Adds a Cloudflare Browser Run binding.
- Scan renders the JavaScript-heavy published ChurchSuite Plan Page.
- Browser Run `/json` extracts:
  - service title
  - date / date text
  - ordered Songs
  - ordered non-song items and their ChurchSuite Type names
  - useful item details
- UI maps Songs automatically to Song.
- Non-song items are mapped using Settings → Extensions → ChurchSuite service-plan types.
- Unconfigured Types are shown clearly and are not inserted.
- Preview includes a permanent reminder to update ChurchSuite Types and rescan if expected items are missing.
- Songs absent from the OpenLP song library are inserted as incomplete Song items.
- A valid ChurchSuite date is required before Insert is enabled.
- New service insertion is implemented.
- Existing-service sync preserves locally-added non-ChurchSuite items and replaces only previously imported ChurchSuite items.
- OpenLP theme remains independent and is preserved.

Browser Run Quick Actions require remote mode in local development, so test with:

    npx wrangler dev --remote

No D1 migration is required.


## v55 — deterministic ChurchSuite rendered-DOM scan

v54 used Browser Run's AI `/json` extractor. The page rendered, but the AI response
was not reliable enough for ChurchSuite.

v55 instead:
- uses Browser Run `/content` to fetch the fully rendered HTML;
- reads ChurchSuite's own Alpine bindings directly;
- explicitly extracts `x-text="planItem.type_name"`;
- checks several likely `planItem.*` title fields;
- checks separate song title bindings;
- extracts useful plan item details where available;
- looks for bound plan/service date fields and falls back to visible date patterns;
- returns diagnostic `planItem.*` field names when the date/items are incomplete.

This removes AI interpretation from the scan itself and makes the extractor deterministic.


## v56 — direct ChurchSuite CSS-selector scan

v55 still parsed serialized rendered HTML and returned only the outer shell.

v56 switches to Browser Run `/scrape`, targeting ChurchSuite's rendered DOM directly.

Primary selector:
- `[x-text="planItem.type_name"]`

Additional direct selectors target:
- likely plan item title fields
- song title fields
- plan item details/notes
- plan/service title
- date/time fields
- `[x-text^="planItem."]` for diagnostics

The scan preview now reports which exact CSS selectors matched and how many elements
were found. This makes the next adjustment deterministic if ChurchSuite uses a
different title/date binding on the real Plan Page.


## v57 — wait for ChurchSuite rendered plan items + diagnostics fix

- Browser Run now explicitly waits for `[x-text="planItem.type_name"]`.
- Navigation timeout increased to 60 seconds.
- Adds a small post-render delay before scraping.
- v56 diagnostics were returned by the Worker but accidentally not passed to the preview;
  v57 fixes that wiring.
- The preview now prints every selector and its match count when a scan is incomplete.
- Insert/Update remains disabled when either the service date or plan items are missing.


## v58 — Cloudflare Browser Run scrape typing workaround

Cloudflare's current Browser Run documentation supports:

    env.BROWSER.quickAction("scrape", ...)

but some generated `worker-configuration.d.ts` versions expose an incomplete Quick Action
overload list and reject `"scrape"` at TypeScript compile time.

v58 casts only the Browser binding at this call site:

    (env.BROWSER as any).quickAction("scrape", ...)

The runtime request remains the documented Browser Run `scrape` Quick Action.


## v59 — TypeScript fix after Browser binding cast

After the Browser binding was cast to `any`, `response.json<any>()` became invalid
because untyped function calls cannot accept type arguments.

v59 changes it to:

    const payload = await response.json() as any;

No runtime behaviour changed.


## v60 — ChurchSuite Core API v2 integration

Browser Run has been removed. ChurchSuite integration now uses the supported Core API v2.

### Authentication
- Worker reads `CHURCHSUITE_CLIENT_ID` and `CHURCHSUITE_CLIENT_SECRET` from Cloudflare Worker secrets.
- Uses OAuth2 Client Credentials against `https://login.churchsuite.com/oauth2/token`.
- Requests only `planning.read`.
- Browser users never receive or see either secret.
- Settings shows Connected / Not connected and a Test connection action.

### Planning API
- Published Plan Page URLs are resolved by ChurchSuite's plan `identifier`.
- Plans come from `/planning/plans`.
- Plan items come from `/planning/plan_items`.
- ChurchSuite Types come from `/planning/types`.
- Song plan items resolve their Song Arrangement and Song, including CCLI where available.
- Plan order is preserved using the API `order` field.
- Plan date/title/time and ChurchSuite `modified_at` are used directly from the API.

### Import / sync
- Manual: paste a published Plan Page URL and Scan.
- Automatic: Services → Sync ChurchSuite lists published plans for the next 120 days and marks plans already added.
- Linked services have an on-demand Sync action.
- Existing locally-added non-ChurchSuite items are preserved during sync.
- Previously imported ChurchSuite items are replaced only after the existing confirmation workflow.
- Service ChurchSuite link/ID/identifier/last-updated/import-mode now persist in D1.

### Songs-only mode
- Settings can default ChurchSuite import to:
  - Songs + configured Types
  - Songs only
- Add Service can override the choice.
- Songs-only preserves ChurchSuite song order and intentionally ignores other service-plan details.
- Other presentation material can then be added manually around the imported songs.

### User / UI tidy-up
- The initial/avatar button now opens Profile and Settings.
- Profile uses the authenticated Cloudflare Access identity already supplied by the Worker.
- Services subtitle mentions ChurchSuite only when ChurchSuite is enabled.
- ChurchSuite secret fields have been removed from browser Settings.
- The existing OpenLP theme selector remains completely independent of ChurchSuite.

### Upgrade
A D1 migration is required:

    npm run db:remote

Then deploy normally:

    npm run types
    npm run check
    npx wrangler deploy


## v61 — ChurchSuite import workflow tidy-up

- Fixed ChurchSuite-imported song items not opening the normal item/song editing workflow.
  Imported items use string IDs; the planner now compares item IDs safely as strings.
- Unmatched ChurchSuite songs remain as ordered Song placeholders and can later be matched
  to a song from the local library without losing the ChurchSuite slot/order.
- ChurchSuite import modes are now:
  - Songs only
  - All configured Types
  - Select Types for each import
- Select Types introduces an import step showing the Types found in the scanned plan.
  It works for both single-plan and multi-plan imports.
- Automatic ChurchSuite plans can now be selected in bulk:
  - Select all services
  - Select any subset
  - Import/sync selected services together
- Multi-service import shows one confirmation preview before changes are applied.
- Imported image-type items open the ordinary image editor:
  - attach images, or
  - choose Go without images to retain the run-sheet item without projection media.
- Existing locally-added items are retained during ChurchSuite sync.


### v61 follow-up fixes
- Existing v60 `mapped` import preference is automatically migrated to `all`.
- Batch Select Types can return cleanly to the multi-service selection screen.
- Unmatched imported ChurchSuite song slots now have a working **Choose song from library** action.
- Imported image items now persist **Go without images** correctly: the item stays on the run sheet, becomes non-projected/ready, and can later be changed back to attach images.


## v62 — ChurchSuite UX tidy-up

- Settings and Add Service both expose the same import-mode concepts:
  - Songs only
  - All configured Types
  - Select Types for each import
- "Select Types" remains a per-import step rather than a permanent selection in Settings.
- Unmatched ChurchSuite song slots now use a searchable song-library picker instead of a long select list.
  Search matches title, alternate title and CCLI number.
- ChurchSuite plans already present in the planner are subtly orange in the multi-service sync list.
- Imported image items that are waiting for images now show an inline **Ignore images** toggle directly in the service-plan view.
  Choosing it keeps the item on the run sheet, marks it complete, and removes the projection requirement.
- The image edit dialog uses the same Ignore images state and attaching images automatically turns projection back on.


## v63 — sync preservation + Bible ignore + pending ChurchSuite song write

- ChurchSuite sync now preserves locally-added images/media on the matching imported image item.
- It also preserves local Ignore images / Ignore Bible choices on matching imported items.
- Local song matches made against a ChurchSuite song placeholder survive a later ChurchSuite read-sync.
- Imported Bible items waiting for projection content now have an inline **Ignore Bible** control.
  It keeps the reading on the run sheet, removes the projection requirement and marks the item complete.
- The Bible edit dialog exposes the same Ignore Bible option.
- Matching an unmatched ChurchSuite song to a local library song now changes the service-plan item to:
  **Available locally · ChurchSuite update pending**
- A small **ChurchSuite update pending** chip is shown on that song item.
- v63 does not write anything back to ChurchSuite yet. The pending marker is deliberately retained for the next write-back stage.


## v64 — local-only service deletion / ChurchSuite write-back boundary

- Deleting a service in OpenLP Service Planner is explicitly local-only.
- The delete confirmation states that a linked ChurchSuite plan will not be changed or deleted.
- The action button now says **Delete from planner**.
- Once the local service is deleted, the next ChurchSuite upcoming-plans/import list no longer
  sees that plan as locally present, so a still-published ChurchSuite plan becomes available to add again.
- No ChurchSuite API write or delete request is made by local service deletion.

### ChurchSuite song write-back status

The current official ChurchSuite Planning OpenAPI (v2.92.2) exposes Songs,
Song Arrangements and Plan Items as read endpoints. `planning.write` currently appears
for creating plan notes, but the published Planning spec does not expose create/update/delete
operations for Songs or Plan Items.

The planner therefore continues to retain `churchSuiteWritePending` song markers but does
not issue unsupported write requests. Once ChurchSuite publishes supported song/plan-item
write endpoints, those pending markers are ready to drive preview/confirm write-back.


## v65 — Services progress states

The Services page now uses one Progress column rather than separate Projection and
Projector-copy columns.

Progress states:
- Not complete — some required projection items are still missing.
- Complete — all required projection items are ready, but no current projector copy has been marked.
- Downloaded — the current service version has been downloaded for the projection laptop.
- Amended after download — the service has changed since that projector copy was made.

Each state has its own restrained colour badge, and mobile uses the same status.


## v66 — favicon

Added the approved generic planning favicon (calendar/check motif) for browser tabs and saved-app icons.
Includes ICO, 16px, 32px, 180px Apple Touch Icon, 192px and 512px PNG assets.


## v67 — floating Add Item regression fix

- Restored the floating Add Item control as a small translucent fixed-position pill.
- Default position is just right of horizontal centre and below vertical centre.
- Old saved positions from the broken build are discarded so the control does not reappear at the top-left.
- Long-press anywhere on the button still enables dragging; the grab handle still starts dragging immediately.
- User-moved positions continue to be remembered under a new clean storage key.
- Added final authoritative CSS so older accumulated floating-button rules cannot push the control into page layout.


## v68 — brand favicon + dark floating Add Item

- Favicon now matches the app header brandmark: the dark green rounded-square **O**.
- Floating **+ Add Item** retains the v67 position/drag behaviour but now uses the same dark
  accent treatment as **Export OpenLP**.


## v69 — consolidation/polish
- Removed ChurchSuite default import mode from Settings; import/sync asks each time.
- Progress colours: orange incomplete, green complete, blue downloaded, red amended after download, grey old.
- Old means the service date has passed and overrides other progress states.
- Progress badges are equal width.
- Back to Planner is darker/bolder.
- Mobile service rows keep the delete bin on the same line and compress title text first.
- General Services-page spacing/alignment cleanup.


## v70 — mobile service-editor delete-row fix

- Fixed the main service editor item rows on small screens.
- The drag handle, item content, and action column now stay in one row.
- The delete bin is pinned in the right-hand action column and cannot wrap to a new line.
- Long titles/details compress and truncate before the delete control moves.
- Status and delete controls remain vertically stacked in the right column.


## v71 — mobile confirmation containment
- Keeps delete and other sheet confirmations within the mobile viewport.
- Prevents confirmation content/cards from forcing the sheet off the right edge.
- Confirmation action buttons wrap inside the dialog when necessary.


## v72 — OpenLP image export regression fix

The numbered-filename change introduced in v41 broke OpenLP image service items.

Known-good OpenLP behaviour (v40):
- the media file stored inside the `.osz` is named `<sha256>.<ext>`;
- the same SHA-256 value is supplied as `file_hash`;
- the image path in `service_data.osj` points at that hash-based stored filename.

v41 changed the stored filename to `001-original-name.png` while leaving `file_hash`
as the SHA-256 hash. OpenLP could open the service item but could not resolve/display it.

v72 restores the known-good hash-based internal filename for both Images and PDF pages
converted to images. The visible slide title remains prefixed `001-`, `002-`, etc. so
the planner-selected order remains explicit without breaking OpenLP's asset lookup.


## v73 — service actions / editor controls / ignored attachments
- Added explicit Edit buttons beside service delete controls on desktop and mobile Services pages.
- First delete click now changes the bin to a compact red ×; second click opens the existing delete confirmation.
- Service component editors now have a second Done button beside the top-right close control.
  Both top and bottom buttons change to Save Changes when the editor becomes dirty.
- Ignored image, video, and Bible items retain a visible No attachments chip after the checkbox is selected.
- Imported video items now support Ignore video consistently with imported Images/Bible items.
- Adding/replacing images or video automatically clears the corresponding ignore state and unchecks the ignore control.


## v74 — mobile Add Item default
- On screens up to 700px wide, the floating Add Item button now defaults to the bottom-right of the viewport for easier thumb reach.
- Desktop default position is unchanged.
- A user-dragged/saved position still takes precedence over the default.


## v75 — song library export tidy-up
- Removed the Export XML button from every individual song row.
- Song export remains available through song selection and Export selected ZIP.
- Simplified the Song Library explanatory text accordingly.


## v76 — unified screen chrome, undo, OpenLP view, dialog layout

### Main screens
- Service Planner and Services now share the same fixed application header and fixed footer.
- Service Planner header contains Services, Library, Run Sheet, and Export OpenLP.
- Services header contains Library and Back to last service.
- Services footer contains + Service and, in ChurchSuite automatic mode, Sync ChurchSuite.
- Service Planner footer contains + Item, Undo, Sync ChurchSuite for linked services, and OpenLP view.
- Mobile screens use wider left/right gutters to provide a safer finger-scrolling area.

### Undo
- Service Planner maintains a per-service undo history of the last 12 structural/edit states.
- Undo covers ordinary service/item edits, additions/deletions, theme/title changes and reordering.
- Undo restores the remote item/order state as well as the local view where possible.

### OpenLP view
- OpenLP view hides run-sheet-only items and displays only projected/exportable service items.
- Drag reordering is disabled while filtered OpenLP view is active so hidden run-sheet items cannot be accidentally reordered.

### ChurchSuite sync awareness
- Linked services are marked locally out-of-sync when item order changes or a song title changes.
- A subtle note appears beneath readiness and the service-level Sync ChurchSuite footer action gains attention shading.
- Successful ChurchSuite sync clears the local divergence marker.
- `0008_churchsuite_sync_state.sql` persists this state in D1.

### Dialogs
- The common sheet now owns a fixed header with X close control and a fixed footer.
- Dialog titles are automatically moved into the fixed header.
- Existing dialog action groups are automatically moved into the fixed footer.
- Dialogs without actions receive a Done button.
- Settings and service-item editors no longer need top Done/Save buttons.
- Item/library/settings dirty-state buttons use the consistent label Save Changes.

### Services mobile layout
- Explicit service action now reads Open rather than Edit.
- Progress and Updated sit side-by-side.
- ChurchSuite becomes a full-width field beneath them.
- View the ChurchSuite Plan uses the same button treatment as Sync ChurchSuite / Edit ChurchSuite.

### Export help
- Settings now contains editable Projector transfer instructions.
- The text is used in the Export OpenLP dialog, allowing local details such as Wi-Fi information or preferred transfer steps.


## v77 — ChurchSuite duplicate-item fix + mobile footer tightening

### Duplicate ChurchSuite songs/items
The duplicate-song issue was traced to repeated ChurchSuite syncs.

Previous behaviour:
- each scan generated a fresh planner ID such as `cs-<timestamp>-<index>`;
- the browser replaced imported items correctly;
- however `/api/services` upserted the new IDs in D1 without removing obsolete rows;
- old imported rows therefore accumulated in D1 and came back on a later bootstrap.

v77 fixes this in three layers:
1. New ChurchSuite imports use a stable planner ID based on the ChurchSuite plan-item `sourceId`.
2. When syncing an existing source item, its current local item ID is retained, preserving attached media/local edits.
3. A complete service POST now replaces that service's D1 item rows rather than merely adding/upserting the current IDs.

For services which already contain accumulated duplicates, the planner also collapses ChurchSuite
items sharing the same `churchSuiteSourceId`. It keeps the richer copy (for example a locally
matched song or an item with attached media) and never de-duplicates ordinary locally-created items.

### Mobile footer
- + Item is narrower.
- Service-level ChurchSuite sync uses a ↻ icon plus the shorter `ChurchSuite` label.
- OpenLP View changes to `Full Service` while filtered, rather than `Full service view`.


## v78 — ChurchSuite feedback + retained media library

### ChurchSuite
- Songs only / All configured Types / Select Types now acknowledge the click immediately with selected styling and a check mark before scan work starts.
- Bulk action label shortened to Import/Sync.
- Automatic ChurchSuite imports now retain/build the published Plan Page URL from the API when available, or from the account Plan Page host already learned from an existing linked plan.
- Existing auto-synced services also have their plan ID, identifier and public URL refreshed during sync.

### Mobile
- Service Planner left/right content gutters increased from 20px to 30px (50% wider) to provide a safer finger-scroll zone.

### OpenLP Planner media library
- Images, videos and PDFs can now be added either by Upload or from retained OpenLP Planner library media.
- Uploads offer a Store in OpenLP Planner library checkbox.
- Retained files are stored separately in R2 under library/<type>/ and service-specific copies remain under services/<service>/<item>/.
- Image, Video and PDF library screens now show:
  - OpenLP Planner library (retained files)
  - Service specific files, grouped by service
- Service-specific files can be promoted to the retained library.
- Retained files show which services use them; unused retained files can be deleted.
- Choosing a retained library file creates a service-specific working copy linked back to the retained source.
- Deleting a service deletes its service-specific R2 objects and database rows, while retained library objects remain.
- PDF library entries are retained as grouped converted-page assets, preserving the existing reliable image-slide OpenLP export model.

### Database
- `0009_media_library.sql` adds retained/media-type/source-library/group metadata to media assets and backfills existing assets from their service item type.


## v79 — Song Library Save a Copy + saved-version undo

- Editing a library song now offers **Save a Copy**.
- Save a Copy uses the current editor contents without altering the original song.
- The user supplies an identifying suffix; the new title is shown before saving and is stored as `Original title — suffix`.
- Every update to an existing shared song now snapshots the complete previous song into D1 first.
- Up to 20 previous versions are retained per song.
- The editor shows whether a previous saved version is available and who/when it was saved.
- **Undo most recent saved version** restores the immediately preceding version.
- The current version is itself preserved before restore, allowing an accidental restore to be reversed.
- Restoring refreshes titles of current service items linked to that exact library song.
- `0010_song_revision_history.sql` adds shared song revision storage.


## v80 — dialog consistency and service-item delete confirmation

- Service-item Delete now always opens a confirmation step before removing the item.
- Confirmation explicitly names the service and describes the kind of item being removed (for example scripture reading or image/sermon item).
- Add Item chooser now uses the standard fixed dialog footer with an explicit Cancel action.
- Images option renamed to **Images (for notices/sermon)**.
- OpenLP Planner media picker loading and selection screens use the same fixed header/footer pattern.
- Shared dialog CSS now constrains all sheet content to the mobile viewport.
- Media-library rows, picker rows and choice grids can shrink rather than forcing the dialog off-screen.
- Mobile dialog footer remains fixed and horizontally contains its action controls; the content area alone scrolls.


## v81 — master song save feedback fix

- Regular Song Library save is explicitly labelled **Save changes to master**.
- The master save no longer silently swallows a failed API request.
- Clicking save immediately changes the button to **Saving…** and disables it during the request.
- A confirmed save shows **Saved ✓** briefly before returning to the Song Library.
- A failed save leaves the editor open, reports the error, and does not replace the local master copy with an unconfirmed change.
- Service items linked to the song are refreshed across all loaded services after a confirmed master save.


## v82 — Song Library duplicate cleanup

- Song Library toolbar now includes **Remove duplicates**.
- Duplicate detection groups:
  - exact duplicate titles;
  - songs with the same CCLI number;
  - likely suffix variants sharing a base title, such as `Song — Youth` or `Song (Short version)`.
- Cleanup is review-only: nothing is deleted automatically.
- Each candidate has a checkbox.
- Songs currently used by any loaded service are marked **protected** and cannot be selected.
- Selected unused copies require a separate confirmation dialog before permanent deletion.
- The backend now supports deleting a song and its stored revision history.


## v83 — missing Song Library cache helper

- Restored the missing `persistSongs()` helper used throughout the Song Library.
- This fixes the duplicate-cleanup error `persistSongs is not defined`.
- The same fix also makes local caching reliable again after:
  - master song edits;
  - Save a Copy;
  - saved-version restore;
  - SongSelect imports;
  - usual-note edits.
- Duplicate cleanup now records a library activity entry after successful deletion.


## v84 — ChurchSuite confirmation pinned to footer

- Final ChurchSuite sync/import confirmation no longer hides the required checkbox at the bottom of the scrolling content.
- For an existing service, the fixed dialog footer now contains:
  - a compact **What will change** summary;
  - the required confirmation checkbox;
  - Back and Update service actions.
- Bulk ChurchSuite Import/Sync uses the same fixed-footer confirmation pattern.
- On mobile, the footer stacks summary → checkbox → actions and keeps the summary compact/scrollable if there are many changes.
- The main scanned-plan content remains independently scrollable above the pinned confirmation area.


## v85 — top-level Song Library delete

- Every song row in the main Song Library now has a delete/trash action.
- Deletion always requires a confirmation dialog.
- Songs currently used in any service are protected from deletion.
- If a song is in use, the dialog lists the services using it.
- Unused songs can be permanently removed from the shared D1 Song Library and local browser cache.


## v86 — Service Planner reorder / sync / upload / redo fixes

- Fixed main Service Planner cross-type drag ordering. ChurchSuite-imported item IDs are strings; the old reorder code coerced IDs to numbers, turning them into `NaN` and preventing reliable movement between imported/local item types.
- ChurchSuite sync now keeps previously imported items that are excluded from the latest sync selection and moves them to the bottom after synced items and local items.
- Those retained items show **Not included in latest ChurchSuite sync**, so they can be deleted or manually moved back into position.
- Video replacement/upload now gives immediate **Uploading video…** feedback and keeps the item editor open until upload completes or fails.
- Added **Redo** alongside Undo, with the same bounded per-service history.
- Current linked services now show a **View plan ↗** link in the Service Planner footer whenever a ChurchSuite Plan Page URL is available.


## v87 — ChurchSuite Plan Page address + mobile footer fit

- Settings → Extensions now has a one-time **ChurchSuite Plan Page address** field.
- For ChurchSuite Auto, enter the account's normal public address once, e.g. `https://yourchurch.churchsuite.com`.
- Auto sync/import combines that host with the API plan identifier and stores the complete `/-/plans/<identifier>` URL on each service.
- Manually pasted Plan Page URLs continue to teach the planner the account address automatically.
- Existing services that have a ChurchSuite identifier but no URL show a small notice; syncing again after setting the address fills the link.
- Mobile Service Planner footer is taller and all action labels may wrap to two lines, so every action can remain visible without horizontal overflow.


## v88 — ChurchSuite Plan Page setting dirty-state fix

- Changing **ChurchSuite Plan Page address** now marks Settings as edited immediately.
- The fixed footer button changes from **Done** to **Save changes** as soon as the address is typed/changed.
- Saving already persisted this value; v88 fixes the missing dirty-state wiring that prevented the save action from becoming available.
- The Plan Page address field now follows ChurchSuite extension visibility consistently and is hidden when ChurchSuite is Off.


## v89 — remember last main screen

- Refresh returns to the last main screen visited: **Services** or **Service Planner**.
- The choice is stored locally in that browser.
- Opening a service from Services records Service Planner as the active screen.
- Removed the older startup behaviour that always opened Services whenever ChurchSuite was enabled.
- Includes v88's ChurchSuite Plan Page address dirty-state fix.


## v90 — retained OpenLP Planner media folders

- Image, Video and PDF retained libraries now have real folders.
- Users can:
  - create folders;
  - rename folders;
  - move retained files/presentations between folders;
  - move items to Unfiled;
  - delete empty folders.
- PDF page grouping remains separate from folders: a multi-page retained PDF moves as one presentation.
- Retaining media directly from a service item automatically chooses a folder based on the service-item title.
  - First retained media from an item titled `Notices` uses folder `Notices`.
  - If `Notices` already exists, a new folder is created/reused with the service date, e.g. `Notices — 15 Aug 2026`.
- The same automatic folder behaviour applies when the **Store uploaded ... in OpenLP Planner library** checkbox is used while adding/editing Images, Video or PDF items.
- The OpenLP Planner media picker browses retained files by folder.
- `0011_media_library_folders.sql` adds folder metadata without changing the existing service-specific/retained distinction.


## v91 — OpenLP download button wording

- `Download & mark projector copy` → `Download`
- `Download incomplete & mark projector copy` → `Download Unfinished Service`
- `Download incomplete without marking` → `Download Unfinished Service without flagging as downloaded`
- `Download without Marking` → `Download without flagging as downloaded`


## v92 — simplified OpenLP download controls

- Export dialog now has only the applicable main download action:
  - **Download**
  - **Download Unfinished Service** when the service is incomplete.
- Removed the two separate "without flagging" download buttons.
- Added a checked-by-default checkbox: **Mark the service status - 'downloaded'.**
- Unchecking it downloads the same file without setting the downloaded status.
- **Download Unfinished Service** now uses the same dark primary-button treatment as Download.

### v92.1 styling correction
- **Download Unfinished Service** now uses exactly the same `primary` button class as **Download**, so the two buttons have identical dark styling.


## v93 — OpenLP export controls in fixed footer

The complete export decision area now lives in the dialog's non-scrolling footer:
- checked-by-default **Mark the service status - 'downloaded'.**
- the incomplete-export explanation, when relevant;
- **Download**;
- dark **Download Unfinished Service**.

The checkbox/explanation no longer scroll with the dialog body.


## v94 — formatted projector transfer instructions

Settings → **Getting the service onto the projector laptop** supports:
- `**bold**` or `__bold__`
- `*italics*` or `_italics_`
- `- bullet point`
- blank lines

The setting is stored as plain text and safely rendered in the Export OpenLP dialog.


## v95 — escaped formatting characters + blank-field help

- Projector transfer instructions now support escaping:
  - `\*` prints a literal `*`
  - `\_` prints a literal `_`
  - `\\` prints a literal `\`
- Escaped characters are protected before Markdown formatting is applied.
- When the transfer-instructions field is blank, its placeholder shows concise formatting examples for bold, italics, bullets and literal asterisks.


## v96 — Bible Gateway helper + optional paste cleanup

- Add/Edit Bible Reading now includes **Open in Bible Gateway ↗**, generated from the entered passage and translation.
- Added a default-on checkbox: **Clean Bible Gateway paste automatically**.
- When enabled, rich HTML paste cleanup attempts to remove:
  - section headings;
  - footnote markers/content;
  - cross-reference markers/content;
  - verse/chapter-number markup;
  - other obvious Bible Gateway annotation/UI elements.
- If only plain text is available, a lighter marker cleanup is applied.
- Users can untick the checkbox and paste again unchanged if cleanup ever removes something they wanted.
- The dialog still reminds users that turning off headings, footnotes, cross-references and verse numbers in Bible Gateway first is the safest workflow.


## v97 — published ChurchSuite plan directory

### Settings
- The growing **Extensions** section has moved to the bottom of Settings.
- ChurchSuite Auto now offers **Publish a ChurchSuite service-plan directory**.
- Configuration:
  - enable/disable publishing;
  - choose the site path, e.g. `/churchsuite-plans`;
  - choose 1–52 weeks ahead.
- Past plans are never included.

### Published page
- The configured path serves a clean minimalist macOS-style page.
- Each future published plan shows:
  - service date;
  - service title;
  - time when supplied;
  - direct link to the ChurchSuite Plan Page.
- **Re-sync** refreshes the cached list directly from ChurchSuite.
- The first visit also synchronises automatically if the cache has never been populated.
- The page is served by the existing Worker at the configured path, rather than requiring a separate filesystem/web directory.

### Database
- `0012_churchsuite_public_directory.sql` stores the cached published plan list and last-sync/range metadata.


## v98 — optional status and song-selection indicators on published ChurchSuite directory

ChurchSuite Auto → published directory has two new independent settings:

- **Show OpenLP Planner status**
  - matches the ChurchSuite plan to its linked OpenLP Planner service;
  - shows `Complete`, `Not complete`, `Downloaded`, or `Amended after download`;
  - shows nothing when no matching OpenLP Planner service exists;
  - status is calculated live when the public page is viewed, so it does not require a ChurchSuite re-sync to reflect planner changes.

- **Show whether ChurchSuite songs are selected**
  - Re-sync inspects the actual ChurchSuite plan items;
  - counts song items which have a selected arrangement;
  - displays `Selected (n)`, `None selected`, or `Unknown` if ChurchSuite could not be checked for that plan.

No new database migration is required because the existing cached-plan JSON can carry the additional song count and the display options are ordinary planner settings.


## v99 — optional Services-page link to published ChurchSuite plans

- Added **Show a link to this page on the Services screen** under the published ChurchSuite directory settings.
- When enabled, and directory publishing itself is enabled, a **ChurchSuite Plans ↗** link appears beside **Library** in the non-scrolling Services header.
- The link follows the configured published-directory path automatically and opens the minimalist directory in a new tab.
- If directory publishing is disabled, the Services-header link is hidden even if the link preference had previously been selected.
- No database migration is required.


## v100 — accurate ChurchSuite song selection state + subtle public status colours

The published ChurchSuite directory now distinguishes between song slots and actually selected songs:

- **All selected (n/n)** — subtle green
- **Partial (n/n)** — subtle orange
- **None selected (0/n)** — subtle red
- **No song items** — neutral
- **Unknown** — neutral if ChurchSuite could not be checked

Detection now counts every ChurchSuite plan item whose type is `song`, then separately counts the items with a selected `arrangement_id`. This catches plans which contain song positions but have not had songs chosen yet.

OpenLP Planner status on the public directory now uses the same restrained visual language:
- **Complete** — subtle green
- **Downloaded** — subtle green
- **Not complete** — subtle orange
- **Amended after download** — subtle red
- no matching OpenLP service — blank

No new database migration is required. Existing cached directory entries will gain the richer song state the next time **Re-sync** is pressed.


## v101 — direct media-library uploads + full-size viewing

### Direct library uploads
Image, Video and PDF libraries now include **＋ Add to library**.
- Files can be stored directly in the retained OpenLP Planner library without first creating a service item.
- The destination can be **Unfiled** or any existing library folder.
- A new folder can be created from the upload dialog.
- Images support multiple-file upload.
- Video supports direct retained upload.
- PDFs are converted to reliable image slides before being stored, preserving the existing OpenLP export model and grouping all pages as one retained PDF presentation.

### View media
Retained and service-specific media rows now include **View**.
- Images open at full available size in the standard dialog.
- Videos open in a full-size playable HTML5 video preview.
- Retained PDF presentations open as full-size pages with Previous/Next controls.
- Service-specific converted PDF pages can also be viewed full size.

### Worker
`/api/media` now accepts a `libraryOnly=true` upload mode, which creates only a retained library asset and no service-specific copy.

No database migration is required.


## v102 — media downloads, rename, folder-specific add, multi-move and drag/drop

- Image and Video library rows now support **Download** and **Rename**.
- Service-specific Image/Video rows also support **Download** and **Rename**.
- Every retained folder, including Unfiled, has its own **＋ Add** action.
  - The folder is locked as the upload destination.
  - The button immediately changes to **Loading…** while the upload dialog opens.
  - Upload progress then shows `Uploading…` / conversion progress as appropriate.
- Fixed folder assignment so direct uploads insert only the new retained asset into the chosen folder; existing folder members are not moved or reclassified.
- Retained media rows now have selection checkboxes.
- **Move selected (n)** moves multiple retained entries in one action.
- Desktop users can drag a row, or a multi-selection, directly onto another folder.
- Dropping onto a folder moves all selected/grouped asset IDs in one API call.
- Download responses use Content-Disposition attachment; normal View remains inline.
- Rename changes the displayed/stored file name without rewriting the R2 object.
- No database migration is required.


## v103 — service-specific media folder headers

- Service-specific media groups now use the same disclosure/folder header style as retained OpenLP Planner folders.
- Each service-specific group shows a folder icon and explicit file count.
- Service date remains visible at the right of the header, stacking neatly on mobile.
- No database migration is required.


## v104 — image edit save race fix

Fixed a Service Planner image-editor race where deleting an existing image and adding a replacement in the same edit could result in both images returning after Save.

Image editing now uses one serialized save flow:
1. the image rows still visible in the editor become the authoritative existing-image list;
2. removed service-specific media is deleted and awaited;
3. new images are uploaded and awaited;
4. the final media array is constructed exactly once;
5. the service item is saved once with that final array.

The general item save now also awaits `saveServiceItem()` before closing the dialog, reducing the chance of a later request overwriting the final media state.

No database migration is required.


## v105 — natural filename ordering for images

- Multi-image uploads are now sorted by filename in natural ascending order before they are saved.
- Examples:
  - `Slide 001.jpeg`
  - `Slide 002.jpeg`
  - `Slide 010.jpeg`
- Natural numeric comparison is used, so `Slide 10` comes after `Slide 2`, not between `Slide 1` and `Slide 2`.
- The same default filename ordering is applied when:
  - creating a new image presentation;
  - adding images to an existing service item;
  - uploading images directly into the retained Image Library.
- Existing image presentations now have **Sort by filename** in the image editor, while manual drag ordering remains available afterward.
- No database migration is required.


## v106 — iOS-safe OpenLP download + filename-order image uploads

### OpenLP `.osz` downloads on iPhone/iPad
OpenLP service files are ZIP containers internally, but they are not intended to be handled as ordinary ZIP downloads.

Previously the Worker returned:
`Content-Type: application/zip`

That encouraged iOS Files / Share workflows to identify, rename or unpack the `.osz` as a generic ZIP archive.

v106 now returns:
- `Content-Type: application/octet-stream`
- `Content-Disposition: attachment` with the explicit `.osz` filename
- RFC 5987 `filename*` as well as ordinary `filename`
- `X-Content-Type-Options: nosniff`

The bytes inside the file are unchanged; OpenLP still receives a normal `.osz` service file.

### Image ordering
Natural ascending filename ordering is now the explicit default for every multi-image upload path:
- new service image presentation;
- adding images to an existing presentation;
- direct Image Library upload / folder Add.

`Slide 001.jpeg` therefore precedes `Slide 002.jpeg`, and numeric filename components sort naturally.
Users can still manually reorder an image presentation afterward.


## v107 — native Share / Send for OpenLP service files

The OpenLP export dialog now offers **Share / Send** beside **Download**.

On browsers that support Web Share file sharing (including current iOS Safari):
1. the Worker generates the `.osz`;
2. the browser fetches it without saving it to Files;
3. the app creates an `.osz` File object;
4. the native iOS Share Sheet opens;
5. LocalSend can be selected directly.

The shared file is deliberately typed as `application/octet-stream` rather than `application/zip`, preserving the iOS-safe behaviour introduced in v106.

The existing **Mark the service status - 'downloaded'.** checkbox applies to both Download and Share / Send. A cancelled Share Sheet does not mark the service as downloaded.

If direct file sharing is unavailable in a browser, Share / Send falls back to the ordinary download and explains what happened.

Incomplete services also get **Share / Send Unfinished** alongside **Download Unfinished Service**.

No database migration is required.


## v108 — configurable local time for activity

- Added **Settings → Local time → Time zone**.
- Default is **Brisbane (Australia/Brisbane)**.
- Also includes Sydney/Melbourne/Canberra, Adelaide, Darwin, Perth and Auckland.
- Server activity timestamps remain stored as UTC; the Activity dialog converts them to the configured local timezone when displayed.
- D1 timestamps such as `2026-08-15 12:30:00` are explicitly interpreted as UTC before conversion.
- `last edited` timestamps use the same configured timezone.
- Daylight saving is handled by the IANA timezone rather than a fixed UTC offset.
- Existing activity records do not need to be rewritten.
- No database migration is required; the timezone is stored with the existing planner settings.


## v109 — Sermon Images, richer image editing, library cleanup, song statistics

- New **Sermon Images** planner item. It uses the same retained Image Library and exports as a normal OpenLP Images service item, but autoplay/loop default OFF.
- Existing image and Sermon Image editors now have subtle click-to-preview and Rename controls, natural filename sort, drag ordering, delete, library picker and upload.
- Item editor now has **Save** (stay in editor) plus **Done**.
- Library > Service specific groups are collapsed by default and use full folder-style headings/counts.
- Song-library maintenance no longer writes misleading activity entries against the last-opened service.
- New **Song statistics** library page:
  - usage is recorded only by an OpenLP export/download/share request;
  - one snapshot per service/service-date is retained, with a later export replacing the earlier snapshot;
  - infinite history in D1;
  - Most popular and Last used views;
  - CSV export.
- New migration: `0013_song_usage.sql`.


## v110 — quieter media-library editing + save-and-stay

- Image/video thumbnails in both retained and service-specific libraries are now the Preview control: click the thumbnail to open the large preview.
- Removed the redundant chunky **View** buttons.
- Download, Rename, Move, Store and Delete are now compact quiet icon actions with tooltips/ARIA labels.
- Folder/service rows therefore devote more space to the filename and usage information rather than controls.
- Rename File, Rename Service Media and Rename Folder dialogs now have:
  - **Save** — writes the change and stays in the current editor;
  - **Done** — writes the change and returns to the same library view;
  - **Back** — returns without another save.
- Media Library view state is preserved during edits:
  - currently open retained folders stay open;
  - currently open service-specific groups stay open;
  - scroll position is restored.
- Entering a media library fresh from the Library hub still collapses all Service Specific service groups by default, as requested.
- No database migration is required.


## v111 — previews return to their editor + song-stat date ranges

- Closing a large media preview now returns to the exact source context rather than a higher-level list.
- Service-item image previews return to the same item editor.
- Unsaved title/person/notes/autoplay/loop/interval/ignore state is preserved while previewing.
- Retained and Service Specific library previews restore the same open groups and scroll position.
- The preview header X behaves like Done and returns to the source editor/library context.
- Song Statistics now supports All time or a custom date range.
- Date-range filtering applies to totals, service-days, Most popular, Last used and CSV export.
- Either date boundary may be left blank for an open-ended range.
- No new migration is required.


## v112 — Song Statistics service filters

Song Statistics can now be filtered by any combination of services that have recorded song usage.

- The Services filter lists every service represented in the song-usage history, with service title and date.
- Default is **All services**.
- Open the service selector to choose one service, several services, or the whole set.
- Service selection combines with the existing **All time / Date range** filter.
- Most popular, Last used, usage totals, service-day totals and CSV export all respect both filters.
- The selected service IDs are included in filtered CSV output.
- No new migration is required; the existing `song_usage` history already records service IDs.


## v113 — configurable regular service types

The planner no longer assumes only two Sunday services.

### Regular service types
Settings → **Regular service types** can contain any number of recurring services. Each type has:
- a user-defined name;
- a usual day of week;
- a default OpenLP theme.

Existing historical Morning Service/Morning Church data is migrated to **Morning Church** and Night Service/NightChurch to **NightChurch**. Other existing regular titles are preserved as their own regular service types rather than being discarded.

### Creating services
New Service now offers the configured regular service types plus **One-off service**.
- Regular services can still be created on any calendar date; the configured weekday is guidance/default metadata, not a restriction.
- Selecting a regular type chooses that type's default OpenLP theme.
- The theme remains editable on the individual service before creation and afterward through the normal service theme control.
- One-off services can have any name/date and default to OpenLP `Default`.
- New ChurchSuite plans are matched to a regular service type by exact configured name; unmatched plans become one-off services rather than being incorrectly classified as regular.

### Song Statistics
The service filter is now based on **service categories**, not individual dated services:
- Morning Church
- NightChurch
- any other user-defined regular service type
- **One-off services**, grouping all one-off events together

Any combination can be selected and combined with All time / Date range. Usage rows now snapshot service type ID/name at export time so infinite historical statistics continue to work even if the original service plan is later deleted.

### Database
New migration: `0014_service_types.sql`.


## v114 — explicit ChurchSuite service mapping

ChurchSuite service classification no longer guesses from an OpenLP Planner service title.

### Settings → Extensions → ChurchSuite → ChurchSuite service mapping
- **Refresh from ChurchSuite** reads the distinct names of published Planning plans available through ChurchSuite API v2.
- Each discovered ChurchSuite plan name can be mapped explicitly to:
  - any configured Regular Service Type; or
  - **One-off services**.
- Unmapped ChurchSuite plan names safely default to **One-off services**.
- Mapping changes are ordinary planner settings and require no additional database migration.

### Import / sync behaviour
- New ChurchSuite services use the explicit mapping to set `kind`, `serviceTypeId` and `serviceTypeName`.
- A mapped regular service receives that regular type's default OpenLP theme when first created.
- Later ChurchSuite re-syncs update the service category from the explicit mapping but do **not** overwrite a theme that has been manually changed for that individual service.
- Existing linked ChurchSuite services therefore follow future mapping changes when they are next synced.

### Why plan-name mapping?
The Core API v2 Planning plan records currently used by this project expose the published plan name we already retrieve reliably. v114 makes that relationship explicit and user-controlled rather than using title heuristics.


## v115 — intelligent ChurchSuite service mapping suggestions

ChurchSuite → Planner service mapping now has a smart default.

If there is no saved explicit mapping for a ChurchSuite plan name:
1. the planner compares the start of the ChurchSuite plan name with every configured Regular Service Type name;
2. a full prefix match selects that regular service type automatically;
3. if several service types match, the longest/more-specific service type name wins;
4. if none match, the plan defaults to **One-off services**.

Examples:
- `Morning Church` → `Morning Church`
- `Morning Church with Communion` → `Morning Church`
- `NightChurch – Baptism` → `NightChurch`
- `Christmas Day` → `One-off services` unless manually mapped otherwise.

The Settings mapping UI labels inferred rows as **Suggested from service-name prefix**. Selecting a different option saves an explicit mapping, and that manual choice always takes precedence over future automatic inference.

No database migration is required.


## v116 — portable database backup and restore

### Settings → Database backup & restore
- **Download database backup** exports a JSON backup of every application database table:
  - planner state/settings;
  - users;
  - services/items/activity;
  - songs and song revision history;
  - retained-media metadata/folders;
  - ChurchSuite directory cache;
  - song-usage history.
- The backup format is application-level rather than a D1 SQL dump so it can also be consumed by a future non-Cloudflare backend.
- Backup files include a format name/version and creation timestamp.

### Restore
- **Restore database backup** reads one of these JSON files.
- Restore requires both a warning checkbox and typing `RESTORE`.
- The current database rows are replaced in dependency-safe order.
- The app reloads after a successful restore.
- No schema/migration downgrade is attempted; the current deployed schema remains in place and compatible backup columns are restored.

### Important media limitation
Database backups include `media_assets` metadata but not the actual uploaded Image/Video/PDF bytes, which currently live in Cloudflare R2. A future full-disaster-recovery/media backup should export those objects separately or as a larger archive.

No new D1 migration is required.


## v117 — full backup and media restore

Settings → **Backup & restore** now has two backup levels.

### Full backup
**Download full backup** creates one ZIP containing:
- `manifest.json`
- `database.json`
- every Image, Video and PDF object referenced by `media_assets`, including retained Library files and service-specific files.

The archive records each object's original R2/storage key, filename, content type, byte size and SHA-256 metadata so the same format can later be restored to another storage backend.

### Full restore
**Restore full backup**:
1. uploads and validates the ZIP;
2. checks that every media entry in the manifest is actually present;
3. restores the archived media objects to their recorded storage keys;
4. restores the application database;
5. removes media objects referenced by the pre-restore database that are not part of the restored backup;
6. reloads the application.

The restore requires both a warning checkbox and typing `RESTORE`.

Only objects represented by the planner's `media_assets` table are backed up/deleted; unrelated objects in the storage bucket are not touched.

### Database-only backup
The existing smaller JSON database backup and restore remain available for quick backups where uploaded media is already safe elsewhere.

### Portability
The full ZIP format is application-level rather than D1/R2-specific:
- database state is JSON;
- media bytes are ordinary ZIP entries;
- the manifest maps archive files to logical storage keys.

A future VPS implementation can consume the same backup package using filesystem/S3/MinIO storage.

No new D1 migration is required.


## v118 — ChurchSuite today/past-service sync override

### Today is now always available
ChurchSuite's `starts_after` boundary can exclude a plan on the boundary date. The planner now requests one extra day before its desired start date and then filters locally, so **today's published plans are always eligible for sync even after their scheduled service time has passed**.

### Temporary past-service override
The ChurchSuite Sync dialog now has a **Services to show** selector:
- Today + future
- Yesterday + future
- Last 7 days + future
- Last 30 days + future

This is intentionally a per-sync override rather than a permanent setting. It is useful for:
- mid-service fault recovery;
- re-importing or repairing today's service;
- recovering a service that was missed;
- checking or rebuilding a recently-past service.

Past plans are subtly marked **Past** and today's plans **Today**.

The selected window is retained while moving through the ChurchSuite import/type/confirmation flow and using Back.

No database migration is required.


## v119 — Bible paste parser preserves verse numbers + removal cross-check

- Automatic Bible Gateway paste cleanup now **preserves verse and chapter numbers**.
- The parser no longer blanket-removes `<sup>` elements.
- Bible Gateway `.versenum`, `.chapternum`, `.verse-num` and related elements are flattened into ordinary passage text rather than deleted.
- Superscript content is removed only when it is recognisably a footnote/cross-reference marker; unknown superscript content is preserved rather than discarded.
- When cleanup removes identifiable material, the Bible editor shows a collapsible **Removed by parser** cross-check panel.
- Removed material is labelled by category: Heading, Footnote, Cross-reference, marker or page furniture.
- Duplicate removed snippets are collapsed in the review.
- Plain-text cleanup is deliberately conservative because semantic HTML is unavailable: it removes only obvious bracketed annotation markers and preserves all numeric verse numbers.
- Help text now recommends turning off headings, footnotes and cross-references in Bible Gateway, while explicitly allowing verse numbers to remain enabled.

No database migration is required.


## v120 — restore OpenLP theme management + ChurchSuite Sermon mapping

### OpenLP themes/templates
Settings again has a dedicated **OpenLP themes/templates** section.
- Add as many exact OpenLP theme names as needed.
- Names are shared by Regular Service Type default-theme selectors and the individual Service theme selector.
- Added names are persisted in planner settings and therefore included in planner backups.
- Custom theme names can be removed when they are not currently used by a service or regular service type.
- `Default` and the existing built-in planner theme names remain available.
- Adding a theme includes the existing warning that the name must exactly match OpenLP on projection laptops.

### ChurchSuite service-plan type → Sermon
**Sermon** is now an available destination in Settings → Extensions → ChurchSuite service-plan types.

A ChurchSuite Type mapped to Sermon imports as the planner's Sermon Images item:
- projected;
- waiting for sermon images;
- Auto/loop OFF by default;
- marked internally as the sermon-image category.

This remains distinct from the ordinary **Images** mapping, whose normal image defaults continue to apply.

No database migration is required.


## v121 — Empty service status + Bible chapter/verse formatting

### Empty services
A service with **no service items at all** now reports **Empty**, not Complete.

This is reflected in:
- the Services screen status badge;
- the published ChurchSuite plan directory's OpenLP Planner status.

Empty uses the same subtle grey family as other neutral/old states. A service that contains items but no projected items may still be Complete when all of its actual service items require no further projection work.

### Bible Gateway number formatting
For rich HTML pasted from Bible Gateway with automatic cleanup enabled:
- **chapter numbers** are retained as OpenLP bold formatting: `{st}1{/st}`;
- **verse numbers** are retained as OpenLP superscript formatting: `{su}6{/su}`;
- the parser normalises the boundary so there is **exactly one space after the formatted number before the nearest following word**.

These are OpenLP's built-in Formatting Tags, so the formatting travels inside the generated OpenLP service rather than being browser-only.

The Bible dialog also now shows a **Formatted passage preview** beneath the editable text. This renders the OpenLP tags as bold/superscript for visual checking, while the textarea retains the actual `{st}` / `{su}` markup that OpenLP needs.

Plain-text clipboard data does not contain enough semantic information to distinguish chapter numbers reliably from verse numbers, so the plain-text fallback preserves numbers but does not guess their formatting.

No database migration is required.


## v122 — real ChurchSuite plan links only + single Save Changes action

### ChurchSuite links
A service now shows a ChurchSuite Plan link only when that service has an actual ChurchSuite plan reference.

- The global ChurchSuite account/base URL is never treated as a service's plan URL.
- A blank/unlinked service shows **Not linked** / **Add ChurchSuite link**.
- A service-level link must point to a real `/-/plans/...` Plan Page.
- Manual entry of the ChurchSuite base/home URL is rejected with an explanatory message.
- Older services with a stale base-only URL and no `churchSuitePlanId` / `churchSuitePlanIdentifier` are cleaned up in the browser state.
- When an identifier is genuinely attached but the stored plan URL is missing, the planner may still construct the real Plan Page URL from the configured account base + that identifier.
- Sync buttons only appear for services with an actual plan reference.

### Service-item editor Save / Done
The editor no longer turns both footer buttons into **Save changes**.

- **Save changes** is the light/secondary button and saves while staying in the editor.
- **Done** remains the dark/primary button. If there are unsaved changes, Done saves them and closes the editor.
- During image/video uploads both controls show appropriate progress, then return to their distinct labels.
- The same behaviour is used consistently for image-based service items and the other service-item editors.

No database migration is required.


## v123 — View Plan requires an actual saved ChurchSuite plan URL

The **View the ChurchSuite Plan** button/link is now rendered only when that
specific planner service has a valid saved ChurchSuite Plan Page URL
(`/-/plans/...`).

A ChurchSuite plan ID or identifier can still support sync/import logic, but it
does not by itself create or expose a **View Plan** button. The global
ChurchSuite account/base URL is never sufficient.


## v124 — strict View Plan visibility + Clear download mark on Service Planner

### View Plan
The Service Planner footer/header **View plan** action now uses the same strict
validation as the Services screen. It is visible only when the current service
has a saved, valid ChurchSuite Plan Page URL (`/-/plans/...`). A blank service,
a locally-created service, a plan ID/identifier without a URL, or the global
ChurchSuite account/base URL will not display View plan.

When hidden, its `href` is removed as well, preventing a stale link remaining
clickable after switching between services.

### Clear download mark
**Clear download mark** has moved out of the Export OpenLP dialog.

When the current service is marked Downloaded (or Amended after download), a
small subtle **Clear download mark** action appears immediately below the
fixed-header **Export OpenLP** button. Clicking it clears only the planner's
projector/download status; it does not delete any previously-downloaded `.osz`
file.

No database migration is required.


## v125 — remove phantom Service Planner View Plan control

The Service Planner no longer contains a permanent hidden `View plan` anchor in
its footer. The control is created dynamically only when the current service
has a validated saved ChurchSuite Plan Page URL, and is removed from the DOM
when the current service does not. This prevents CSS/layout rules from
overriding the HTML `hidden` state and exposing a phantom View Plan button.


## v126 — Microsoft SSO + local users + three access levels

Authentication:
- native Microsoft Entra OIDC SSO, restricted by default to `@kpc.org.au`;
- local email/password users created by an Administrator;
- existing Cloudflare Access identity remains accepted during transition.

Access levels are cumulative:
1. Service List only.
2. Service List + OpenLP Planner/Library/export.
3. Level 1 + 2 + Settings/user administration/backups.

New Microsoft SSO users start at Level 1. Existing users are migrated to Level 3
to avoid locking out the current installation.

Local passwords use PBKDF2-HMAC-SHA256 with 600,000 iterations, unique salts,
12-character minimum, login lockout, server-side hashed session tokens, and
Secure/HttpOnly/SameSite=Lax host-only cookies.

Microsoft OIDC uses Authorization Code + PKCE and validates token signature,
issuer, audience, expiry and nonce.

Configure these Worker/VPS environment secrets:
- MICROSOFT_TENANT_ID
- MICROSOFT_CLIENT_ID
- MICROSOFT_CLIENT_SECRET
- MICROSOFT_ALLOWED_DOMAIN (optional; defaults to kpc.org.au)

Register:
https://YOUR-PLANNER-HOST/auth/microsoft/callback

New migration: 0015_auth_permissions.sql.

- State-changing authenticated requests also reject a mismatched `Origin` header
  as an additional CSRF defence.


## v127 — Microsoft SSO runtime configuration diagnostics

- Adds `/auth/config-status`, which reports only whether the running Worker can
  see each Microsoft configuration binding. Secret values are never returned.
- The login page now names any missing Microsoft binding when SSO is unavailable.
- Adds `keep_vars = true` to `wrangler.toml` so Wrangler deployments preserve
  dashboard-defined text variables.
- No database migration is required.


## v128 — sign-out/authentication hardening

- Hosted deployments no longer fall back to locally cached "static mode" when
  `/api/bootstrap` returns 401 or authentication fails.
- A 401 immediately redirects to `/login`.
- Protected HTML responses use `Cache-Control: no-store, private`.
- Logout clears the planner session, disables caching and sends
  `Clear-Site-Data: "cache"` to reduce browser back/forward-cache surprises.
- Adds `/auth/session-status`, which safely reports whether the running Worker
  currently considers the browser authenticated, plus user/access level when
  signed in. No token or secret is exposed.
- Local/static fallback remains available only for localhost development.

No database migration is required.


## v129 — delete users

Settings → Users & access → Manage users now includes **Delete user…**.

Deletion:
- requires a confirmation checkbox and typing `DELETE`;
- removes the user's Planner account;
- deletes all active Planner sessions for that user;
- does not delete or rewrite historical service activity/audit records;
- cannot be used to delete the administrator account that is currently signed in.

For Microsoft SSO users, the confirmation explicitly notes that automatic
`@kpc.org.au` provisioning can recreate the user at Level 1 on a later sign-in.
Use **Disable this account** when the intent is to block that Microsoft identity
from future access.

No database migration is required.


## v130 — Cloudflare-compatible PBKDF2

Cloudflare Workers WebCrypto rejects PBKDF2 iteration counts above 100,000.
Local-password hashing now uses PBKDF2-HMAC-SHA256 with **100,000 iterations**
and a unique random 16-byte salt.

The stored `password_iterations` value is now used when verifying a password,
so each account records the work factor that created its hash. The helper also
caps requested iterations at the current Workers runtime maximum.

No database migration is required. Local users whose creation/reset failed
under v126-v129 can simply be created/reset again after deploying v130.


## v131 — permission-aware login redirects

Successful sign-in now routes directly to the highest area the account can use:

- **Level 1 · Service List** → the configured separate Service List URL.
- **Level 2 · Planner** → the main OpenLP Service Planner.
- **Level 3 · Administrator** → the main OpenLP Service Planner, with Settings
  available there.

The same logic is used for Microsoft SSO, OpenLP Service Planner email/password
accounts, and an already-signed-in user visiting `/login`.

The Level-1 server guard now detects the Service List path explicitly rather
than repeatedly redirecting to itself, preventing the permission redirect loop.

Terminology in the user-management UI has also changed from "local user" to
**OpenLP Service Planner user**.

No database migration is required.


## v132 — named permissions and conditional ChurchSuite Service list

Visible permission names are now:
- **ChurchSuite Service list**
- **Planner**
- **Administrator**

The ChurchSuite Service list permission can be assigned only while ChurchSuite
is in **Automatic** mode and Service List publishing is enabled. User creation
offers only Planner/Administrator when it is unavailable.

Existing Service-list-only users are not silently promoted if the feature is
later disabled. They are redirected after login to a notification screen
explaining that their assigned feature is currently unavailable, with Sign out.

The ChurchSuite Service list page now includes:
- **OpenLP Planner** for users who also have Planner/Administrator access;
- **Sign out** for all authenticated users.

Underlying numeric values remain internal for compatibility; numbers are removed
from the user-facing permission labels. No database migration is required.


## v134 — ChurchSuite Service List sync controls

The standalone ChurchSuite Service List now has:

- **Re-sync** with an immediate "Syncing with ChurchSuite…" working indicator;
- the working indicator remains visible until the network sync actually finishes;
- **Last synced …** shown under the page heading after every load;
- server-side protection against more than one manual sync in any 5-minute period;
- a short-lived server-side sync lock so simultaneous users cannot start overlapping syncs;
- **Log out** beside Re-sync;
- a subtle **Back to OpenLP Service Planner** link underneath the buttons, shown
  only when the signed-in account has Planner or Administrator access.

ChurchSuite-Service-list-only users therefore never see a Planner link that
they do not have permission to use.

No database migration is required.


## v135 — fix v134 Service List build

v134 embedded browser JavaScript template literals inside the Worker HTML
template string, which broke TypeScript parsing. v135 removes all nested
backticks from the embedded Service List script and safely embeds the configured
directory path.

All v134 behaviour is retained: working sync indicator, last-sync note,
five-minute throttle, overlap lock, Log out, and the permission-aware return
link to OpenLP Service Planner.

No database migration is required.


## v136 — TypeScript cleanup

- Fixes TS18048 on the permission-aware "Back to OpenLP Service Planner" link
  by normalising the optional access level before comparison.
- Adds `@types/node` to devDependencies, matching Wrangler's generated-types
  recommendation for the current Node.js compatibility configuration.
- No functional change to v135 Service List behaviour.
- No database migration is required.


## v137 — enforce 5-minute ChurchSuite Service List re-sync cooldown

The 5-minute rule is now enforced in two places:

1. **Server-side** — every manual Service List sync checks the timestamp of the
   most recent successful sync before any ChurchSuite API work begins. Requests
   inside the 5-minute window return HTTP 429 with the remaining cooldown.
2. **Page UI** — the Re-sync button is rendered disabled during the cooldown and
   shows a live "Re-sync available in Xm Ys" countdown. It becomes clickable only
   when the cooldown expires.

A successful sync immediately starts a fresh 5-minute cooldown. A failed sync
does not start the cooldown. The existing overlap lock remains in place.

No database migration is required.

## v138 — Song Library imports, classifications and Settings cleanup

Song Library:
- dark sticky `+ Song` footer action;
- Create manually, CCLI/SongSelect paste, and OpenLyrics XML import;
- OpenLyrics accepts multiple files;
- imports use existing CCLI/title duplicate matching;
- SongSelect launched from the Library adds to the Library only; service add
  workflows can add the imported song to the current service.

Classifications:
- administrator-defined classification groups;
- rules: Exactly one required, One or more required, Optional / zero or more;
- required groups have a default;
- initial groups: Collection, Review, Service position;
- default Collection classification is Uncategorised;
- classifications are editable per song and searchable/filterable in the Library;
- changing group rules normalises existing songs rather than deleting them.

Settings:
- sticky navigation tabs: General, Services, Song Library, Extensions, Backup;
- classification administration lives under Song Library.

New migration: `0016_song_classifications.sql`.


## v139 — service-specific media follows service items

In Image, Video and PDF libraries, the Service specific section is now nested:

**Service → service item → files**

For example:

- Morning Church
  - Notices
  - Sermon
- NightChurch
  - Notices
  - Sermon

The service-item folder name comes from the actual Planner item title, so custom
titles are respected rather than hard-coding "Sermon" or "Notices".

Existing preview, download, rename and Store-in-library actions remain available
on the files inside the item folder.

No database migration is required.


## v140 — CCLI / SongSelect file import

The Song Library **＋ Song** chooser now offers four paths:

- Create manually
- CCLI / SongSelect paste
- CCLI / SongSelect file
- OpenLyrics

The new file option accepts common text/RTF-style SongSelect/CCLI files and
passes the extracted text through the same existing SongSelect parser and review
screen as paste import.

That means file imports retain the existing:
- metadata review;
- CCLI/title duplicate detection;
- default song classifications;
- Song Library-only behaviour when launched from the Library;
- optional add-to-current-service behaviour when launched from Add Song.

No database migration is required.


## v141 — fix v139 media-library TypeScript error, retain v140

v139 introduced service-specific media grouping by service item, but the
service-item JSON fallback was inferred by TypeScript as `{}`, causing TS2339
for `.title` and `.type`.

v141 parses the item JSON with an explicit shape:

`{ title?: string; type?: string }`

and then reads the service-item title/type from that typed object.

v141 is based on v140, so it also retains:
- Service specific media grouped as Service → service item → files;
- CCLI / SongSelect file import;
- CCLI / SongSelect paste import;
- OpenLyrics import;
- song classifications and Settings navigation from v138.

No new database migration is required beyond migrations already introduced in
earlier versions.


## v142 — edit song classifications from lists and service plans

Song classifications no longer require opening the full Song Library editor.

A compact **Classifications** action is now available from:
- the main Song Library list;
- the Add Song / song-search list;
- Song Statistics rows for songs still present in the library;
- a song preview opened while adding a song to a service;
- an existing song item opened from a service plan.

All of these use the same shared quick-classification editor and therefore obey
the administrator-configured group rules and defaults. Saving updates the shared
Song Library record immediately.

Song-search lists now also search classification names.

No database migration is required.


## v143 — clearer and working classification controls

- Song Library search results now show a plain-text classification summary.
- Icon-only classification controls are replaced by a visible **Classify** button.
- Add Song search results use the same clearer presentation.
- Opening a song item from a service now shows the song's current classifications
  and a working **Classify** button.
- Saving classifications from a service item returns to that same service item.
- Song Statistics uses a labelled **Classify** action.

No database migration is required.


## v144 — Bible Gateway parser review + optional automatic fetch

Bible passage dialogs now show the first three **Removed by parser** items
immediately. Any additional removed items are behind a small disclosure control,
so the cross-check is visible without opening the full list.

A new **Try automatic fetch** button is available beside **Open in Bible Gateway**.

The automatic path:
- sends only the Bible reference and translation code to the Worker;
- the Worker constructs a fixed `biblegateway.com/passage/` URL;
- uses the Worker's HTTP `fetch()` (the Cloudflare equivalent of doing a curl
  request on a traditional server);
- passes returned HTML through the exact same existing Bible Gateway parser;
- fills the passage text only when usable text is recognised;
- leaves the existing copy/paste workflow completely independent.

If Bible Gateway blocks server requests or changes its HTML, the automatic
attempt reports the failure and explicitly directs the user back to Open in
Bible Gateway + paste.

No database migration is required.


## v145 — service classification fix + bulk classification

- Fixes the dead **Classify** button when a song is opened from a service. The handler had accidentally been nested inside the **View / edit song lyrics** handler.
- The Song Library selection toolbar now includes **Classify selected (N)**.
- Bulk classification uses per-category **No change / Add or set / Remove** actions, so existing unrelated classifications are preserved.
- Exactly-one groups enforce one Add/set choice, and the existing classification normaliser still enforces required groups/defaults for every updated song.

No database migration is required.


## v146 — harden Bible Gateway automatic fetch parsing

The normal rich-paste parser remains unchanged in behaviour, but the automatic
fetch path now tells it to prefer Bible Gateway's actual passage-content
container before cleaning the page.

The HTML cleaner no longer assumes `document.body` is present. It uses a safe
root fallback and returns an empty result rather than throwing a null
`textContent` error.

If the fetched HTML cannot be recognised, the UI now shows a simple fallback
message and leaves the existing Open in Bible Gateway + paste workflow available.

No database migration is required.


## v147 — security hardening

- Adds an Administrator toggle controlling whether first-time Microsoft users from the configured domain may self-enrol at the lowest access level. Default is enabled for backward compatibility.
- Removes obsolete trust of `cf-access-authenticated-user-email`.
- Makes logout POST-only, invalidates the session and clears browser storage/cache.
- Strengthens same-origin/CSRF checks for unsafe requests.
- Adds CSP, anti-framing, nosniff, referrer, permissions and HSTS headers.
- Displays the configured Microsoft domain rather than hard-coding kpc.org.au.
- Renames the service footer link to **View CS Plan ↗**.
- Moves the Projection laptop / Presentations plugin note into **Services → Projector transfer instructions**.

No database migration is required.


## v148 — formatting consistency pass

A full static review was made across the main planner, Settings tabs and the shared dialog system. This release adds a final consistency layer for dialog headers/scroll bodies/fixed footers, action-row wrapping, settings spacing, mobile settings headers, form/help-text wrapping, button-styled links and destructive footer actions.

It also expands the terse access-level descriptions so **Planner** and **Administrator** no longer repeat their own labels as their descriptions.

No database migration is required.

## v149 — OpenLP compatibility note

- General Settings now states that the Service Planner is built for **OpenLP 3.1.7**.
- It recommends using OpenLP 3.1.7 on projection computers and warns that other OpenLP versions may behave differently with exported/imported services, songs or media.

No database migration is required.


## v150 — dual Cloudflare / Debian VPS runtime

This installation build includes the portability work prepared for the public repository. Your existing Cloudflare deployment remains the primary runtime and keeps its current `wrangler.toml`, D1 database, R2 bucket and song library unchanged.

A second runtime is now included under `server/` for Debian/Node deployments using SQLite and filesystem media storage. See `docs/DEBIAN-VPS.md` and `deploy/debian/`.

Fresh installations no longer require Microsoft Entra ID to establish the first Administrator. A one-time `PLANNER_SETUP_TOKEN` enables `/setup`, where the first Administrator may be created as a normal Planner email/password account. Microsoft SSO remains optional. Your existing KPC installation does **not** need to use `/setup` because Administrator accounts already exist.

The Settings **Projection laptop note** is now contained inside **Services → Projector transfer instructions**, so it no longer appears beneath unrelated Settings tabs.

No D1 migration is required for v150.


## v151 — Service Plans label + Song Statistics bulk classification

- In **Service plans**, an existing ChurchSuite plan URL is now edited with the
  clearly labelled **Edit CS Plan URL** button.
- **Song statistics** rows for songs still present in the shared Song Library
  can now be selected with checkboxes.
- **Select visible** selects/deselects all currently displayed library-backed
  statistics rows.
- **Classify selected (N)** opens the existing bulk classification editor, so
  classifications can be added/set/removed across the selected songs while
  preserving unrelated classifications and enforcing classification-group
  rules/defaults.

No database migration is required.


## v152 — Song Statistics layout correction

The checkbox added in v151 exposed an older flexible-row rule and allowed the
Song Statistics title/details column to collapse too aggressively.

The statistics rows now use an explicit four-column grid:

**selection · rank · flexible song details · Classify**

The song-details column receives all remaining width and titles wrap normally.
On narrow screens the Classify button moves beneath the song details rather than
compressing the title.

No database migration is required.


## v153 — SongSelect Back + structured manual song creation

- **CCLI / SongSelect paste** now has a **Back** button returning to the Add Song chooser (and from there back to the Song Library/service song picker).
- **Create manually** now uses a general **Lyrics** paste box rather than assuming Verse 1.
- **Parse lyrics into sections** recognises Verse, Chorus, Bridge, Pre-Chorus, Tag, Ending, Intro and Other headings, including common short forms such as V1/C1/B1.
- Parsed components appear in an editable section list where the component type, section number and lyrics can all be corrected, removed or supplemented with **＋ Section**.
- Manual songs now include **Usual verse order** and **Usual music note**, along with title, authors, CCLI number, copyright and classifications, matching the important shared fields on existing library songs.
- Saving without pressing Parse still parses a non-empty Lyrics box automatically as a final safeguard.

No database migration is required.


## v154 — Microsoft SSO renewal maintenance

- **Settings → General → Users & access** now includes a **Renewal due** date for the Microsoft Entra client secret.
- Beginning **14 days before** that date, signed-in **Administrators** see a red warning bar across the top of the Planner. The warning remains after expiry until the renewal date is changed.
- The warning links directly to Settings.
- Built-in expandable instructions explain renewal through the **Microsoft Entra admin centre + Cloudflare dashboard**, without requiring Wrangler or access to the development computer.
- Separate Debian VPS instructions are also included.
- The Cloudflare instructions deliberately say to create the replacement first, update `MICROSOFT_CLIENT_SECRET`, test Microsoft sign-in, and only then remove the old Entra secret.

No database migration is required; the renewal date is stored with normal Planner settings.


## v155 — Settings dirty-state audit

Fixed a Settings dirty-state omission introduced with the Microsoft SSO renewal
date. Changing **Renewal due** now enables **Save Changes** and persists normally.

The Settings save path was audited at the same time. Two static fields that were
being saved but were missing from the common dirty tracker were found and fixed:

- **Microsoft SSO renewal due**
- **Allow first-time Microsoft users from the allowed domain**

All other static fields read by the Settings save routine are now explicitly
covered by the common dirty tracker, while dynamic list editors retain their
existing dedicated dirty handlers.

No database migration is required.


## v156 — constrain Microsoft SSO renewal warning to the brand area

The Administrator SSO renewal warning no longer creates a full-width sticky
layer at the top of the application.

When active it now covers only the **OpenLP Service Planner logo/title area**
inside the fixed header. The Planner navigation, Export, Activity, Settings and
profile controls remain outside the warning's hit area and fully clickable.

The compact red brand warning remains clickable and opens Settings.

No database migration is required.


## v157 — Administrator recovery

Emergency recovery can be temporarily enabled with `PLANNER_ADMIN_RECOVERY_TOKEN`. Without it `/admin-recovery` is 404. Recovery only resets an enabled local Administrator, invalidates that account’s sessions, and the token should be removed immediately afterwards. Cloudflare and Debian VPS procedures are in Settings → General → Users & access. No migration required.


## v158 — persistent and multi-select service deletion

- Fixed deleted services reappearing after refresh.
- The bootstrap response now distinguishes a genuinely fresh database from an
  initialized Planner that intentionally has zero services. An empty Planner is
  no longer automatically re-seeded from browser/default state.
- A service is removed from the browser only after the server confirms deletion.
  Delete failures are surfaced instead of being silently ignored.
- Server deletion now verifies the service row is gone, cleans service-specific
  media/item/audit rows, preserves retained library media, and repairs the
  active-service setting if the active service was deleted.
- Service plans now have selection checkboxes, **Select all**, and a
  **Delete selected (N)** action for bulk deletion.
- Bulk deletion uses one server request and one confirmation dialog; ChurchSuite
  plans themselves are never deleted.

No database migration is required.


## v159 — zero-service state / deletion refresh-loop fix

The refresh oscillation after deleting services was traced to two older
assumptions that were no longer valid:

1. Browser startup accepted cached Planner state only when `services.length`
   was non-zero. A legitimately saved empty service list was therefore treated
   as missing state and the bundled/default services were resurrected.
2. The main Planner renderer assumed a current service always existed. An empty
   server bootstrap could therefore throw while rendering, sending hosted
   startup into its error/re-authentication path.

v159 makes an empty service array a first-class saved state. When there are no
services, the application stays on **Service plans**, displays the normal
**+ Service** action, and does not attempt to render a nonexistent Planner
service. The convenience state getters and Back-to-Planner path are also
guarded for the zero-service case.

No database migration is required.


## v160 — conditional visibility fix

Fixed the **ChurchSuite Plans** Services-header link remaining visible after
**Show a link to this page on the Services screen** was unchecked.

The setting and renderer were already correct: the link's `hidden` property was
being set. The `.secondary` link/button CSS supplied an explicit display mode,
however, which could override the browser's default `[hidden]` styling.

v160 adds a root semantic rule:

```css
[hidden] { display: none !important; }
```

This fixes the ChurchSuite Plans button and prevents the same visibility bug on
other conditionally hidden controls.

No database migration is required.


## v161 — create missing ChurchSuite songs from unmatched slots

When a ChurchSuite song slot has no local Song Library match:

- the song editor now offers **Choose song from library** and **Add new song**;
- after choosing **Choose song from library**, the search dialog now has
  **Add new song** beside **Back** and **Keep unmatched**;
- **Add new song** opens the structured manual-song creator with the ChurchSuite
  song title prefilled;
- saving creates the song in the shared Song Library and fills the **existing
  ChurchSuite service slot** with that song rather than appending a duplicate
  service item;
- the slot becomes ready and keeps its ChurchSuite source relationship, with
  the existing ChurchSuite-update-pending state.

No database migration is required.


## v162 — full Add Song methods for unmatched ChurchSuite slots

The **Add new song** action on an unmatched ChurchSuite song now opens the same
Add Song chooser used by the shared Song Library:

- **Create manually**
- **CCLI / SongSelect paste**
- **CCLI / SongSelect file**
- **OpenLyrics**

The ChurchSuite song title is still passed into manual creation as a helpful
prefill. All creation/import methods now preserve the ChurchSuite-slot context.
After one song is created/imported, it is saved to the shared Song Library and
used to fill the existing ChurchSuite service slot rather than appending a
second service item.

The same full chooser is used when **Add new song** is selected from the
near-match library search dialog.

No database migration is required.


## v163 — refresh stays on the service being edited

Fixed refresh opening a different service. The shared `activeServiceId` in D1
could lag behind a browser's current selection (or be changed by another
browser), and bootstrap always replaced the browser's saved active service with
that shared value.

v163 now:
- preserves this browser's locally saved active service across refresh when that
  service still exists;
- persists an explicit service selection to the server through
  `/api/active-service`;
- falls back to the server active service, then the first service, only when the
  browser's previous service no longer exists.

No database migration is required.


## v164 — service-only songs, replaceable ChurchSuite song slots, clearer status

- Any **Add song** flow started from a service now offers:
  - **Add to service & library**
  - **Add to this service only**
- Service-only songs keep their complete title/author/lyrics/verse-order/CCLI
  data inside the service item. They are not inserted into the shared Song
  Library.
- OpenLP export now accepts that embedded song data, so service-only songs
  export as normal OpenLP song items rather than failing the library check.
- SongSelect paste/file, manual creation and OpenLyrics all honour the selected
  save scope.
- A ChurchSuite-origin song slot remains replaceable after it has been matched
  to an existing library song, newly created in the library, or stored as a
  service-only song. The editor shows **Replace song** in each of those states.
- Adding/replacing a previously missing ChurchSuite song now changes the item
  status from **Missing** to **Local copy updated**.
- ChurchSuite resync preserves both library-backed replacements and embedded
  service-only replacements.

No database migration is required.


## v165 — My ChurchSuite member authentication

The Planner now supports three independent authentication methods:

1. OpenLP Service Planner local email/password accounts
2. Microsoft Entra ID
3. My ChurchSuite OpenID Connect

My ChurchSuite login is deliberately separate from the ChurchSuite API client
used for Planning/service-list synchronisation.

### Permission rule

A **first-time My ChurchSuite member always starts at access level 1:
ChurchSuite Service list**. There is no automatic My ChurchSuite route to
Planner or Administrator. An existing Administrator must explicitly promote
the account through **Users & access**.

### Configuration

Register the OAuth App callback:

`https://YOUR-PLANNER-DOMAIN/auth/churchsuite/callback`

Configure:

- `CHURCHSUITE_OIDC_CLIENT_ID`
- `CHURCHSUITE_OIDC_CLIENT_SECRET`

Then enable **Settings → General → Users & access → Allow My ChurchSuite member
sign-in**. The login page shows **Sign in with My ChurchSuite** only when both
the server configuration and the Administrator setting are enabled.

The implementation uses ChurchSuite's OpenID Connect Authorization Code flow
with a short-lived state and nonce. The ID token is validated against ChurchSuite's
discovery metadata/JWKS, and the Planner stores the immutable `sub` claim in
`users.churchsuite_sub` as the My ChurchSuite linkage key. Email is retained as
profile/contact data and is not treated as the ChurchSuite identity.




## v168 — My ChurchSuite OpenID Connect sign-in

My ChurchSuite member sign-in now follows ChurchSuite's published OIDC documentation.
The Worker contains ChurchSuite's universal OIDC configuration internally:

- discovery: `https://login.churchsuite.com/.well-known/openid-configuration`
- requested scopes: `openid email profile`
- authorisation endpoint (from discovery): `https://login.churchsuite.com/oauth2/authorize`
- UserInfo endpoint: `https://login.churchsuite.com/oauth2/userinfo`

The token exchange follows ChurchSuite's live discovery metadata. At present
ChurchSuite advertises `client_secret_basic`; if that metadata changes, the Worker
can fall back to sending `client_secret` in the form body as illustrated in the
ChurchSuite OIDC guide.
The returned ID token is signature/audience/issuer/expiry validated against the
discovery document and JWKS. UserInfo may supplement profile claims.

The Planner links a My ChurchSuite identity by the immutable OIDC `sub` claim,
**never by email**. ChurchSuite documents that email can change and need not be
unique. Email and display name are retained as profile/contact fields only. A
first-time My ChurchSuite person still receives ChurchSuite Service list access
(level 1) and must be promoted by an Administrator for greater access.

Only these per-installation values are required:

- `CHURCHSUITE_OIDC_CLIENT_ID`
- `CHURCHSUITE_OIDC_CLIENT_SECRET`

There is no administrator-configured discovery URL and no database migration is
required when upgrading from v165-v167.

## v169 — sign-in page ordering

- My ChurchSuite sign-in is presented first.
- Microsoft sign-in is labelled **@kpc.org.au M365**.
- Local email/password sign-in is collapsed under **OpenLP user**.
- Authentication behaviour is otherwise unchanged from v168.

## v172 — global and per-user SSO controls

- Settings now includes an explicit **Allow Microsoft SSO sign-in** switch. It
  defaults to enabled on upgrades so existing installations keep their current
  Microsoft sign-in behaviour.
- My ChurchSuite retains its existing global enable/disable switch.
- Each Planner user now has independent **@kpc.org.au SSO** and **My ChurchSuite SSO**
  permissions, visible both in the Users list and the user editor.
- Existing linked identities are automatically enabled for their linked provider
  by migration `0019_sso_controls.sql`.
- A new external identity may be linked to an existing Planner account by email
  only when an Administrator has explicitly enabled that SSO method for the
  account. Email by itself is never treated as proof of identity.

## v1.73 backup/restore and user-login safeguards

- User list login methods are now read-only indicators; login-method permissions are edited only inside the user editor.
- An enabled user must retain at least one configured account login method (Planner password, Microsoft SSO, or My ChurchSuite SSO). If an administrator removes the last method, the UI offers to disable the account instead and the API enforces the same rule.
- Full backup restore now validates the ZIP in a streaming first pass, previews backup metadata/counts, streams media to R2 in a second pass, and restores D1 only after media writes succeed. It no longer buffers the entire ZIP in Worker memory.
- Full and database restores strongly prompt the administrator to download a current full backup first.
- Restore invalidates all Planner sessions and in-progress OIDC states, requiring a fresh sign-in against the restored user database.
- Cloudflare account request-size limits still apply to the uploaded restore ZIP (currently 100 MB on Free/Pro, 200 MB Business, 500 MB Enterprise by default). Backup download itself is streamed and is not subject to that response-size cap.

## v1.74 — security, restore and portability consolidation

- All native browser alerts, confirmations and text prompts have been replaced by one
  Planner-themed dialog system.
- Login-method checks now include the global provider switches and actual provider
  configuration. Settings cannot strand the installation without a usable Administrator.
- Full backup restore stages media under new keys, validates Administrator access, commits
  the restored database, then retires old media. Failed restores clean staging data rather
  than overwriting live media first.
- Full restore preview/restore use the ZIP as a streaming request body rather than a
  multipart `File` buffer.
- Debian VPS now receives the My ChurchSuite OIDC, initial-setup and Administrator-recovery
  environment variables, streams incoming request bodies, and streams filesystem media
  writes through temporary files.
- PDF.js is now installed locally from `pdfjs-dist` instead of loaded from a third-party
  CDN. `npm install` runs the vendoring step automatically.
- `fflate` is upgraded to 0.8.3 to incorporate its ZIP64 security fix, and esbuild is
  upgraded to 0.28.2.
- Content Security Policy no longer needs `unsafe-inline` for scripts.
- Validation now covers browser JavaScript and the complete migration chain as well as
  Cloudflare and Debian/VPS checks.
- Application, backup and asset cache-busting version metadata are aligned to v1.74.

See `docs/SECURITY-QUALITY-AUDIT-v174.md` for completed audit work and remaining
hardening/maintenance items.
