# auto-editor's -35dB decision -> per-line audio, every kept piece faded 8ms (skill lesson 1),
# pieces of one line butted (its comma pauses tightened); line timings mapped for en words.
#   lines_cut.py SEGS.json THRESHOLD_DB     (auto-editor's decision and the threshold it was made at)
import json, sys, numpy as np, soundfile as sf
x,SR=sf.read("take48.wav",dtype="float32"); segs=json.load(open(sys.argv[1])); THR=float(sys.argv[2]); meta=json.load(open("take-meta.json"))
def fade(y,ms=8):
    n=min(int(SR*ms/1000),len(y)//2); r=np.linspace(0,1,n,dtype=np.float32); y=y.copy(); y[:n]*=r; y[-n:]*=r[::-1]; return y
out=[]
for l in meta:
    a0,a1=l['start'],l['start']+l['dur']
    ps=[(max(a,a0-0.09),min(b,a1+0.09)) for a,b in segs if b>a0 and a<a1]   # pieces overlapping this line
    audio=[]; tmap=[]; pos=0.0
    for a,b in ps:
        y=fade(x[int(round(a*SR)):int(round(b*SR))]); audio.append(y); tmap.append((a,b,pos)); pos+=len(y)/SR
    y=np.concatenate(audio); sf.write(f"line{l['i']:02d}.wav",y,SR,subtype="FLOAT")
    def m(t):  # take time -> line-local time
        for a,b,p in tmap:
            if a<=t<=b: return p+(t-a)
        if t>tmap[-1][1]: return pos            # Kokoro's last-word end runs past the trimmed audio: clamp to the line's end
        if t<tmap[0][0]: return 0.0
        return next(p for a,b,p in tmap if t<a)   # inside a removed pause: snap to the next kept piece
    w=None
    if l['words']: w=[[tx,round(m(l['start']+s),4),round(m(l['start']+e),4)] for tx,s,e in l['words']]
    out.append({**l,"file":f"line{l['i']:02d}.wav","len":round(pos,4),"pieces":len(ps),"words_local":w})
json.dump(out,open("lines-cut.json","w"),ensure_ascii=False,indent=1)
raw=sum(l['dur'] for l in meta); cut=sum(o['len'] for o in out)
# speech preserved: threshold-consistent count (skill lesson 3)
def speech(y,thr=THR):
    w=int(0.01*SR); r=20*np.log10(np.sqrt((y[:len(y)//w*w].reshape(-1,w)**2).mean(1))+1e-12); return (r>thr).sum()*0.01
print(f"lines raw {raw:.2f}s -> cut {cut:.2f}s; speech above {THR:.0f}dB: take {speech(x):.2f}s, lines {sum(speech(sf.read(o['file'],dtype='float32')[0]) for o in out):.2f}s")
for o in out: print(f"  {o['i']:2d} {o['len']:5.2f}s ({o['pieces']} piece{'s' if o['pieces']>1 else ''})  {o['text'][:24]}")
