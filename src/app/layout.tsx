import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Supervisor de Vendas | IA",
  description: "Dashboard inteligente para supervisão de vendas e atendimento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#050505] text-gray-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
