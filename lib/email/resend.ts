import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export const GONDEREN_EPOSTA =
  process.env.RESEND_FROM_EPOSTA ?? "onboarding@resend.dev";
