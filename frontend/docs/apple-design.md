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
| Type | Pick one UI face. The body currently uses Red Hat Display while `font-sans` is set to Inter, and the hero uses Edu QLD Beginner. Keep the expressive face for one short display line only; use a consistent UI face for navigation, forms, data, and routine names. | Consistent type makes the application feel related to the landing page without forcing playful lettering into functional screens. |
| Type scale | Suggested starting point: display 40–56/1.08, page title 30–36/1.15, section 22–26/1.25, card title 17–20/1.3, body 16/1.5, metadata 13–14/1.4. Small labels should not routinely be 10px. | The current mix of 10–12px uppercase labels and large heavy uppercase titles makes the hierarchy jumpy and harms phone legibility. |
| Tracking | Tighten large titles slightly (`-0.02em` as a starting point); keep body close to zero; use positive tracking only on short overlines. | One tracking treatment across sizes does not read equally well. |
| Controls | Give primary touch targets roughly 44px minimum height and visible pressed, focus, loading, success, and error states. A control's label should say what happens: “Add to routine”, “Copy link”, “Show 20 products”. | Several icon buttons and tiny chips rely on hover or browser alerts, leaving touch and keyboard users with weak feedback. |
| Motion | Use short, interruptible transitions for menus and sheets. Keep hover decoration subtle. Respect reduced motion and transparency preferences; do not hide important content until a scroll reveal completes. | Motion should explain the change and remain responsive to input. |

The values above are design targets, not an implementation spec. Check contrast and text scaling before settling exact colors and sizes.

## 1. Global navigation and footer

**Evidence:** `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/ClearupLogoLink.tsx`.

### Header: hierarchy and wayfinding

- **Desktop — medium impact.** The primary links are 12px, bold, and uppercase. The Products item is only a dropdown trigger, so reaching “All Products” requires an extra step while Builder and Routines are direct links. Give the catalog a direct “Products” destination; category browsing can be a secondary popover. Use sentence case at approximately 14–15px and a clear active state beyond a slight gray change.
- **Desktop — medium impact.** The signed-in control reads `hi {name}!` and is capped at 9rem on smaller widths. A friendly greeting is fine in content, but the navigation should describe its destination. A compact avatar/name or “Account” label gives clearer wayfinding, especially for long names.
- **Phone — high impact.** The drawer is a fixed 300px panel with a dark scrim. It has click-outside dismissal and a close button, but the source does not show Escape handling, focus containment, or focus return. Design it as a proper navigation sheet with a visible title, active destination, keyboard dismissal, and a short slide that can be interrupted. Keep the menu button at least 44px square.
- **Phone — medium impact.** Products expands into eight destinations inside the drawer. Put “All products” first as the main row and group category links in a clearly labeled section; consider fewer visible categories with a “See all categories” route if the drawer is longer than one screen.
- **Across sizes.** The header becomes frosted only after scrolling. Keep text contrast reliable over the hero art. If translucency remains, provide solid backgrounds for reduced transparency and strong contrast modes. The frosted layer should be a functional navigation surface, not another decorative layer.

### Footer: destination clarity

- “View Products” points to `/products/category/other`, which makes a broad label land on a narrow category. Point the label at the catalog concept when this is cleaned up.
- The large deep-blue footer is a good closing anchor, but its logo, support text, links, and legal row use multiple alignments. On phone, use a single left alignment and compact vertical rhythm; on desktop, align each group to the same top baseline. Keep link tap areas larger than the 12px text itself.

**Layout sketch**

```text
Desktop:  [logo]      Products  Routines  Builder       [Account]
Phone:    [menu] [logo]                            [Account]
Drawer:   Explore / Products / Routines / Builder / Account
```

## 2. Home page

**Evidence:** `src/components/home/HeroSection.tsx`, `HowItWorks.tsx`, `FeaturedRoutinesSection.tsx`, `Matches.tsx`, `TrustBanner.tsx`, `src/components/ui/Carousel.tsx`, `src/components/animations/ScrollReveal.tsx`, and `public/assets/landingpagedesktop.png`, `culandingmobile.png`.

