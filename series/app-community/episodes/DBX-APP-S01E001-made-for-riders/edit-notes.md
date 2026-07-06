# Edit Notes — DBX-APP-S01E001 (made-for-riders)

The editing script. ~22s launch teaser. Open a **1080×1920 / 30fps** Kdenlive project and
build the timeline below. **All timecodes are estimates — the truth is your voice.** Drop
the VO first, then slide each clip/overlay/subtitle to land on the words (the phone
overlays are cut to match the feature VO word-for-word, so they'll snap into place).

All media lives in one self-contained bundle: **`media/DBX-APP-S01E001/`**. Paths below are
relative to that folder (e.g. `footage/02_founder-main.mp4`).

Track layout: **V1** footage/photo · **V2** overlays (transparent, on top) · **A1** voiceover
+ hook SFX · **A2** music · subtitles via Kdenlive's subtitle tool (import `en-US.srt`).

## Timeline

| Time | V1 (footage) | V2 (overlay, on top) | A1 (voiceover) | A2 (music) | Subtitle |
|------|--------------|----------------------|----------------|------------|----------|
| 0.0–2.0 hook | `footage/01_hook-photo.jpeg` (slow push-in) | — | `music/sfx-hook-nobody-cares-CAR-PLACEHOLDER.mp3` ⚠ says "car" | `music/bgm-1-close-up.mp3` in, low | "Nobody cares about your dirt bike." |
| 2.0–3.5 i-do | `footage/02_founder-main.mp4` (start) — **mute video audio** | — | `voiceover/vo-1-ido.wav` | bgm-1 | "I do." |
| 3.5–9.0 pivot | founder clip continues | `overlays/..._hook-title_v001.mov` (MADE FOR RIDERS) | `voiceover/vo-2-pivot.wav` | bgm-1 builds | pivot lines |
| 9.0–12.8 | founder continues (your face stays in bg) | `overlays/..._phone-language_v001.mov` | `voiceover/vo-3-features.wav` (starts 9.0) | `music/bgm-2-motivating-mornings.mp3` in | "Post in any language." |
| 12.8–15.8 | founder continues | `overlays/..._phone-embed_v001.mov` | …features VO continues | bgm-2 | "Bring everything you've shared — with one link." |
| 15.8–19.5 | founder continues | `overlays/..._phone-sponsor_v001.mov` | …features VO ends | bgm-2 | "And finally get seen, through sponsorship." |
| 19.5–22.0 cta | `footage/06_founder-cta.mp4` (finger pointing down) — **mute video audio** | — | `voiceover/vo-4-comment.wav` | `music/bgm-3-running-out-of-time.mp3` resolve | "Comment \"dirt bike\" and I'll send you the invite code." |

The four `overlays/*.mov` files are **transparent ProRes 4444** — put them on V2 over the
founder clip on V1 and your face shows around them automatically. They already contain the
keyframed slide-ins and the stamps (MADE FOR RIDERS / SPEAKS YOUR LANGUAGE / DROP ONE LINK /
GET SPONSORED). All overlays are rendered — nothing left to render.

## Music & sound bed (Combo B — license-clean Mixkit, no attribution)

- **0.0–9.0** `music/bgm-1-close-up.mp3` — restrained tech intro under hook + pivot. Keep it low.
- **9.0–19.5** `music/bgm-2-motivating-mornings.mp3` — driving montage energy under the features. Crossfade in ~0.3s at 9.0.
- **19.5–22.0** `music/bgm-3-running-out-of-time.mp3` — confident tag for the CTA (or let bgm-2 resolve).
Duck all music −12 to −16 dB under the voiceover.

## SFX (suggested — source from any free pack; not included)

- Bass-drop / impact on the **2.0s hard cut to "I do."**
- Whoosh on each phone slide-in (9.0 / 12.8 / 15.8).
- Soft pop when each stamp lands; a "ding" on the sponsor stamp. Keep it sparse — accents only.

## Retention checklist (fill after your first assembly, before export)

1. First frame conflict/hook? — "nobody cares" at 0s. ✔ 2. First 3s no filler? — hook → "I do" is instant.
3. Understandable muted? — subtitles + phone overlays carry it. 4. Emphasis words distinct? — stamps echo the VO.
5. SFX at key moments only? — see list. 6. A change every 1–3s? — cut, then a phone overlay every ~3s.
7. Transitions serve content? — hard cuts + slide-ins. 8. Nothing fights for attention? — face/phone/stamp balanced.
9. Every sentence moves info forward? — yes (Whisper-verified). 10. Ending = follow expectation? — comment-for-invite CTA. ✔

## Moving to your editing machine

`media/` is **gitignored** — the clone will NOT contain any of the footage/overlays/audio.
The whole project is one folder: **`media/DBX-APP-S01E001/`**. Copy that one folder to the
same path in the clone and everything resolves.

```text
media/DBX-APP-S01E001/
  footage/     01_hook-photo.jpeg · 02_founder-main.mp4 · 06_founder-cta.mp4   → V1
  overlays/    ..._hook-title / _phone-language / _phone-embed / _phone-sponsor (transparent) → V2
  voiceover/   vo-1-ido · vo-2-pivot · vo-3-features · vo-4-comment (trimmed) → A1
  music/       sfx-hook-...CAR-PLACEHOLDER (⚠) · bgm-1-close-up · bgm-2-motivating-mornings · bgm-3-running-out-of-time → A1/A2
  en-US.srt    subtitles (also tracked in the repo)
  _source/     NOT for the edit — camera originals, 30fps screen-rec conversions
               (already baked into the overlays), and untrimmed VO. Backups only.
```

On the editing machine:
1. `git clone git@github.com:monkeyboiii/video-master.git`
2. Copy `media/DBX-APP-S01E001/` into the clone at `media/DBX-APP-S01E001/`.
3. Open Kdenlive → new **1080×1920 / 30fps** project → import `footage/`, `overlays/`,
   `voiceover/`, `music/` and build the timeline above. (No Node/Remotion needed — all rendered.)

## Notes / decisions

- ⚠ **Hook audio says "car," not "dirt bike."** Placeholder until you re-record that line.
- CTA is the comment-for-invite-code mechanic (your recorded line), no graphic card — your
  finger-point-down clip is the whole ending, per your call.
- VO takes were clean (Whisper found no ums) — trims only removed lead/trail silence and the
  keyboard clicks after "I do".
- `_source/` holds the untouched camera files + the 30fps screen-rec conversions (inputs to the
  phone overlays) + untrimmed VO — kept for backup / re-rendering, not imported into the cut.
