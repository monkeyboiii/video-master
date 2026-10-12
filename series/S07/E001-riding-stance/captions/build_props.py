# zh word timing: MFA on the delivered voice stem (required by /video-captions); the hook is three MFA sentences,
# one per phrase, since a guitar chord sits between each. en word timing: Kokoro's own token timestamps (the
# synthesiser knows; MFA's mandarin dict cannot align English). One row is not spoken: the on-screen callout
# the pop lands with (audio/mix-bed.py), held until 第一步.
import json
H="/".join(__file__.split("/")[:-1]) or "."
A=f"{H}/../audio"
W=json.load(open(f"{H}/words.mfa.json")); P={p['i']:p for p in json.load(open(f"{A}/plan.json"))}
LC={l['i']:l for l in json.load(open(f"{A}/lines-cut.json"))}; D=json.load(open(f"{A}/offset.json"))["bed_offset"]
LAT=0.005                                   # alimiter look-ahead in the delivered files
POP=round(json.load(open(f"{A}/sfx.json"))["pop_at"]*1000)
CALLOUT="99%的人都不知道"
LINE=[0,0,0]+list(range(1,17))              # MFA sentence -> script line (lines.tsv)
DISPLAY={"三个":"3个"}
NBSP=" "                               # zh lays words out with no gap; a plain trailing space collapses
EMPH=[["3个"],["小电驴"],["越野摩托车手"],["第一步","脚"],["舒服"],["前脚掌","脚踝","颠簸"],["内扣","腿","死拽"],
      ["fantastic!"],["第二步","手部"],["一两根","前刹","离合"],["手肘","微弯","空间"],["Nice,","track!"],
      ["第三步","上半身"],["髋部","前倾"],["对齐","前方"],["给油","甩"],["Beautiful!"],["等下","真的"],["关注","翘头"]]
assert len(W)==len(LINE)==len(EMPH)
rows=[]
for si,s in enumerate(W):
    li=LINE[si]
    if LC[li]['loc']=='en':
        src=LC[li]['text'].split(); kw=LC[li]['words_local']; assert len(src)==len(kw),(src,kw)
        place=D+P[li]['place']
        ws=[(t+(NBSP if k<len(src)-1 else ""),round((place+a+LAT)*1000),round((place+b+LAT)*1000)) for k,(t,(_,a,b)) in enumerate(zip(src,kw))]
    else:
        ws=[(DISPLAY.get(x['text'],x['text']),x['startMs'],x['endMs']) for x in s['words']]
    marks=set(EMPH[si]); hit={t.rstrip(NBSP) for t,_,_ in ws}&marks
    assert hit==marks,(si,marks-hit)
    rows.append("\n".join(f"{t}|{a}|{b}"+("|*" if t.rstrip(NBSP) in marks else "") for t,a,b in ws))
    if si==2:
        nxt=W[3]['words'][0]['startMs']; assert POP>ws[-1][2] and nxt-POP>1500,(POP,ws[-1][2],nxt)
        rows.append(f"{CALLOUT}|{POP}|{nxt}|*")
out={"locale":"zh-CN","durationSec":58.30,"script":"\n\n".join(rows)}
json.dump(out,open(f"{H}/../remotion-props/spoken-captions.zh-CN.json","w"),ensure_ascii=False,indent=2)
for r in rows: print(" ".join(l.split("|")[0].replace(NBSP,"␣")+("*" if l.endswith("|*") else "") for l in r.split("\n")))
