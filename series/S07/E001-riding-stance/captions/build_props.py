# zh word timing: MFA on the delivered voice stem (required by /video-captions).
# en word timing: Kokoro's own token timestamps (the synthesiser knows; MFA's mandarin dict cannot align English).
import json
H="/".join(__file__.split("/")[:-1]) or "."
W=json.load(open(f"{H}/words.mfa.json")); P=json.load(open(f"{H}/../audio/plan.json")); LC={l['i']:l for l in json.load(open(f"{H}/../audio/lines-cut.json"))}
LAT=0.005                                   # alimiter look-ahead in the delivered files
DISPLAY={"三个":"3个"}
NBSP=" "                               # zh lays words out with no gap; a plain trailing space collapses
EMPH={0:["3个","越野摩托车手"],1:["第一步","脚"],2:["舒服"],3:["前脚掌","脚踝","颠簸"],4:["内扣","腿","死拽"],
      5:["fantastic!"],6:["第二步","手部"],7:["一两根","前刹","离合"],8:["手肘","微弯","空间"],9:["Nice,","track!"],
      10:["第三步","上半身"],11:["髋部","前倾"],12:["对齐","前方"],13:["给油","甩"],14:["Beautiful!"],15:["等下","真的"],16:["关注","翘头"]}
rows=[]
for si,s in enumerate(W):
    if LC[si]['loc']=='en':
        src=LC[si]['text'].split(); kw=LC[si]['words_local']; assert len(src)==len(kw),(src,kw)
        place=next(p['place'] for p in P if p['i']==si)
        ws=[(t+(NBSP if k<len(src)-1 else ""),round((place+a+LAT)*1000),round((place+b+LAT)*1000)) for k,(t,(_,a,b)) in enumerate(zip(src,kw))]
    else:
        ws=[(DISPLAY.get(x['text'],x['text']),x['startMs'],x['endMs']) for x in s['words']]
    for t,_,_ in ws: pass
    marks=set(EMPH.get(si,[])); hit={t.rstrip(NBSP) for t,_,_ in ws}&marks
    assert hit==marks,(si,marks-hit)
    rows.append("\n".join(f"{t}|{a}|{b}"+("|*" if t.rstrip(NBSP) in marks else "") for t,a,b in ws))
out={"locale":"zh-CN","durationSec":56.79,"script":"\n\n".join(rows)}
json.dump(out,open(f"{H}/../remotion-props/spoken-captions.zh-CN.json","w"),ensure_ascii=False,indent=2)
for r in rows: print(" ".join(l.split("|")[0].replace(NBSP,"␣")+("*" if l.endswith("|*") else "") for l in r.split("\n")))
