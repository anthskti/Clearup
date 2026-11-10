# Clearup design cleanup plan

This is the implementation companion to [apple-design.md](./apple-design.md). The review records findings and subsequent design decisions; this page tracks agreed direction, completed work, and the next batches. Review each batch on desktop and phone before moving on.

## Agreed direction

- Use Red Hat Display for interface text and the shared type scale.
- Keep the hero's waves and gradients. Resolve their apparent offset during the home page batch.
- On catalog and product-detail pages, start the procedural wave below the opaque 72px header and inset content 64px into the page so the wave remains visible.
- Make design changes in small page or feature batches.

## Completed

### Batch 0 — typography foundation

Red Hat Display is the shared interface font. The type scale, brand colors, canvas, focus treatment, and pressed states are in place. The earlier Times fallback issue was fixed. Browser checks covered 320–1440px; lint and build passed.

### Batch 1 — navigation and footer

**Current files:** `src/components/header/Header.tsx` coordinates scroll and menu state; `DesktopNav.tsx`, `MobileNavDrawer.tsx`, `ProfileMenu.tsx`, and `navConfig.ts` hold the related UI and links. The shared footer remains in `src/components/Footer.tsx`.

Builder leads the navigation. Products links directly to the catalog and exposes an attached category shelf on desktop; the phone drawer offers the same destinations. The account control uses the profile photo with an avatar fallback and includes Saved products. The footer links to the full catalog and uses consistent alignment. The header is opaque from first paint, hides when scrolling down, and returns when scrolling toward the top; open menus and keyboard focus keep it visible.

**Carry forward:** Signed-in account behavior and touch feel on a real phone still need checking. The Saved products destination now has a page shell; product saving remains deferred (Batch 6).

### Batch 2 — home page

**Review section:** [Home page](./apple-design.md#2-home-page).

Kept the hero slogan and handwritten font, using the updated portrait and landscape artwork. Removed the white gradient/blur overlays so the artwork retains its color. The hero starts below the 72px header; its smaller text and actions sit below the bottles on phone/tablet and lower-left on desktop. Headline sizes are 28/32/38px in scalable rem units. Portrait artwork continues through tablet widths, and the desktop height responds to screen width to avoid excessive cropping. The two links have 44px minimum targets, fit beside each other at 320px, and wrap when text is enlarged.

Removed the trust-banner copy and claims; restored its procedural wave and gradient as a text-free transition into the global footer. Matches uses a swipeable, snapping row with labeled previous/next buttons on phone and tablet; desktop keeps its six-card grid.

**Hero verification:** Chrome checks covered 320, 390, 768, 1024, and 1440px, including a tall tablet, 200% text, reduced motion, image visibility, and button sizing/wrapping. Frontend lint/build passed. The image files remain unchanged.

**Carry forward:** Matches cards are tall. Review these with the three-step copy and featured cards when revisiting the home page. Broader wave/scroll-reveal motion and reduced-motion work remain deferred; the hero entry respects reduced motion. No new image set is needed for Matches.

## Batch 3 — product catalog and search

**Review section:** [Product catalog and category search](./apple-design.md#3-product-catalog-and-category-search).  
**Likely files:** `src/components/products/*`, `src/components/filters/PriceRangeFilter.tsx`, and catalog page components under `src/app/(main)/products/`.

**Status: complete for this iteration.** The current catalog layout and interaction pass is implemented; follow-up ideas below are deferred and do not block this batch.

**Search and filters:** The page heading, submitted search, and result count span the full width above the desktop filter rail and results. Phone and tablet users open a bottom sheet (centered dialog at tablet widths) with draft filters and a “Show results” action. Applied filters appear as removable chips, and clearing filters preserves the search. Wide desktop uses a compact 240px bordered filter panel with selection counts and a bounded brand list; narrower screens keep the results full width and use the sheet.

**Rows and cards:** Phone cards retain all configured fields with tighter spacing and sentence-case labels, keeping “Skin Type” in title case. Brand and product name share a compact link that can wrap to two lines. Every skin type appears in wrapping tags across the card; desktop rows keep the compact `+N` tooltip, styled in ClearUp deep blue. The filter panel and table share a compact header treatment, and desktop row padding is reduced to give products more room. Country display and image cropping remain as before.

**Deferred to a later iteration:** Page-based pagination requires a backend API change and is tracked in the v2 plans. The catalog keeps its existing incremental loading and result feedback for now. Desktop column density, separating card and row renderers (and the similar routine/builder layouts), unifying checkbox and price filter application, and adding a clear route from category pages back to all products can be revisited separately.

## Batch 4 — product detail and merchant comparison

**Review section:** [Product detail](./apple-design.md#4-product-detail).  
**Status: complete for this iteration.** Updated `src/components/product/ProductClient.tsx` and `src/components/ui/ProductGallery.tsx`.

**Work:**

1. In `ProductClient.tsx`, put brand and product name inline in one `h1`, matching the catalog's separator and natural wrapping. Keep the Database Status gimmick beside Add to Routine without implying it verifies current merchant availability.
2. In `ProductGallery.tsx`, retain the original thumbnail grid and quiet arrows. A single-image product keeps its thumbnail with invisible, noninteractive arrows; multiple images show arrows on hover, focus, and touch. Keep the square phone stage and defer swipe.
3. In `ProductClient.tsx`, use “Product details,” preserve every configured fact, and show “Not listed” for missing values. Give the four sections one consistent line-above-heading treatment, including the Full ingredients disclosure. Retain the merchant table and logos on phone with compact type and cell padding. Provide intentional states for missing images and offers. Start the page wrapper below the opaque header and leave 64px before the product content so the procedural wave is visible.

**Scope:** Frontend presentation only; no schema, API, or auth changes. Change the phone gallery proportions or merchant table structure only if narrow-screen checks show a concrete problem.

**Verification:** Product 45 and the catalog were checked in Chrome DevTools at 320px. Both page wrappers and procedural waves begin below the 72px header; content starts at y=136px, 64px into the page. The product table fits the 288px content width and both merchant rows remain readable. Its one-image gallery has the original thumbnail and invisible arrows. Lint and build passed. Multi-image and missing-data states still need a live product example.

## Batch 5 — routine builder and save flow

**Review section:** [Routine builder](./apple-design.md#5-routine-builder).  
**Status: implemented, awaiting visual sign-off.** Updated the builder, notes and save components, shared add/share controls, and draft persistence hooks. The latest save-modal polish removes the duplicate visible “Saving your routine…” line; the button remains the visible progress indicator, while assistive technology still receives a status announcement.

**Agreed layout:** Keep the category order, desktop columns, phone cards, dashed selection controls, visible Morning/Night notes, and total/save panel at the end. Keep “Build your routine” and return to Builder after adding a product. Category rails, selected-first layouts, collapsed notes, and sticky save bars are outside this iteration.

**Implemented:** The wave begins below the opaque header. The title is 24px on phone and 36px on desktop, with a short explanation that categories can be skipped. Labels use sentence case and 14px text; the notes heading is 18px. Product names use the catalog's inline brand and CSS dot. Remove controls have product-specific names and 44px targets. “Adding…” and “Saving…” communicate progress, and errors/sign-in guidance appear beside the action. The save dialog has labeled fields, an optional description, a public-sharing notice, keyboard focus management, and “View routine” as its primary success action. Copying the share link confirms success or failure.

**Drafts:** Products, Morning/Night notes, and skin-type tags persist on this device. The draft status reflects successful storage writes and warns when storage fails. Saving successfully clears all three draft parts.

**Signed-out save panel:** Explain the account requirement before any click and show “Log in to save” as the primary action. Show “Save routine” for signed-in users and disable the action while the session is loading.

**Notes panel follow-up — implemented:** Morning/Night groups use 16px headings and outlined, 44px “Add note” buttons in ClearUp blue. Empty and fully assigned states explain why an action is unavailable. The book icon and timeline rails are removed. Builder note entries keep step numbers, the catalog's CSS dot, a usage field, and an explicit “Remove note” action. Routine viewing now uses the same numbered note-header presentation (Batch 6). The note picker matches the save dialog, with native radio selection, a checkmark, labeled usage text, bounded scrolling, Escape, focus wrapping, and focus restoration.

**Notes verification:** Chrome DevTools checks at 320px and 1440px covered empty groups, adding the last eligible Morning note, independent Night eligibility, editing/reloading, and removing a note while retaining its product. The picker fits the phone viewport, and Tab/Shift+Tab/Escape keep focus predictable. No backend or storage contract changes were needed for this follow-up.

**Verification:** Frontend lint and build passed after the latest modal polish. Chrome DevTools checks covered empty and populated layouts at 320px and 1440px, product/note/tag restoration after reload, signed-out save guidance, and simulated storage failures for drafts and adding products. Authenticated save progress, failure, retry, success, Escape, and focus wrapping were checked with browser-only mocked responses in an isolated context; no routine was published during those checks. A real signed-in save remains to be checked.

**Deferred:** Missing-price handling belongs to the backend follow-up; no price-exclusion notice was added.

## Batch 6 — routine browsing, detail, and personal library

**Browsing pass complete for this iteration:** Community routines use a 240px desktop filter rail and the catalog filter sheet on phone/tablet. Filters retain draft/apply behavior, removable active tags, and clear actions. Browsing uses two card columns from small tablet widths upward and one on phone. Cards keep equal heights, with an invisible placeholder when skin-type tags are absent. Shared cards use one link, contained product previews, readable metadata, and a compact estimated-CAD footer. Empty browse states offer Clear filters or Build a routine.

**Deferred:** Routine description previews may be added to cards later. Revisit grid density if the collection grows.

**Routine detail pass complete for this iteration:**

- **Introduction and total:** Name, author, and description sit beside the Total price card on desktop; the card is 480px wide on large screens to balance shorter descriptions. On phone it follows the introduction. CAD price, product count, and skin types sit above sharing, with no reserved photo space.
- **Sharing and actions:** Keep the attached URL field with external-link and copy icons. Display `clearup.skin/routine/{id}` and copy the full URL with success/failure feedback. The owner-only ⋯ menu sits beside the field inside the card footer; both controls are 44px high. Delete routine retains its confirmation dialog.
- **Products:** Keep the builder’s category layout and inline brand · product names. Desktop has a separate column of compact blue Buy buttons; phone cards show CAD prices and “via” followed by the linked merchant name and external-link icon.
- **Description and notes:** The quiet pencil/Edit action sits beside the Description label on desktop and right-aligned on phone; an empty description offers Add. Notes begin in reading mode and match the builder’s numbered Morning/Night entries, dividers, and amber/violet headings. Edit notes opens editing; save returns to reading. Editing is limited to description and notes. Notes edit/cancel buttons remain outlined; save actions use blue.

**Verification recorded from implementation:** Frontend lint and build passed. Chrome DevTools checks covered signed-in desktop (1440px) and phone (390px), copy feedback, description-dialog opening/Escape, actions-menu opening/Escape, and matching 44px share/menu heights. No description was saved or routine deleted during these checks.

**Deferred:** Before/after uploads can become a results section beneath the introduction when images exist; no empty photo area is shown. “Use in builder” duplication remains future work. The former saved-routines destination is now Saved products.

**Review section:** [Community routines and profile routines](./apple-design.md#6-community-routines-saved-routine-detail-and-profile-routines).  
**Likely files:** `src/app/(main)/routines/page.tsx`, `src/app/(main)/routine/[id]/page.tsx`, `src/app/(main)/profile/created-routines/page.tsx`, relevant `src/components/guides/*` and `src/components/routine/*`.

**Saved products shell — implemented:** The account menu now links to `/profile/saved-products`; `/profile/saved-routines` redirects there. The authenticated page uses the shared wave, Red Hat typography, a simple bookmark empty state, and a 44px Browse products link. Copy explicitly says saving is coming soon. No fake items, loading animation, or inactive filters are shown. Product saving, persistence, and populated layouts are deferred. Frontend lint/build passed; Chrome checks at 390px and 1440px confirmed the layout, no horizontal overflow, and the legacy redirect.

**Created routines — implemented:** The page uses the shared wave and guides’ two-column, equal-height cards (one column on phone). Desktop retains a List view with contained product previews, product count, skin types, an estimated CAD total, and one link per row. Grid/List controls have visible labels, pressed states, and 44px targets; below desktop the layout returns to cards. A blue New routine action, explicit loading status, builder-linked empty state, and retryable load error complete the page. Code is limited to the page and `CreatedRoutineRow.tsx`.

**Created routines verification:** Frontend lint/build passed. Chrome checks used eight real routines at desktop, tablet, and 320–390px phone widths, including missing tags. Checked equal card heights, grid/list switching, the two-column fallback at 700px, and no horizontal overflow. Browser-only mocked empty/failure responses verified the builder link and retry recovery without changing saved data.

**Remaining work:** Visual sign-off on created routines. Implement product saving separately when ready.

## Batch 7 — authentication and account preferences

**Review section:** [Authentication and account preferences](./apple-design.md#7-authentication-and-account-preferences).  
**Likely files:** `src/app/(auth)/*` and `src/app/(main)/profile/preferences/page.tsx`.

**Auth pass implemented:** Login, registration, password recovery/reset, and email verification share a 440px reading/form column, the existing wave and logo, and normal document scrolling. Shared `AuthPage` and `PasswordInput` components keep labels, 16px inputs, 44px controls, focus styling, and password visibility consistent. Primary actions are full-width blue; login retains Google sign-in and puts Forgot password beside its password label.

**Feedback and recovery:** Inline errors replace alerts and preserve entered values. Pending labels and submit guards prevent duplicate requests. Registration and password reset share `PasswordRequirements`, a live checklist for length, uppercase, lowercase, and special characters as frontend guidance. The component accepts the password value and a description ID so future onboarding can reuse it. The length requirement is eight characters, with a 128-character input limit, matching the installed Better Auth policy. The case/special-character indicators do not add new submission restrictions. Reset mismatch is associated with the confirmation field. Missing, invalid, and expired links retain the same page shell and a recovery action. Verification shows the destination email when known and separate resend progress, success, and error feedback. Reset/verification success uses an explicit next action. Unverified login offers a link to the verification page. Unimplemented registration OAuth markup and the unsupported hCaptcha disclaimer were removed.

**Verification:** Frontend lint/build passed. Chrome checks covered desktop and 320px phone layouts, associated labels, 16px/44px inputs, password visibility, preserved values, pending/duplicate-submit states, mismatch focus, invalid/expired recovery, resend feedback, and explicit success actions. Mocked successful verification makes one request and remains mounted through background session refreshes. Google completion, real reset/verification email delivery, and physical-phone keyboard behavior remain unchecked. One registration escaped the browser mock during a device switch and created a test account; it was retained and reported to the user.

**Avatars and Preferences — implemented:** Preferences now uses a stable reading column, shared page styling, a photo editor, read-only email/verification status, and a labeled Display name form. Name editing permits spaces and trims on save; unchanged/empty names cannot be submitted, and progress/success/errors are inline. The shared `UserAvatar` renders Google or custom image URLs with a fallback and is also used in the header. Photo selection previews locally; Save photo uploads and saves the URL, Cancel discards the preview, and Remove photo clears the URL. Prior R2 objects are retained. Account deletion keeps the quieter row and now opens the focused confirmation dialog described below.

**R2 integration:** The authenticated, rate-limited `POST /api/users/me/avatar` endpoint validates bounded JPEG/PNG/WebP uploads and creates a 256px WebP. SHA-256 filenames live under `profilephotos/production/` when the backend's `NODE_ENV` is `production`, otherwise `profilephotos/staging/`. The existing `user.image` field stores the result; there is no migration. Google photos remain at their existing URLs. Setup and variable names are documented in [avatar setup](../../docs/features/avatars.md) and `backend/.env.example`.

**Avatar verification — complete for this iteration:** Backend build and frontend lint/build passed. Offline checks covered normalization, stable hashes, environment prefixes, missing configuration, unsupported/corrupt/animated/oversized images, and the 5 MiB parser limit, with storage calls stubbed. Chrome checks at 1440px and 320–390px covered Google photos, preview/cancel, validation, upload/save failures, header updates, removal, display-name feedback, and no horizontal overflow. Browser mutations were intercepted; the real account remained unchanged during those checks. A hydration mismatch was fixed using the header's existing hydration pattern. After configuring R2, the user confirmed that live avatar uploads work.

**Account-deletion dialog — implemented:** `DeleteAccountDialog` replaces native confirm/prompt calls. The dialog focuses Cancel, traps/restores keyboard focus, and clears passwords/errors on reopening. It checks linked sign-in methods when opened: password accounts enter their current password; connected-only accounts do not see a password field. Failed checks can be retried. Errors stay inline, expired sessions direct the user to log in again, and pending deletion disables duplicate submission and dismissal. Copy explains permanent loss of account/routine access without promising that every stored asset is erased. The existing Better Auth deletion endpoint and server rules are unchanged.

**Deletion verification:** Frontend lint/build passed. Chrome checks at 1440px and 320px covered focus, Escape, password reset on reopening, provider-check retry, password/session errors, connected-account payloads, pending guards, and confirmed-success navigation. A verification-email response remains in the dialog instead of claiming deletion. All deletion requests were intercepted; the real account remained accessible afterward.

**Deferred:** Password setup/onboarding, skin preferences, and public profiles remain separate follow-ups. The avatar, Preferences cleanup, and account-deletion dialog passes are complete for this iteration.

## Batch 8 — information pages

**Review section:** [Information pages](./apple-design.md#8-information-pages).  
**Current files:** `src/components/info/InfoArticle.tsx`, `AboutHero.tsx`, and pages/layout under `src/app/(info)/`.

**Status: complete for this iteration.** Shared About/FAQ/Privacy/Terms navigation, the existing Red Hat type scale, a reading column capped at 720px, and normal phone gutters replace the percentage-based layout and waves. Longer pages have sticky desktop section navigation and a collapsed native “On this page” menu on phone/tablet. FAQ questions use native expandable rows, grouped by topic.

**About hero:** A full-width video-ready introduction follows the fixed header, with stationary overlay text and an Our story anchor. The nonsticky information tabs sit below it, followed by the existing story. Native video playback is silent, looping, and inline, with a 44px play/pause control. Reduced motion leaves the still visible without assigning a video source; blocked playback offers Play, and media errors retain the still. Other information pages keep their top tabs.

**Add the final media:** Set `ABOUT_VIDEO_SRC` to the direct Cloudflare video URL in `src/app/(info)/about-clearup/page.tsx`, and update `ABOUT_POSTER_SRC` with a matching still. The video URL is currently empty; `/assets/home.webp` provides the temporary still. Recheck text contrast and the centered phone crop against the final footage. Photography for FAQ and legal pages is deferred.

**Content:** Updated outdated feature and deletion instructions. About/FAQ/Terms explain retailer-sourced data, locally inferred skin-type labels, manual adjustments, and accuracy limits. Privacy explains public routine content, Cloudflare R2 photo storage and retained image files, Google photo URLs, session cookies, and the existing Vercel analytics/performance integrations. No account, storage, or API behavior changes.

**Verification:** Frontend lint/build passed. Chrome checks at 320, 390, 768, and 1440px covered page navigation, contents/anchor links, keyboard expansion, phone layout, and enlarged text. A temporary synthetic clip verified About autoplay, keyboard play/pause, reduced-motion changes, simulated autoplay denial, and invalid-media fallback. The test source was removed and the empty configuration restored. Final Cloudflare media and real-phone playback are still pending; no new dependencies were introduced.

## Batch 9 — admin screens

**Review section:** [Admin screens](./apple-design.md#9-admin-screens).  
**Likely files:** `src/app/admin/layout.tsx`, `src/app/admin/users/page.tsx`, and `src/components/admin/*`.

**Approved direction:** Support phone admin. Work in small stages, reviewing each before moving on. Stages 1–2 and then stages 3–4 were approved for implementation in parallel pairs. Imports and activity tracking remain separate work.

**Stages 1–2 implemented, awaiting owner review.** Backend build and frontend lint/build passed (one existing catalog lint warning). Chrome DevTools checks covered phone/tablet/desktop, reduced motion, phone text enlargement, drawer focus/Escape/resize, chart inspection, range changes, and daily tables. Backend UTC aggregation and validation were checked using read-only requests and a stubbed service check. No dependencies or migrations were introduced. Real-phone touch review remains pending.

**Stages 3–4 implemented, awaiting owner review.** Featured editing now uses ID/URL lookup, shared homepage cards, a local ordered draft, Move earlier/later controls, and Save/Discard. Migration 012 adds retained active/inactive membership and positions; mutations save atomically. Users now support server search/filter/pagination, mobile cards, desktop tables, and account details with routine links. No new dependencies. Browser checks covered draft lookup/add/reorder/discard, user filters/details/copy/focus, empty results, 320/1024/1440px and 200% phone text. Backend validation and stubbed migration/transaction recovery checks passed. A real featured save/public-cache refresh remains unexercised to preserve the live selection.

1. **Responsive shell:** Compact phone/tablet header and navigation drawer, desktop sidebar, normal page scrolling, 16px phone gutters, and accessible touch controls.
2. **Dashboard:** Separate user/routine line charts, a shared URL-based 7/30/90-day selector (default 30), exact values and a data table. Report completed UTC days and distinguish period counts from lifetime totals. Update backend analytics and matching types; no migration or dependency needed.
3. **Featured editor:** Replace the routine list with ID/URL lookup and homepage-card previews. Add/remove/reorder, then save together. Add persisted positions and an atomic admin save API.
4. **Users:** Search ID/name/email, paginate on the server, and show account creation, role, verification, and routine counts in responsive results/details. Remove the analytics dependency.
5. **Import reports:** Persist runs and all row issues; show brand/name, record/source line, reason, and partial success. Add import history/detail and downloadable reports. Correlate existing Pino logs by import ID; no general logging console or Sentry integration in this batch.
6. **Background imports:** Use persisted jobs with a worker, progress, safe claiming, and interrupted-job recovery. Start sequentially with PostgreSQL; assess retry safety before automatic recovery. New dependencies require approval.
7. **Last active (optional):** Track throttled authenticated activity in an app-owned record. Do not infer online presence from auth session timestamps.

**Verification:** Frontend lint/build and backend build when affected; phone/tablet/desktop, keyboard, reduced-motion, enlarged-text and error-state checks. Import work also needs interruption, duplicate submission, partial-write and retry checks.

## Batch 10 — consistency and accessibility pass

**Review section:** [Cross-feature interaction pass](./apple-design.md#cross-feature-interaction-pass).  
**Likely files:** Only shared components and pages where the preceding batches exposed a concrete mismatch.

**Work:** Check type, spacing, color, currency wording, control names, loading/error/success feedback, keyboard focus, text scaling, reduced motion, and reduced transparency across completed pages. Resolve remaining inconsistencies without reopening each page's layout direction.

## Technical boundaries

- Public-page batches are frontend-only unless explicitly documented. Admin Batch 9 now includes approved backend analytics work and separately staged API/schema work. No new dependencies are approved.
- Existing auth behavior and access rules remain in force. Navigation changes must not expose admin routes to non-admin users or imply a saved feature works before it does.
- Each batch should be independently reviewable. Do not bundle unrelated cleanup with the batch.
