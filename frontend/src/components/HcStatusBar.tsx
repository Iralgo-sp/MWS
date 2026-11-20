import type { CSSProperties } from "react";

const BAR_BG     = '#12180F';
const BAR_BORDER = '#2a3524';
const FG         = '#8f9b87';
const FG_HOVER   = '#c8a05a';
const FL_COLOR   = '#5b74bf';
const GP_COLOR   = '#3a7d44';
const MW_COLOR   = '#8b6a9e';

declare global {
  interface Window {
    launcher?: { goHome: () => void; openApp: (name: string) => void };
  }
}

const pillBase: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '5px',
  padding: '3px 9px', borderRadius: '4px',
  border: `1px solid ${BAR_BORDER}`, background: 'none',
  fontFamily: 'inherit', fontSize: '11px',
  cursor: 'pointer', color: '#5c6b55',
  transition: 'border-color .15s, color .15s',
};

function SectionPill({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  return (
    <button
      style={pillBase}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.color = color;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = BAR_BORDER;
        (e.currentTarget as HTMLElement).style.color = '#5c6b55';
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </button>
  );
}

export function HcStatusBar() {
  if (typeof window === 'undefined' || !window.launcher) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '36px', background: BAR_BG,
      borderTop: `1px solid ${BAR_BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 12px', zIndex: 10000,
      fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace",
      fontSize: '12px',
    }}>

      <button
        onClick={() => window.launcher!.goHome()}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          color: FG, background: 'none', border: 'none',
          borderRight: `1px solid ${BAR_BORDER}`,
          padding: '0 12px 0 0', marginRight: '12px',
          height: '100%', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '12px',
          transition: 'color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = FG_HOVER; }}
        onMouseLeave={e => { e.currentTarget.style.color = FG; }}
      >
        <span style={{
          width: '16px', height: '16px', borderRadius: '4px',
          background: '#2a1f0d', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '9px', fontWeight: 700,
          color: '#c8a05a', flexShrink: 0,
        }}>HC</span>
        HomeCore
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#8f9b87', fontSize: '11px', flex: 1 }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: MW_COLOR, flexShrink: 0 }} />
        Gestión de Vehículos
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <SectionPill color={FL_COLOR} label="Gestión Financiera"   onClick={() => window.launcher!.openApp('finlock')} />
        <SectionPill color={GP_COLOR} label="Gestión de Inmuebles" onClick={() => window.launcher!.openApp('gestprop')} />
      </div>
    </div>
  );
}
