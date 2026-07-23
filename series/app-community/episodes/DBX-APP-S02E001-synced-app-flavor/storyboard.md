# Storyboard & Shot Plan — DBX-APP-S02E001

Source is already shot and music-synced (`media/DBX-APP-S02E001/footage/01_synced.MP4`). This storyboard records the touch-up overlay plan against the existing hard-cut timeline.

## Shot-by-shot breakdown

| SH | Beat | Frame / composition | Action | Transition in | Caption / overlay | SFX intent | Camera token |
|----|------|---------------------|--------|---------------|-------------------|------------|--------------|
| SH010 | hook-x-callouts | opening pointing stills | three balanced orange Xs ramp from tiny to large close to the fingertip, then the fourth still switches to the larger balanced DirtBikeX wordmark and clears before the next scene | source hard cuts | orange-X-64/136/228-balanced + DirtBikeX-500-balanced | embedded music only | synced |
| SH020 | gear-up | helmet / gear transition montage | no extra overlay; preserve music-cut cadence | source hard cuts | - | embedded music only | synced |
| SH030 | first-walk-feature | side walking shot | feature overlay from S01E002 appears only within the walk window | hard cut @10.55 | feature-phones-built-it | embedded music only | synced |
| SH040 | second-walk-logo | front walking shot | balanced DirtBikeX wordmark stays above helmet/head and changes placement across the zoom-state cut | hard cut @14.033; zoom-state cut @15.400 | DirtBikeX-560-balanced + DirtBikeX-460-balanced | embedded music only | synced |
| SH050 | rubio-profile | arms crossed | Rubio profile-card holds through the identity pose and fades only during the transition blur | hard cut @16.883; fade @18.800-19.200 | profile-card | embedded music only | synced |
| SH060 | app-icon-point | pointing up | balanced rounded iOS-style AppIcon card fades in at a fixed lower position near the pointing hand, then export trims before black | transition blur into icon beat; black @22.55 | AppIcon-ios-card-balanced.png | embedded music only | synced |

## Post-shoot

- [x] Source copied into episode media bundle as `01_synced.MP4`.
- [x] Static assets copied into `media/DBX-APP-S02E001/assets/` and `packages/remotion-graphics/public/e201/`.
- [x] S01E002 overlays copied into `media/DBX-APP-S02E001/overlays/` with S02E001 filenames.
- [x] Hard-cut boundaries detected with `ffmpeg` scene/blackdetect and recorded in `edit-notes.md`.
- [x] Derived PNG assets generated for deterministic ffmpeg compositing and recorded in `manifest.yml`.
