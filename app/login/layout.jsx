"use client";
import { SessionProvider } from "next-auth/react";

export default function LoginLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
