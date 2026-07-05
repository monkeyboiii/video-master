import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {monoFont} from '../theme/fonts';
import {moto, safeZoneFor} from '../theme/tokens';

const UNSAFE = 'rgba(210, 58, 45, 0.22)';

const label: React.CSSProperties = {
  fontFamily: monoFont('en-US'),
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: '#FFFFFF',
  backgroundColor: 'rgba(22, 20, 15, 0.75)',
  padding: '4px 12px',
  borderRadius: 6,
};

/**
 * Debug overlay: shades the platform-unsafe margins red and outlines the safe
 * rectangle green. Studio preview only — never rendered into deliverables.
 */
export const SafeZoneGuide: React.FC = () => {
  const {width, height} = useVideoConfig();
  const safe = safeZoneFor(width, height);
  const safeW = width - safe.left - safe.right;
  const safeH = height - safe.top - safe.bottom;

  return (
    <AbsoluteFill>
      {/* Unsafe bands */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: safe.top, backgroundColor: UNSAFE}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: safe.bottom, backgroundColor: UNSAFE}} />
      <div style={{position: 'absolute', top: safe.top, bottom: safe.bottom, left: 0, width: safe.left, backgroundColor: UNSAFE}} />
      <div style={{position: 'absolute', top: safe.top, bottom: safe.bottom, right: 0, width: safe.right, backgroundColor: UNSAFE}} />
      {/* Safe rectangle */}
      <div
        style={{
          position: 'absolute',
          top: safe.top,
          left: safe.left,
          width: safeW,
          height: safeH,
          border: `4px dashed ${moto.green}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{...label, fontSize: 34}}>
          SAFE {safeW} × {safeH}
        </div>
      </div>
      {/* Inset labels */}
      <div style={{position: 'absolute', top: safe.top / 2 - 20, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={label}>top {safe.top}</div>
      </div>
      <div style={{position: 'absolute', bottom: safe.bottom / 2 - 20, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={label}>bottom {safe.bottom}</div>
      </div>
      <div style={{position: 'absolute', top: '50%', left: 8, transform: 'rotate(-90deg)', transformOrigin: 'left center'}}>
        <div style={label}>left {safe.left}</div>
      </div>
      <div style={{position: 'absolute', top: '50%', right: 8, transform: 'rotate(90deg)', transformOrigin: 'right center'}}>
        <div style={label}>right {safe.right}</div>
      </div>
    </AbsoluteFill>
  );
};
