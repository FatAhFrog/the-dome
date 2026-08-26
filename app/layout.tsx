import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Dome",
  description: "A private hub for the group — chat, news, weather, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`}>
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
