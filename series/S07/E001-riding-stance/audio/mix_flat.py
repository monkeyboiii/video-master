# v2: one static bed level, no ducking (operator: ducking sounded weird). The level is measured:
# the single gain that still gives S05E003's approved consonant clarity over all speech (12.4 dB median).
import json, numpy as np, soundfile as sf
SR=48000; G=json.load(open("bgm-grid.json")); FLAT=json.load(open("flat.json"))["flat_gain"]   # -23.51
bar=4*G["beat"]; ph=G["phase"]
v,_=sf.read("voice.wav",dtype="float32")
END=ph+27*bar; FADE_AT=ph+26*bar             # fade across bar 26 of the chorus, as v1
L=int(round(END*SR)); t=np.arange(L)/SR
m,_=sf.read("bgm100.wav",dtype="float32"); m=m[:L]*10**(FLAT/20)
g=np.ones(L); k=t>=FADE_AT; g[k]=np.clip(1-(t[k]-FADE_AT)/(END-FADE_AT),0,1)
vv=np.zeros(L,dtype=np.float32); vv[:len(v)]=v
sf.write("pre.wav",(m*g[:,None]+vv[:,None]).astype(np.float32),SR,subtype="FLOAT")
print(f"flat bed {FLAT:.2f} dB, fade {FADE_AT:.2f}-{END:.2f}")
