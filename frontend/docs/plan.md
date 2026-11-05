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

Builder leads the navigation. Products links directly to the catalog and exposes an attached category shelf on desktop; the phone drawer offers the same destinations. The account control uses an avatar fallback and includes Saved Routines. The footer links to the full catalog and uses consistent alignment. The header is opaque from first paint, hides when scrolling down, and returns when scrolling toward the top; open menus and keyboard focus keep it visible.

**Carry forward:** Signed-in account behavior and touch feel on a real phone still need checking. The Saved Routines destination remains a placeholder for the routines/library batch.

### Batch 2 — home page

**Review section:** [Home page](./apple-design.md#2-home-page).

Kept the hero artwork and slogan. Removed the trust banner. On phone, the hero begins below the fixed header, its background meets the next section without a color seam, and the headline and actions sit over the illustration with more breathing room. Matches now uses a swipeable, snapping row with labeled previous/next buttons on phone and tablet; desktop keeps its six-card grid.

**Carry forward:** The artwork's wordmark duplicates the header logo, some headline/art overlap remains on narrow phones, Matches cards are tall, and the transition to the footer is abrupt. Review these with the three-step copy and featured cards when revisiting the home page. Wave motion and reduced-motion work are deferred. No new image set is needed for Matches.

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
**Likely files:** `src/app/(main)/builder/page.tsx`, `src/components/routine/BuilderProductNotesSection.tsx`, `SaveRoutineModal.tsx`, and `AddToRoutineButton.tsx`.

**Work:** Reduce empty-step weight, make selected products and the next action easy to scan, and give phone users a visible total/save action. Keep optional AM/PM notes secondary. Replace browser alerts with local error, progress, and success feedback. Make draft persistence understandable without promising it when storage fails.

**Approval point:** Confirm whether the phone total/save control should stay visible while scrolling and whether Add to Routine should continue to navigate immediately to Builder.

## Batch 6 — routine browsing, detail, and personal library

**Review section:** [Community routines and profile routines](./apple-design.md#6-community-routines-saved-routine-detail-and-profile-routines).  
**Likely files:** `src/app/(main)/routines/page.tsx`, `src/app/(main)/routine/[id]/page.tsx`, `src/app/(main)/profile/created-routines/page.tsx`, relevant `src/components/guides/*` and `src/components/routine/*`.

**Work:** Shorten the phone browse filter block; make routine cards more visual and consistent. Put routine description, author, tags, and cost before the product table on detail pages. Give phone users clear store actions and share confirmation. Keep owner edit and destructive actions distinct. Resolve the Saved Routines placeholder already linked from the account menu.

**Approval point:** Decide whether Saved Routines will be built, replaced with a useful empty state, or removed from navigation for now.

## Batch 7 — authentication and account preferences

**Review section:** [Authentication and account preferences](./apple-design.md#7-authentication-and-account-preferences).  
**Likely files:** `src/app/(auth)/*` and `src/app/(main)/profile/preferences/page.tsx`.

**Work:** Make forms and their feedback consistent at phone width; use clear labels, suitable input types, readable text, and inline errors. Present the primary email as read-only if it cannot be changed. Give profile saving local confirmation and account deletion one focused confirmation flow.

**Approval point:** Confirm the language and consequences shown in account deletion before changing that flow.

## Batch 8 — information pages

**Review section:** [Information pages](./apple-design.md#8-information-pages).  
**Likely files:** `src/components/info/InfoArticle.tsx` and affected pages under `src/app/(info)/`.

**Work:** Set a comfortable reading width, improve heading and link hierarchy, and make FAQ questions easy to scan. Apply the same type foundation without adding decorative wave weight to long reading pages.

**Approval point:** Confirm whether FAQ should remain an article or become individually expandable questions.

## Batch 9 — admin screens

**Review section:** [Admin screens](./apple-design.md#9-admin-screens).  
**Likely files:** `src/app/admin/layout.tsx`, `src/app/admin/users/page.tsx`, and `src/components/admin/*`.

**Work:** Decide the supported phone/tablet experience first. If phone admin is required, replace the fixed sidebar with compact navigation and prioritize table fields. Improve chart detail access, row-level feature feedback, and import preflight/result hierarchy.

**Approval point:** Confirm whether admins must complete imports and user/content tasks on a phone, or whether tablet is the minimum supported size.

## Batch 10 — consistency and accessibility pass

**Review section:** [Cross-feature interaction pass](./apple-design.md#cross-feature-interaction-pass).  
**Likely files:** Only shared components and pages where the preceding batches exposed a concrete mismatch.

**Work:** Check type, spacing, color, currency wording, control names, loading/error/success feedback, keyboard focus, text scaling, reduced motion, and reduced transparency across completed pages. Resolve remaining inconsistencies without reopening each page's layout direction.

## Technical boundaries

- This is a frontend design plan. It does not call for schema changes, migrations, API payload changes, or new dependencies. If a later design decision requires one, plan and approve it separately.
- Existing auth behavior and access rules remain in force. Navigation changes must not expose admin routes to non-admin users or imply a saved feature works before it does.
- Each batch should be independently reviewable. Do not bundle unrelated cleanup with the batch.
