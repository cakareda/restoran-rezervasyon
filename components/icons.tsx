type IkonProps = { className?: string };

const temelOzellikler = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AsagiOkIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function GozIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function GozKapaliIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.36 5.6A9.7 9.7 0 0 1 12 5.25c6.5 0 10 6.75 10 6.75a13.4 13.4 0 0 1-3.06 3.71M6.6 6.6C4.2 8.05 2 12 2 12s3.5 6.75 10 6.75a9.6 9.6 0 0 0 3.4-.62" />
    </svg>
  );
}

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

export function TelefonIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.6 21 3 14.4 3 6a2 2 0 0 1 1-2Z" />
    </svg>
  );
}

export function WhatsappIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M4 20l1.3-4.1A8 8 0 1 1 9 18.6L4 20Z" />
      <path d="M9 9.3c0 3.5 2.9 6.4 6.4 6.4" strokeLinecap="round" />
      <path d="M9 9.3c-.2-.9.4-1.8 1-2 .3-.1.7-.1.9.2l.6 1c.2.3.1.7-.1 1l-.5.5c.4 1.1 1.3 2 2.4 2.4l.5-.5c.3-.2.7-.3 1-.1l1 .6c.3.2.3.6.2.9-.2.6-1.1 1.2-2 1" />
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

export function RestoranIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M3 9 5 4h14l2 5" />
      <path d="M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
      <path d="M3 9h18" />
      <path d="M9 20v-6a3 3 0 0 1 6 0v6" />
    </svg>
  );
}

export function MasaIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function AyarlarIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function RaporIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

export function BildirimIkonu({ className }: IkonProps) {
  return (
    <svg {...temelOzellikler} className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
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
