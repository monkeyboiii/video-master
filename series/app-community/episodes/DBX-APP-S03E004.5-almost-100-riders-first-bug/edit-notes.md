# Edit Notes — DBX-APP-S03E004.5

The audio pass on the interstitial that publishes behind E004: **two locales, both plain
silence cuts, both under a delayed bed.** Everything here is reproducible with
`./vo-process.sh` — the config block at the top is the whole edit.

Masters: `VO_EN_026` (v001) and `VO_ZH_010` (v001).

---

## VO audio — take 1 en-US (VO_EN_026, v001) and take 1 zh-CN (VO_ZH_010, v001)

|  | en-US | zh-CN |
|---|---|---|
| raw take | 46.78s, -31.1 LUFS, -11.3 dBTP | 42.30s, -32.1 LUFS, -10.4 dBTP |
| region kept | 0.30 – 45.90s | 0.30 – 42.15s |
| master | **27.23s**, -21.2 LUFS, -1.6 dBTP | **26.03s**, -22.6 LUFS, -1.0 dBTP |
| dead air removed | 19.55s (41.8%) | 16.27s (38.5%) |
| spliced regions | 15 | 12 |
| script sentences | 15 | 12 |
| audible speech blocks | 13 | 13 |
| pauses (median / min / max) | 0.189 / 0.134 / 0.234s | 0.176 / 0.132 / 0.248s |
| delivery gain | +9.70 dB | +9.40 dB |
| bed attenuation | -29.60 dB | -30.70 dB |

### Two plain silence cuts, and nothing else

Neither locale needed a structural edit. No room-tone insert (E003.8 needed one in both), no
graft (E003.8 and E003 both needed one), no pickup, no tail pad. One region per locale, cut
at the head and tail only, and auto-editor did the rest.

That makes this the **second consecutive episode with no structural edit at all**, after
E004. The two before it needed four between them.

The region bounds are the only hand-set numbers in the cut and both are set by junk, not by
taste:

* **0.30s at the head, both locales.** Both files open with the AAC encoder's lead-in — a
  21 ms hole at sample zero, a scatter of sub-millisecond holes to 0.05s, and a 43 ms hole at
  0.149s, all of it under -53 dB. It ends at 0.192s in both. 0.30 clears it with room to
  spare and still sits 0.34s (zh) / 0.45s (en) ahead of the first word, which is more than the
  0.06s head margin needs.
* **45.90s (en).** 0.27s past the last word, which leaves the 0.12s tail margin its room.
* **42.15s (zh).** The zh take has a 0.10s blip at 42.20s that peaks at -39.1 dB, then the
  encoder tail decaying to -138 dB. Both sit under the -34 dB gate, so the cut would have
  dropped them anyway; stopping the region at 42.15 just makes that explicit instead of
  relying on the gate to catch it.

### Twenty-five digital dropouts across the two files

Same lossy-transfer signature as every take since E003.8, and for the first time the two
locales in one batch disagree sharply about how bad it is:

| | dropouts (≥5 ms) | range | closest approach to kept audio |
|---|---|---|---|
| en-US | 7 | 5.5 – 43.7 ms | 229 ms |
| zh-CN | 18 | 5.3 – 48.3 ms | 233 ms |

The running count across the batch is now **10 → 16 → 19 → 7 / 18**. en-US take 1 is the
cleanest source file since this started; the zh-CN take recorded on the same day is the
second worst. The two halves of the batch did not travel the same way.

None of the 25 land inside a word, none land inside a retained margin, and every one is
removed by the cut. Both masters contain **no run of zero samples at all** — not one, at any
length. That is the check that matters: a dropout only becomes audible if it survives into
the master.

**It is still luck.** Twenty-five holes fell in room tone twenty-five times. The transfer
path is worth finding before one lands mid-word — see DECIDE 5.

### Pacing

Both cuts are tight and even. en-US: 13 speech blocks, pauses 0.134–0.234s, median 0.189s.
zh-CN: 13 blocks, pauses 0.132–0.248s, median 0.176s. Neither has a single pause over 0.25s,
so **neither cut has a hole in it that the picture has to fill** — unlike E003.8, which
deliberately held a 1.2s pause open for a meme card in both locales.

Three pauses in the two cuts are doing comedic work rather than sitting there, and none
should be closed in the edit: en-US 0.174s between "And also..." and "Sorry.", then the
en-US cut's longest pause at 0.234s immediately after "Sorry." before the story starts; and
in zh-CN the cut's longest at 0.248s inside the bug-number-one beat, between 好 and
第一个 Bug 已经找到.

### Level, and the two locales landing 1.4 LU apart

The delivery stage introduced on E004 carries forward: one constant broadband gain on the
finished cut, derived as `DELIVERY_TP(-1.0) − max(truepeak(voice), truepeak(mix))`.

