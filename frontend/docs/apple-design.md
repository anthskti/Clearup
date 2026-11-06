# Clearup design review

**Review date:** 2026-11-02  
**Scope:** Public pages, catalog, product details, routine flows, account pages, information pages, and admin screens. Desktop and phone layouts are considered separately.  
**Method:** Read the page and component source, global styles, and supplied hero image assets. The local browser connection was unavailable, so this is a code and asset review, not a claim that every issue was visually reproduced or touch tested. Interaction and breakpoint recommendations should be checked at 320, 375, 430, 768, and 1440 CSS pixels, with long names and larger text.

## Design direction

Clearup's strongest asset is its friendly illustrated hero. The product experience underneath it uses a much more generic database style: blue waves, pale gray backgrounds, compact uppercase labels, boxed tables, and many small badges. That shift makes the app feel like two brands. A useful design goal is **calm confidence**: let product images, routine structure, and prices carry the content; use the illustration and blue as selective accents. Apple-style here means clear hierarchy, immediate feedback, predictable movement, and comfort on touch screens. It does not require making every surface glassy or adding springs everywhere.

### Proposed visual rules

| Element | Direction | Why |
| --- | --- | --- |
| Palette | Keep deep Clearup blue (`#0E4B84`) for primary actions and active state; pair with warm off-white, a restrained pale blue, and neutral text. Use amber/violet only for AM/PM semantics and red for destructive actions. | The current hero is warm beige and blue, while application pages are cool gray with several unrelated badge colors. A smaller palette will make the whole journey feel connected. |
| Surfaces | Use a white or warm-white content canvas. Reserve blue waves for a page introduction or one illustration per journey, rather than repeating a large wave behind every utility page. Use borders for structure and shadows only for floating layers. | Repeated decoration competes with dense data and dilutes the hero's character. |
| Type | Red Hat Display now serves as the shared interface face. Keep the expressive hero lettering for short display copy. | Consistent type makes the application feel related to the landing page without forcing playful lettering into functional screens. |
| Type scale | Suggested starting point: display 40–56/1.08, page title 30–36/1.15, section 22–26/1.25, card title 17–20/1.3, body 16/1.5, metadata 13–14/1.4. Small labels should not routinely be 10px. | The current mix of 10–12px uppercase labels and large heavy uppercase titles makes the hierarchy jumpy and harms phone legibility. |
| Tracking | Tighten large titles slightly (`-0.02em` as a starting point); keep body close to zero; use positive tracking only on short overlines. | One tracking treatment across sizes does not read equally well. |
| Controls | Give primary touch targets roughly 44px minimum height and visible pressed, focus, loading, success, and error states. A control's label should say what happens: “Add to routine”, “Copy link”, “Show 20 products”. | Several icon buttons and tiny chips rely on hover or browser alerts, leaving touch and keyboard users with weak feedback. |
| Motion | Use short, interruptible transitions for menus and sheets. Keep hover decoration subtle. Respect reduced motion and transparency preferences; do not hide important content until a scroll reveal completes. | Motion should explain the change and remain responsive to input. |

The values above are design targets, not an implementation spec. Check contrast and text scaling before settling exact colors and sizes.

## 1. Global navigation and footer

**Current files:** `src/components/header/Header.tsx` coordinates menu and scroll state; `DesktopNav.tsx`, `MobileNavDrawer.tsx`, `ProfileMenu.tsx`, and `navConfig.ts` contain the related UI and links. `src/components/Footer.tsx` and `src/components/ClearupLogoLink.tsx` remain shared components.

**Implemented:** Builder is first. Products is a direct catalog link with an attached desktop category shelf and an expandable category list in the phone drawer. The account control uses an avatar fallback and includes Saved products. The header has a solid background from first paint, hides on downward scroll, and returns when scrolling toward the top; open menus and visible keyboard focus keep it available. The footer now links to `/products` and aligns its content consistently across sizes.

