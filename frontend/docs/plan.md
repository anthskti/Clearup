# Clearup design cleanup plan

This is the implementation companion to [apple-design.md](./apple-design.md). The review explains the problems and design suggestions; this document sets the order of work and the decision needed before each batch. Work through one batch at a time, review it on desktop and phone, then approve the next batch. **No application changes are approved by this document alone.**

## Decisions already made

- Use **Red Hat Display** as the consistent interface font. Retain the expressive hero lettering only where it serves the illustration.
- Adopt the type scale proposed in the review as a starting point; tune it against real content and larger text settings.
- Keep the waves and gradients as part of Clearup's identity, especially where they connect to the hero. Fix the apparent offset or stagger when the wave and nearby content appear; verify the cause in the rendered page before changing the effect.
- Keep design changes in page or feature batches, with desktop and phone reviewed together.

## How a batch is handled

1. Agree on its layout and interaction decisions, including any open question below.
2. Make the smallest related frontend changes. Keep unrelated pages out of the change set.
3. Run `bun run lint` and `bun run build` from `frontend/`.
4. Review the affected screens at 320, 375, 430, 768, and 1440 CSS pixels, plus keyboard focus, long text, missing data, and reduced motion where relevant.
5. Record what changed and any follow-up in the batch's review notes before starting another batch.

The shared checks in step 4 are a verification target. Browser or device access is needed to complete them; source inspection alone cannot confirm visual quality or touch feel.

## Batch 0 — typography and visual foundation

**Goal:** Make later page redesigns use one coherent font and a small set of reusable visual rules. This batch comes before the navigation redesign so its spacing and type are designed against the final foundation.

**Likely files:** `src/app/layout.tsx`, `src/app/globals.css`, and shared `src/components/ui/button.tsx` and `input.tsx` only if their current defaults prevent the agreed scale.

**Work:**

1. Resolve the current Red Hat body / Inter `font-sans` mismatch in favor of Red Hat Display for interface text. Keep a sensible local fallback.
2. Define a compact type scale for display, page title, section title, card title, body, and metadata. Set size-specific line height and tracking; stop using 10px text for important information in subsequent page batches.
3. Establish the core blue, warm or neutral canvas, border, focus, and pressed-state rules. Limit global CSS changes to foundational tokens; apply component-level rules when each page is redesigned.
4. Check for unexpected line wrapping or overflow on existing screens after the font change. Fix only regressions caused by this batch.

**Approval point:** Confirm the type specimen and base palette at phone and desktop widths before Batch 1. No new font package is needed.

**Risk:** A global font mapping can change line breaks throughout the app. Treat that as a verification requirement, not an invitation to redesign every page at once.

**Batch 0 review notes (2026-11-04):** Red Hat now owns the shared `font-sans` mapping; the unused Inter and Geist mappings are gone. The stylesheet defines `text-display`, `text-page-title`, `text-section-title`, `text-card-title`, `text-body`, and `text-meta` for later page batches. Brand blue, pale blue, and a warm canvas are named color tokens; focus rings use blue and shared buttons have immediate pressed feedback. A missing font-family fallback caused the browser to render Times; the base rule now reads the Red Hat CSS variable directly. Chrome confirmed Red Hat loaded at 320, 375, 430, 768, and 1440px, with no horizontal overflow. The phone home screen was visually inspected at 390px. Lint and production build pass.

## Batch 1 — global navigation and footer

