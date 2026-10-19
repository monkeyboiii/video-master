import json, sys, numpy as np, soundfile as sf
SR=48000; G=json.load(open("bgm-grid.json")); L=json.load(open("lines-cut.json"))
beat=G["beat"]; ph=G["phase"]; bar=4*beat
beats=ph+beat*np.arange(0,200); bars=ph+bar*np.arange(0,50); halves=ph+2*beat*np.arange(0,100)
def sb(f):  # speech bounds inside a line file (-40dB, the take's cut threshold; 10ms)
    y,_=sf.read(f,dtype="float32"); w=480; r=20*np.log10(np.sqrt((y[:len(y)//w*w].reshape(-1,w)**2).mean(1))+1e-12)
    on=np.where(r>-40)[0]; return on[0]*0.01,(on[-1]+1)*0.01
ANCHOR=json.loads(sys.argv[1]) if len(sys.argv)>1 else {}
GAP=0.30; HEAD={1,6,10}; EN={5,9,14}
plan=[]; prev_end=None
for l in L:
    a,b=sb(l['file']); i=l['i']
    if str(i) in ANCHOR: on=ANCHOR[str(i)]
    elif prev_end is None: on=bars[0]
    elif i in HEAD:
        on=bars[bars>=prev_end+0.35][0]
        if on-prev_end>1.3: on=halves[halves>=prev_end+0.35][0]
        if on-prev_end>0.9: on=beats[beats>=prev_end+0.35][0]   # v3: still on a beat, just not a strong one
    elif i in EN: on=beats[beats>=prev_end+0.25][0]
    elif i==15 and '16' in ANCHOR: on=beats[beats+(b-a)<=ANCHOR['16']-0.25][-1]
    elif i==15: on=beats[beats>=prev_end+0.5][0]
    else: on=prev_end+GAP
    plan.append({"i":i,"on":round(float(on),3),"off":round(float(on+b-a),3),"place":round(float(on-a),4),"file":l['file'],"text":l['text'],
                 "gap":None if prev_end is None else round(float(on-prev_end),3)})
    prev_end=on+b-a
json.dump(plan,open("plan.json","w"),ensure_ascii=False,indent=1)
def where(t):
    k=int(np.round((t-ph)/beat)); d=(t-(ph+k*beat))*1000; return f"bar {k//4:2d} beat {k%4+1} {d:+5.0f}ms"
for p in plan: print(f"{p['i']:2d} on {p['on']:6.2f} ({where(p['on'])})  off {p['off']:6.2f}  gap {p['gap'] if p['gap'] is not None else '-':>5}  {p['text'][:20]}")
print(f"chorus downbeat {bars[24]:.2f}; voice ends {plan[-1]['off']:.2f}")
