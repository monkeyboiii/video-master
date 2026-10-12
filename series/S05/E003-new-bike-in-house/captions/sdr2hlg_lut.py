# sRGB/BT.709 graphics -> HLG/BT.2020 signal, ITU-R BT.2408 display-light mapping:
# SDR 100% white -> 203 cd/m2 on a 1000 cd/m2 HLG display (75% HLG signal).
import numpy as np, sys
N=65
x=np.linspace(0,1,N)
b,g,r=np.meshgrid(x,x,x,indexing="ij")             # .cube: R varies fastest
rgb=np.stack([r,g,b],-1).reshape(-1,3)
lin=np.where(rgb<=0.04045,rgb/12.92,((rgb+0.055)/1.055)**2.4)          # sRGB EOTF
M=np.array([[0.6274,0.3293,0.0433],[0.0691,0.9195,0.0114],[0.0164,0.0880,0.8956]])  # BT.2087 709->2020
lin=lin@M.T
Lw,gam=1000.0,1.2
FD=203.0*lin                                           # display light, cd/m2
YD=np.clip(FD@np.array([0.2627,0.6780,0.0593]),1e-9,None)
Ys=(YD/Lw)**(1/gam)
E=np.clip((FD/Lw)/(Ys[:,None]**(gam-1)),0,1)           # inverse HLG OOTF -> scene light
a,bb,c=0.17883277,0.28466892,0.55991073
Ep=np.where(E<=1/12,np.sqrt(3*E),a*np.log(np.maximum(12*E-bb,1e-12))+c)  # HLG OETF
with open(sys.argv[1],"w") as f:
    f.write(f"LUT_3D_SIZE {N}\n")
    for v in Ep: f.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
w=Ep[-1]; print("white ->", np.round(w,4), " black ->", np.round(Ep[0],4))
