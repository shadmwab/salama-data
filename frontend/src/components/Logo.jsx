export function LogoIcon({ size = 40, online = true }) {
  const bg = online ? "#1A4B7A" : "#085041"
  const ring = online ? "#009EDB" : "#1D9E75"
  const dot = online ? "#1D9E75" : "#9FE1CB"
  const badge = online ? "#1A4B7A" : "#085041"

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <rect width="48" height="48" rx="10" fill={bg}/>
      <circle cx="24" cy="20" r="8" fill="none" stroke={ring} strokeWidth="1.5"/>
      <circle cx="24" cy="20" r="3" fill={dot}/>
      <path d="M24 28 L24 34" stroke="#9FE1CB" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M19 32 L24 34 L29 32" stroke="#9FE1CB" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14" cy="32" r="2.5" fill="#009EDB" opacity="0.8"/>
      <circle cx="34" cy="32" r="2.5" fill="#009EDB" opacity="0.8"/>
      <line x1="16.5" y1="32" x2="21" y2="34" stroke="#009EDB" strokeWidth="1" opacity="0.7"/>
      <line x1="31.5" y1="32" x2="27" y2="34" stroke="#009EDB" strokeWidth="1" opacity="0.7"/>
      <circle cx="36" cy="14" r="5" fill={badge} stroke="#9FE1CB" strokeWidth="1"/>
      <path d="M33 14 L35 16 L39 12" stroke="#9FE1CB" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function LogoHorizontal({ online = true, dark = true }) {
  return (
    <svg width="180" height="56" viewBox="0 0 280 88">
      <rect width="64" height="64" rx="12" fill={online ? "#1A4B7A" : "#085041"} x="12" y="12"/>
      <circle cx="44" cy="36" r="14" fill="none" stroke={online ? "#009EDB" : "#1D9E75"} strokeWidth="1.8"/>
      <circle cx="44" cy="36" r="5" fill={online ? "#1D9E75" : "#9FE1CB"}/>
      <circle cx="44" cy="36" r="2.5" fill="#9FE1CB"/>
      <path d="M44 50 L44 58" stroke="#9FE1CB" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M37 55 L44 58 L51 55" stroke="#9FE1CB" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="26" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
      <circle cx="62" cy="57" r="3.5" fill="#009EDB" opacity="0.8"/>
      <line x1="29.5" y1="57" x2="40" y2="58" stroke="#009EDB" strokeWidth="1.2" opacity="0.7"/>
      <line x1="58.5" y1="57" x2="48" y2="58" stroke="#009EDB" strokeWidth="1.2" opacity="0.7"/>
      <circle cx="66" cy="26" r="8" fill={online ? "#085041" : "#1A4B7A"} stroke="#9FE1CB" strokeWidth="1"/>
      <path d="M62 26 L65 29 L70 23" stroke="#9FE1CB" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="92" y="36" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="20" fontWeight="700" fill={dark ? "white" : "#0D2E4E"}>SALAMA</text>
      <text x="92" y="54" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="14" fontWeight="400" fill={dark ? "#7FB3D3" : "#1A4B7A"}>DATA</text>
      <text x="92" y="70" fontFamily="Poppins, Segoe UI, sans-serif" fontSize="9" fontWeight="400" fill={dark ? "#5A8AA8" : "#64748B"}>Plateforme humanitaire · RDC</text>
    </svg>
  )
}