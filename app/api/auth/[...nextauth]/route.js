import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { EMPLOYEES, getPasswordMap } from "@/lib/employees";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const passwordMap = getPasswordMap();
        const normName = credentials.username.trim().toLowerCase();
        const storedPass = passwordMap[normName];
        if (!storedPass || storedPass !== credentials.password.trim()) return null;
        const emp = EMPLOYEES.find(e => e.name.toLowerCase() === normName);
        if (!emp) return null;
        return {
          id: emp.name,
          name: emp.name,
          email: `${emp.name.toLowerCase()}@fleet.local`,
          shift: { start: emp.start, end: emp.end, isNight: emp.isNight },
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.employeeName = user.name;
        token.shift = user.shift;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.employeeName = token.employeeName;
      session.user.shift = token.shift;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
