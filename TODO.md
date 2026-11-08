# TODO

These features of the app should be placed within their existing `src/pages` astro file. All client-side scripts should be placed in its astro `src/scripts` file. If needed an `src/pages/api/modules/name.ts` file can be created to be a server endpoint for client requests.

## Theory Engine

- [x] Build the rule-based theory engine for chord functions, scale membership, arpeggios and guide tones
- [x] Label chords outside the chosen key as borrowed or outside, without correcting them
- [x] Rank scale and arpeggio suggestions for each chord
- [x] Generate a one or two sentence reason for each suggestion from the engine's output
- [x] Test the engine against known progressions, including the jazz (Dm7, G7, Cmaj7, Am7) and instrumental (Am, F, C, G) examples
- [x] Test the handling of borrowed chords on the sample progressions

## Build a Progression

- [ ] Add key, tempo and bar count controls to `src/pages/app/progression.astro`
- [ ] Add chord entry, one chord at a time, with changes to any chord
- [ ] Add a sample progression picker
- [ ] Show each chord's name, function in the key and a short note from `explainChord`
- [ ] Update suggestions whenever a chord changes
- [ ] Limit a progression to sixteen bars and split longer progressions into sections
- [ ] Save progressions through `setProgression` in `src/script/app/progression.astro`

## Find Scales and Notes

- [x] Add chord selection to `src/pages/app/scales.astro`
- [x] List the scales and arpeggios that fit the selected chord, with the feel of each from `getScaleFeel`
- [x] Show the reason for each scale from `explainScale`
- [x] Draw the scale on a keyboard diagram
- [x] Draw the scale on a fretboard diagram
- [x] Mark the guide tones for the selected chord and the next one
- [x] Add text descriptions for every diagram, such as "C major scale: C, D, E, F, G, A, B."

## Write Notes

- [x] Build the tab editor in `src/pages/app/editor.astro`
- [x] Build the sheet music editor from the same note data as the tabs
- [x] Highlight notes that fit the current chord and scale
- [x] Mark notes outside the scale with a symbol as well as a color, and never remove them
- [x] Show the reason for a note from `explainNote`
- [x] Let the songwriter keep, change or remove any note
- [x] Save notes through `setNotes` in `src/script/app/editor.astro`

## Autofill

- [X] Build rule-based phrase proposals that use chord tones on strong beats
- [X] Add an autofill request for a bar in `src/pages/app/autofill.astro`
- [X] Show the theory behind each phrase from `explainPhrase`
- [X] Let the songwriter accept, edit or reject a phrase, and write it into the song only after acceptance
- [X] Save proposals and their status through `addPhraseSuggestion` and `setPhraseSuggestionStatus`
- [X] Test the autofill rules on the sample progressions

## Suggestions Panel

- [x] Show suggestions in a side panel with a short reason beside each one
- [x] Track accepted and rejected suggestions through `setScaleSuggestionStatus`
- [x] Add a toggle to turn suggestions off for a session
- [x] Never present a suggestion as the only correct choice

## Songs and Storage

- [x] Keep songs on the device by default
- [x] Sync songs to the account only when the songwriter chooses
- [x] Add a songs list and song creation, editing and deletion
- [x] Add an explicit export for sharing progressions and melodies
- [x] Remove synced copies within thirty days of account deletion
- [x] Link the app pages from `src/pages/app/index.astro` and the app header

## Teacher

- [ ] Let a teacher set sample progressions for a class
- [ ] Show a teacher which sample progressions a student used and how many suggestions were accepted
- [ ] Hide a student's melodies from the teacher unless the student shares them

## Accessibility

- [ ] Make every control work with a keyboard and a screen reader, including note entry and scale selection
- [ ] Make every suggestion readable as text without the diagram
- [ ] Place the main controls within reach for one-handed use on a phone

## Metrics

- [x] Track the share of sessions that produce a saved progression
- [x] Track the share of suggestions accepted
- [x] Track the share of users who open the reason behind a suggestion
- [x] Track the median time from first chord to first scale view
- [ ] Set metric targets after the pilot

## Pilot

- [ ] Pilot A: load a set of jazz standards into the app as sample progressions, with assisted scales and guide tones on each chord
- [ ] Pilot A: show the printed chord chart beside the app's suggestions so songwriters can compare them while they play along
- [ ] Pilot B: start a new instrumental song from a blank progression in the app, with chord and scale suggestions as the songwriter writes
- [ ] Pilot B: add a review view in the app that shows which suggestions each songwriter kept
- [ ] Add an in-app survey asking songwriters whether they can name a scale for a chord

## Open Questions

- [x] Decide which genres the first version covers beyond jazz and instrumental writing
- [x] Decide whether the editor supports tabs, sheet music or both in v1
- [x] Decide how much theory a beginner sees by default
- [x] Decide whether a teacher can set a full course or only sample progressions
- [x] Decide who owns the progression library after the hackathon
- [x] Finish the competitive review
