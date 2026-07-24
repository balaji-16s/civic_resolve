// ── Cartoon SVG illustrations for each civic issue ───────────────────

export function GarbageImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#fef3c7"/>
      <rect x="70" y="30" width="60" height="80" rx="4" fill="#6b7280"/>
      <rect x="60" y="25" width="80" height="12" rx="4" fill="#4b5563"/>
      <path d="M85 10 L90 25 L110 25 L115 10Z" fill="#4b5563"/>
      <circle cx="90" cy="50" r="8" fill="#ef4444" opacity="0.6"/>
      <circle cx="110" cy="45" r="6" fill="#f59e0b" opacity="0.6"/>
      <circle cx="100" cy="60" r="5" fill="#10b981" opacity="0.5"/>
      <rect x="30" y="85" width="20" height="8" rx="3" fill="#f59e0b" opacity="0.5"/>
      <rect x="150" y="80" width="15" height="6" rx="2" fill="#ef4444" opacity="0.4"/>
      <rect x="45" y="95" width="12" height="6" rx="2" fill="#f59e0b" opacity="0.4"/>
      <circle cx="75" cy="15" r="3" fill="#ef4444"/>
      <circle cx="125" cy="20" r="2" fill="#f59e0b"/>
    </svg>
  );
}

export function StreetlightImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#fef9c3"/>
      <rect x="95" y="20" width="10" height="100" rx="2" fill="#6b7280"/>
      <rect x="105" y="20" width="40" height="8" rx="2" fill="#4b5563"/>
      <path d="M130 28 L130 40 L145 40 L140 28Z" fill="#4b5563"/>
      <circle cx="100" cy="50" r="15" fill="#f59e0b" opacity="0.15"/>
      <line x1="110" y1="30" x2="120" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <line x1="120" y1="30" x2="110" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <rect x="90" y="120" width="20" height="8" rx="2" fill="#374151"/>
      <circle cx="100" cy="30" r="8" fill="#d1d5db" opacity="0.5"/>
      <text x="100" y="36" textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="bold">X</text>
      <rect x="45" y="60" width="30" height="4" rx="1" fill="#9ca3af" opacity="0.3"/>
      <rect x="130" y="55" width="25" height="4" rx="1" fill="#9ca3af" opacity="0.3"/>
    </svg>
  );
}

export function PotholeImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#fef2f2"/>
      <rect x="0" y="90" width="200" height="60" fill="#374151"/>
      <rect x="0" y="88" width="200" height="4" fill="#fbbf24"/>
      <ellipse cx="100" cy="100" rx="35" ry="15" fill="#1f2937"/>
      <ellipse cx="100" cy="98" rx="28" ry="10" fill="#111827"/>
      <path d="M85 95 L95 105 L105 95 L115 105" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.5"/>
      <circle cx="90" cy="95" r="3" fill="#fbbf24" opacity="0.4"/>
      <circle cx="110" cy="100" r="2" fill="#fbbf24" opacity="0.3"/>
      <rect x="30" y="115" width="25" height="6" rx="2" fill="#4b5563"/>
      <rect x="145" y="110" width="20" height="5" rx="2" fill="#4b5563"/>
      <rect x="160" y="120" width="15" height="5" rx="2" fill="#4b5563"/>
    </svg>
  );
}

export function WaterImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#eff6ff"/>
      <rect x="80" y="20" width="40" height="60" rx="4" fill="#6b7280"/>
      <circle cx="100" cy="35" r="12" fill="#3b82f6" opacity="0.6"/>
      <circle cx="100" cy="35" r="6" fill="#60a5fa" opacity="0.8"/>
      <rect x="90" y="70" width="20" height="30" rx="2" fill="#6b7280"/>
      <path d="M95 100 Q90 115 85 110" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M105 100 Q110 120 115 115" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M100 100 Q100 118 95 120" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="85" cy="115" r="4" fill="#3b82f6" opacity="0.4"/>
      <circle cx="115" cy="118" r="3" fill="#3b82f6" opacity="0.3"/>
      <ellipse cx="100" cy="140" rx="60" ry="8" fill="#3b82f6" opacity="0.15"/>
      <rect x="25" y="95" width="15" height="3" rx="1" fill="#93c5fd" opacity="0.4"/>
      <rect x="155" y="90" width="18" height="3" rx="1" fill="#93c5fd" opacity="0.4"/>
    </svg>
  );
}

