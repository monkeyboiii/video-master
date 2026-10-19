# The two bed levels (dB on the file) for v3's design — the intro riff at full volume, ONE flat drop when
# the drums enter. Writes levels.json. Reads voice.wav and bed.wav (bed_edit.py's).
#   levels.py INTRO_GAIN    (render.sh passes it: the riff at the voice's loudness, as first measured)
# The flat level is measured, not picked: the single gain that keeps S05E003's approved consonant clarity —
# 1-4 kHz voice-over-music per 21 ms voiced frame, 12.4 dB median, -6.9 dB 10th percentile, <=20.1% of
# frames under 0 — over the speech AFTER the drums.
import json, sys, numpy as np, soundfile as sf
SR=48000; N=2048; H=1024; DRUMS=8.79          # bgm-grid.py: bar 4's downbeat, where the kit comes in
D=json.load(open("offset.json"))["bed_offset"]   # the voice runs D ahead of the bed; measure on the bed's clock
v,_=sf.read("voice.wav",dtype="float32"); v=v[int(round(D*SR)):]; m,_=sf.read("bed.wav",dtype="float32"); m=m[:len(v)].mean(1)
win=np.hanning(N).astype(np.float32); f=np.fft.rfftfreq(N,1/SR)
fr=lambda x: np.stack([x[i*H:i*H+N]*win for i in range((len(x)-N)//H)])
FV=fr(v); V=np.abs(np.fft.rfft(FV))**2; M=np.abs(np.fft.rfft(fr(m)))**2
t=(np.arange(len(V))*H+N/2)/SR; act=20*np.log10(np.sqrt((FV**2).mean(1))+1e-12)>-40
k=(f>=1000)&(f<4000); s=(10*np.log10(V[:,k].sum(1)+1e-20)-10*np.log10(M[:,k].sum(1)+1e-20))[act&(t>=DRUMS)]
ref=(12.4,-6.9,20.1)
flat=-max(ref[0]-np.median(s), ref[1]-np.percentile(s,10), -np.percentile(s,ref[2]))
json.dump({"intro_gain":float(sys.argv[1]),"flat_gain":float(flat)},open("levels.json","w"))
print(f"intro {float(sys.argv[1]):.2f} dB, flat after the drums {flat:.2f} dB")
