import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgentLiveTicker } from "../components/AgentLiveTicker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Workspace",
  description: "Virtual Office and Orchestration for AI Agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#313338] text-white antialiased`}>
        {children}
        <AgentLiveTicker />
      </body>
    </html>
  );
}
