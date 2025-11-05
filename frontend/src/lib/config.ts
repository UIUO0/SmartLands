// src/lib/config.ts
export const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://smartlands-production.up.railway.app";

export const COOKIE_NAME = process.env.COOKIE_NAME || "sl_token";