```
                     en-US                        zh-CN
master (mono)   -21.2 LUFS / -1.6 dBTP       -22.6 LUFS / -1.0 dBTP
_review.mp3     -18.4 LUFS / -1.9 dBTP       -19.9 LUFS / -1.2 dBTP
_review-mix.mp3 -18.2 LUFS / -1.3 dBTP       -19.6 LUFS / -1.2 dBTP
```

Two things in that table are worth explaining rather than filing:

**The en-US master sits at -1.6 dBTP, not -1.0.** The gain is referenced to whichever of the
two outputs peaks higher, so that the voice sits at the same level in the master and in the
mix. In en-US the bed pushed the mix 0.6 dB above the voice, so the mix got -1.0 and the
voice master landed 0.6 dB below it. In zh-CN the voice peaked higher, so it took -1.0
itself. Nothing was clipped in either.

**The siblings land 1.4 LU apart** (-18.2 against -19.6 in the mixes). That is inherent to
targeting a true peak with no limiter: the zh-CN read has the wider crest factor — 21.6 LU
peak-to-loudness in the master against en-US's 19.6 — so at any shared peak ceiling it
delivers less loudness, and no gain can close the difference. Since the platforms normalise
each upload independently this costs nothing in delivery, but if the two ever have to sit in
one timeline they will not match, and matching them would mean gain-riding one of them, which
the no-processing rule does not allow.

Both are ~4 LU under the ~-14 LUFS the short-form platforms normalise to, for the same reason
E004 was: no limiting. The decision recorded there (ship at what pure gain reaches) applies
here unchanged.

### Pure splice — verified twice, and the second test is new

The residual test from E004: align each spliced region back against its own take by
cross-correlation, then subtract.

| | regions | residual | under signal | signal range |
|---|---|---|---|---|
| en-US | 15 | -81.3 to -95.1 dB | 51.6 – 64.5 dB | 5.9 dB |
| zh-CN | 12 | -81.8 to -95.1 dB | 48.7 – 62.2 dB | 5.4 dB |

Every region aligns to an **integer sample offset** — no resampling, no tempo change, no
sub-sample drift. The residual floor is the 16-bit dither auto-editor writes (it outputs
`pcm_s16le`, so every master in this repo is 16-bit content in a 24-bit container), and it
does **not track signal level**, which is what rules out compression, gating and EQ.

The new test is stronger and much simpler. For each region, fit the least-squares scalar `g`
that best maps the take onto the master:

```
en-US  15 regions:  min 9.6999  max 9.7000  spread 0.0001 dB
zh-CN  12 regions:  min 9.3998  max 9.4000  spread 0.0002 dB
```

A single scalar, constant to a ten-thousandth of a decibel across the whole master. That is
not evidence that the delivery gain is a constant — it is a **measurement of the constant**,
and it simultaneously rules out anything frequency- or level-dependent anywhere in the chain,
because no such process could leave a flat scalar behind. This should be the house purity
check from here; it replaces both the octave-band test (confounded by gate populations) and
the bit-exact test (defeated by 16-bit dither).

### Music bed — disco-inferno, and the first bed with no runway at all

`50-cent-disco-inferno.mp3`. Placement follows the rule set on E003.8 and generalised on
E004: **the bed's downbeat lands on the first word of the second script sentence**, so the
hook plays dry and the beat arrives under the line that follows it.

```
OFFSET = SENT2 − BED_ENTRY      (delay when positive, seek when negative)
en-US:  2.206 − 0.442 = +1.764s  → delayed 1764 ms
zh-CN:  2.117 − 0.442 = +1.675s  → delayed 1675 ms
```

`BED_ENTRY = 0.442s`, measured not chosen: 0.43s of dither floor at -85 dB, a 7 ms pickup at
-27.7 dB from 0.435s, then -19.4 to -9.3 dB inside one 1 ms block at 0.442s and full level
(-0.8 dB) three milliseconds after that. riders-on-the-storm needed 3.94s to get going and
who-you-foolin 0.33s; this one is playing at full tilt before half a second has passed.

`SENT2` is measured in the finished master, not guessed from the take — build once, measure,
set the constant, rebuild. Both values are the first sustained crossing of the same -34 dB
gate the cut itself uses: en-US 2.206s (the /s/ of "So"), zh-CN 2.117s (为).

Verified by rendering the bed alone through the identical filter chain:

```
en-US   first non-zero sample 1.9007s   2.201s -57.3 dB → 2.206s -38.9 dB → 2.211s -30.0 dB
zh-CN   first non-zero sample 1.8121s   2.112s -58.4 dB → 2.117s -40.0 dB → 2.122s -31.1 dB
```

### What the delay buys that E004's seek did not

On E004 the bed was seeked into, so its own quiet intro played under the hook — audible only
in the sense that a -71.8 dBFS signal is present. Here the bed is **delayed**, which means
`adelay` writes literal digital silence ahead of it. The hook is not quiet; it is empty. The
only thing in the bed track before the downbeat is the mp3's own dither floor, arriving
0.3s early at -85 dB and attenuated another 30 dB on top of that: **-49 dB peak, -85 dB RMS
across the whole hook**, roughly 20 dB below the room tone in the voice master. It is not
merely inaudible, it is below the noise it would have to be heard against.

