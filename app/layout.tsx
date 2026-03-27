import "./globals.css";
import ClientLayout from "./ClientLayout";
import { Providers } from "./providers";
import CyberCursor from '@/components/CyberCursor';

export const metadata = {
  title: "Code For Cause | Kali v2.0",
  description: "EC Department HackerSpace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#0a0b10", overflowX: 'hidden' }}>
        
        {/* --- GLOBAL CYBER CURSOR OVERLAY --- */}
        <CyberCursor />
        
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        
      </body>
    </html>
  );
}