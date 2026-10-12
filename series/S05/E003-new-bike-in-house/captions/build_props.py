# words.v7time.json (MFA on the v7 voice stem) -> spoken-captions props on the VIDEO's timeline
import json
HERE = __file__.rsplit("/", 1)[0]
W = json.load(open(f"{HERE}/words.v7time.json"))
warp = json.load(open(f"{HERE}/warp.json"))            # measured: video audio runs 1.001937x the v7 stem
to_video = lambda ms: round((ms / 1000 + warp["a_s"] + warp["b"] * ms / 1000) * 1000)
# MFA was given the spoken reading; the caption shows digits (captions.md: digits, not spelled)
DISPLAY = {"四九年": "49年", "二六年": "26年", "两百斤": "200斤", "两米一": "2米1", "voila": "voilà"}
EMPHASIS = {"0:1", "0:3", "1:0", "1:3", "2:0", "3:5", "4:2", "5:3", "6:3", "8:2", "9:1", "10:2",
            "11:6", "12:5", "13:1", "14:6", "15:3", "18:1", "19:0", "20:2"}
rows = []
for si, s in enumerate(W):
    rows.append("\n".join(f"{DISPLAY.get(w['text'], w['text'])}|{to_video(w['startMs'])}|{to_video(w['endMs'])}"
                          + ("|*" if f"{si}:{wi}" in EMPHASIS else "") for wi, w in enumerate(s["words"])))
keys = {f"{si}:{wi}" for si, s in enumerate(W) for wi in range(len(s["words"]))}
assert EMPHASIS <= keys, EMPHASIS - keys
out = {"locale": "zh-CN", "durationSec": 33.43, "script": "\n\n".join(rows)}   # the video's own length
json.dump(out, open(f"{HERE}/../remotion-props/spoken-captions.zh-CN.json", "w"), ensure_ascii=False, indent=2)
for si, s in enumerate(W):
    print(f"{si:2d} " + " ".join(DISPLAY.get(w["text"], w["text"]) + ("*" if f"{si}:{wi}" in EMPHASIS else "") for wi, w in enumerate(s["words"])))
print("last word ends", to_video(W[-1]["toMs"]), "ms on the video timeline")
