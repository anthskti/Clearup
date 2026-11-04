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

**First-pass decision (under revision):** “Products” goes directly to `/products`; the adjacent “Categories” button opens the existing category links. The unfinished Saved Routines link was hidden from the account menu. The account trigger uses a neutral avatar fallback so a profile photo can replace it later.

**Review feedback:** Builder should lead the navigation. Products and category browsing should read as one item. Restore Saved Routines to the signed-in account menu.

**Verify:** Home, catalog, routine, and information pages; signed in/out; long account name; menu by touch and keyboard; footer links and external link behavior.

**Batch 1 first-pass notes (2026-11-04):** The first pass used a separate Categories control and omitted Saved Routines. Review feedback requested one Products group, Builder first, and the existing Saved Routines link. Chrome checks from the first pass covered the signed-out home, catalog, routines, builder, and information routes; category menu and phone drawer keyboard behavior; and widths from 320 to 1440px. Signed-in menu and real-phone touch behavior still need review.

### Batch 1 revision — implementation

**Goal:** Put the routine builder first and make Products a single navigation group while preserving direct access to the full catalog. Restore the Saved Routines account link.

**Scope:** `src/components/Header.tsx` and this progress record. No new dependencies, API changes, schema changes, migrations, or auth changes.

**Non-goals:** Footer changes, profile photo storage or upload, Saved Routines page content, and catalog filtering changes. Keep the avatar fallback from the first pass.

1. Reorder `navItems` to Builder, Products, Routines so desktop links and phone drawer follow the same order.
2. Replace the separate desktop Categories item with one Products group. Clicking the Products label navigates to `/products`; hovering or focusing the group reveals the existing category links. Keep a visible disclosure control for pointer and keyboard users, and retain Escape, outside-click dismissal, focus return, and the active Products state on category pages.
3. Make one Products row in the phone drawer: the label opens `/products`, while an adjacent 44px-or-larger disclosure control expands the category links. Keep the drawer's focus handling and reduced-motion behavior.
4. Restore the Saved Routines link inside the signed-in account menu, pointing to its existing route. Leave the route itself for the routine/library batch; it currently shows a placeholder.
5. Review the revised header at 320, 375, 430, 768, and 1440px. Check desktop hover and keyboard focus, phone tap targets, the direct Products route, category links, signed-in and signed-out menus, and long account names. Run `bun run lint` and `bun run build` from `frontend/`.

**Risk to check:** A linked label beside a disclosure control needs clear hit areas. The desktop menu must stay open while moving the pointer from Products into the category list, and keyboard users must be able to enter and leave it predictably. Restoring Saved Routines exposes its placeholder until that feature is built.

**Implementation notes (2026-11-04):** Builder now leads desktop and phone navigation. Products is one group with a direct catalog link and adjacent category disclosure; clicking the Products link closes the category panel, including when the catalog is already open. The phone drawer uses the same link/disclosure split with a 48px control. The category panel opens on mouse hover or keyboard focus, stays within the pointer path, closes on Escape/outside click/focus exit, and retains the active Products state on category routes. Saved Routines is restored in the account menu. Footer remains as implemented in the first pass. `bun run lint`, `bun run build`, and `git diff --check` pass. Chrome review confirmed the desktop menu opens on hover, remains open while entering its links, and closes on the Products link; the 375px phone drawer shows the revised order and expands categories, and the cleanser category route loads without horizontal overflow. Signed-in account-menu behavior and real-device touch feel still need review.

### Batch 1 visual polish — desktop category menu

**Goal:** Make category browsing feel like part of the global navigation instead of a detached white card. The current rounded panel with interior padding reads as a generic popover and draws focus away from the page.

**Recommended direction:** Present the categories as a slim, full-width subnavigation shelf attached directly beneath the desktop header. Inside the existing centered header width, show a quiet “Browse categories” label followed by the seven category links in one horizontal row. Keep links as plain text navigation with a restrained hover/focus treatment and a clear active category state; avoid turning every category into a separate chip or card.

**Work:**

1. In `src/components/Header.tsx`, replace the detached 208px floating panel with the attached shelf. Keep it fixed directly below the header so opening it does not push page content or change scroll position.
2. Use the existing warm-white/white navigation material with enough opacity for the illustrated hero beneath it, a soft blur where supported, one fine bottom divider, and a restrained shadow. Do not use a second rounded rectangle or heavy border around the link group.
3. Preserve the existing interaction contract: hover, keyboard focus, or disclosure opens the shelf; Products still navigates directly and closes it; category selection closes it and leaves that category marked active; Escape, outside click, and focus exit dismiss it.
4. Anchor a short, subtle downward fade/translation to the header. Avoid bounce; under reduced motion, remove translation and retain only immediate visibility or a brief opacity change. Keep the phone drawer's nested category list unchanged unless review shows the same visual problem there.
5. Review at 1024, 1280, and 1440px over both the home hero and catalog content. Confirm the seven links fit on one line, the shelf does not obscure the header controls, text contrast holds over imagery, and keyboard focus/active states remain clear. Recheck the existing 375px drawer and run frontend lint/build.

**Risks and decision point:** At the 1024px desktop breakpoint, the label plus seven links may feel cramped; if so, remove the label before wrapping links into a second row. The shelf overlays page content, so its material needs to remain legible without becoming a large opaque banner. The attached shelf direction was approved before implementation.

**Implementation notes (2026-11-04):** Replaced the detached card with a full-width warm-white shelf attached below the header. Plain text category links share one horizontal row with a small label; active categories use the brand underline. The shelf remains in the Products group's DOM order so keyboard navigation reaches categories before Routines, and it overlays content without shifting the page. Chrome checks at 1024, 1280, and 1440px confirmed all seven links fit on one line and the viewport has no horizontal overflow. The desktop hover panel stayed open while moving into its links; Tab entered the first category and Escape returned focus to the disclosure. Home hero and catalog shell were reviewed at 1440px; the catalog showed its empty state during the check, so product imagery behind the shelf was not assessed. At 375px the desktop shelf is hidden and the existing phone drawer still expands categories without overflow. Lint, production build, and `git diff --check` pass.

### Batch 1 follow-up — menu click behavior and header material

**Goal:** Keep the new category shelf, fix its click interaction, and make the header feel intentional from the first frame.

**Observed issue:** The desktop menu opens on hover and the disclosure click toggles the same open state. When the pointer has already opened the shelf, clicking the disclosure can toggle that state off, making the menu disappear under the pointer. This is likely why the menu feels unreliable; confirm it in the browser before changing the interaction.

**Direction:** Keep Builder first and retain the Products group and attached shelf. Give hover/focus visibility and explicit click/dismissal clear behavior instead of letting a click invert an already hover-open state. A click on the disclosure must not make the shelf vanish immediately. Products and category links should still navigate and close the shelf; Escape, outside click, and leaving the interaction region should dismiss it predictably. Ensure keyboard users can open, move into, and dismiss the shelf without focus causing it to reopen unexpectedly.

Make the desktop header opaque from initial page load rather than transparent over the hero until scroll. Keep the existing brand, proportions, and shelf direction. The solid header may create a visually abrupt seam with the hero's top wave; inspect that boundary at initial load and while scrolling, and make a note of the smallest wave/header adjustment that would resolve it. Preserve the wave's role in the hero and do not replace or remove it as part of this batch without a separate review.

**Likely files:** `src/components/Header.tsx`; inspect `src/components/home/HeroSection.tsx` and `src/components/themes/ProceduralWave.tsx` only if the browser review shows the wave/header boundary needs a related adjustment.

**Work and acceptance checks:**

1. Reproduce the click-dismiss issue and confirm which event/state path closes the shelf.
2. Define distinct behavior for hover, focus, explicit disclosure activation, and dismissal so the first click while hover-open does not close the menu. Avoid pointer/focus snap-back after an explicit dismissal.
3. Render the desktop header with its opaque material from first paint; remove scroll-dependent transparency only where it is no longer needed.
4. Inspect the header, shelf, hero, and top wave together at 1024, 1280, and 1440px, both at initial load and after scrolling. Record whether the wave needs a small boundary/position adjustment; keep that decision within the visual evidence.
5. Recheck keyboard navigation, Escape, outside click, direct Products navigation, category navigation, and the existing 375px phone drawer. Run frontend lint and build.

**Approval point:** Review the interaction and the opaque header/wave boundary together before making any broader wave or hero changes. No footer changes are included in this follow-up.

**Implementation notes (2026-11-04):** Separated click-pinned visibility from hover/focus visibility. Chrome confirmed hover opens the shelf, the first disclosure click keeps it open, a second click closes it, and Escape closes it and returns focus to the trigger. Added a transparent 14px hover bridge below the Products trigger so the pointer can travel to the shelf without crossing a dead zone; its hit area meets the shelf at the header's lower edge. Products and category links clear the pinned state; outside click, focus exit, and route changes also close it. The desktop header is now opaque from first paint. At 1440px the solid bar creates a clean horizontal edge over the hero; at 375px it partly covers the hero illustration's embedded “Clearup” lettering. The wave itself remains lower in the hero and was left unchanged. Carry the phone wordmark/header overlap into Batch 2 for a hero composition decision. The phone navigation was visually checked at 375px; lint and production build pass.

**Status:** Implemented; review pending.

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
| 0 — foundation | Complete | Red Hat rendering fixed and verified in Chrome; type scale and palette accepted before Batch 1. |
| 1 — navigation/footer | Implemented; review pending | Builder leads; Products combines the catalog link and attached desktop category shelf; Saved Routines restored. Footer unchanged in revision. |
| 2 — home/waves | Planned | Keep waves and gradients; diagnose offset fade. |
| 3 — catalog | Planned | |
| 4 — product detail | Planned | |
| 5 — builder | Planned | |
| 6 — routines/library | Planned | |
| 7 — auth/preferences | Planned | |
| 8 — information | Planned | |
| 9 — admin | Planned | Mobile support decision required. |
| 10 — consistency pass | Planned | |
