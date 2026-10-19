# The narration on the output clock. The hook's first phrase plays alone from 0.10s; the bed starts D seconds in,
# D set so its first chord lands a comma's pause after that phrase; the from/to phrases each END just before the
# next guitar attack and start wherever their length puts them; lines 1-17 (the operator's take) are plan.json's
# bed-time places + D.
# Writes voice.wav and offset.json.
import json, numpy as np, soundfile as sf
SR=48000
V0=0.10                         # phrase 1's first syllable
CHORD=0.28                      # bed time of the first chord (first 5 ms frame above -50 dBFS)
GAP=0.25                        # phrase 1's last syllable -> that chord
ENDS=[2.40,4.55]                # bed time: chord 2's attack, then the 4.56s hit; the from/to phrases end here
HOOK_GAIN_DB=-1.67              # set when the hook was split: the phrases gain-matched to the one-sentence hook
                                # (line00, -25.75 LUFS); kept since, so the opening's level does not move
TAKE_GAIN_DB=4.09               # the take's lines up to the stand-in's they replace (-28.94 -> -24.85 LUFS), the
                                # level the hook's gain and the intro riff's were set against
P=[p for p in json.load(open("plan.json")) if p['i']!=0]
def bounds(y):
    w=480; r=20*np.log10(np.sqrt((y[:len(y)//w*w].reshape(-1,w)**2).mean(1))+1e-12); on=np.where(r>-35)[0]; return on[0]*0.01,(on[-1]+1)*0.01
hooks=[sf.read(f"hook{i}.wav",dtype="float32")[0] for i in range(3)]   # bounds measured before the gain
s,e=bounds(hooks[0]); D=round(V0+(e-s)+GAP-CHORD,3)
end=D+max(p['place']+sf.info(p['file']).frames/SR for p in P)
v=np.zeros(int(round((end+0.05)*SR)),dtype=np.float32)
for i,y in enumerate(hooks):
    s,e=bounds(y); on=V0 if i==0 else D+ENDS[i-1]-(e-s)
    k=int(round((on-s)*SR)); v[k:k+len(y)]+=y*10**(HOOK_GAIN_DB/20); print(f"  hook {i}: {on:.2f}-{on+e-s:.2f}s")
for p in P:
    y,_=sf.read(p['file'],dtype="float32"); k=int(round((D+p['place'])*SR)); v[k:k+len(y)]+=y*10**(TAKE_GAIN_DB/20)
sf.write("voice.wav",v,SR,subtype="FLOAT"); json.dump({"bed_offset":D},open("offset.json","w"))
print(f"voice.wav {len(v)/SR:.2f}s, the bed from {D:.3f}s")
