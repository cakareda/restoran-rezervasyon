import {
  WifiIkonu,
  TerasIkonu,
  EvcilHayvanIkonu,
  OtoparkIkonu,
  KartIkonu,
  MuzikIkonu,
} from "@/components/icons";

const IKON_HARITASI: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  wifi: WifiIkonu,
  teras: TerasIkonu,
  evcil_hayvan: EvcilHayvanIkonu,
  otopark: OtoparkIkonu,
  kredi_karti: KartIkonu,
  canli_muzik: MuzikIkonu,
};

export default function OlanakIkonu({ deger, className }: { deger: string; className?: string }) {
  const Ikon = IKON_HARITASI[deger];
  if (!Ikon) return null;
  return <Ikon className={className} />;
}
