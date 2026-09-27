type IkonProps = { className?: string };

const temelOzellikler = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function KonumIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function EpostaIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function OnayIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function TabakIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function AramaIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function GonderIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

export function KisiIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.4.4 4.5 2.5 4.5 5.8" />
    </svg>
  );
}

export function TakvimIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function SaatIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function WifiIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M4 9a13 13 0 0 1 16 0" />
      <path d="M7 12.5a8.5 8.5 0 0 1 10 0" />
      <path d="M10 16a4 4 0 0 1 4 0" />
      <circle cx="12" cy="19.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TerasIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M12 3v3M4.5 8.5h15M6 8.5a6 6 0 0 1 12 0Z" />
      <path d="M12 11.5V21" />
    </svg>
  );
}

export function EvcilHayvanIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <circle cx="19" cy="13" r="1.6" />
      <path d="M9 18c-1.5-3 1-5.5 3-5.5s4.5 2.5 3 5.5c-1 2-5 2-6 0Z" />
    </svg>
  );
}

export function OtoparkIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M5 16V9a2 2 0 0 1 2-2h6.5a4.5 4.5 0 0 1 0 9H9" />
      <path d="M5 16v3M9 16v3" />
      <path d="M9 7v6" />
    </svg>
  );
}

export function KartIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M6 15h4" />
    </svg>
  );
}

export function MenuIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function KapatIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MuzikIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  );
}
