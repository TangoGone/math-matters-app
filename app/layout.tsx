import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const fontSans = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-sans",
});

const fontMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Math Matters",
  description: "Tutoring management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}