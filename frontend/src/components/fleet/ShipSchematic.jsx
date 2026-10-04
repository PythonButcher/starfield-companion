import { useId } from 'react';

export default function ShipSchematic({ modules, name, reactorClass }) {
  const uid = useId().replaceAll(':', '');
  const count = (category) => modules.filter((m) => m.category === category).reduce((sum, m) => sum + m.count, 0);
  const engines = Math.min(6, count('Engine'));
  return <div className="ship-schematic">
    <div className="canvas-toolbar"><span className="eyebrow">SHIP FORGE / TECHNICAL OVERVIEW</span><span className="mono small">CLASS {reactorClass || '—'}</span></div>
    <svg viewBox="0 0 720 420" role="img" aria-label={`${name} ship loadout schematic`}>
      <defs><pattern id={`ship-grid-${uid}`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--color-hairline)" strokeWidth="0.4" /></pattern>
        <linearGradient id={`engine-${uid}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="var(--color-hud-blue)" /><stop offset="1" stopColor="var(--color-hud-blue)" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="720" height="420" fill={`url(#ship-grid-${uid})`} />
      <g className="schematic-rulers"><path d="M 360 25 V 395 M 40 215 H 680 M 130 80 H 590 M 130 80 V 355 M 590 80 V 355" />
        <circle cx="360" cy="215" r="155" /><circle cx="360" cy="215" r="175" strokeDasharray="3 9" /></g>
      <g className="ship-outline"><path d="M 360 52 L 391 93 L 391 143 L 441 173 L 470 270 L 416 304 L 397 352 L 323 352 L 304 304 L 250 270 L 279 173 L 329 143 L 329 93 Z" />
        {count('Cockpit') > 0 && <path className="ship-glass" d="M 360 64 L 381 98 L 381 130 L 339 130 L 339 98 Z" />}
        {count('Hab') > 0 && <g className="ship-hab"><rect x="329" y="143" width="62" height="100" rx="3" /><path d="M 333 166 H 387 M 333 190 H 387 M 333 214 H 387" /></g>}
        {count('Reactor') > 0 && <g className="reactor-core"><circle cx="360" cy="273" r="25" /><circle cx="360" cy="273" r="14" /><path d="M 331 273 H 389 M 360 244 V 302" /></g>}
        {count('Grav drive') > 0 && <rect x="335" y="310" width="50" height="29" rx="3" />}
        {count('Cargo') > 0 && <g><rect x="275" y="192" width="38" height="61" rx="3" /><rect x="407" y="192" width="38" height="61" rx="3" /></g>}
        {Array.from({ length: engines }, (_, i) => {
          const x = i % 2 === 0 ? 244 - Math.floor(i / 2) * 38 : 444 + Math.floor(i / 2) * 38;
          return <g key={i}><rect x={x} y="270" width="32" height="66" rx="5" /><rect x={x + 6} y="336" width="20" height="48" stroke="none" fill={`url(#engine-${uid})`} /><path d={`M ${x + 4} 319 h 24 M ${x + 4} 324 h 24`} /></g>;
        })}
      </g>
      <g className="schematic-labels"><path d="M 385 110 H 475 L 495 90 H 646 M 310 180 H 208 L 185 156 H 55 M 385 274 H 510 L 530 248 H 655 M 335 325 H 198 L 175 345 H 55" />
        <text x="500" y="80">{count('Cockpit')} COCKPIT</text><text x="55" y="146">{count('Hab')} HAB MODULES</text><text x="535" y="238">{count('Reactor')} REACTOR</text><text x="55" y="335">{count('Grav drive')} GRAV DRIVE</text>
      </g>
    </svg>
    <div className="canvas-caption"><span>MODULE OVERVIEW · placement is illustrative</span><span>{count('Engine')} ENGINES / {count('Cargo')} CARGO</span></div>
  </div>;
}
