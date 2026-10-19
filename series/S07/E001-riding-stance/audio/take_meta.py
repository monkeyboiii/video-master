# The operator's take (lines 1-17; the hook stays TTS) -> take-meta.json, the shape the TTS stand-in's take had,
# so lines_cut.py and everything after it run unchanged. take-lines.json is measured on the take:
# each line's first and last 10 ms above -40 dB (MFA put the line edges within ~0.2s of these everywhere except
# around the English, where its OOV placeholder took too little time), and the English words' times, which MFA's
# mandarin model cannot give: whisper's DTW word split corrected to the energy dips between words.
import json
T=json.load(open("take-lines.json")); lines=[l.rstrip('\n').split('\t') for l in open('lines.tsv')]
PRE,POST=0.05,0.10                          # inside every between-line silence (>=0.33s, 16->17) with lines_cut's 0.09 each side
meta=[]
for i,a,b in T["lines"]:
    loc,text=lines[i]; s=a-PRE; w=T["en_words"].get(str(i))
    meta.append({"i":i,"loc":loc,"text":text,"start":round(s,4),"dur":round(b+POST-s,4),
                 "words":[[t,round(x-s,4),round(y-s,4)] for t,x,y in w] if w else None})
json.dump(meta,open("take-meta.json","w"),ensure_ascii=False,indent=1)
print(f"{len(meta)} lines, {sum(m['dur'] for m in meta):.2f}s of the take")
