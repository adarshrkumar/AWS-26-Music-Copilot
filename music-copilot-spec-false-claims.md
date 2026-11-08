# Music Copilot Spec: False Claims

This audit checks every claim in `music-copilot-spec.md` against the code in `src/` and against the competitors' own public pages, as of November 7, 2026. Claims that are only plans or targets, such as metric targets, the "within one minute" goal and the pilot plan, are not counted as false. Line numbers are approximate.

Verdicts: **False** means the claim does not hold.

## Theory Engine and Testing

| # | Spec section | Claim | Verdict | What is actually true | Evidence |
| --- | --- | --- | --- | --- | --- |
| 2 | §14 | "Both [borrowed chords and autofill rules] are tested on the sample progressions before the editor is built." | False | The editor is already built (`src/pages/app/editor.astro`), and nothing tests borrowed chords or autofill. The samples in `src/lib/theory/samples.ts` are used only as UI presets. | `src/lib/theory/samples.ts`, `src/pages/app/editor.astro` |
| 4 | §16 | Implied: there is one theory engine. | False | There are three separate theory implementations: `src/lib/theory/` (progression and scales pages), `src/lib/scale-finder.ts` (the scales page's options list) and `src/lib/theory.ts` (editor and autofill). They rank scales differently and label chords differently. | The three files named |

## Guide Tones and Chord Labels

| # | Spec section | Claim | Verdict | What is actually true | Evidence |
| --- | --- | --- | --- | --- | --- |
| 6 | §18 Appendix | "Copilot labels Dm7 as a supertonic minor chord." | False | The app never says "supertonic". The engine labels Dm7 "Subdominant (ii7) in C major", and the scale finder says "ii7 in C major". In music theory, ii is the supertonic degree with a subdominant function, so the appendix describes something the app does not show. | `src/lib/theory/harmony.ts` 5-13; grep for "supertonic" in `src/` finds nothing |

## Competitive Notes

| # | Spec section | Claim | Verdict | What is actually true | Evidence |
| --- | --- | --- | --- | --- | --- |
| 14 | §13 | "Competitors were reviewed ... from each product's own documentation." | False | Scaler 3 is cited through KVR Audio and Plugin Boutique, which are a product database and a store, not Scaler Music's own documentation. Captain Chords and musictheory.net have no documentation link for the features listed. | §13 table links |

## Claims Checked and Found True

These were checked and hold, so they are not listed above: Hookpad's key-aware chord palettes, hidden out-of-key chords, next-chord suggestions and note guides; Captain Chords' key and scale progressions, next-chord help and hit-song presets; Scaler 3's key and chord detection and its genre and feel groups (Dark, Bright); Guitar Pro 8's tab and notation, chord engine and scale tool; MuseScore Studio's linked tablature; musictheory.net's free lessons, exercises and ear training; all six products playing audio; the C to B guide-tone move from Dm7 to G7; G7 labeled dominant with Mixolydian ranked first; out-of-key chords labeled, not corrected; out-of-scale notes marked with a `!` symbol and never removed; autofill being rule-based and written only after acceptance; sections capped at sixteen bars; text descriptions on diagrams; no key detection; no audio code; the sample library holding chord changes only.

## Could Not Verify

- §10: every control working with a keyboard and a screen reader, and one-handed reach on a phone. This needs manual testing.
- §16: Roman numerals, guide-tone movement and the model's explanation sitting "one step deeper" for beginners. The UI layering was not checked.
- §12: "as in the source draft". No source draft is in the repository.
