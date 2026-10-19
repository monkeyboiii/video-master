# The bed, edited. The take runs ~1.7x the stand-in's length, so chorus 1 (bar 24, 50.53s) would lift halfway through
# 下巴…, not under 没问题 — v8's approved ending is the question on a beat, 没问题 on the chorus downbeat, the CTA, then
# the bed back to full. (Not a level problem: under every line the music's 1-4 kHz measures the same; the lines that
# read soft are soft in the voice.) So verse 1 runs into verse 2 at a phrase start — the same riff
# (2-bar spectra correlate 0.77, as verse 1 does with itself four bars on, 0.78-0.81) — so every teaching line sits
# on the verse and chorus 2 lifts on edited bar 28, where 没问题 lands. Verse 2 runs ~0.28s ahead of the grid fitted
# on the first 100s (the band drifts), so its downbeat is found by onset correlation, not taken from the grid.
# Writes bed.wav (48 kHz stereo, from bgm130.wav) and bed-edit.json.
import json, numpy as np, soundfile as sf
SR=48000; G=json.load(open("bgm-grid.json")); beat=G["beat"]; ph=G["phase"]; bar=lambda k: ph+4*k*beat
J,TGT=16,38                     # verse 1's fourth phrase -> verse 2's second; chorus 2 (bar 50) then lands on bar 50-TGT+J = 28
XF=(0.025,0.005)                # equal-power crossfade, ending 5 ms ahead of bar J's downbeat
x,_=sf.read("bgm130.wav",dtype="float32"); m=x.mean(1)
N=2048; H=48; win=np.hanning(N).astype(np.float32)
def onset(t0,dur):              # spectral flux at 1 ms hops
    s=m[int(t0*SR):int((t0+dur)*SR)+N]; fr=np.lib.stride_tricks.sliding_window_view(s,N)[::H]*win
    L=np.log1p(100*np.abs(np.fft.rfft(fr))); return np.r_[0,np.maximum(np.diff(L,axis=0),0).sum(1)]
ref=onset(bar(J)-0.1,4*beat)
lags=range(-400,101)            # ms
c=[np.corrcoef(ref,onset(bar(TGT)-0.1+l/1000,4*beat)[:len(ref)])[0,1] for l in lags]
lag=lags[int(np.argmax(c))]/1000; DELTA=bar(TGT)+lag-bar(J)
T=bar(J); a,b=T-XF[0],T-XF[1]; ia,ib=int(round(a*SR)),int(round(b*SR)); d=int(round(DELTA*SR))
L=len(x)-d; y=np.empty((L,2),dtype=np.float32); y[:ia]=x[:ia]; y[ib:]=x[ib+d:ib+d+L-ib]
u=np.linspace(0,1,ib-ia,dtype=np.float32)[:,None]; y[ia:ib]=x[ia:ib]*np.cos(u*np.pi/2)+x[ia+d:ib+d]*np.sin(u*np.pi/2)
sf.write("bed.wav",y,SR,subtype="FLOAT")
json.dump({"splice_at":round(T,4),"from_bar":J,"to_bar":TGT,"lag":lag,"delta":round(DELTA,4),"onset_corr":round(float(max(c)),3)},open("bed-edit.json","w"))
print(f"bar {J} ({T:.2f}s) -> bar {TGT} at {lag*1000:+.0f} ms off the grid (onset corr {max(c):.3f}); the bed after it is the "
      f"source +{DELTA:.3f}s; chorus 2 (grid {bar(50):.2f}s) lands at {bar(50)+lag-DELTA:.2f}s, bar 28 is {bar(28):.2f}s")
