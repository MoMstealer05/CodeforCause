import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

declare module "next-auth" {
  interface Session {
    firebaseToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, 
      // 🚀 THE FIX: Forces Google to ignore the broken mobile cache 
      // and issue a fresh session token every time.
      authorization: {
        params: {
          prompt: "login",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email || (credentials as any)?.username;
        
        // Master Admin Bypass
        if (email === "23ec017@charusat.edu.in" && credentials?.password === "admin123") {
          return { id: email, email: email, name: "Master Admin" };
        }
        
        // Fallback Access
        if (email) {
          return { id: email, email: email, name: email.split('@')[0] };
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
        try {
          // Syncs Google User to your Firestore Database
          const userRef = doc(db, "users", user.id); 
          await setDoc(userRef, {
            displayName: user.name,
            email: user.email?.toLowerCase(),
            photoURL: user.image,
            role: "student",
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing Google User to Firestore:", error);
        }
      }
      return true;
    },
    async jwt({ token, user, profile, account }) {
      if (account?.provider === "google") {
        token.idToken = account.id_token; 
      }
      if (user) {
        token.email = user.email;
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image || (profile as any)?.picture; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
        session.firebaseToken = token.idToken as string | undefined; 
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Let NextAuth handle its own native routing
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };