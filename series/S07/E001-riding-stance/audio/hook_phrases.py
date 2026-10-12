# The hook as three separately synthesised phrases (Kokoro zm_yunxi), one per gap in the intro riff
# (edit-notes.md § Placement on the bed): the first at the take's own 1.15 — it plays before the bed comes in —
# the other two at the slowest speed that fits between two chords. Writes hook0-24k.wav..hook2-24k.wav.
import numpy as np, soundfile as sf
from kokoro import KPipeline
SR=24000
P=[("跟我学会这三个技巧，",1.15),("直接从小电驴骑士，",1.22),("变成越野摩托车手！",1.30)]
zh=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M'); g2p=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M',model=False)
def trim(a,thr=-45):
    w=240; n=len(a)//w; r=20*np.log10(np.sqrt((a[:n*w].reshape(n,w)**2).mean(1))+1e-12); on=np.where(r>thr)[0]
    s=max(0,on[0]*w-240); e=min(len(a),(on[-1]+1)*w+240); y=a[s:e].copy(); k=int(0.008*SR); y[:k]*=np.linspace(0,1,k); y[-k:]*=np.linspace(1,0,k); return y
for i,(t,sp) in enumerate(P):
    ph=''.join(r.phonemes for r in g2p(t))
    y=trim(np.concatenate([r.audio.numpy() for r in zh.generate_from_tokens(ph,voice='zm_yunxi',speed=sp)]))
    sf.write(f"hook{i}-24k.wav",y,SR,subtype="FLOAT"); print(f"{t} at {sp}: {len(y)/SR:.2f}s")
