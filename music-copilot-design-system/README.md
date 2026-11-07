# Music Copilot: Design System

This package holds the visual rules for Music Copilot, a songwriting environment that explains music theory while you write, with scale and arpeggio suggestions beside each chord.

## Contents

- `style-guide.md`: the full guide, generated from the config in `gen_music_copilot_style_guide_v2.py`.
- `scss/colors.scss`: the base palette. Edit this file to re-skin the system.
- `scss/color-functions.scss`: tint, shade, state, and WCAG contrast helpers.
- `scss/tokens.scss`: spacing, padding, radius, borders, and sizing.
- `scss/effects.scss`: focus ring and background helpers.
- `scss/system.scss`: typography (Rubik, Source Sans 3), breakpoints, z-index, motion, and component rules.
- `scss/index.scss`: forwards every module.

## Using the package

```scss
@use "scss/index" as ds;

.bar {
  background: ds.$card;
  border-radius: ds.radius(lg);
  padding: ds.padding(row);
}
```

Compile check: `/tmp/sasscheck/node_modules/.bin/sass --no-source-map --quiet scss/index.scss out.css`

## Layout

The page is a sheet of manuscript: cream paper, a treble-clef header, and ink-outlined bars with sign tags. Every corner is rounded.

## Rules

- Note status is never shown by color alone. Each note also carries a symbol and a text label.
- Headings use Rubik. Body text uses Source Sans 3.
- No serif fonts anywhere.
- Every corner is rounded, with no square corners.
- Suggestions never change the song without an accepted action.