**Still to review:** The solid header partly covers lettering embedded in the phone hero art; address that in the home page batch. Signed-in account behavior and touch feel on a real phone have not been checked after the navigation work. Saved products now has an honest coming-soon page shell; saving functionality remains deferred.

## 2. Home page

**Current direction:** Keep the hero artwork and slogan. Matches uses a horizontal scroll rail with arrow controls on phone and tablet and keeps the desktop grid; imagery is optional for a later pass. The phone hero begins below the fixed header, and its base color matches the next section. A text-free procedural wave and blue gradient sit between Matches and the global footer; the former trust claims and product count remain removed. Motion and other wave changes are deferred.

**Evidence:** `src/components/home/HeroSection.tsx`, `HowItWorks.tsx`, `FeaturedRoutinesSection.tsx`, `Matches.tsx`, `src/components/animations/ScrollReveal.tsx`, and `public/assets/landingpagedesktop.png`, `culandingmobile.png`.

### Hero and imagery

- **Desktop — high impact.** The hero image already contains a centered white Clearup wordmark, while the fixed header also carries the logo. This creates competing brand marks. The artwork also places products on the right, which works well with left-aligned copy; preserve that left/right division but remove the embedded wordmark in a future art revision or use a crop that does not repeat it.
- **Phone — later review.** The portrait asset has a wordmark near the top and product illustrations below. The hero now starts below the header, and its lower fade meets the next section's color. The embedded wordmark duplicates the header logo, and some title/art overlap remains on narrow phones. Review the `object-cover` crop before deciding whether to edit the asset.
- **Copy — later review.** The hero slogan stays as written. The subtitle is hidden on phone, so check whether the first screen explains the product clearly enough without it.
- **Image treatment.** The hand-painted hero is distinctive. Use it as the lead visual, then let real product photography and actual routine previews take over. Avoid adding another large full-bleed product collage in the same viewport. If the artwork is updated, export clean desktop and portrait compositions with text-safe areas and no baked-in UI copy or logo.

### How it works

- Three numbered circles and centered paragraphs communicate a process, but the steps have uneven copy length and no visible product example. Show one small UI or product image per step: a catalog result, a routine slot, and a saved routine. That makes “how” tangible without a long paragraph.
- The third step again implies measurable skin improvement. Prefer an achievement the app actually supports: “Keep your routine organized” or “Know what to refill”.
- On phone, stack steps with left-aligned text and a slim connecting line or clear spacing. Centered multi-line copy is slower to scan.

### Featured routines, matches, and trust banner

- **Featured routines — medium impact.** Cards are primarily text, 48px product thumbnails, skin type pills, a price badge, and a full-width “View Routine” button. Give the routine a stronger visual preview: a horizontal lineup of 3–4 product images on a neutral stage, with title and author below. Keep the price as secondary metadata. The card or title should be the primary navigation target so the full-width button does not consume a large share of every card.
- **Find your match — later review.** The phone and tablet rail scrolls horizontally with snap points, labeled arrow controls, and a visible next card. The cards remain tall and text-only; assess their density and whether “Acne Prone”, “Oil Control”, and “Sensitivity” clearly read as catalog filters before adding imagery.
- **Footer transition — implemented.** Keep the former trust banner's procedural wave and gradient as a decorative bridge from Matches into the global footer. It has no trust claims, product count, or empty copy area; the section is hidden from assistive technology.
- **Motion — deferred.** `ScrollReveal` still moves each home section upward over 0.8s and has no reduced-motion branch. Review this separately; Matches now uses native horizontal scrolling instead of instant card replacement.

**Layout sketch**

```text
Desktop:  [headline + value + CTA] [illustration]
          [3 concise steps with actual UI previews]
          [featured routine cards with product lineups]
          [skin-type discovery]

Phone:    [headline over illustration]
          [primary and secondary actions]
          [steps, left aligned]
          [featured cards, next card peeking]
          [scrollable skin-type cards, next card peeking]
```

