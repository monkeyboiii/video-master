# The operator's ad-hoc lift: 得使用前脚掌踩住脚踏 and 让脚踝能够上下活动 sat over the ankle they describe, so while
# they are up the track moves up to the frame's vertical centre — 494px puts the line's ink (y 1418-1489 on the
# track) about 960. Every other line stays where the track puts it.
#   lift.py TRACK.mov OUT.mov
import json, math, subprocess, sys
H="/".join(__file__.split("/")[:-1]) or "."
TRACK,OUT=sys.argv[1:3]
LIFT=494; FIRST,LAST="得使用前脚掌踩住脚踏","让脚踝能够上下活动"; FPS=30
rows=[[r for r in b.split("\n") if not r.startswith(">")] for b in
      json.load(open(f"{H}/../remotion-props/spoken-captions.zh-CN.json"))["script"].split("\n\n")]
text=["".join(r.split("|")[0] for r in b) for b in rows]
i=text.index(FIRST); assert text[i+1]==LAST
frame=lambda b: math.floor(int(rows[b][0].split("|")[1])/1000*FPS+0.5)   # Math.round, as the track's
a,b=frame(i),frame(i+2)                     # FIRST's first frame .. the frame the next line takes over
subprocess.run(["ffmpeg","-y","-nostdin","-v","error","-i",TRACK,"-vf",
    f"pad=iw:ih+{LIFT}:0:0:color=black@0.0,crop=iw:ih-{LIFT}:0:'if(between(n,{a},{b-1}),{LIFT},0)'",
    "-map","0:v","-map","0:a?","-c:a","copy","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",OUT],check=True)
print(f"{FIRST} / {LAST} up {LIFT}px on frames {a}-{b-1} ({a/FPS:.3f}-{b/FPS:.3f}s) -> {OUT}")
