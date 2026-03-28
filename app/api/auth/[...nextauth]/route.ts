import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { db } from "@/lib/firebase";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  adapter: FirestoreAdapter(db as any), 
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, 
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return { 
            id: credentials.email, 
            email: credentials.email, 
            name: credentials.email.split('@')[0] // 🎯 Dynamic name for initials
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return !!user.email?.endsWith("@charusat.edu.in"); 
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.id = user.id;
        token.name = user.name; // 🎯 Capture name here
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
        session.user.name = token.name as string; // 🎯 Pass name here
      }
      return session;
    },
    // 🎯 FIX: The Loop Breaker
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  debug: true, // Keep this on so you can see errors in Vercel Logs
});

export { handler as GET, handler as POST };