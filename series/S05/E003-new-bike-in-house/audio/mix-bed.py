import sys, numpy as np, soundfile as sf
SR=48000
voice, out = sys.argv[1], sys.argv[2]
DUCK_DB=7.5           # measured: smallest broadband duck restoring pre-guitar consonant-band clarity is 7.27
DUCK_IN=(8.47,8.57)   # after the guitar's first gesture (7.89-8.47), inside the dip that runs to 8.88
TAIL=2.2; FADE=1.5; REL=0.30
v,_=sf.read(voice,dtype="float32")
w=20*np.log10(np.sqrt((v[:len(v)//480*480].reshape(-1,480)**2).mean(1))+1e-12)
last=(np.where(w>-40)[0][-1]+1)*0.01          # end of 你想干嘛
L=int(round((len(v)/SR+TAIL)*SR)); t=np.arange(L)/SR
m,_=sf.read("ACDC_-_TNT_Instrumental.wav",dtype="float32"); m=m[:L]*10**(-14/20)
g=np.ones(L,dtype=np.float32); lo=10**(-DUCK_DB/20)
def ramp(a,b,frm,to):  # raised-cosine between two gains
    k=(t>=a)&(t<b); x=(t[k]-a)/(b-a); g[k]=frm+(to-frm)*(0.5-0.5*np.cos(np.pi*x))
ramp(*DUCK_IN,1,lo); g[(t>=DUCK_IN[1])&(t<last)]=lo; ramp(last,last+REL,lo,1)
fst=L/SR-FADE; k=t>=fst; g[k]*=np.clip(1-(t[k]-fst)/FADE,0,1)   # same linear 1.5s fade-out as before
m=m*g[:,None]
vv=np.zeros(L,dtype=np.float32); vv[:len(v)]=v
sf.write(out,m+vv[:,None],SR,subtype="FLOAT")
print(f"{out}: duck {DUCK_DB}dB {DUCK_IN[0]}-{DUCK_IN[1]} -> held to {last:.2f}, back up by {last+REL:.2f}, fade {fst:.2f}-{L/SR:.2f}")
