import "./globals.css";
import ClientLayout from "./ClientLayout";
import { Providers } from "./providers";
import CyberCursor from '@/components/CyberCursor';

export const metadata = {
  title: "Code For Cause",
  description: "EC Department",
  viewport: "width=device-width, initial-scale=1"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
     <body style={{ margin: 0, backgroundColor: "#0a0b10", overflowX: 'hidden', width: '100%' }}>
        
        {/* --- GLOBAL CYBER CURSOR OVERLAY --- */}
        <CyberCursor />
        
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        
      </body>
    </html>
  );
}