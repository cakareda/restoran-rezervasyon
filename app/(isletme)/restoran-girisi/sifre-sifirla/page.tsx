import type { Metadata } from "next";
import SifreSifirlaClient from "./SifreSifirlaClient";

export const metadata: Metadata = { title: "Şifreyi Sıfırla" };

export default function RestoranSifreSifirlaSayfasi() {
  return <SifreSifirlaClient />;
}
