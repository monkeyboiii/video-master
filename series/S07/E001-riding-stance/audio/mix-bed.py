# v3, the operator's design ("just as we did for previous time", S05E003): the intro riff keeps its
# volume; when the drums kick in the bed drops ONCE to a flat level and stays there — no ducking swells.
import json, numpy as np, soundfile as sf
SR=48000; G=json.load(open("bgm-grid.json")); L3=json.load(open("levels.json"))
INTRO=L3["intro_gain"]; FLAT=L3["flat_gain"]
DROP=(8.40,8.75)            # inside the riff's near-silent tail (8.0-8.75s at -41..-59 dB), before the drums at 8.79
bar=4*G["beat"]; ph=G["phase"]
v,_=sf.read("voice.wav",dtype="float32")
END=ph+27*bar; FADE_AT=ph+26*bar
L=int(round(END*SR)); t=np.arange(L)/SR
m,_=sf.read("bgm100.wav",dtype="float32"); m=m[:L]
gdb=np.full(L,FLAT); gdb[t<DROP[0]]=INTRO
k=(t>=DROP[0])&(t<DROP[1]); u=(t[k]-DROP[0])/(DROP[1]-DROP[0]); gdb[k]=INTRO+(FLAT-INTRO)*(0.5-0.5*np.cos(np.pi*u))
g=10**(gdb/20); k=t>=FADE_AT; g[k]*=np.clip(1-(t[k]-FADE_AT)/(END-FADE_AT),0,1)
vv=np.zeros(L,dtype=np.float32); vv[:len(v)]=v
sf.write("pre.wav",(m*g[:,None]+vv[:,None]).astype(np.float32),SR,subtype="FLOAT")
print(f"intro {INTRO:.2f} dB -> flat {FLAT:.2f} dB over {DROP[0]}-{DROP[1]}s, fade {FADE_AT:.2f}-{END:.2f}")