**Review section:** [Global navigation and footer](./apple-design.md#1-global-navigation-and-footer).  
**Likely files:** `src/components/Header.tsx`, `src/components/Footer.tsx`, and `src/components/ClearupLogoLink.tsx` if logo sizing needs adjustment. These components are shared by main and information layouts; the admin and auth shells are separate.

**Work:**

1. Use readable, sentence-case desktop navigation with a direct link to `/products`, a clear active state, and separate category access.
2. Replace the greeting-shaped account trigger with a predictable account control that handles long names and signed-out state.
3. Keep the phone drawer, simplify its Products path, enlarge touch targets, and make opening, dismissal, focus return, and reduced-motion behavior predictable.
4. Align footer logo, support, link groups, and legal row. Make its “View Products” link lead to `/products`, and use one alignment on phone.

**Approval point:** Decide whether category links remain in a secondary nav control or move entirely to the catalog page. Decide whether the unfinished Saved Routines destination should be hidden from the account menu until it works.

**Verify:** Home, catalog, routine, and information pages; signed in/out; long account name; menu by touch and keyboard; footer links and external link behavior.

## Batch 2 — home and wave transitions

**Review section:** [Home page](./apple-design.md#2-home-page).  
**Likely files:** `src/components/home/*`, `src/components/themes/ProceduralWave.tsx`, `src/components/animations/ScrollReveal.tsx`, and hero assets only if a revised image is approved.

**Work:** Keep the illustrated hero and wave/gradient connection; resolve duplicate logo placement and the phone text/image crop. Make the headline, explanatory line, and primary action visible together on phone. Shorten and align the three steps; improve routine previews and skin-type discovery. Inspect the reported offset fade in the browser and remove the timing or geometry mismatch that causes it. Add reduced-motion behavior without removing useful feedback.

**Approval point:** Approve a desktop and phone hero composition before editing image assets. The wave remains; the exact animation change follows visual diagnosis.

## Batch 3 — product catalog and search

**Review section:** [Product catalog and category search](./apple-design.md#3-product-catalog-and-category-search).  
**Likely files:** `src/components/products/*`, `src/components/filters/PriceRangeFilter.tsx`, and catalog page components under `src/app/(main)/products/`.

**Work:** Put search and results before full filters on phone. Use a filter sheet with active-filter summary and clear recovery from zero results. Give the desktop filter rail enough width. Choose one understandable apply model for search, checkboxes, and price. Reduce phone card metadata to the facts needed for selection; preserve full detail on the product page.

**Approval point:** Confirm which filters are primary and whether the phone surface applies changes immediately or on “Show results”.

## Batch 4 — product detail and merchant comparison

**Review section:** [Product detail](./apple-design.md#4-product-detail).  
**Likely files:** `src/components/product/ProductClient.tsx`, `src/components/ui/ProductGallery.tsx`, and shared product image presentation if needed.

**Work:** Lead with product name, image, useful price/offer information, and Add to Routine. Move database status to quiet metadata or remove it from the shopper-facing decision area. Make gallery controls visible on touch. Replace the four-column phone merchant table with scannable offer rows; keep a comparison table on desktop. Make missing images and missing offers intentional states.

**Approval point:** Confirm the order of price, merchant, and Add to Routine, and whether swipe is worth adding to the gallery.

## Batch 5 — routine builder and save flow

**Review section:** [Routine builder](./apple-design.md#5-routine-builder).  
**Likely files:** `src/app/(main)/builder/page.tsx`, `src/components/routine/BuilderProductNotesSection.tsx`, `SaveRoutineModal.tsx`, and `AddToRoutineButton.tsx`.

**Work:** Reduce empty-step weight, make selected products and the next action easy to scan, and give phone users a visible total/save action. Keep optional AM/PM notes secondary. Replace browser alerts with local error, progress, and success feedback. Make draft persistence understandable without promising it when storage fails.

**Approval point:** Confirm whether the phone total/save control should stay visible while scrolling and whether Add to Routine should continue to navigate immediately to Builder.

## Batch 6 — routine browsing, detail, and personal library

**Review section:** [Community routines and profile routines](./apple-design.md#6-community-routines-saved-routine-detail-and-profile-routines).  
**Likely files:** `src/app/(main)/routines/page.tsx`, `src/app/(main)/routine/[id]/page.tsx`, `src/app/(main)/profile/created-routines/page.tsx`, relevant `src/components/guides/*` and `src/components/routine/*`.

**Work:** Shorten the phone browse filter block; make routine cards more visual and consistent. Put routine description, author, tags, and cost before the product table on detail pages. Give phone users clear store actions and share confirmation. Keep owner edit and destructive actions distinct. Address the Saved Routines placeholder as a product decision before linking to it again.

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

## Progress record

| Batch | Status | Review notes |
| --- | --- | --- |
| 0 — foundation | Ready for review | Red Hat rendering fixed and verified in Chrome; no horizontal overflow at the plan's target widths. Review the type scale and palette before Batch 1. |
| 1 — navigation/footer | Planned | Await Batch 0 and navigation decisions. |
| 2 — home/waves | Planned | Keep waves and gradients; diagnose offset fade. |
| 3 — catalog | Planned | |
| 4 — product detail | Planned | |
| 5 — builder | Planned | |
| 6 — routines/library | Planned | |
| 7 — auth/preferences | Planned | |
| 8 — information | Planned | |
| 9 — admin | Planned | Mobile support decision required. |
| 10 — consistency pass | Planned | |
