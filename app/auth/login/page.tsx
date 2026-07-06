"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

const MATH_SYMBOLS = [
  { symbol: "∫", x: 5, y: 10, size: 52, duration: 18, delay: 0 },
  { symbol: "π", x: 88, y: 15, size: 44, duration: 22, delay: 2 },
  { symbol: "∑", x: 15, y: 75, size: 48, duration: 20, delay: 4 },
  { symbol: "√", x: 80, y: 70, size: 42, duration: 25, delay: 1 },
  { symbol: "x²", x: 92, y: 45, size: 34, duration: 17, delay: 6 },
  { symbol: "∞", x: 3, y: 50, size: 50, duration: 23, delay: 3 },
  { symbol: "θ", x: 72, y: 88, size: 36, duration: 19, delay: 8 },
  { symbol: "Δ", x: 25, y: 90, size: 44, duration: 21, delay: 5 },
  { symbol: "≠", x: 90, y: 88, size: 38, duration: 24, delay: 7 },
  { symbol: "λ", x: 8, y: 30, size: 40, duration: 16, delay: 2 },
  { symbol: "±", x: 82, y: 35, size: 42, duration: 20, delay: 9 },
  { symbol: "∂", x: 45, y: 5, size: 36, duration: 26, delay: 4 },
  { symbol: "α", x: 55, y: 92, size: 34, duration: 18, delay: 11 },
  { symbol: "β", x: 2, y: 88, size: 38, duration: 22, delay: 6 },
  { symbol: "∇", x: 95, y: 60, size: 44, duration: 19, delay: 13 },
  { symbol: "∈", x: 38, y: 95, size: 32, duration: 23, delay: 3 },
  { symbol: "∏", x: 70, y: 5, size: 40, duration: 21, delay: 10 },
  { symbol: "≈", x: 18, y: 5, size: 36, duration: 17, delay: 8 },
  { symbol: "φ", x: 93, y: 20, size: 42, duration: 25, delay: 1 },
  { symbol: "ω", x: 60, y: 96, size: 34, duration: 20, delay: 14 },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("user_id", data.user.id)
      .single()

    if (!profile) {
      setError("No profile found. Please contact an administrator.")
      setLoading(false)
      return
    }

    if (profile.approval_status === "pending") { router.push("/auth/pending"); return }
    if (profile.approval_status !== "approved") {
      setError("Your account has not been approved yet.")
      setLoading(false)
      return
    }

    switch (profile.role) {
      case "operator": router.push("/dashboard/operator"); break
      case "codirector": router.push("/dashboard/codirector"); break
      case "tutor": router.push("/dashboard/tutor"); break
      case "student": router.push("/dashboard/parent"); break
      default: router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">

      {/* Floating math symbols — full background */}
      <style>{`
        @keyframes floatDrift {
          0%   { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          45%  { transform: translateY(-30px) translateX(14px) rotate(3deg); opacity: 0.12; }
          55%  { transform: translateY(-34px) translateX(10px) rotate(-2deg); opacity: 0.12; }
          90%  { opacity: 1; }
          100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {MATH_SYMBOLS.map((item, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              animation: `floatDrift ${item.duration}s ease-in-out ${item.delay}s infinite`,
              color: "white",
              fontWeight: 200,
              lineHeight: 1,
              opacity: 0,
              userSelect: "none",
              fontFamily: "Georgia, serif",
            }}
          >
            {item.symbol}
          </span>
        ))}
      </div>

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-sm px-4 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="Math Matters"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              // Fallback if no logo uploaded yet
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Math Matters</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</>
              ) : "Sign in"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <a href="/auth/signup" className="text-primary hover:underline font-medium">
                Sign up
              </a>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Math Matters
        </p>
      </div>
    </div>
  )
}