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
  adapter: FirestoreAdapter(db as any), 

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allows linking Google to an existing email/password account
      allowDangerousEmailAccountLinking: true, 
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verification happens in the frontend; we pass it to the session here
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

  callbacks: {
    // 1. 🛡️ YOUR SECURITY GATE: Only allow CHARUSAT emails for Google
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return !!user.email?.endsWith("@charusat.edu.in"); 
      }
      return true;
    },

    // 2. JWT Callback: Required to pass user data to the session
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.id = user.id;
      }
      return token;
    },

    // 3. 🎯 YOUR SESSION SYNC: Ensures ClientLayout sees the email
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
      }
      return session;
    },

    async redirect({ baseUrl }) {
      return baseUrl; 
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };