# Music Copilot: Full Spec

## 1. Summary

Music Copilot is a songwriting environment that explains music theory while the user writes. The user builds a chord progression, sets a tempo and a bar count, and the app shows the scales and arpeggios that fit each chord, along with guide tones that help a player move smoothly between chords. Tabs and sheet music stay in one place, and the app's suggestions appear beside the notes the user is writing.

The core rule: Copilot explains and suggests, and the songwriter decides. Every suggestion shows the theory behind it, such as the chord's function or the scale's character, so the user learns why a note fits instead of only accepting it. Nothing is written into a song without the user's action.

The first setting is an educational environment for music hobbyists and music students, who want to understand harmony while they write their own material.

## 2. Problem

Writing original music is hard, and applying theory is harder. A songwriter may know a scale by name without knowing which chords it fits over or what feel it gives a progression. Improvising with other people needs a working memory of keys, scales, and the chord types that belong in each key. Most players learn this slowly, through repeated trial, or by copying what they hear.

Three problems stand out:

- **Theory stays abstract.** Lessons explain scales and chords in isolation. Songwriters struggle to connect them to a progression they are actually writing.
- **Improvising needs memory.** Choosing notes over a chord change requires knowing which scale fits, and most songwriters do not have that knowledge ready when they play.
- **Feel is hard to name.** A key or scale carries a mood, but songwriters often cannot say what that mood is or how to use it.

Music Copilot addresses these by keeping theory next to the writing. The songwriter sees the scale, the chord function, and the guide tones at the moment they need them.

## 3. Goals and Non-Goals

### Goals

- Let a user build a chord progression with tempo and bars, and see the scales and arpeggios that fit it within one minute.
- Show the reason for each suggestion in plain words, so the user learns the theory.
- Support both tabs and sheet music for the same progression.
- Provide a visual of the scale on a fretboard or keyboard for each chord.

### Non-goals

- Generating a complete song or a finished melody without the user's input.
- Recording, mixing, or producing audio in v1.
- Replacing a music teacher or a full notation program.
- Claiming that any suggestion is the only correct choice.

## 4. Core Concepts

| Concept | Meaning |
| --- | --- |
| Progression | An ordered list of chords with a tempo and a number of bars. |
| Chord | A named set of notes placed on one bar or beat. |
| Key | The tonal center a progression is organized around, such as C major or A minor. |
| Scale | An ordered set of notes that fits a key or a chord, with a character or feel. |
| Arpeggio | The notes of a chord played one at a time, used as a melodic outline. |
| Guide tone | A chord tone, usually the third or seventh, that moves smoothly from one chord to the next. |
| Suggestion | A proposed scale, arpeggio, chord, or note, with a reason shown beside it. |
| Feel | A short label for a scale's mood, such as bright, dark, or bluesy. |

## 5. User Roles

- **Songwriter:** writes a progression, reviews suggestions, and decides what goes into the song. This is the main user.
- **Student:** a songwriter who is learning harmony and may start from sample progressions. Often the same person as the songwriter.

## 6. Primary Workflows

### Build a progression

- The songwriter sets a key, a tempo, and a number of bars.
- They enter chords one at a time, or choose a sample progression.
- Copilot shows the chord names, their functions in the key, and a short note on each.
- The songwriter can change any chord, and the suggestions update.

### Find scales and notes

- The songwriter taps a chord.
- Copilot lists the scales and arpeggios that fit it, with the feel of each.
- The songwriter can view the scale on a keyboard or fretboard diagram.
- Copilot marks the guide tones for the chord and the next one.

### Write notes

- The songwriter writes a melody in the tab or sheet music area.
- Copilot highlights notes that fit the current chord and scale, and marks any note outside them.
- The songwriter keeps, changes, or removes any note. Copilot does not change notes on its own.

### Autofill

- The songwriter asks for autofill on a bar.
- Copilot proposes a short phrase that fits the chord and scale, and shows the theory behind it.
- The songwriter accepts, edits, or rejects the phrase.

## 7. AI Behavior

Copilot uses a music-theory engine for the core suggestions. Chord functions, scale membership, and arpeggios come from fixed rules, not from a language model. A language model handles only the explanations and the genre and feel labels, and it works from the engine's output.

The model is not allowed to:

- Insert notes, chords, or phrases into the user's song without an accepted action.
- Claim one scale or chord is the only correct choice.
- Present a suggestion without a reason.
- Name a real artist's song as a template, or copy a melody from a recording.
- Store or reuse a user's melody to build a profile.

Suggestions are shown in a side panel with a short reason, such as "This is the dominant chord, so the mixolydian scale fits." The songwriter can turn suggestions off for a session.

## 8. Rules for the Idea

- **Explain rule:** every suggestion shows a reason in one or two sentences, drawn from the theory engine.
- **Key rule:** a chord that is not in the chosen key is labeled as borrowed or outside, not corrected.
- **Note rule:** a note outside the current scale is marked, but never removed.
- **Accept rule:** a suggestion changes the song only after the songwriter accepts it.
- **Count rule:** a progression holds up to sixteen bars in v1. Longer progressions are split into sections.

## 9. Data Handling

- **Songs:** kept on the device by default and synced only when the songwriter chooses an account.
- **Melodies and progressions:** not used to train models, and not shared with other users without an explicit export.
- **Retention:** songs kept until the songwriter deletes them. Account deletion removes synced copies within thirty days.
- **Training:** songs are not used to train models without a separate opt-in.

## 10. Accessibility

- Every control works with a keyboard and a screen reader, including note entry and scale selection.
- Scale and chord diagrams have text descriptions, such as "C major scale: C, D, E, F, G, A, B."
- Suggestions are readable in text, so a songwriter who cannot see the diagram still gets the reason.
- Color is never the only way to show a note's status. Notes in and out of scale also carry a symbol.
- Playback, if added later, has a visible stop control and an option for slower tempo.
- Main controls sit within reach for one-handed use on a phone.

## 11. Metrics

| Metric | What it shows | Target |
| --- | --- | --- |
| Progressions built | Share of sessions that produce a saved progression | placeholder |
| Suggestions accepted | Share of suggestions the songwriter accepts | placeholder |
| Theory checks | Share of users who open the reason behind a suggestion | placeholder |
| Time to first scale | Median time from first chord to first scale view | placeholder |
| Theory confidence | Share of songwriters who say they can name a scale for a chord | placeholder |

All targets are placeholders until the pilot runs.

## 12. Pilot Plan

Two pilots, as in the source draft:

**Pilot A: jazz standards.** Copilot is used on a set of well-known jazz standards with assisted scales and guide tones. Songwriters play along and compare the suggestions with the printed chord charts.

**Pilot B: writing an instrumental song.** Songwriters write a short instrumental piece from a blank progression. Copilot suggests chords and scales as they go, and songwriters review which suggestions they kept.

## 13. Competitive Notes

Notation software handles tabs and sheet music but does not explain theory. Online theory courses teach scales and chords in isolation, away from the writing. Chord-finder tools suggest chords but rarely show the scales or guide tones over them. The gap is a writing environment where the theory appears beside the notes. A full competitive review is still needed before pitching. Placeholder: competitor list pending.

## 14. Technical Architecture

The high-level flow is:

```text
INPUT (chords, key, tempo, bars)
  → THEORY ENGINE (chord functions, scales, arpeggios, guide tones)
  → SUGGESTIONS (ranked, with reasons)
  → EDITOR (tabs and sheet music)
  → AUTOFILL (rule-based phrase proposals)
  → EXPLAIN (short language-model text from engine output)
  → STORE (on device, with optional sync)
```

The theory engine is rule-based and tested against a set of known progressions. The language model writes only the explanation text and is given the engine's result as input. Audio playback is out of scope for v1 and would use a separate module.

The riskiest parts are the theory engine's handling of borrowed chords and the autofill rules. Both are tested on the sample progressions before the editor is built.

## 15. Risks and Mitigations

| Risk | Severity | Mitigation |
| --- | --- | --- |
| A suggestion is presented as the only right answer | Medium | Explain rule. Every suggestion names its reason and allows other options. |
| The language model invents a theory claim | High | The model explains only engine output. Claims are checked against the engine's rules. |
| Songwriters copy a recording's melody | Medium | Autofill uses rules, not recordings. No artist melodies are used as templates. |
| Notation is misread in the editor | Medium | Tabs and sheet music are checked against the same note data. |
| A key is misidentified for a progression | Medium | The songwriter sets the key. Copilot only suggests one when asked. |
| Songwriters rely on suggestions and skip learning | Low | Reasons are shown every time, and suggestions can be turned off. |

## 16. Open Questions

- Which genres should the first version cover, beyond jazz and instrumental writing?
- Should the editor support tabs, sheet music, or both in v1?
- How much theory should a beginner see by default, and how much should be hidden?
- Who owns the progression library after the hackathon?

## 17. Glossary

- **Arpeggio:** the notes of a chord played in sequence.
- **Chord function:** the role a chord plays in a key, such as tonic or dominant.
- **Feel:** the mood of a scale or key, described in a short word.
- **Guide tone:** the third or seventh of a chord, used to move smoothly between chords.
- **Progression:** an ordered set of chords with a tempo and bars.
- **Scale:** an ordered set of notes that fits a key or a chord.
- **Suggestion:** a proposed scale, arpeggio, chord, or note, with its reason.

## 18. Appendix: Example Jazz Progression

A songwriter enters a common jazz progression in C major: Dm7, G7, Cmaj7, Am7. They set the tempo to a medium swing and the progression to four bars. Copilot labels Dm7 as a supertonic minor chord and G7 as the dominant. It suggests the dorian scale over Dm7 and the mixolydian scale over G7, with a short reason for each. It marks the third of G7 and the seventh of Dm7 as guide tones, because they move by step into the next chord. The songwriter views the scales on a keyboard diagram and writes a short melody. Copilot marks two notes outside the mixolydian scale, which the songwriter keeps as a deliberate chromatic approach.

## 19. Appendix: Example Instrumental Writing Session

A songwriter starts a new instrumental piece with a blank eight-bar section in A minor. They enter Am, F, C, and G, one chord per two bars. Copilot labels each chord and suggests the natural minor scale over Am, and the major scale over C. It explains that F and C share notes with A minor, which makes the progression smooth. The songwriter asks for autofill on bar five. Copilot proposes a short phrase in A minor with a clear resolution, and shows that it uses the chord tones on the strong beats. The songwriter edits the last note, accepts the phrase, and keeps the progression.
