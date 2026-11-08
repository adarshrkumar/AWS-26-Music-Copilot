# Music Copilot: Summary

## The problem

Coming up with original ideas in music is hard, and songwriters often struggle to apply music theory. It is one thing to play and another to consider scales, keys, and chords. To improvise with other people, you have to memorize a lot about keys and scales, and know which chords belong in a key and what specific feel a key or scale gives.

## The idea

Music Copilot is an environment that suggests music theory information during your songwriting process. It also shows visuals of scales for improvising over the chord progressions you build.

## How it works

- A songwriting environment, with tabs or sheet music, and AI suggestions such as autofill and recommended components for a specific genre or feel.
- You build a basic chord progression, set the tempo and bars, and Copilot offers the matching scales or arpeggios, along with guide notes.

## Guardrails

- Copilot explains each suggestion with a short reason, and the songwriter decides what goes in the song.
- Nothing is added to a song without the songwriter's action.
- A note outside the chosen scale is marked, never removed.
- Copilot does not present one scale or chord as the only correct choice.

## Who it is for

Educational environments for individual music hobbyists and music students.

## Pilot

Two pilots. The first uses specific jazz songs, with assisted scales and notes. The second follows the process of writing an instrumental song, and shows how Copilot suggests chords and scales as the song takes shape. Pilot numbers are placeholders until the pilot runs.

## What the hackathon build covers

A writing environment for chords, tempo, and bars, a basic music database or selection of progressions, scale and arpeggio suggestions with reasons, and a scale view for each chord. Recording, audio playback, and full song generation are outside the build.

## Decisions

- **Genres:** jazz, instrumental writing, pop and rock, and blues in v1.
- **Editor:** both tabs and sheet music, drawn from the same note data.
- **Beginner theory:** chord status, ranked scales and arpeggios, and a short reason for each by default, with deeper detail one step away.
- **Library:** the sample progressions stay in this repository. Songwriters own what they write.
