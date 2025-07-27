import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AOQI Game",
  description: "AOQI Game - Thế giới linh thú",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
            <footer style={{background:'#2196f3',color:'#fff',textAlign:'center',padding:'12px 0',marginTop:30,fontSize:'1em'}}>
              © 2024 AOQI GAME | <a href="#" style={{color:'#ffd600',textDecoration:'underline'}}>Liên hệ</a>
            </footer>
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
