import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import type { UserRole } from "@/types";

// Anti-brute-force: лимит попыток входа на email-адрес.
// 8 неудач за 15 минут → блокировка на 15 минут.
const MAX_FAILS = 8;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { fails: number; firstAt: number; lockedUntil: number }>();

function recordFailure(emailKey: string) {
  const now = Date.now();
  const entry = loginAttempts.get(emailKey);
  if (!entry || now - entry.firstAt > FAIL_WINDOW_MS) {
    loginAttempts.set(emailKey, { fails: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  entry.fails += 1;
  if (entry.fails >= MAX_FAILS) {
    entry.lockedUntil = now + LOCK_MS;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Self-hosted за reverse-proxy: доверяем заголовку Host (X-Forwarded-Host).
  // Иначе Auth.js v5 по-умолчанию отклоняет всё что не равно NEXTAUTH_URL.
  trustHost: true,
  // По умолчанию в production Auth.js использует `__Secure-` cookies (только https).
  // Когда сайт временно открыт по http (например — http://IP пока DNS/SSL не готов),
  // secure-куки не сохраняются, CSRF теряется. Явно отключаем secure если AUTH_URL
  // не https. На проде с SSL — снова true.
  useSecureCookies: (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://"),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Anti-brute-force: задержка ~600мс на каждый запрос. Это в 100 раз
        // замедляет перебор и не мешает реальному пользователю.
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        if (!credentials?.email || !credentials?.password) {
          await sleep(600);
          return null;
        }

        // Rate-limit по email: после 8 неудачных попыток за 15 минут — лочим.
        // Хранилище — модуль-уровень для одиночного процесса (для кластера
        // переехать на Redis).
        const emailKey = String(credentials.email).toLowerCase();
        const now = Date.now();
        const entry = loginAttempts.get(emailKey);
        if (entry && entry.lockedUntil > now) {
          await sleep(600);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || user.status !== "ACTIVE") {
          recordFailure(emailKey);
          await sleep(600);
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) {
          recordFailure(emailKey);
          await sleep(600);
          return null;
        }

        loginAttempts.delete(emailKey);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
