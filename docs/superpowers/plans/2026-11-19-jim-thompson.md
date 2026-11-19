# Jim Thompson Page Implementation Plan

> Executed natively (superpowers:executing-plans). Spec: `docs/superpowers/specs/2026-11-19-jim-thompson-design.md`. Figma reference: Branding page, "Jim Thompson — Desktop".

**Goal:** `jim-thompson.html` case study matching the Figma frame, plus a home tile.
**Architecture:** static page in the `body.cs2 theme-jt` system; colourway switcher = data in markup (`<button data-src>` swatches per pattern tab) + small vanilla JS in `js/main.js`; CSS appended to `css/style.css`.

## Global constraints
- Images JPEG ~80, max 1800px; swatches max 900px. Bump `?v=` on CSS/JS in every HTML file.
- No brown, no pill ✓/✕ chips, no cheap zoom. Geist + Goudy labels. Copy from her old page and reflection deck.
- Credit line "Collection imagery courtesy of Jim Thompson."
- Commit as Bua; she pushes via GitHub Desktop.

## Review focus
- Phone 390: switcher frame stacks above swatches, swatches wrap, tabs scroll horizontally, no sideways page scroll.
- Switching tabs resets to that pattern's first swatch and updates name/description/count.
- Selected badge shows only on the three selected cloud colourways.
- Keyboard: tabs and swatches are buttons with aria-pressed/aria-selected.
- Missing image never breaks layout (fixed aspect frame).

### Task 1: Assets
Crop swatches from `Image 14-8-25 at 19.50.JPG` into `images/jim-thompson/cw/<pattern>-<n>.jpg`; copy selected clouds, studio photos, hero, poster + clip.
Verify: every referenced file exists, sizes within limits.

### Task 2: Page + styles + switcher
Create `jim-thompson.html` (sections 01–06 per spec), theme CSS, switcher JS; add home tile.
Verify (browser JS check at 1440/390): no h-scroll, all images load, clicking each tab/swatch swaps image and text, no console errors.

### Task 3: Ship
Commit, mirror any deltas to Figma, ask Bua to push.
