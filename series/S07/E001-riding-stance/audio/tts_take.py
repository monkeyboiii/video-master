# Narrate every line (TTS stand-in for the operator's take), as one continuous "take" with
# human-ish pauses, so the auto-editor -> BGM-alignment steps are the ones the real take will use.
import json, numpy as np, soundfile as sf
from kokoro import KPipeline
SR=24000
FIX={  # measured wrong in misaki's output for this script, corrected at the phoneme level
 3:[("tɤ↗jʊ↘ŋ","tei↓jʊ↘ŋ")],          # 得用: děi, not dé
 4:[("ꭧwai→","ꭧwai↘")],                # 死拽: zhuài, not zhuāi
 7:[("i→lja↓ŋkə→n","i↘lja↓ŋkə→n")],    # 一两根: yì (sandhi)
 16:[("ɕja↘ i→ʨi↗","ɕja↘ i↘ʨi↗")],     # 下一集: yì (sandhi)
}
zh=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M'); g2p=KPipeline(lang_code='z',repo_id='hexgrad/Kokoro-82M',model=False); en=KPipeline(lang_code='a',repo_id='hexgrad/Kokoro-82M')
def bounds(x,thr=-45):
    w=int(0.01*SR); n=len(x)//w; r=20*np.log10(np.sqrt((x[:n*w].reshape(n,w)**2).mean(1))+1e-12)
    on=np.where(r>thr)[0]; return on[0]*w, (on[-1]+1)*w
take=[]; meta=[]; t=0.5
lines=[l.rstrip('\n').split('\t') for l in open('lines.tsv')]
for i,(loc,text) in enumerate(lines):
    if loc=='zh':
        ph=''.join(r.phonemes for r in g2p(text))
        for a,b in FIX.get(i,[]):
            assert a in ph,(i,a); ph=ph.replace(a,b)
        audio=np.concatenate([r.audio.numpy() for r in zh.generate_from_tokens(ph,voice='zm_yunxi',speed=1.15)])
        words=None
    else:
        rs=list(en(text,voice='am_michael',speed=1.1)); audio=np.concatenate([r.audio.numpy() for r in rs])
        words=[]; off=0.0
        for r in rs:
            for tk in r.tokens:
                if tk.start_ts is not None and any(c.isalpha() for c in tk.text):
                    words.append([tk.text+(tk.whitespace and ' ' or ''),off+tk.start_ts,off+tk.end_ts])
            off+=len(r.audio)/SR
    a,b=bounds(audio); a=max(0,a-int(0.01*SR)); b=min(len(audio),b+int(0.01*SR))
    seg=audio[a:b].copy(); n=int(0.008*SR); seg[:n]*=np.linspace(0,1,n); seg[-n:]*=np.linspace(1,0,n)
    if words: words=[[w,s-a/SR,e-a/SR] for w,s,e in words]
    meta.append({"i":i,"loc":loc,"text":text,"start":round(t,4),"dur":round(len(seg)/SR,4),"words":words})
    take.append((t,seg)); t+=len(seg)/SR+(1.0 if i+1<len(lines) and lines[i+1][1].startswith('第') else 0.7)
out=np.zeros(int((t+0.5)*SR),dtype=np.float32)
for s,seg in take: k=int(round(s*SR)); out[k:k+len(seg)]+=seg
sf.write("take-tts-24k.wav",out,SR,subtype="FLOAT"); json.dump(meta,open("take-meta.json","w"),ensure_ascii=False,indent=1)
for m in meta: print(f"{m['i']:2d} {m['loc']} {m['start']:6.2f} +{m['dur']:5.2f}s  {m['text']}")
print(f"take {len(out)/SR:.2f}s, speech {sum(m['dur'] for m in meta):.2f}s")
