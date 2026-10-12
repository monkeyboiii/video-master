# The 99% callout: plain text mid-frame — the operator's "instagram style, not karaoke" — from the pop
# (audio/sfx.json) to the frame 第一步's caption appears, composited onto the caption track so the edit gets one
# overlay. White, the captions' Noto Sans SC at 600 (closer to Instagram's Classic than the captions' 800), a soft
# shadow instead of the captions' stroke. The two layers do not overlap (mid-frame vs the bottom band), so
# alpha-over is: colour by overlay, alpha by screen (a + b - ab).
#   callout.py TRACK.mov OUT.mov FONTS_DIR     (FONTS_DIR: packages/remotion-graphics/public/fonts)
import json, subprocess, sys
H="/".join(__file__.split("/")[:-1]) or "."
TRACK,OUT,FONTS=sys.argv[1:4]
TEXT="99%的人都不知道"; FPS=30
pop=json.load(open(f"{H}/../audio/sfx.json"))["pop_at"]
step1=json.load(open(f"{H}/words.mfa.json"))[3]['words'][0]['startMs']/1000
a=int(pop*FPS); b=round(step1*FPS)-1          # the frame holding the pop .. the last before 第一步's
open("callout.txt","w").write(TEXT)
subprocess.run(["ffmpeg","-y","-nostdin","-v","error","-f","lavfi","-i","color=c=black@0.0:s=1080x1920,format=rgba","-vf",
    f"drawtext=fontfile={FONTS}/noto-sans-sc-600.woff2:textfile=callout.txt:expansion=none:fontsize=84:fontcolor=white:"
    "x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.45:shadowx=0:shadowy=4","-frames:v","1","callout.png"],check=True)
on=f"between(n,{a},{b})"
subprocess.run(["ffmpeg","-y","-nostdin","-v","error","-i",TRACK,"-loop","1","-framerate",str(FPS),"-i","callout.png",
    "-filter_complex",
    "[0:v]format=yuva444p12le,split[m][ma0];[ma0]alphaextract[ma];[1:v]format=yuva444p12le,split[t][ta0];[ta0]alphaextract[ta];"
    f"[m][t]overlay=format=yuv444p10:shortest=1:enable='{on}'[c];[ma][ta]blend=all_mode=screen:shortest=1:enable='{on}'[al];"
    "[c][al]alphamerge,format=yuva444p10le[v]",
    "-map","[v]","-map","0:a?","-c:a","copy","-c:v","prores_ks","-profile:v","4444","-pix_fmt","yuva444p10le",OUT],check=True)
print(f"{TEXT} on frames {a}-{b} ({a/FPS:.3f}-{(b+1)/FPS:.3f}s) -> {OUT}")
