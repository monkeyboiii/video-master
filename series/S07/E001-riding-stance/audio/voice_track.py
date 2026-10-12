import json, numpy as np, soundfile as sf
SR=48000; P=json.load(open("plan.json"))
end=max(p['place']+sf.info(p['file']).frames/SR for p in P)
v=np.zeros(int(round((end+0.05)*SR)),dtype=np.float32)
for p in P:
    y,_=sf.read(p['file'],dtype="float32"); k=int(round(p['place']*SR)); v[k:k+len(y)]+=y
sf.write("voice-v1.wav",v,SR,subtype="FLOAT"); print(f"voice-v1.wav {len(v)/SR:.2f}s")
