import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ChronoMap — Ghicește Epoca & Locul",
  description: "Călătorește prin istoria lumii și testează-ți cunoștințele ghicind anul și locația exactă a celor mai fascinante imagini istorice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${inter.variable} ${sora.variable} h-full`}>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#111318] text-white antialiased selection:bg-amber-400 selection:text-black"
      >
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