### The bed itself, and what is wrong with it

Two things worth stating plainly.

**It is the loudest and the most clipped bed in the library.** -10.2 LUFS, +2.3 dBTP, with
954 samples sitting at digital full scale. For comparison E003.8 noted riders-on-the-storm as
the first bed in `media/audio/` that was *not* a clipped master at -3.2 dBFS; this is 6.9 LU
louder than that and clipped besides. It does not reach the delivered file — 30 dB of
attenuation sees to that — but the distortion is baked into the source, so a licensed
replacement should not be assumed to sound the same.

**The window used is the best part of it.** 5s RMS across the first 30s runs -10.3 to
-11.3 dB, a 1.0 dB spread. Across the whole 214s the spread is 12.8 dB: the track has three
breakdowns (40–50s, 90–110s, 150–160s) sitting 4 dB down, and it starts fading at 195s. None
of them fall inside the 27.2s / 26.0s actually used, which is luck rather than design — the
bed starts at its own first sample because the downbeat is there, not because that window was
chosen for flatness.

**It is not marked as an instrumental.** No `-instrumental` suffix, unlike eight of the
twelve files in `media/audio/`. whisper returns `[Music]` for all twelve windows across the full
track, which is the same answer the cleared instrumentals give, but that is weak evidence for
a rap record with a hook. See DECIDE 2.

### No script was supplied

This is the first episode in S03 where the operator sent takes and no text. Both scripts in
this directory are **machine transcriptions** (whisper ggml-base and ggml-small, plus
per-clip passes on the disputed spots), aligned against each master's own splice structure —
15 en-US sentences to 15 regions, 12 zh-CN sentences to 12 regions, in order, so the
segmentation is certainly right even where the words are not.

**Four readings in each locale are uncertain and are tabled at the bottom of each script.**
The headline ones: en-US "For 66 comments" against zh-CN's 前66个 ("the FIRST 66") — a
material difference in what is being promised; en-US "Bug number one", which no decode
actually produced (three passes gave But / Back / Black) and which is inferred from context;
zh-CN 南京**飞跳台**, where five decodes agree only on 飞…跳; and 小三角形 against en-US's
"yellow triangle", which are not the same thing on screen.

None of this affects the audio. All of it affects the subtitle pass, and the giveaway terms
affect what the channel is committed to.

### Not carried over from E003 / E003.8 / E004

* No room-tone insert. Neither cut has a pause that needs holding open.
* No graft. The rider is quoted, not recorded — same posture E004 took with the farm owner.
* No `pin_margins`. That existed to fix a graft's frame-snapped margins; with no graft there
  is nothing to pin.
* The gated octave-band purity test is gone for good, replaced by the residual and scalar-fit
  pair above.

## Relationship to the rest of S03

Fourth interstitial, second dual-locale one after E003.8. It does not advance the 100-track
counter and no track is visited.

It is also the shortest episode in S03 by a wide margin — 27s and 26s against E004's 52s and
E003.8's 41s / 45s — and the only one whose subject is the channel itself rather than a place
or a feature. That is the right length for what it is: a milestone, an ask, and an apology.
There is no room in it for a second idea, and it should not acquire one in the edit.

Publishing order matters here. E004 closes on a joke with no ask; this one is almost entirely
ask. **They should not go out on the same day.**

## DECIDE (human)

1. **The four uncertain lines in each script.** Tabled at the bottom of `script.en-US.md` and
   `script.zh-CN.md`. One listen settles all eight. The subtitle pass cannot start without
   them, and "For 66" vs "the first 66" is an operational commitment, not a caption detail.
2. **Is `50-cent-disco-inferno.mp3` actually an instrumental?** Same question still open on
   `gunna-who-you-foolin.mp3`, `california-love.mp3` and `playboi-carti-magnolia.mp3`. Four
   files, one listening session.
3. **The music licence.** Commercial recording, no licence on file, same as every bed in S03.
   Placeholder only. This one is additionally a clipped master, so a licensed replacement
   will not be a drop-in.
4. **Is the giveaway provisioned?** 66 airtime cards is an operational commitment made on
   camera at 3.25s. Nothing in the takes says whether they exist.
5. **The dropouts.** 7 in one take and 18 in the other, recorded the same day. Whatever the
   transfer path is, it is not deterministic, and it has now produced 70 holes across five
   takes. Find it before one lands mid-word.
6. **The rider at the track.** He is described but not named or shown, in a story about his
   phone being wrong. Lower risk than E003's barber or E003.8's DM rider, but it is still
   someone else's Saturday in a video.
7. **Locale parity in the loudness.** The two masters land 1.4 LU apart and that is unfixable
   without processing one of them. Fine for independent uploads; decide now whether anything
   downstream ever puts them side by side.
8. **The slug.** `almost-100-riders-first-bug` is mine, not the operator's, and it is
   refinable exactly once — the naming rules freeze it at `scripting`.
