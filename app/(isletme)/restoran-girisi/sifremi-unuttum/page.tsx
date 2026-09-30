import type { Metadata } from "next";
import SifremiUnuttumClient from "./SifremiUnuttumClient";

export const metadata: Metadata = { title: "Şifremi Unuttum" };

export default function RestoranSifremiUnuttumSayfasi() {
  return <SifremiUnuttumClient />;
}
