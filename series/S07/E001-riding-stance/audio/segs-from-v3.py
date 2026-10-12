# auto-editor's --export v3 timeline -> [[start_s, end_s], ...] of the kept pieces (its DECISION only;
# the pieces are rebuilt with fades by lines_cut.py).   segs-from-v3.py cut-35.v3 segs-35.json
import json, sys
v=json.load(open(sys.argv[1])); num,den=map(int,str(v.get("timebase","30/1")).split("/")); fps=num/den
clips=v["a"][0] if "a" in v else v["v"][0]
json.dump(sorted([(c["offset"]/fps,(c["offset"]+c["dur"])/fps) for c in clips]),open(sys.argv[2],"w"))
