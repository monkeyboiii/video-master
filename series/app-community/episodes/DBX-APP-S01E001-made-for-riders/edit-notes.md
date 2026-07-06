# Edit Notes — DBX-APP-S01E001 (made-for-riders)

The editing script. ~22s launch teaser. Open a **1080×1920 / 30fps** Kdenlive project and
build the timeline below. **All timecodes are estimates — the truth is your voice.** Drop
the VO first, then slide each clip/overlay/subtitle to land on the words (the phone
overlays are cut to match the feature VO word-for-word, so they'll snap into place).

Track layout: **V1** footage/photo · **V2** phone overlays + title cards · **A1** voiceover
· **A2** music · subtitles via Kdenlive's subtitle tool (import `subtitles/en-US.srt`).

## Timeline

| Time | V1 (footage) | V2 (overlay, on top) | A1 (voiceover) | A2 (music) | Subtitle |
|------|--------------|----------------------|----------------|------------|----------|
| 0.0–2.0 hook | `..._SH010_..._nobody-photo.jpeg` (slow push-in) | *(opt)* "NOBODY CARES?" | `..._sfx-nobody-cares-CAR-PLACEHOLDER.mp3` ⚠ says "car" | `bgm-close-up` in, low | "Nobody cares about your dirt bike." |
| 2.0–3.5 i-do | `..._founder-idobuilt_30.mp4` (start) — **mute video audio** | — | `trimmed/vo-ido.wav` | close-up | "I do." |
| 3.5–9.0 pivot | founder clip continues | "MADE FOR RIDERS" (`phone-... ` no — render `hook-title`, see below) | `trimmed/vo-ibuilt.wav` | close-up builds | pivot lines |
| 9.0–12.8 | founder clip continues (your face stays in bg) | `..._phone-language_v001.mov` | `trimmed/vo-features.wav` (starts 9.0) | `bgm-motivating-mornings` in | "Post in any language." |
| 12.8–15.8 | founder continues | `..._phone-embed_v001.mov` | …features VO continues | motivating-mornings | "Bring everything you've shared — with one link." |
| 15.8–19.5 | founder continues | `..._phone-sponsor_v001.mov` | …features VO ends | motivating-mornings | "And finally get seen, through sponsorship." |
| 19.5–22.0 cta | `..._founder-comment_30.mp4` (you, finger pointing down) — **mute video audio** | — | `trimmed/vo-comment.wav` | `bgm-running-out-of-time` resolve | "Comment \"dirt bike\" and I'll send you the invite code." |

The three `phone-*_v001.mov` files are **transparent ProRes 4444** — put them on V2 over the
founder clip on V1 and your face shows around them automatically. They already contain the
keyframed slide-in and the stamp (SPEAKS YOUR LANGUAGE / DROP ONE LINK / GET SPONSORED).

## Music & sound bed (Combo B — all three already in `media/audio/`, license-clean, no attribution)

- **0.0–9.0** `bgm-close-up.mp3` — restrained, futuristic tech intro under hook + pivot. Keep it low; let the VO lead.
- **9.0–19.5** `bgm-motivating-mornings.mp3` — driving montage energy under the three features. Crossfade in at 9.0 (~0.3s).
- **19.5–22.0** `bgm-running-out-of-time.mp3` — confident tag for the CTA, or just let motivating-mornings resolve.
Duck all music −12 to −16 dB under the voiceover. Upgrade path for a more cinematic hook/build: swap 0–9s for the two Pixabay tracks the research listed (tense sting → hopeful piano).

## SFX (suggested — source from any free pack; not yet included)

- Bass-drop / impact on the **2.0s hard cut to "I do."**
- Whoosh on each phone slide-in (9.0 / 12.8 / 15.8).
- Soft pop when each stamp lands; a "ding" on the sponsor stamp.
- Keep it sparse — accents only.

## To render before final (2 small title cards)

- **"MADE FOR RIDERS"** for the pivot (3.5–9.0): render the `hook-title` composition with
  `title: "Made for riders"` → `media/overlays/`. (Optional "NOBODY CARES?" hook card too.)

## Retention checklist (fill after your first assembly, before export)

1. First frame conflict/hook? — the "nobody cares" line lands at 0s. ✔ (pending your cut)
2. First 3s no filler? — hook → "I do" is instant. 
3. Understandable muted? — subtitles + phone overlays carry it. 
4. Emphasis words distinct? — stamps echo "language / one link / sponsored". 
5. SFX at key moments only? — see SFX list. 
6. A change every 1–3s? — cut, then a new phone overlay every ~3s. 
7. Transitions serve content? — hard cuts + slide-ins only. 
8. Nothing fights for attention? — face vs phone vs stamp balanced (verified in preview). 
9. Every sentence moves info forward? — yes (Whisper-verified, fluent). 
10. Ending = follow expectation? — comment-for-invite-code CTA. ✔

## Moving to your editing machine

`media/` is **gitignored** — the clone will NOT contain footage, overlays, VO, or music.
Copy the whole `media/` folder into the clone at the same paths. Every file below is
referenced by these exact repo-relative paths (they align across machines):

```text
# V1 footage
media/selected/DBX-APP-S01E001/DBX-APP-S01E001_founder-idobuilt_30.mp4   # i-do, pivot, features bg
media/selected/DBX-APP-S01E001/DBX-APP-S01E001_founder-comment_30.mp4    # cta — finger pointing down
media/raw/DBX-APP-S01E001/DBX-APP-S01E001_SH010_TK01_nobody-photo.jpeg   # hook

# V2 overlays (transparent ProRes 4444 — put over V1)
media/overlays/DBX-APP-S01E001_en-US_9x16_hook-title_v001.mov            # MADE FOR RIDERS (pivot)
media/overlays/DBX-APP-S01E001_en-US_9x16_phone-language_v001.mov
media/overlays/DBX-APP-S01E001_en-US_9x16_phone-embed_v001.mov
media/overlays/DBX-APP-S01E001_en-US_9x16_phone-sponsor_v001.mov

# A1 voiceover (already trimmed)
media/voiceover/DBX-APP-S01E001/trimmed/vo-ido.wav
media/voiceover/DBX-APP-S01E001/trimmed/vo-ibuilt.wav
media/voiceover/DBX-APP-S01E001/trimmed/vo-features.wav
media/voiceover/DBX-APP-S01E001/trimmed/vo-comment.wav

# A1 hook SFX (placeholder — says "car") + A2 music
media/audio/DBX-APP-S01E001/DBX-APP-S01E001_sfx-nobody-cares-CAR-PLACEHOLDER.mp3
media/audio/DBX-APP-S01E001/bgm-close-up.mp3
media/audio/DBX-APP-S01E001/bgm-motivating-mornings.mp3
media/audio/DBX-APP-S01E001/bgm-running-out-of-time.mp3

# subtitles come WITH the clone (tracked in git):
series/app-community/episodes/DBX-APP-S01E001-made-for-riders/subtitles/en-US.srt
```

On the editing machine:
1. `git clone git@github.com:monkeyboiii/video-master.git`
2. Copy `media/` into the clone (same relative paths as above).
3. Open Kdenlive → new **1080×1920 / 30fps** project → build the timeline above.

(The original camera files in `media/raw/` are the backups; the edit uses the
`media/selected/` conversions. You don't need Node/Remotion on the editing machine —
everything is already rendered.)

## Notes / decisions

- ⚠ **Hook audio says "car," not "dirt bike."** Placeholder until you re-record that line.
- CTA is the comment-for-invite-code mechanic (your recorded line), no graphic card — your
  finger-point-down clip is the whole ending, per your call.
- VO takes were clean (Whisper found no ums) — trims only removed lead/trail silence and the
  keyboard clicks after "I do".
