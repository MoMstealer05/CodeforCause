import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; 

// --- TYPESCRIPT OVERRIDE ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  // 🎯 Adapter is intentionally left out to prevent the Admin SDK crash
  
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
        if (!credentials?.email || !credentials?.password) {
          return null; 
        }

        try {
          // 🎯 FIREBASE CHECK: Validates the password against the Firebase Auth database
          const userCredential = await signInWithEmailAndPassword(
            auth, 
            credentials.email, 
            credentials.password
          );
          
          const user = userCredential.user;

          // Passes the verified user to NextAuth
          return { 
            id: user.uid, 
            email: user.email, 
            name: user.email?.split('@')[0] || "User"
          };
        } catch (error: any) {
          console.error("FIREBASE_AUTH_FAILED:", error.code);
          return null; 
        }
      }
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        // 🎯 Blocks non-university Google accounts
        if (email && email.endsWith("@charusat.edu.in")) {
          return true;
        }
        return false; 
      }
      return true; // Allows Custom Credentials to pass through
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.id = user.id;
        token.picture = user.image;
        token.name = user.name; 
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
        session.user.image = token.picture as string;
        session.user.name = token.name as string; 
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  
  debug: true, 
});

export { handler as GET, handler as POST };