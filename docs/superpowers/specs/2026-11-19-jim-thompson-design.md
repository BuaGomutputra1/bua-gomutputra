# Jim Thompson internship case study

## Why
Bua wants her Jim Thompson internship (her first) on the new site as a case study alongside SideBy, DuoPoker, EcoPinet and BuzzTile. It should show scale (140+ colourways), real outcomes (3 selected for the 2026 collection) and how a heritage brand's collection actually moves.

## Goals / non-goals / anti-goals
- Goal: a `jim-thompson.html` case study in the existing `body.cs2` system, with its own theme and one signature interaction.
- Non-goal: rewriting her copy. Sources, in her words: the old page's text and her internship reflection deck (`JT presentation.pdf`: first impressions, what she learnt, worked on, takeaways, suggested improvements).
- Anti-goals: repeating SideBy patterns, brown, pill ✓/✕ chips, rows crowded with photos of people, cheap zoom effects.

## Approaches
1. **Colourway switcher (picked).** Pick a pattern, click swatches to swap between her real colourways in one large frame; the 3 selected cloud colourways carry a "Selected for 2026" mark. Shows the 140+ instead of stating it.
2. Before/after betta slider: beautiful but only one exercise.
3. Collection-cycle click-through: mostly text and photos, too close to EcoPinet's journey.

## Design
- Theme `theme-jt`: silk teal / deep indigo with a saffron accent, cream ground. Fonts as site (Geist + Goudy labels).
- Sections: 01 Jim Thompson (role, dates 15 Jul–15 Aug 2025, headline "140+ colourways. Three selected for the 2026 collection.", hero photo, facts row) · 02 What I did (contributions incl. weaving and photographing archive fashion pieces at the Art Centre; 3 skills; favourite task: the non-geometric colourways) · 03 Colourways (switcher) · 04 Inside the studio (SS26 wall, shoots, sample books, SACIT panel, video clip) · 05 What I took with me (her takeaways, plus one line from her deck's suggestion to share Home Furnishings with younger audiences) · 06 Thanks for reading + More work (2 cards).
- Home: add a Jim Thompson tile in the next empty slot.
- Assets: her old site's `public/assets/jim-thompson` photos + video, the Selected JT folder, Downloads/JimThompson photos. All collection and web imagery is cleared for use (Bua, 19 Nov 2026); keep a short "Collection imagery courtesy of Jim Thompson" credit.
- Phone: switcher frame stacks above swatches; photo rows become swipeable strips.

## Left to the builder
Exact swatch crops, spacing within the site system, which studio photos make the cut (max ~6).