export function DrainageImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#f0fdfa"/>
      <rect x="30" y="70" width="140" height="50" rx="8" fill="#475569"/>
      <rect x="35" y="75" width="130" height="40" rx="6" fill="#1e293b"/>
      <line x1="60" y1="75" x2="60" y2="115" stroke="#475569" strokeWidth="2"/>
      <line x1="100" y1="75" x2="100" y2="115" stroke="#475569" strokeWidth="2"/>
      <line x1="140" y1="75" x2="140" y2="115" stroke="#475569" strokeWidth="2"/>
      <ellipse cx="80" cy="95" rx="12" ry="8" fill="#0ea5e9" opacity="0.5"/>
      <ellipse cx="120" cy="90" rx="10" ry="6" fill="#0ea5e9" opacity="0.4"/>
      <rect x="65" y="70" width="70" height="8" rx="2" fill="#6b7280"/>
      <circle cx="65" cy="68" r="4" fill="#6b7280"/>
      <circle cx="135" cy="68" r="4" fill="#6b7280"/>
      <rect x="38" y="120" width="25" height="5" rx="2" fill="#0ea5e9" opacity="0.3"/>
      <rect x="140" y="118" width="20" height="4" rx="2" fill="#0ea5e9" opacity="0.3"/>
    </svg>
  );
}

export function DumpingImage({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" rx="12" fill="#fafaf9"/>
      <rect x="0" y="100" width="200" height="50" fill="#a8a29e"/>
      <rect x="30" y="90" width="45" height="30" rx="3" fill="#78716c"/>
      <rect x="35" y="85" width="35" height="10" rx="2" fill="#57534e"/>
      <rect x="130" y="95" width="40" height="25" rx="3" fill="#78716c"/>
      <rect x="135" y="90" width="30" height="8" rx="2" fill="#57534e"/>
      <circle cx="45" cy="80" r="8" fill="#ef4444" opacity="0.4"/>
      <circle cx="65" cy="78" r="5" fill="#f59e0b" opacity="0.4"/>
      <rect x="70" y="95" width="20" height="8" rx="2" fill="#a8a29e"/>
      <rect x="54" y="100" width="10" height="8" rx="2" fill="#a8a29e"/>
      <rect x="120" y="90" width="8" height="15" fill="#ef4444" opacity="0.3"/>
      <circle cx="160" cy="82" r="6" fill="#10b981" opacity="0.3"/>
    </svg>
  );
}

