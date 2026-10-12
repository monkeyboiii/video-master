# Tempo, beat phase and bar grid of the bed, from a spectral-flux onset envelope (numpy only — the
# TTS venv has no librosa/scipy). Writes bgm-grid.json; prints per-bar energy to find the sections.
#   bgm-grid.py BED.wav     (the first 100s, 48 kHz, as bgm100.wav in render.sh)
import json, sys, numpy as np, soundfile as sf
x,SR=sf.read(sys.argv[1],dtype="float32"); m=x.mean(1)
H=480; N=2048; win=np.hanning(N)
fr=np.lib.stride_tricks.sliding_window_view(np.pad(m,(N//2,N//2)),N)[::H]*win
S=np.abs(np.fft.rfft(fr)); f=np.fft.rfftfreq(N,1/SR)
L=np.log1p(100*S); flux=np.r_[0,np.maximum(np.diff(L,axis=0),0).sum(1)]
fps=SR/H; t=np.arange(len(flux))/fps
o=np.maximum(flux-np.convolve(flux,np.ones(50)/50,'same'),0)
ac=np.correlate(o,o,'full')[len(o)-1:]
lags=np.arange(int(fps*60/180),int(fps*60/70)); lag=lags[np.argmax(ac[lags])]
y0,y1,y2=ac[lag-1],ac[lag],ac[lag+1]; lagf=lag+0.5*(y0-y2)/(y0-2*y1+y2)
bpm=60*fps/lagf; beat=60/bpm
phases=np.linspace(0,beat,200,endpoint=False)
ph=phases[int(np.argmax([np.interp(np.arange(p,t[-1],beat),t,o).sum() for p in phases]))]
beats=np.arange(ph,t[-1],beat)
band=lambda lo,hi: S[:,(f>=lo)&(f<hi)].sum(1)
kick=np.interp(beats,t,np.convolve(band(40,120),np.ones(3),'same')); snr=np.interp(beats,t,np.convolve(band(2000,5000),np.ones(3),'same'))
best=max(range(4),key=lambda k: kick[k::4].mean()+kick[(k+2)%4::4].mean()-snr[k::4].mean()-snr[(k+2)%4::4].mean())
bars=beats[best::4]
print(f"tempo {bpm:.2f} BPM, beat {beat*1000:.1f} ms, phase {ph:.3f}s, kick-on-beat index {best} (mod 4)")
for i,b in enumerate(bars[:40]):
    k=(t>=b)&(t<b+4*beat); seg=m[int(b*SR):int((b+4*beat)*SR)]
    print(f"{i:3d} {b:6.2f}  {20*np.log10(np.sqrt(np.mean(seg**2))+1e-9):6.1f} {10*np.log10(band(40,150)[k].mean()+1e-9):5.1f} {10*np.log10(band(300,2000)[k].mean()+1e-9):5.1f} {10*np.log10(band(5000,12000)[k].mean()+1e-9):5.1f}")
json.dump({"bpm":bpm,"beat":beat,"phase":ph,"bar_index":best,"bars":[float(b) for b in bars]},open("bgm-grid.json","w"))
