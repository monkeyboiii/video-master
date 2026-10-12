# The ONE static bed gain (dB on the file) that keeps S05E003's approved consonant clarity — 1-4 kHz
# voice-over-music per 21 ms voiced frame: 12.4 dB median, -6.9 dB 10th percentile, <=20.1% of frames
# under 0 dB — across all speech. Writes flat.json. Reads voice.wav and bgm100.wav.
import json, numpy as np, soundfile as sf
SR=48000; N=2048; H=1024
v,_=sf.read("voice.wav",dtype="float32"); m,_=sf.read("bgm100.wav",dtype="float32"); m=m[:len(v)].mean(1)
win=np.hanning(N).astype(np.float32); f=np.fft.rfftfreq(N,1/SR)
fr=lambda x: np.stack([x[i*H:i*H+N]*win for i in range((len(x)-N)//H)])
FV=fr(v); V=np.abs(np.fft.rfft(FV))**2; M=np.abs(np.fft.rfft(fr(m)))**2
act=20*np.log10(np.sqrt((FV**2).mean(1))+1e-12)>-40
k=(f>=1000)&(f<4000); s=(10*np.log10(V[:,k].sum(1)+1e-20)-10*np.log10(M[:,k].sum(1)+1e-20))[act]
ref=(12.4,-6.9,20.1)
g=-max(ref[0]-np.median(s), ref[1]-np.percentile(s,10), -np.percentile(s,ref[2]))
json.dump({"flat_gain":float(g)},open("flat.json","w")); print(f"flat bed gain {g:.2f} dB")
