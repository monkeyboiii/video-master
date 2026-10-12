import json, os, sys, numpy as np, soundfile as sf
SR=48000
src=sys.argv[1]; out=sys.argv[2]
TTS_ONSET=0.534     # v5's 0.784 minus 0.25: the whole voice moves 0.25s earlier against the music
QGAP=0.25; WO_GAP=1.00
GUITAR=7.89         # measured: riff enters out of the intro's break (flux peak 7.90, break 7.62-7.86)
JURAN=8.50          # measured: dip after the guitar's first gesture (7.89-8.47), before the 8.90 hit
XX_LATER=1.00       # operator: 你想干嘛 pushed 1s back, room for the video cut before it
def fade(x,ms=8):
    n=min(int(SR*ms/1000),len(x)//2); r=np.linspace(0,1,n,dtype=np.float32); x=x.copy(); x[:n]*=r; x[-n:]*=r[::-1]; return x
def bounds(x,thr=-40):
    w=int(0.010*SR); n=len(x)//w; r=20*np.log10(np.sqrt((x[:n*w].reshape(n,w)**2).mean(1))+1e-12)
    on=[i for i,v in enumerate(r) if v>thr]; return on[0]*w/SR,(on[-1]+1)*w/SR
def trim(x):
    s,e=bounds(x); a=int(max(0,s-0.01)*SR); b=int((e+0.01)*SR); return fade(x[a:b]),0.01
take,_=sf.read(src,dtype="float32"); segs=json.load(open(os.path.join(os.path.dirname(__file__),"cut-segments.json")))  # auto-editor -40dB, margin 0.08s,0.09s
pieces=[fade(take[int(round(a*SR)):int(round(b*SR))]) for a,b in segs]
# match your take to the TTS reference (-24.03 LUFS); gain measured on the pieces actually used
import subprocess
sf.write("_lufs.wav",np.concatenate(pieces[:17]),SR)
I=float(subprocess.run(["ffmpeg","-i","_lufs.wav","-af","loudnorm=print_format=json","-f","null","-"],capture_output=True,text=True).stderr.split('"input_i" : "')[1].split('"')[0])
g=10**((-24.03-I)/20); P=[p*g for p in pieces]
tts49,p=trim(sf.read("tts-49er-48k.wav",dtype="float32")[0])
ttsxx,_=trim(sf.read("tts-ganma-xx-48k.wav",dtype="float32")[0]*10**((-24.03+19.02)/20))
place=[]; t=TTS_ONSET-p; place.append((tts49,t)); tts_end=t+len(tts49)/SR-p
onA,offA=bounds(pieces[0]); a0=tts_end+QGAP-onA; place.append((P[0],a0)); hy_end=a0+offA
on2,off2=bounds(pieces[1]); a2=hy_end+WO_GAP-on2; place.append((P[1],a2)); phrase_end=a2+off2
on3=bounds(pieces[2])[0]; pos=JURAN-on3
for x in P[2:17]: place.append((x,pos)); pos+=len(x)/SR
on18=bounds(pieces[17])[0]; tx=pos+on18-0.01+XX_LATER; voila_end=pos; place.append((ttsxx,tx)); end=tx+len(ttsxx)/SR
assert phrase_end < GUITAR-0.15, phrase_end
tr=np.zeros(int(round(end*SR))+1,dtype=np.float32)
for x,tt in place: i=int(round(tt*SR)); tr[i:i+len(x)]+=x
sf.write(out,tr,SR,subtype="FLOAT")
print(json.dumps({"out":out,"take_lufs":I,"take_gain_db":round(-24.03-I,2),"tts49":[round(TTS_ONSET,3),round(tts_end,3)],
 "26nian_on":round(a0+onA,3),"huanyou_end":round(hy_end,3),"wo_on":round(a2+on2,3),"gap":round(a2+on2-hy_end,3),
 "phrase_end":round(phrase_end,3),"guitar":GUITAR,"clear_before_guitar":round(GUITAR-phrase_end,3),"juran_on":JURAN,"voila_end":round(voila_end,3),"xx_on":round(tx+0.01,3),"end":round(end,3)}))