### Hero and imagery

- **Desktop — high impact.** The hero image already contains a centered white Clearup wordmark, while the fixed header also carries the logo. This creates competing brand marks. The artwork also places products on the right, which works well with left-aligned copy; preserve that left/right division but remove the embedded wordmark in a future art revision or use a crop that does not repeat it.
- **Phone — high impact.** The portrait asset also has a wordmark near the top, then large product illustrations occupying the lower half. With an `80vh` container and `object-cover`, the exact crop will vary by phone height. The three-line 40px headline plus two stacked buttons may overlap the illustration or force the important products out of view. Use a content-first phone composition: short headline, one sentence of value, one primary button, then the illustration in its own aspect-ratio region. Avoid fixed viewport height for this block.
- **Copy — medium impact.** “Pick Products / Build Your Routine / Improve Your Skin!” promises an outcome that the app cannot directly show or guarantee. “Choose products. Build a routine that fits your skin.” is more specific and credible. “Start Your Build” could become “Build a routine”. The subtitle is hidden on phone, removing the clearest explanation of the product at the moment it is needed most.
- **Image treatment.** The hand-painted hero is distinctive. Use it as the lead visual, then let real product photography and actual routine previews take over. Avoid adding another large full-bleed product collage in the same viewport. If the artwork is updated, export clean desktop and portrait compositions with text-safe areas and no baked-in UI copy or logo.

### How it works

- Three numbered circles and centered paragraphs communicate a process, but the steps have uneven copy length and no visible product example. Show one small UI or product image per step: a catalog result, a routine slot, and a saved routine. That makes “how” tangible without a long paragraph.
- The third step again implies measurable skin improvement. Prefer an achievement the app actually supports: “Keep your routine organized” or “Know what to refill”.
- On phone, stack steps with left-aligned text and a slim connecting line or clear spacing. Centered multi-line copy is slower to scan.

### Featured routines, matches, and trust banner

- **Featured routines — medium impact.** Cards are primarily text, 48px product thumbnails, skin type pills, a price badge, and a full-width “View Routine” button. Give the routine a stronger visual preview: a horizontal lineup of 3–4 product images on a neutral stage, with title and author below. Keep the price as secondary metadata. The card or title should be the primary navigation target so the full-width button does not consume a large share of every card.
- **Find your match — high impact on phone.** The six cards are tall `aspect-2/3` blocks containing only one label. On phone they are shown one at a time through arrow/dot controls; the carousel does not track a finger swipe. This spends a lot of screen space to reveal little information. Use a two-column grid of compact tiles or a horizontally scrollable row with partial next-card visibility. Add a short explanatory line so “Acne Prone”, “Oil Control”, and “Sensitivity” read as filters, not diagnoses.
- **Trust banner — medium impact.** “Product Intel”, “Smart Filtering”, and “Custom Routines” describe features already shown above and the numerical claim may age. Replace with one crisp closing action or a small proof point that is maintained from real data. The saturated blue gradient can act as a footer transition, but a second promotional band after four home sections feels repetitive.
- **Motion.** `ScrollReveal` moves each home section upward over 0.8s and has no reduced-motion branch. Let content appear immediately when reduced motion is requested; on standard motion, use a shorter, subtler reveal. The match carousel's instant content replacement with a `transition-all` wrapper does not create a continuous slide, so the arrow implies motion the content does not provide.

**Layout sketch**

```text
Desktop:  [headline + value + CTA] [illustration]
          [3 concise steps with actual UI previews]
          [featured routine cards with product lineups]
          [compact skin-type discovery] [closing CTA]

Phone:    [headline + value + CTA]
          [illustration]
          [steps, left aligned]
          [featured cards, next card peeking]
          [2-column skin-type tiles]
```

## 3. Product catalog and category search

**Evidence:** `src/components/products/ProductListClient.tsx`, `ProductListFiltersSidebar.tsx`, `src/constants/filters.tsx`, `src/components/filters/PriceRangeFilter.tsx`.

### Search, filters, and results order

- **Phone — critical.** The filter `<aside>` appears before the results, and skin type, brand, price, and category-specific filter sections default open. A long brand list can push the search field and first result many screens below the title. Lead with the page title, search, result count, and a compact “Filters” button. Open filters in a sheet with selected count and a persistent “Show results” action. Keep active filters visible as removable chips above results.
- **Desktop — high impact.** The sidebar gets two of twelve grid columns, while the results get ten. Brand names, checkbox labels, and paired price inputs are cramped. Give the filter rail a deliberate width around 240–280px, or use a top filter row if the catalog table needs the width. Open only the most useful groups by default. Show selection counts in collapsed group headings.
- **Search — high impact.** Search applies only when Enter is pressed, but no submit button or “Press Enter” cue appears. The field looks like live search. Make it a real search form with a visible submit action, or debounce after typing with explicit loading feedback. Keep the query, filters, and result count grouped together.
- **Filter behavior — medium impact.** Checkboxes apply immediately, while price requires an “Apply” button. Choose one model per filter surface. A sheet can allow drafting everything and commit with “Show N products”; desktop can apply immediately with a brief updating state. “Clear all filters” should remain visible when active, with one-click recovery from zero results.
- **Page heading — medium impact.** The `h1` lives inside the filter aside. On phone, collapsing the filters would also hide the page title unless the heading is moved into the main page header. Category pages should also say which category is active and provide a route back to all products.

### Product rows and cards

- **Phone — high impact.** Each result card renders nearly every table column in a three-column definition list, including small 10px uppercase labels, then separates price at the bottom. For quick browsing, show image, brand/name, one or two decision attributes, price, and “Add”. Put the rest on the detail page. This can cut card height substantially while making scanning easier.
- **Desktop — medium impact.** The table is dense and treats attributes, flag, rating, price, and Add as similar-weight columns. Pin a strong first column for product identity; right-align prices; reduce secondary attribute columns or place them in a compact “details” summary. Country should be text with a flag as an optional cue, since a flag alone is hard to scan and can be ambiguous.
- **Image layout.** The catalog uses 44px square thumbnails. Use a consistent neutral image stage and `object-contain` for product packaging where possible. Packaging shapes should remain recognizable, and missing images need a branded placeholder rather than a plain gray square.
- **Results feedback.** “Showing X of Y” appears before the search field, while infinite loading happens at the bottom. Group count with search and filters, and make the existing loading and end-of-shelf messages more visible within the result flow. The empty state should offer “Clear filters” when filters caused it.

**Layout sketch**

```text
Desktop:  Products / Cleansers            [Search products] [result count]
          [240px filter rail]              [dense but readable result rows]

Phone:    Products
          [Search products             Search]
          [Filters (3)] [Sort]  124 results
          [active chips]
          [image  name + two facts      price / Add]
```

## 4. Product detail

**Evidence:** `src/components/product/ProductClient.tsx`, `src/components/ui/ProductGallery.tsx`.

### Product identity and action

- **Desktop — high impact.** The image/name layout is a solid starting point, but a prominent bordered card says “Database Status / Indexed & Tracked” beside Add to Routine. This is an internal system concept placed where a shopper expects price, retailer, or product fit. Move status to quiet metadata if it is useful at all; put starting price, merchant count/availability, and the routine action near the title.
- **Typography — medium impact.** Brand is a 24px `h1`, product name a 36px `h2`. The product name is the real page title and should be the single `h1`; brand can be a smaller overline. Long product names need a readable max width and natural wrapping.
- **Phone — high impact.** The gallery occupies a full-width square before the name and all actions. A tall image or several thumbnails can hide the decision information below the fold. Consider a 4:5 or square image stage with name/price immediately after it, a compact thumbnail rail, and the Add action visible without searching through details. A sticky action bar can help only if it does not cover the page or keyboard.

### Gallery, details, ingredients, and merchants

- **Gallery — high impact on touch.** Previous/next controls start at `opacity-0` and appear on hover; touch has no hover and the code has no swipe tracking. Keep visible controls or a clear image counter on touch. Support swipe with the image following the finger, then settle to the projected next image; ensure reduced motion uses a simple cross-fade. The fixed five-column thumbnail grid may overflow or crowd when there are many images; use a horizontal rail.
- **Details — medium impact.** Icons, labels, instructions, and ingredients are in several stacked sections with 12px uppercase headings. Create a clear “At a glance” summary for the two or three most useful facts, then “How to use” and “Full ingredients” as readable sections. Avoid icon decoration for facts that are already labeled.
- **Merchant comparison — critical on phone.** A four-column HTML table has no phone layout or horizontal overflow wrapper. Seller, availability, price, and store link will become cramped. On phone, make each offer a compact row/card: merchant + stock on the left, price + “Visit store” on the right; include shipping as a second line. On desktop, sort by meaningful price/availability and emphasize the best available offer. Use consistent `CA $` formatting throughout catalog, cards, builder, and details.
- **Empty information.** A missing gallery image currently says “No Image” on a blank square. A neutral branded product silhouette and “Image unavailable” would look intentional. If merchant data is absent, provide a specific empty state rather than an empty table.

## 5. Routine builder

**Evidence:** `src/app/(main)/builder/page.tsx`, `src/components/routine/BuilderProductNotesSection.tsx`, `SaveRoutineModal.tsx`, `AddToRoutineButton.tsx`.

### Steps and selection

- **Desktop — medium impact.** The table metaphor gives good order but eight category rows with large dashed empty controls can make the page feel unfinished. Group routine steps into a compact sequence. Show the current products first, with one consistent “Add product” affordance per category, and avoid repeated placeholder price dashes.
- **Phone — high impact.** Each category becomes a separate white card. Empty cards are tall, and the builder then adds a large notes panel and a total/save panel. Prioritize selected steps and the next empty slot. Use clear step numbers or a compact category rail so the user can tell how far they have progressed. The remove `X` needs a visible label or accessible name and a target large enough to tap.
- **Add flow — high impact.** Adding a product from the catalog stores it then navigates to Builder. The Add button immediately disables but still says “Add”. Use immediate acknowledgment such as “Adding…” and then show the new product in context; preserve the user's place if they return to the catalog. This is an interaction to verify on a device before deciding whether the route jump is the best behavior.

### Notes, totals, and saving

- **Notes — medium impact.** The “User Routine notes” area is optional but visually large and present even for an empty routine. Make it a secondary “Add morning or evening notes” section, expandable when someone wants it. Morning amber and night violet are useful semantic accents; keep text contrast strong and do not rely on color alone.
- **Total — medium impact.** The total panel has `bottom-0` and `lg:top-20` classes but no `fixed` or `sticky` positioning, so it reads as an ordinary block at the bottom of the page. Decide whether the total is a persistent action. On phone, a compact bottom bar with total + Save could shorten the path to completion, with safe-area padding and enough space left at the end of content. On desktop, a summary rail or final panel is enough.
- **Saving — high impact.** Empty routine and unauthenticated save paths use browser `alert()`, then the save modal uses another `alert()` on failure. Replace these with inline messages adjacent to Save. The modal should show a clear name field label, optional description, an explicit public/share status, progress, and a success view whose primary next step is “View routine”. The current success view leads with “Close” and then a share link.
- **Loss prevention.** The builder persists selections in local storage, which supports agency. Make that visible with a quiet “Draft saved on this device” status, especially before sign-in or navigation. Keep the message truthful if persistence fails.

**Layout sketch**

```text
Desktop:  Build your routine              [Draft saved]
          [ordered category list + products] [total / Save]
          [optional AM / PM notes]

Phone:    Build your routine
          [selected steps]
          [next step + Add product]
          [optional notes]
          [bottom: estimated total     Save]
```

## 6. Community routines, saved routine detail, and profile routines

**Evidence:** `src/app/(main)/routines/page.tsx`, `src/components/guides/GuidesFilters.tsx`, `RoutinePreviewCard.tsx`, `src/app/(main)/routine/[id]/page.tsx`, `src/app/(main)/profile/created-routines/page.tsx`, `saved-routines/page.tsx`, `src/components/routine/RoutineShareLink.tsx`.

### Community browse and cards

- **Phone — high impact.** The large white filter card, skin-type chip set, price slider, and Apply/Clear buttons appear before any routine cards. Collapse this to a filter button and selected chips near the result area; use a sheet for the full controls. Unlike the catalog, these filters are draft/apply based. The two browse experiences should share an understandable filter model.
- **Cards — medium impact.** Four 48px thumbnails, many pills, an estimated price badge, and a full-width button compete for attention. Lead with a routine name and product lineup, then show author, skin types, item count, and estimated total as a calm metadata row. Use a consistent image stage and fallback when no product image exists. Keep 10px text out of key data.
- **Empty state.** “No guides match these filters yet” should offer a direct Clear filters action. If there are no routines at all, the message should be different from a filtered zero-result state.

### Routine detail and sharing

- **Desktop — high impact.** The routine detail reuses the builder table layout even though this is a reading page. A shared routine should first explain the routine: title, author, description, skin type, estimated cost, and AM/PM structure. Product rows can follow. The current description sits below the product table inside the total panel, so the reason for the routine arrives late.
- **Phone — high impact.** Category cards list products but hide the Buy action, leaving only merchant text/link as a way out. Show a clear product-level store action when an offer exists. The category price at top right and overall total at the bottom should share currency labels and say when some prices are unavailable.
- **Share — medium impact.** A long read-only URL field and icon-only copy button consume much of a narrow header. A “Share routine” button can open the platform share sheet when available and fall back to “Copy link”; show “Link copied” beside the control. The current copy action has no visible success feedback.
- **Editing.** The owner sees editing controls lower on the page. Put a clear “Edit routine” action near the title, then keep destructive Delete separated at the bottom. This helps distinguish reading from editing modes.

### Created and saved routines

- **Created — medium impact.** The page has a useful empty state and New Routine action. The grid/list toggle exists only on desktop and uses icons with `title` attributes. If both views are valuable, label the choices visibly and remember the preference; otherwise keep one strong layout. The same card issues from community browse apply here.
- **Saved — high impact.** “Saved Routines” is exposed in the account menu, but its page is only “Implementation coming soon!”. Remove the destination from primary account navigation until it serves a user goal, or give the page a real empty state that explains saving and links to browse. As it stands, the feature breaks trust.

## 7. Authentication and account preferences

**Evidence:** `src/app/(auth)/*`, `src/app/(main)/profile/preferences/page.tsx`.

- **Auth layout — medium impact.** Login, registration, reset, and verification share the wave backdrop, but functional form pages need stronger visual focus than the wave. Use a stable form width around 420–480px, a clear title and one-sentence context, and a quiet background. On phone, use generous top and bottom padding instead of `min-h-screen` vertical centering, which can feel cramped when the keyboard opens.
- **Fields — high impact.** Login and registration use visual `span` labels and 14px inputs; email fields use `type="text"`. Design proper associated labels, email keyboard/autocomplete behavior, 16px mobile input text, consistent 44px field heights, and clear focus rings. Show password requirements near the field as registration already begins to do, but keep the list concise and connected to validation.
- **Feedback — high impact.** Several auth failures use browser `alert()`. Replace with inline error text at the relevant field or form banner, and keep entered values. Loading should be visible in the pressed button. Email verification should clearly state what happened, which address was used, and what to do if mail does not arrive.
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

Start with the changes that affect whether people can complete the main journeys: **phone catalog filters and search; phone merchant offers; routine builder save feedback; account/saved-routine wayfinding; admin phone shell if mobile admin is required.** Then establish the shared type, color, spacing, and control rules. Next refine home imagery, routine cards, and motion. Review each page at phone and desktop widths with real product data, long names, missing images, empty states, keyboard focus, reduced motion, and larger text before calling that page done.

This document is the critique and design direction. The implementation checklist can be made after deciding which recommendations fit Clearup's product goals and which screens matter most to users.
