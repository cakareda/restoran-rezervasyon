import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

const GONDEREN_ADRES = process.env.RESEND_FROM_EPOSTA ?? "onboarding@resend.dev";

export const GONDEREN_EPOSTA = `Masadaki <${GONDEREN_ADRES}>`;
