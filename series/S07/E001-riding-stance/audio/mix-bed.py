# The operator's design ("just as we did for previous time", S05E003): the intro riff keeps its volume; when the
# drums kick in the bed drops ONCE to a flat level — no ducking swells under speech — and once the last word is
# out it comes back to full. The bed starts offset.json's D seconds in. A pop lands with the on-screen callout in
# the riff before 第一步. Writes pre.wav and sfx.json (the pop's output time and the mix's length, for the captions).
import json, numpy as np, soundfile as sf, subprocess
SR=48000; G=json.load(open("bgm-grid.json")); L3=json.load(open("levels.json")); D=json.load(open("offset.json"))["bed_offset"]
INTRO=L3["intro_gain"]; FLAT=L3["flat_gain"]; beat=G["beat"]; ph=G["phase"]
beat_at=lambda k: ph+k*beat
DROP=(8.40,8.75)                    # bed time: inside the riff's near-silent tail, before the drums at 8.79
LAST=json.load(open("plan.json"))[-1]["off"]   # bed time: the CTA's last syllable
K=int(np.ceil((LAST+0.5-ph)/beat))  # the first beat 0.5s on from it (v8: 102, 53.66s)
SWELL=(LAST+0.04,beat_at(K))        # back to full right after it, arriving on that beat
END=beat_at(K+6); FADE_AT=beat_at(K+4)   # full for a bar, out over the last two beats
POP=5.53                            # bed time: the riff's first rest after 变成越野摩托车手 (5.52-5.71s, -22..-27 dB)
v,_=sf.read("voice.wav",dtype="float32")
L=int(round(END*SR)); t=np.arange(L)/SR
m,_=sf.read("bed.wav",dtype="float32"); m=m[:L]
def ramp(g,a,b,x0,x1):
    k=(t>=a)&(t<b); u=(t[k]-a)/(b-a); g[k]=x0+(x1-x0)*(0.5-0.5*np.cos(np.pi*u))
gdb=np.full(L,FLAT); gdb[t<DROP[0]]=INTRO; gdb[t>=SWELL[1]]=INTRO
ramp(gdb,*DROP,INTRO,FLAT); ramp(gdb,*SWELL,FLAT,INTRO)
g=10**(gdb/20); k=t>=FADE_AT; g[k]*=np.clip(1-(t[k]-FADE_AT)/(END-FADE_AT),0,1)
# the pop: leading silence cut to 5 ms before its attack; its loudest 10 ms set to the hook voice's
# 95th-percentile 10 ms level
p=subprocess.run(["ffmpeg","-nostdin","-v","error","-i","sfx-pop.mp3","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
p=np.frombuffer(p,dtype=np.float32).copy(); w=SR//100
pr=20*np.log10(np.sqrt((p[:len(p)//w*w].reshape(-1,w)**2).mean(1))+1e-12); a0=max(0,np.argmax(pr>pr.max()-30)*w-SR//200)
p=p[a0:]; f=int(0.02*SR); p[-f:]*=np.linspace(1,0,f)
hv=v[int(0.10*SR):int((D+4.55)*SR)]; hr=20*np.log10(np.sqrt((hv[:len(hv)//w*w].reshape(-1,w)**2).mean(1))+1e-12)
pg=np.percentile(hr[hr>-60],95)-pr.max(); p*=10**(pg/20)
n=int(round(D*SR)); out=np.zeros((n+L,2),dtype=np.float32); out[n:]=m*g[:,None]; out[:len(v)]+=v[:,None]
k=int(round((D+POP)*SR)); out[k:k+len(p)]+=p[:,None]
sf.write("pre.wav",out,SR,subtype="FLOAT"); json.dump({"pop_at":round(D+POP,3),"length":round(len(out)/SR,3)},open("sfx.json","w"))
print(f"bed from {D:.3f}s: intro {INTRO:.2f} -> flat {FLAT:.2f} dB over {D+DROP[0]:.2f}-{D+DROP[1]:.2f}s, "
      f"back to {INTRO:.2f} over {D+SWELL[0]:.2f}-{D+SWELL[1]:.2f}s, fade {D+FADE_AT:.2f}-{D+END:.2f}s; pop at {D+POP:.2f}s ({pg:+.1f} dB)")
