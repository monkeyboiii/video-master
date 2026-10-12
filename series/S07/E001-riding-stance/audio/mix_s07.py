import json, numpy as np, soundfile as sf
SR=48000; P=json.load(open("plan.json")); G=json.load(open("bgm-grid.json"))
G0=-12.32        # measured: music-alone at the voice's own loudness (voice -24.83, music 0-56s -12.51 LUFS)
DUCK=11.5        # measured: smallest duck restoring S05E003's consonant-band clarity is 11.07
SWELL_MIN=1.5    # only a pause this long lets the music back up; shorter ones hold the duck (no pumping)
ATT=0.15; REL=0.30
bar=4*G["beat"]; ph=G["phase"]
v,_=sf.read("voice-v1.wav",dtype="float32")
END=ph+26*bar+bar            # fade out across bar 26 of the chorus, ending on bar 27's downbeat
FADE_AT=ph+26*bar
L=int(round(END*SR)); t=np.arange(L)/SR
m,_=sf.read("bgm100.wav",dtype="float32"); m=m[:L]*10**(G0/20)
spans=[[p['on'],p['off']] for p in P]; merged=[spans[0]]
for a,b in spans[1:]:
    if a-merged[-1][1]<SWELL_MIN: merged[-1][1]=b
    else: merged.append([a,b])
lo=10**(-DUCK/20); g=np.ones(L)
def ramp(a,b,x0,x1):
    k=(t>=a)&(t<b); u=(t[k]-a)/(b-a); g[k]=x0+(x1-x0)*(0.5-0.5*np.cos(np.pi*u))
for a,b in merged:
    g[(t>=a)&(t<b+0.15)]=lo; ramp(max(0,a-ATT),a,1,lo); ramp(b+0.15,b+0.15+REL,lo,1)
k=t>=FADE_AT; g[k]*=np.clip(1-(t[k]-FADE_AT)/(END-FADE_AT),0,1)
mix=m*g[:,None]; vv=np.zeros(L,dtype=np.float32); vv[:len(v)]=v; mix=mix+vv[:,None]
sf.write("pre.wav",mix.astype(np.float32),SR,subtype="FLOAT")
print("duck regions:", ", ".join(f"{a:.2f}-{b:.2f}" for a,b in merged), f"| fade {FADE_AT:.2f}-{END:.2f}")
