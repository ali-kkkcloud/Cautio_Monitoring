import { SessionProvider } from "./session-provider";

export default function DashboardLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
