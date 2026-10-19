# zh word timing: MFA on the delivered voice stem (required by /video-captions); the hook is three MFA sentences,
# one per phrase, since a guitar chord sits between each; MFA lost its place after the Nice! placeholder, so 第三步 to
# 前方 were aligned again on their own window (edit-notes.md). en word timing: the take's, measured in
# audio/take-lines.json and carried through the cut (MFA's mandarin dict cannot align English). The riff's run before 第一步 has no words: its
# caption is ♪ — music, nothing said — from just after the hook to 第一步.
#
# Every cut is made here, at the script's own punctuation, so the track never has to make one: its width split
# cuts where the halves come out equal, which put 让 on the wrong line (…踩住脚踏让 | 脚踝…). Whole clauses are
# packed onto a line while they fit — the fewest lines, earlier ones fullest, so 手肘抬高向外打开保持微弯 stays one
# instruction — and a clause wider than a line by itself is cut by hand (BREAK). No mark where a comma was: a
# space in the line draws the band under nothing. An English aside shows as its zh translation (ZH), one block per
# English sentence, each zh word lit while the English words it renders are said, and the English sentence under it
# as the secondary line — the operator's ask. Per sentence, so 很好 and 看起来 never share a line as 很好看.
import json
H="/".join(__file__.split("/")[:-1]) or "."
A=f"{H}/../audio"
W=json.load(open(f"{H}/words.mfa.json")); P={p['i']:p for p in json.load(open(f"{A}/plan.json"))}
LC={l['i']:l for l in json.load(open(f"{A}/lines-cut.json"))}; D=json.load(open(f"{A}/offset.json"))["bed_offset"]
LAT=0.005                                   # alimiter look-ahead in the delivered files
LINE=[0,0,0]+list(range(1,18))              # MFA sentence -> script line (lines.tsv)
DISPLAY={"三个":"3个"}
MUSIC="\u266a"                              # ♪
PUN="，。！？、；：,.!?"
ROOM_EM=790/(72*0.88)                       # captionRoom at 1080 over burst-captions-zh's size: 12.5 CJK glyphs
BREAK={"用一两根手指随时准备操作前刹和离合":"手指"}   # 17 glyphs; cut after this word
ZH={5:[[("很好",0,0)],[("看起来",1,1),("棒极了",2,2)]],   # zh word, the first and last English word it renders
    9:[[("不错",0,0)],[("上道了",1,6)]],                   # the operator's
    14:[[("漂亮",0,0)]]}
EMPH=[["3个"],["小电驴"],["越野摩托车手"],["第一步","脚"],["舒服"],["前脚掌","脚踝","颠簸"],["内扣","腿","死拽"],
      ["棒极了"],["第二步","手部"],["一两根","前刹","离合"],["手肘","微弯","空间"],["不错","上道了"],
      ["第三步","上半身"],["髋部","前倾"],["对齐","前方"],["给油","甩"],["漂亮"],["等下","对"],["没问题","学会"],
      ["关注","翘头"]]
assert len(W)==len(LINE)==len(EMPH)
em=lambda ws: sum(1 if ord(c)>=0x2E80 else 0.6 for w in ws for c in w[0])
def clauses(ws,text):
    """The sentence's words grouped at the script's punctuation."""
    out=[[]]; i=0
    for w in ws:
        assert text[i:i+len(w[0])]==w[0],(text,i,w[0]); i+=len(w[0]); out[-1].append(w)
        if i<len(text) and text[i] in PUN:
            while i<len(text) and text[i] in PUN: i+=1
            if i<len(text): out.append([])
    assert i==len(text),(text,i)
    return out
def lines(cs):
    out=[]
    for c in cs:
        if em(c)>ROOM_EM:                   # a KeyError here wants a BREAK
            k=[w[0] for w in c].index(BREAK["".join(w[0] for w in c)])+1; out+=[c[:k],c[k:]]
        elif out and em(out[-1]+c)<=ROOM_EM: out[-1]=out[-1]+c
        else: out.append(c)
    return out
blocks=[]; second={}                       # block index -> its secondary line
for si,s in enumerate(W):
    li=LINE[si]; marks=set(EMPH[si])
    if li and LC[li]['loc']=='en':     # the hook (line 0) is TTS, not in the take's cut
        src=LC[li]['text'].split(); kw=LC[li]['words_local']; assert len(src)==len(kw),(src,kw)
        ms=lambda t: round((D+P[li]['place']+t+LAT)*1000)
        bs=[[(z,ms(kw[a][1]),ms(kw[b][2])) for z,a,b in zb] for zb in ZH[li]]
        assert [i for zb in ZH[li] for _,a,b in zb for i in range(a,b+1)]==list(range(len(src))),li
        for zb in ZH[li]: second[len(blocks)+ZH[li].index(zb)]=" ".join(src[zb[0][1]:zb[-1][2]+1])
    else:
        ws=[(DISPLAY.get(x['text'],x['text']),x['startMs'],x['endMs']) for x in s['words']]
        bs=[ws] if si<3 else lines(clauses(ws,LC[li]['text']))
    hit={w[0] for b in bs for w in b}&marks
    assert hit==marks,(si,marks-hit)
    blocks+=[[w+(w[0] in marks,) for w in b] for b in bs]
    if si==2:                               # after 变成越野摩托车手: the hook holds 200 ms (< HOLD_GAP_MS), then ♪
        blocks.append([(MUSIC,ws[-1][2]+200,W[3]['words'][0]['startMs'],False)])
for b in blocks: assert em(b)<=ROOM_EM,("".join(w[0] for w in b),em(b))
out={"locale":"zh-CN","durationSec":json.load(open(f"{A}/sfx.json"))["length"],
     "script":"\n\n".join("\n".join([f"{t}|{a}|{z}"+("|*" if m else "") for t,a,z,m in b]+([">"+second[k]] if k in second else []))
                          for k,b in enumerate(blocks))}
json.dump(out,open(f"{H}/../remotion-props/spoken-captions.zh-CN.json","w"),ensure_ascii=False,indent=2)
for k,b in enumerate(blocks): print(f"{b[0][1]/1000:6.2f}s  {em(b):4.1f}  "+"".join(w[0]+("*" if w[3] else "") for w in b)+(f"  / {second[k]}" if k in second else ""))