## 3. Product catalog and category search

**Current iteration — complete for now:** Search and filters lead the catalog. Phone users open a bottom filter sheet with draft changes and a “Show results” action; tablet widths use the same controls in a centered dialog. On wide desktop, the title, search, and result count span the page above a compact 240px filter panel and the results table. Active filters appear as removable chips, and clearing filters leaves the search query intact. Phone cards use tighter spacing, mostly sentence-case labels (with “Skin Type” in title case), a two-line brand/product link, and wrapping tags for every skin type. Desktop rows keep the compact `+N` skin-type tooltip, styled in ClearUp deep blue; the filter panel and table also share a compact header treatment and reduced row padding.

Page-based pagination is tracked in the v2 plans because it requires a backend API change. Desktop column density, separate card and row renderers, unified filter application, and a clearer route from category pages back to the catalog are deferred to later iterations.

**Evidence:** `src/components/products/ProductListClient.tsx`, `ProductListFiltersSidebar.tsx`, `src/constants/filters.tsx`, `src/components/filters/PriceRangeFilter.tsx`.

### Search, filters, and results order

- **Phone — addressed.** The title, search form, and result count appear before the list. Filters open in a bottom sheet with a selected-filter count, draft changes, and a persistent “Show results” action. Active selections can be removed above results. The sheet keeps long brand and category lists out of the page flow.
- **Desktop — addressed at wide sizes.** The compact 240px bordered panel appears at 1280px and above, aligned with the results table below the full-width page header. At narrower widths, results use the full row and filters open in a centered dialog. Filter groups start collapsed except Skin type; selected groups show counts, and the expanded brand list has a bounded scroll area.
- **Search — addressed.** Search is a form with a visible submit button. On wide desktop, the page title, search, and result count sit together above the filter panel and results.
- **Filter behavior — complete for this iteration.** The phone sheet stages selections until “Show results”; desktop checkboxes apply immediately and desktop price changes use “Apply price.” Unifying desktop filter application is deferred. Clearing filters preserves the query, and filtered empty states offer recovery actions.
- **Page heading — addressed.** The `h1` is outside the filter rail and shows the catalog or category name. A clearer route from category pages back to all products is deferred.

### Product rows and cards

- **Phone — addressed for this iteration.** Cards retain all configured fields with tighter spacing and sentence-case labels, keeping “Skin Type” in title case. Brand and product name share a compact link that wraps to two lines; every skin type appears in wrapping tags across the card.
- **Desktop — refined; further density work deferred.** The table keeps its data-first row layout with tighter padding and a compact header. Skin type shows the first tag and a `+N` tooltip. Further column prioritization can be revisited later. Phone country values remain readable text, while desktop keeps the flag image.
- **Image layout.** The catalog uses 44px square thumbnails. Use a consistent neutral image stage and `object-contain` for product packaging where possible. Packaging shapes should remain recognizable, and missing images need a branded placeholder rather than a plain gray square.
- **Results feedback — addressed for this iteration.** The result count is grouped with the page heading and search. Existing incremental loading remains; page-based pagination is deferred to v2 because it requires a backend API change. Filtered empty states offer recovery actions.

**Layout sketch**

```text
Desktop:  Products / Cleansers            [Search products] [result count]
          [240px filter rail]              [data-first product rows]

Phone:    Products
          [Search products             Search]
          [product card with all fields and wrapping skin-type tags]
          [Filters (3)]          124 results
          [active chips]
          [image  name + two facts      price / Add]
```

## 4. Product detail

**Evidence:** `src/components/product/ProductClient.tsx`, `src/components/ui/ProductGallery.tsx`.

**Implementation note (2026-11-04):** Product 45 was inspected at 320px and 375px using Chrome DevTools. The four-column offer table clipped its last heading at 375px before the compact-width changes. The changes below are now implemented; this section retains the reasoning behind them.

### Product identity and action

