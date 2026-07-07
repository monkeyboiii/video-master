# Edit Notes — DBX-APP-S01E002 "founder-story" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl` (cli-anything-kdenlive)
→ `media/DBX-APP-S01E002/founder-story.kdenlive` (portable, relative paths).
Human polishes zoom keyframes + final timing in Kdenlive on Mac, then renders.

## v2 revision (current cut) — what changed from v1

- **Trailing pauses cropped**: each clip is cut at its speech end (silencedetect), so the
  click/pause between takes is gone. New contiguous timeline ≈ 65.75s (was 69.7).
- **Captions**: single bottom line (rolling 6-word window) in a **fixed-width panel** —
  the background is bounded, it doesn't stretch/shrink with the text. cta captions **stop
  at "…description."** — no captions over "My name is Rubio / waiting for you there".
- **Feature phones (E1 app clips)**: `feature-phones-built-it` (language + post-once, side
  by side, 47.5–53.5s) and `feature-phones-cta` (sponsorship, 54.5–59.0s), lower third,
  covering the caption. Each phone plays then **freezes on its last frame**; the language
  phone runs picker → **pull-to-refresh** → freeze (E1-style) and holds past "21 languages".
- **Invite card**: the real invite-card.png used directly, "Instagram people welcome!"
  patched to "New riders welcome" (platform-agnostic), **centered in the lower third at
  100% opacity**, sized like the overlay cards. QR kept (fully scannable).
  Freeze frames for the phones (`embed-freeze.png`, `sponsor-freeze.png`) are last-frame
  grabs of the E1 clips, extracted into `public/_feat/`.
- **Profile card**: moved to the **lower third** (where the subtitle sits), on "My name
  is Rubio".
- **Audio**: music down to ~10% (VO-first); SFX short/recognizable and **low-impact** —
  soft whoosh on brutal, radio-static on scattered, soft whoosh on the DirtBikeX reveal,
  camera shutter on the feature-phone pops, soft hit on hook/invite. Deep whoosh / deep
  hits / sub-drop / glitches removed.
- **Kdenlive-native**: after export, `tools/kdenlive-nativize.py --vertical` repoints the
  root producer to `maintractor`, adds numeric `kdenlive:id` to every producer, renames
  `clipN`→`producerN`, and fixes the 9:16 profile. Validated (no unresolved refs).

## Track layout

| Track | Content |
|-------|---------|
| V1 | Tone-mapped footage `footage/NN_*_sdr.mp4` (HLG→SDR Rec.709). Carries the VO. |
| V2 | Streaming caption overlays (`kinetic-captions-<beat>`), one per beat, tiled 0–69.7s |
| V3 | Branded overlays: `brand-title`, `invite-card`, `profile-card` |
| A1 | `bgm-vampire-heart.mp3` (duck −16 dB under VO on Mac) |
| A2 | SFX hits at emphasis timecodes |

Cuts are **hard cuts only**. Zoom (punch-in / pull-out) is **not baked** — add it as
Transform keyframes on the V1 clips on the Mac (the `Zoom:` lines below are the intent).

## HDR

All 6 clips are HLG HDR. Each was tone-mapped to SDR before edit (see storyboard HDR
pipeline / `kdenlive-build.repl` uses the `_sdr.mp4`). Do **not** re-import the raw `.MOV`
into the timeline — that reproduces E001's pale look.

## Assembly plan — en-US

Positions are timeline seconds at raw clip lengths; tighten pauses on the Mac (target ~60s).

### hook (0.00–8.73)
V1: SEL_001 01_hook_sdr.mp4. V2: cap-hook. 
Zoom: open mid-push, snap-in on "gets it". 
SFX: riser-1 @5.0 → hit-2 @7.0 ("gets it"). 
Captions: "Nobody" harsh, "gets it" brand.

### first-ride (8.73–20.33)
V1: SEL_002. V2: cap-first-ride. 
Zoom: escalating push-ins per hardship. 
SFX: deep-hit @9.6 ("brutal"), sub-drop @11.5 ("100 degrees"). 
Captions: "brutal / 100 / degrees" harsh.

### addictive (20.33–31.83)
V1: SEL_003. V2: cap-addictive. 
Zoom: pull-out on "couldn't stop", punch-in on "addictive". 
SFX: riser-2 @25.0 → hit-3 @26.9 ("addictive"). 
Captions: "crazy / addictive / share" brand.

### problem (31.83–39.30)
V1: SEL_004. V2: cap-scattered. 
Zoom: near-static, colder. 
SFX: glitch-1 @34.6 ("scattered"), glitch-2 @35.6 ("outdated"). 
Captions: "scattered / outdated" harsh.

### built-it (39.30–56.10)
V1: SEL_005. V2: cap-built-it. V3: brand-title @44.0 (logo reveal on "DirtBikeX"). 
Zoom: punch-in on "build DirtBikeX myself", snap per feature. 
SFX: mech-keyboard @40.2 ("software engineer"), deep-hit-2 @44.0 ("DirtBikeX"). 
Captions: "DirtBikeX / bloat / twice / 21 / languages" brand. 
DECIDE: optional light UI flashes (no-bloat / embed / 21-languages) — not in this cut.

### cta (56.10–69.67)
V1: SEL_006. V2: cap-cta. V3: invite-card @61.8 (during "invite code in the description"),
profile-card @66.0 (on "My name is Rubio", holds to end). 
Zoom: warm settle, punch-in on "invite code". 
SFX: riser-3 @57.0 ("us to be seen"), hit-2 @62.0 ("invite code"). 
Captions: "seen / invite / code / Rubio" brand. 
DECIDE: caption panel overlaps the invite/profile cards ~61–69s — trim cap-cta on the Mac
if it competes.

## DECIDE (human, on the Mac)
- Add punch-in/pull-out Transform keyframes per the `Zoom:` lines (not baked).
- Tighten pauses/breaths to ~60s; caption + SFX + card positions follow the retimed cuts.
- Confirm brand-title placement (currently the "build DirtBikeX" reveal, not the open).
  In the flatten preview it sits over the founder's eyes ~44s — nudge up / shrink, or
  keep as a quick 2s flash.
- cap-cta (56–69.7s) peeks behind the invite-card / profile-card — trim it where the
  cards are full-screen so captions don't compete.
- Duck music under VO; balance SFX levels.

## Preview
A rough-cut flatten (no zooms) is at
`media/DBX-APP-S01E002/exports/DBX-APP-S01E002_en-US_tiktok_9x16_v001_review.mp4`
(ffmpeg composite of V1 footage + all overlays + music + SFX; 69.7s). It's for review
only — the final render happens on the Mac from `founder-story.kdenlive`.

## Retention checklist (fill after final cut)
1. First-frame grab? hook opens on face + "Nobody" — TBD confirm on final.
2–10. TBD after the Mac polish + render.
