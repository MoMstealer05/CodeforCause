import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { db } from "@/lib/firebase";

// --- TYPESCRIPT OVERRIDE ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  // Link to your Firebase Firestore
  adapter: FirestoreAdapter(db as any), 

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allows linking Google to an existing email/password account if emails match
      allowDangerousEmailAccountLinking: true, 
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Manual login logic (used for local testing or secondary admin access)
        if (credentials?.email) {
          return { 
            id: credentials.email, 
            email: credentials.email, 
            name: "Root Admin" 
          };
        }
        return null;
      }
    })
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // 1. 🛡️ STRICT FILTER: Only allow CHARUSAT emails for Google Auth
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        const isCharusat = email?.endsWith("@charusat.edu.in");
        
        if (!isCharusat) {
          console.log(`[ AUTH_DENIED ]: ${email} is not a valid @charusat.edu.in account.`);
          return false; 
        }
      }
      return true;
    },

    // 2. JWT Callback: Passes user info to the token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },

    // 3. Session Callback: Synchronizes token data to the frontend session object
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
      }
      return session;
    },

    // 4. Redirect Logic: Prevents the "callback loop" on Vercel
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login", // Redirects any Auth errors back to your custom terminal login
  },
});

export { handler as GET, handler as POST };