// ── Hero Background: City Skyline ───────────────────────────────────
export function CitySkyline({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" stopOpacity="1"/>
          <stop offset="40%" stopColor="#16213e" stopOpacity="1"/>
          <stop offset="70%" stopColor="#0f3460" stopOpacity="1"/>
          <stop offset="100%" stopColor="#e94560" stopOpacity="0.3"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softGlow"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="1440" height="800" fill="url(#skyGrad)"/>
      <g fill="white" opacity="0.6">
        <circle cx="100" cy="50" r="1.5"/><circle cx="250" cy="80" r="1"/><circle cx="380" cy="30" r="1.5"/>
        <circle cx="500" cy="90" r="1"/><circle cx="650" cy="45" r="1.5"/><circle cx="780" cy="70" r="1"/>
        <circle cx="900" cy="25" r="1.5"/><circle cx="1050" cy="60" r="1"/><circle cx="1150" cy="35" r="1.5"/>
        <circle cx="1300" cy="85" r="1"/><circle cx="140" cy="120" r="1"/><circle cx="320" cy="140" r="0.8"/>
        <circle cx="550" cy="110" r="1"/><circle cx="720" cy="130" r="0.8"/><circle cx="850" cy="100" r="1"/>
        <circle cx="1020" cy="150" r="0.8"/><circle cx="1200" cy="115" r="1"/><circle cx="1380" cy="140" r="0.8"/>
      </g>
      <g opacity="0.4">
        <rect x="0" y="350" width="80" height="450" fill="#1a1a2e"/><rect x="85" y="300" width="60" height="500" fill="#16213e"/>
        <rect x="150" y="380" width="90" height="420" fill="#1a1a2e"/><rect x="245" y="280" width="50" height="520" fill="#16213e"/>
        <rect x="300" y="350" width="100" height="450" fill="#1a1a2e"/><rect x="405" y="250" width="70" height="550" fill="#0f3460"/>
        <rect x="480" y="320" width="85" height="480" fill="#1a1a2e"/><rect x="570" y="270" width="60" height="530" fill="#16213e"/>
        <rect x="635" y="350" width="95" height="450" fill="#1a1a2e"/><rect x="735" y="300" width="75" height="500" fill="#0f3460"/>
        <rect x="815" y="260" width="65" height="540" fill="#16213e"/><rect x="885" y="340" width="80" height="460" fill="#1a1a2e"/>
        <rect x="970" y="290" width="90" height="510" fill="#0f3460"/><rect x="1065" y="330" width="60" height="470" fill="#16213e"/>
        <rect x="1130" y="270" width="70" height="530" fill="#1a1a2e"/><rect x="1205" y="310" width="85" height="490" fill="#16213e"/>
        <rect x="1295" y="350" width="55" height="450" fill="#1a1a2e"/><rect x="1355" y="290" width="85" height="510" fill="#0f3460"/>
      </g>
      <g opacity="0.6">
        <rect x="30" y="310" width="70" height="490" fill="#1a1a2e" rx="2"/><rect x="120" y="270" width="55" height="530" fill="#16213e" rx="2"/>
        <rect x="190" y="330" width="80" height="470" fill="#1a1a2e" rx="2"/><rect x="280" y="250" width="65" height="550" fill="#16213e" rx="2"/>
        <polygon points="420,200 440,250 400,250" fill="#0f3460"/><rect x="400" y="250" width="40" height="550" fill="#1a1a2e" rx="2"/>
        <ellipse cx="530" cy="290" rx="45" ry="20" fill="#16213e"/><rect x="490" y="290" width="80" height="510" fill="#16213e" rx="2"/>
        <rect x="585" y="280" width="60" height="520" fill="#1a1a2e" rx="2"/><rect x="660" y="320" width="85" height="480" fill="#16213e" rx="2"/>
        <rect x="760" y="270" width="55" height="530" fill="#1a1a2e" rx="2"/><rect x="830" y="240" width="70" height="560" fill="#16213e" rx="2"/>
        <rect x="910" y="310" width="75" height="490" fill="#1a1a2e" rx="2"/><rect x="1000" y="260" width="65" height="540" fill="#16213e" rx="2"/>
        <rect x="1080" y="300" width="55" height="500" fill="#1a1a2e" rx="2"/><rect x="1150" y="250" width="80" height="550" fill="#16213e" rx="2"/>
        <rect x="1240" y="330" width="60" height="470" fill="#1a1a2e" rx="2"/><rect x="1310" y="280" width="70" height="520" fill="#16213e" rx="2"/>
      </g>
      <g fill="#e94560" opacity="0.6">
        <rect x="45" y="330" width="8" height="10" rx="1"/><rect x="65" y="330" width="8" height="10" rx="1"/>
        <rect x="130" y="290" width="7" height="9" rx="1"/><rect x="148" y="290" width="7" height="9" rx="1"/>
        <rect x="295" y="270" width="7" height="9" rx="1"/><rect x="312" y="270" width="7" height="9" rx="1"/>
        <rect x="408" y="270" width="6" height="8" rx="1"/><rect x="420" y="270" width="6" height="8" rx="1"/>
        <rect x="500" y="310" width="8" height="10" rx="1"/><rect x="520" y="310" width="8" height="10" rx="1"/>
        <rect x="845" y="260" width="7" height="9" rx="1"/><rect x="865" y="260" width="7" height="9" rx="1"/>
        <rect x="1165" y="270" width="7" height="9" rx="1"/><rect x="1185" y="270" width="7" height="9" rx="1"/>
      </g>
      <g fill="#f0c040" opacity="0.5">
        <rect x="65" y="450" width="8" height="10" rx="1"/><rect x="148" y="380" width="7" height="9" rx="1"/>
        <rect x="312" y="390" width="7" height="9" rx="1"/><rect x="420" y="450" width="6" height="8" rx="1"/>
        <rect x="615" y="360" width="6" height="8" rx="1"/><rect x="785" y="380" width="6" height="8" rx="1"/>
        <rect x="1035" y="370" width="7" height="9" rx="1"/><rect x="1185" y="360" width="7" height="9" rx="1"/>
      </g>
      <g opacity="0.85">
        <rect x="-20" y="380" width="100" height="420" fill="#0d0d1a" rx="3"/><rect x="90" y="340" width="70" height="460" fill="#111126" rx="3"/>
        <rect x="170" y="400" width="90" height="400" fill="#0d0d1a" rx="3"/><rect x="270" y="360" width="60" height="440" fill="#111126" rx="3"/>
        <rect x="340" y="390" width="110" height="410" fill="#0d0d1a" rx="3"/><rect x="460" y="350" width="80" height="450" fill="#111126" rx="3"/>
        <rect x="550" y="380" width="100" height="420" fill="#0d0d1a" rx="3"/><rect x="660" y="340" width="75" height="460" fill="#111126" rx="3"/>
        <rect x="745" y="400" width="95" height="400" fill="#0d0d1a" rx="3"/><rect x="850" y="350" width="70" height="450" fill="#111126" rx="3"/>
        <rect x="930" y="380" width="85" height="420" fill="#0d0d1a" rx="3"/><rect x="1025" y="340" width="65" height="460" fill="#111126" rx="3"/>
        <rect x="1100" y="390" width="80" height="410" fill="#0d0d1a" rx="3"/><rect x="1190" y="360" width="90" height="440" fill="#111126" rx="3"/>
        <rect x="1290" y="380" width="80" height="420" fill="#0d0d1a" rx="3"/><rect x="1380" y="350" width="80" height="450" fill="#111126" rx="3"/>
      </g>
      <circle cx="1100" cy="100" r="30" fill="#f0e68c" opacity="0.9"/>
      <circle cx="1100" cy="100" r="30" fill="#fffde7" opacity="0.3"/>
      <circle cx="1090" cy="95" r="25" fill="#1a1a2e" opacity="0.3"/>
      <rect x="0" y="750" width="1440" height="50" fill="#0a0a15"/>
      <g stroke="#e94560" strokeWidth="1" opacity="0.3">
        <line x1="0" y1="775" x2="1440" y2="775" strokeDasharray="20,15"/>
      </g>
    </svg>
  );
}
