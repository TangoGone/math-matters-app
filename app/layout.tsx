import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Math Matters",
  description: "Tutoring management platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}