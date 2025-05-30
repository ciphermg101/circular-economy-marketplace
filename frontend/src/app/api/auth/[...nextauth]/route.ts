import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import EmailProvider from 'next-auth/providers/email';
import { Session } from 'next-auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  accessToken?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT!),
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: account?.provider,
            providerAccountId: account?.providerAccountId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to authenticate with backend: ${errorData.message}`);
        }

        const data = await response.json();
        user.id = data.userId;
        return true;
      } catch (error) {
        console.error('Backend authentication failed:', error);
        return false;
      }
    },

    async session({ session, token }) {
      if (token) {
        const user = session.user as ExtendedSession['user'];
        if (user) {
          user.id = token.sub!;
        } else {
          session.user = {
            id: token.sub!,
            name: undefined,
            email: undefined,
            image: undefined,
          } as ExtendedSession['user'];
        }
        session.accessToken = token.accessToken as string;
      }
      return session as ExtendedSession;
    },

    async jwt({ token, account }) {
      if (account) {
        try {
          const response = await fetch(`${BACKEND_URL}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: token.sub,
              provider: account.provider,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to get backend token: ${errorData.message}`);
          }

          const data = await response.json();
          token.accessToken = data.accessToken;
        } catch (error) {
          console.error('Failed to get backend token:', error);
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
