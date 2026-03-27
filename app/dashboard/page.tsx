import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  // Check the bouncer list
  const session = await getServerSession(authOptions);

  // If they aren't logged in, instantly kick them to /login
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      
      {/* Background Cyber Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-causeCyan/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <div className="bg-brandCard/50 backdrop-blur-xl border border-causeCyan/20 p-10 rounded-3xl shadow-[0_0_40px_rgba(0,210,255,0.1)] max-w-2xl w-full z-10">
        
        <div className="w-20 h-20 bg-causeCyan/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-causeCyan/50 shadow-[0_0_15px_rgba(0,210,255,0.4)]">
          {/* Checkmark SVG */}
          <svg className="w-10 h-10 text-causeCyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-brandText mb-2">Welcome, {session.user?.name}</h1>
        <p className="text-causeCyan font-mono mb-8">{session.user?.email}</p>
        
        <p className="text-xl text-gray-400 mb-8">
          You successfully bypassed the bouncer using your official university ID. Your internal club tools will live here.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/" className="px-6 py-3 bg-brandBase text-gray-300 border border-brandCard hover:border-codeBlue hover:text-codeBlue rounded-xl font-semibold transition-all duration-300">
            Return to Home
          </Link>
          <Link href="/api/auth/signout" className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all duration-300">
            Log Out
          </Link>
        </div>
      </div>
    </main>
  );
}