- **Desktop — agreed direction.** Keep the “Database Status / Indexed & Tracked” card as a deliberate ClearUp gimmick beside Add to Routine. Offer price and availability are still useful, but should not displace that character element; avoid presenting the status as a live guarantee about merchant data.
- **Typography — implemented.** Brand and product name share one `h1` with the separator treatment from `ProductListClient`, and the title wraps naturally on narrow screens.
- **Phone — verify before changing.** The square gallery precedes the title and actions. With the usual single scraped image, this may be an appropriate product-first layout. Check a narrow phone with one image and with several images before changing the stage ratio or adding a sticky action bar; the decision information must remain easy to reach.

### Gallery, details, ingredients, and merchants

- **Gallery — agreed direction.** Keep the original thumbnail grid and quiet arrow treatment. A single-image product shows its thumbnail while the arrows have zero opacity and cannot receive input. With multiple images, the arrows appear on hover or keyboard focus and stay visible on touch. Keep the navigation functions for both cases. Most scraped products, including YesStyle results, have one image, so swipe can wait.
- **Details — agreed direction.** Use the direct heading “Product details” and retain every configured fact. Show “Not listed” for missing values instead of dropping that category or displaying a bare dash. Give Product details, How to use, Full ingredients, and Marketplace data the same section treatment: a line above each heading, with no extra line below a heading. The chevron and disclosure behavior identify Full ingredients as expandable.
- **Merchant comparison — phone refinement.** Keep the four-column table and merchant logo: the image helps break up the row, and a separate phone card layout is not justified yet. Try slightly smaller phone-only text and cell padding while keeping prices, availability, shipping, and “Visit Store” readable and tappable. Check 320px and 375px widths with long merchant names and prices; only change the structure if content actually clips or overlaps. Keep `CA $` formatting consistent across product surfaces.
- **Empty information — implemented.** Missing images show “Image unavailable,” missing detail values show “Not listed,” and products without merchant data show a specific empty state.

## 5. Routine builder

**Evidence:** `src/app/(main)/builder/page.tsx`, `src/components/routine/BuilderProductNotesSection.tsx`, `SaveRoutineModal.tsx`, `AddToRoutineButton.tsx`.

### Steps and selection

- **Layout — agreed direction.** Keep the fixed category order, desktop columns, phone cards, and dashed selection controls. Their stable positions make the routine understandable. The earlier category-rail and selected-first proposals are deferred. Explain that categories can be skipped. Keep “Build your routine,” using 24px phone and 36px desktop type, and position the wave below the opaque header.
- **Selected products — implemented.** Match the catalog's inline brand, CSS dot, and product name. Give each remove button a product-specific accessible name and a 44px target. Retain the existing merchant and price presentation.
- **Add flow — implemented.** Keep the return to Builder. Show “Adding…” while adding and show a local message if storage prevents the add.

### Notes, totals, and saving

- **Notes — implemented.** Keep the visible Morning/Night panel and its amber/violet accents. “Routine notes” is 18px; time-period headings are 16px and outlined “Add note” buttons are 14px with 44px targets and ClearUp blue. Empty and fully assigned groups have explicit guidance. Step numbers and simple separators replace the timeline rails; note headers use the catalog's CSS dot. Usage fields are 16px on phone and 14px on desktop, with an explicit “Remove note” action. The note picker matches the save dialog and uses native radios, a selection checkmark, a persistent usage label, bounded scrolling, and keyboard focus management.
- **Total — agreed direction.** Keep the final summary panel in normal page flow. Use “Skin types,” “Estimated total,” and “Save routine” consistently. Missing-price behavior is deferred to backend work.
- **Saving — implemented.** The signed-out panel explains the account requirement before any click and offers “Log in to save.” Signed-in users see “Save routine.” Inline guidance replaces browser alerts. The native modal dialog has labeled fields, optional description, a public-sharing notice, inline errors, Escape handling, and focus wrapping/restoration. During a save, the button itself shows “Saving…”; a separate visible status line was removed to avoid a stray duplicate message, while a screen-reader-only status remains. “View routine” leads the success view; sharing remains available with copy feedback. This follows `feedback.md › Best practices` (integrate status near the action) and `modality.md › Best practices` (a short, focused modal task).
- **Loss prevention — implemented.** Products, notes, and skin-type tags persist locally. “Draft saved on this device” is tied to successful writes; a storage failure produces a warning instead. A successful routine save clears those draft parts.

**Layout sketch**

```text
Desktop:  Build your routine              [Draft saved]
          [category / product / seller / price rows]
          [visible Morning / Night notes]
          [skin types / estimated total / Save routine]

Phone:    Build your routine
          [category cards in their existing order]
          [visible Morning / Night notes]
          [skin types / estimated total / Save routine]
```

## 6. Community routines, saved routine detail, and profile routines

**Evidence:** `src/app/(main)/routines/page.tsx`, `src/components/guides/GuidesFilters.tsx`, `RoutinePreviewCard.tsx`, `src/app/(main)/routine/[id]/page.tsx`, `src/app/(main)/profile/created-routines/page.tsx`, `src/app/(main)/profile/saved-products/page.tsx`, `saved-routines/page.tsx` (redirect), `src/components/routine/RoutineShareLink.tsx`.

### Community browse and cards

- **Filters — implemented.** The heading sits above a compact desktop filter rail and card grid. Phone/tablet users open the catalog-style sheet. Skin types use the shared solid selection control; routine totals retain CAD inputs and a slider. Changes apply together, active tags can be removed directly, and closing the sheet discards its unapplied changes when reopened.
- **Cards — implemented.** Shared cards retain the product lineup, use contained images and a missing-preview fallback, and lead with the routine name and author. Skin types use readable metadata instead of tiny pills. A compact estimated-CAD row replaces the price badge and full-width button; the card is one keyboard-accessible link.
- **Density — accepted for this iteration.** Community browsing uses two columns from small tablet widths upward and one on phone. Equal card heights and an invisible skin-type placeholder keep the grid aligned. Two columns give names and product lineups room beside the filter rail. Description previews and any future increase in column count are deferred.
- **Empty state — implemented.** Filtered empty results offer Clear filters; an unfiltered empty collection links to the builder.

### Routine detail and sharing

- **Guide introduction — accepted for this iteration.** Routine name, author, and description lead the page. A summary labeled Total price uses 320px at medium desktop widths and 480px on large screens, balancing shorter descriptions. It groups CAD cost, product count, and skin types above sharing, and follows the introduction on phone. Header spacing follows content, with no reserved photo area. Products and usage follow. The description has a comfortable reading width and preserves author line breaks.
- **Products — implemented.** Rows follow the builder’s category framework and inline brand · product names, with a separate desktop Buy column. Compact blue Buy buttons match the catalog and appear only when a store URL exists; phone cards retain CAD prices and show “via” with a linked merchant name and external-link icon. Packaging uses contained images.
- **Share and routine actions — implemented.** The attached URL field and copy-icon layout displays `clearup.skin/routine/{id}` without a scheme or www. Copying confirms success or failure and copies a full HTTPS production URL; localhost retains a working local URL for development. The owner-only ⋯ menu aligns beside the field inside the total-price card’s footer. Both controls have a 44px outer height and matching border, white background, and subtle shadow. Delete routine lives in this menu and retains its confirmation dialog; a future Copy to builder action can join it.
- **Usage presentation — implemented.** Public notes follow the builder’s 16px Morning/Night headings, amber/violet accents, numbered brand · product headers, and simple dividers. The timeline rail, book icon, and duplicate notes heading are removed.
- **Editing — implemented.** Owners edit description through a focused accessible dialog. Usage begins in reading mode, with explicit Edit notes and Cancel editing actions; saving returns to reading. Name, skin types, and products are outside this editing scope. Owners see a quiet pencil/Edit action beside the Description label on desktop (right-aligned on phone), or Add when empty; it opens the same focused dialog. Notes edit and cancel buttons use white outlined controls; save buttons use blue. Editing controls retain 44px targets.
- **Future story content.** Before/after photos can sit below the introduction when available, with dates and captions. No empty image placeholder is reserved. Duplicating into the builder is deferred.

### Created routines and saved products

- **Created — implemented.** The page matches the guides’ shared wave, typography, two-column cards, equal heights, and skin-type placeholders. Phone uses one card column. Desktop keeps an alternate list of compact rows: routine name, product count and skin types, contained square previews, estimated CAD total, and a quiet View routine arrow within one link. Grid/List buttons have visible labels, 44px targets, and pressed states; selection lasts for the current page visit, while smaller screens return to cards. New routine uses the shared blue action. Loading, empty, and failed-load states are distinct, with a builder link or working retry as appropriate.
- **Saved products — shell implemented.** Replaces Saved routines in the account menu at `/profile/saved-products`; the old URL redirects. The authenticated page keeps the shared wave and typography, with a quiet bookmark icon, clear coming-soon copy, and a blue Browse products link with a 44px target. Desktop and phone use the same focused empty state. There are no simulated saved products or perpetual loading placeholders. Saving, persistence, and populated layouts remain future work.

## 7. Authentication and account preferences

**Evidence:** `src/app/(auth)/*`, `src/app/(main)/profile/preferences/page.tsx`.

- **Auth layout — implemented.** Login, registration, recovery/reset, and verification use the shared `AuthPage` shell: a 440px form column, quiet canvas, existing wave/logo, sentence-case title, and brief context. Top padding and normal scrolling keep mobile layouts predictable. Success and unusable-link states retain the same alignment. Primary actions use full-width ClearUp blue; Google remains an outlined login option. Profile/preferences are deferred.
- **Fields — implemented.** Associated labels replace visual spans; email fields use email/autofill attributes. Inputs use 16px text, 44px minimum heights, and visible focus rings. Shared password visibility controls have 44px targets and accessible labels. Registration calls the name field Display name. Registration and password reset use the shared `PasswordRequirements` component for live length, uppercase, lowercase, and special-character guidance. Its length minimum is eight, with the input capped at 128 to match Better Auth; case/special-character indicators do not block submission. Reset mismatch appears beside the confirmation field with invalid state, an associated message, and focus.
- **Feedback — implemented.** Inline errors preserve entered values; Google failures appear near Google and credential failures near login submission. Busy labels, disabled submit buttons, and duplicate-submit guards communicate pending requests. Recovery success keeps account-existence-neutral copy. Verification shows the destination email when available and separate resend progress, success, and failure feedback, including expired-link screens. Unverified login links to verification without sending automatically. Reset and verification success offer explicit continuation instead of timed redirects. The initial session loader no longer unmounts forms during background refreshes; verification also reuses its request during effect replay to avoid consuming a link twice.
- **Preferences — high impact.** “Primary email” is rendered as a select with a single option, suggesting a choice that does not exist. Present it as read-only account information. The username input is sized to two-thirds of a horizontal row, which may crowd its label on phone; stack label, hint, and input vertically at narrow widths. Save should confirm success inline rather than `alert()`.
- **Account deletion — high impact.** A destructive action merits a deliberate confirmation surface, but native `confirm()` followed by `prompt()` feels disconnected and gives weak context. Use one focused dialog that explains consequences, accepts the required credential, shows progress/errors, and offers a clear cancel path. Keep the red treatment confined to the destructive area.

## 8. Information pages

**Evidence:** `src/components/info/InfoArticle.tsx`, `src/app/(info)/*`.

