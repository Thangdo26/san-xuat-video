# Travel short videos (Remotion)

Vertical 9:16 travel videos rendered with [Remotion](https://remotion.dev).
One composition renders every video; each video is a folder of data.

Current video: **`da-nang-3n2d`** — Đà Nẵng 3 ngày 2 đêm, 7 scenes, 57s.

## Layout

```
data/videos/<slug>/
  brief.md          goal, audience, tone, content rules
  video.json        the video: scenes, text, timing, assets  ← edit this
  credits.json      image sources and licences
  voice.lock.json   hashes of generated voice clips (written by video:voice)

public/videos/<slug>/
  images/           photos referenced by video.json
  voice/            generated voice-over clips

src/
  schema.ts         the shape of video.json
  TravelShort.tsx   assembles scenes into a TransitionSeries
  Scene.tsx         background + photo + layout + voice for one scene
  layouts.tsx       the three scene layouts: hook, point, outro
  SceneImage.tsx    photo with Ken Burns and the scrim
  Root.tsx          registers the composition

output/<slug>/      draft.mp4 and final.mp4 (git-ignored)
```

Components decide **how** things look; `video.json` decides **what** is shown.
Adding a video means adding a folder under `data/videos/`, not new components.

## Commands

```bash
# Check the data and that every referenced file exists. No network calls.
npm run video:validate -- --slug da-nang-3n2d

# Generate voice-over from each scene's narration (ElevenLabs).
npm run video:voice -- --slug da-nang-3n2d
npm run video:voice -- --slug da-nang-3n2d --dry-run   # show what it would do

# Validate, then render output/<slug>/draft.mp4
npm run video:render -- --slug da-nang-3n2d
npm run video:render -- --slug da-nang-3n2d --final    # writes final.mp4
npm run video:render -- --slug da-nang-3n2d --crf 20   # higher quality, bigger file

# voice (when needed) → validate → render
npm run video:pipeline -- --slug da-nang-3n2d
npm run video:pipeline -- --slug da-nang-3n2d --voice  # force voice generation

# Interactive preview
npm run dev

# eslint + tsc
npm run lint
```

Nothing uploads or publishes. Reviewing and posting stay manual.

### Output files

`draft.mp4` is for review. `final.mp4` is only written when you pass `--final`,
so a routine render can never overwrite an approved export.

## Voice-over

`video:voice` reads each scene's `narration`, generates an MP3 and writes the
path back into `video.json`. Credentials come from the environment and are
never printed:

| Variable | Required | Notes |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | yes, to generate | Not needed when every clip already exists |
| `ELEVENLABS_VOICE_ID` | yes, to generate | The voice to speak with |
| `ELEVENLABS_MODEL_ID` | no | Defaults to `eleven_multilingual_v2` |

```bash
export ELEVENLABS_API_KEY=...
export ELEVENLABS_VOICE_ID=...
npm run video:voice -- --slug da-nang-3n2d
```

Clips are regenerated only when the narration, voice or model changed, so
fixing one line does not re-bill the whole video. If the API fails, no file is
written and the error explains whether to retry.

## Adding a video

1. `mkdir data/videos/<slug>` and write `brief.md`.
2. Write `video.json` following `src/schema.ts`. Keep `id` equal to `<slug>`.
3. Put photos in `public/videos/<slug>/images/` and record their licences in
   `credits.json`.
4. `npm run video:validate -- --slug <slug>` until it passes.
5. `npm run video:pipeline -- --slug <slug>`.

`durationSec` should fit the narration read aloud. Validation warns when a
scene looks too short, using roughly 4 Vietnamese syllables per second — a
sanity check, not a measurement. Check the real timing after generating voice.

## Review checklist

Run through this on every draft before publishing:

- [ ] **Nội dung** — places, itinerary, proper nouns and facts are correct
- [ ] **Footage** — each photo matches the place being talked about, no watermarks
- [ ] **Voice** — natural Vietnamese, proper nouns right, no clipped sentences
- [ ] **Phụ đề** — spelling correct, on screen long enough, matches the narration
- [ ] **Khung hình** — 9:16, subject and captions clear of the TikTok UI
- [ ] **Âm thanh** — voice above the music, no clipping, sensible fades
- [ ] **Xuất file** — MP4 opens, full length, no black frames or missing media
- [ ] **Bản quyền** — footage, music and AI-voice rights checked

## Image licensing

Every photo in `public/videos/da-nang-3n2d/images/` comes from Wikimedia
Commons under CC0, CC BY or CC BY-SA. `data/videos/da-nang-3n2d/credits.json`
records the file, author, licence and source URL for each one.

**CC BY and CC BY-SA require attribution when you publish.** Put the credits in
the video description or an end card. CC BY-SA additionally requires that
derivative works carry the same licence — check this before publishing
commercially, or swap those images for CC0 ones.

## Known gaps

- **No subtitles.** The `narration` field is the voice-over source and is not
  drawn on screen. Word-level subtitles would need `@remotion/captions` plus a
  transcription pass over the generated audio.
- **No music track.** `video.json` supports `music: { src, volume }` and the
  composition plays it, but no track is licensed or committed yet.
- **Duration is a heuristic** until voice clips exist; see above.