- The article container uses `max-w-[70%]`, which makes the line length depend on viewport width. On a wide desktop this can create very long lines; on a phone it can become narrow after padding. Use a reading column around 65–75 characters with a max width near 680–760px, while allowing full width minus phone gutters.
- FAQ is currently a long article of questions and answers. Give it a contents list or individually separated question blocks, but keep answers visible or easily expandable. Privacy and terms can stay as readable articles with a clear section hierarchy and anchored headings.
- The information pages should use the same title scale, link treatment, and background rhythm as functional pages. A wave atop every legal or help article is less useful than a stable reading surface.

## 9. Admin screens

**Evidence:** `src/app/admin/layout.tsx`, `src/components/admin/*`, `src/app/admin/users/page.tsx`.

- **Phone — critical if admin work is expected on mobile.** The admin shell fixes a 256px sidebar inside `h-screen`, the content uses 32px padding, and user/content tables have no phone-specific column strategy. A narrow screen will have little usable content width. Use a compact top bar and a drawer for navigation on phone; switch dense tables to prioritized rows/cards or allow deliberate horizontal scrolling with sticky identity columns. If admin is desktop-only, state that clearly in the product expectation and verify tablet widths at minimum.
- **Dashboard — medium impact.** Metric cards are good summaries, but the daily trend bars rely on `title` hover text for exact values. Add visible axis context or a tap/focus detail view. Use colors that remain distinct in high contrast and color vision variants.
- **Users/content — medium impact.** Repeated table styles make the area coherent, but the content page offers a tiny “Feature/Featured” button per row with little status feedback. Show pending status on the row, keep counts near the action, and make errors local to the affected item. The users screen repeats “Top contributors” from the dashboard; consider whether it helps the user management task.
- **Imports — high impact.** The 14-row CSV textarea and three wide tab labels will be heavy on phone. Make file upload the primary path and pasted CSV an advanced option. Show a compact preflight summary (file, import type, rows if available) before running, then a structured result with created, updated, skipped, and failed counts. This matters because the action can affect many records.

## Cross-feature interaction pass

These are patterns to address while improving the individual blocks, rather than a separate redesign project.

| Pattern | Current source-backed observation | Design target |
| --- | --- | --- |
| Press and completion feedback | Many controls have hover styles; share copy has no success state; several flows use native alerts. | Press feedback immediately, then show local loading, success, or error where the action happened. |
| Touch gestures | Product gallery and home match carousel use arrow buttons; gallery arrows are hover-hidden. | Make touch navigation visible. If swipe is added, content should track the finger and remain reversible; preserve button and keyboard controls. |
| Motion preferences | Hero entrance and `ScrollReveal` motion are unconditional in the reviewed source. | Provide reduced-motion alternatives that keep content visible and preserve useful state feedback. |
| Translucency | Header and admin bar blur content behind them; other panels are opaque. | Use blur where a floating surface overlaps content, with contrast and reduced-transparency fallbacks. Avoid glass on glass. |
| Accessibility of small data | Many labels/badges use 10–12px type; icon-only controls appear in gallery, share, and view toggles. | Raise key metadata size, give icon controls accessible names and visible focus, and test at 200% text scaling. |
| Currency | Catalog uses `$`, product offers and routine totals use `CA $`, some card estimates omit currency context. | Use one Canadian-dollar format and distinguish catalog estimates from live merchant offers. |
| Terminology | “Guides”, “Routines”, “Builder”, “Build”, “Seller”, and “Merchant” overlap across screens. | Use “Routines” for user-facing content, “Build a routine” for the action, and one term for stores. |

## Suggested design sequence for the later checklist

Start with the changes that affect whether people can complete the main journeys: **phone catalog filters and search; phone merchant offers; routine builder save feedback; account/saved-product wayfinding; admin phone shell if mobile admin is required.** Then establish the shared type, color, spacing, and control rules. Next refine home imagery, routine cards, and motion. Review each page at phone and desktop widths with real product data, long names, missing images, empty states, keyboard focus, reduced motion, and larger text before calling that page done.

This document is the critique and design direction. The implementation checklist can be made after deciding which recommendations fit Clearup's product goals and which screens matter most to users.
