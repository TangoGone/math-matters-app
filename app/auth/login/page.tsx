"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, GraduationCap } from "lucide-react"

export const dynamic = 'force-dynamic'

const MATH_SYMBOLS = [
  { symbol: "∫", x: 8, y: 15, size: 48, duration: 18, delay: 0 },
  { symbol: "π", x: 20, y: 70, size: 36, duration: 22, delay: 2 },
  { symbol: "∑", x: 55, y: 20, size: 42, duration: 20, delay: 4 },
  { symbol: "√", x: 75, y: 60, size: 38, duration: 25, delay: 1 },
  { symbol: "x²", x: 40, y: 45, size: 30, duration: 17, delay: 6 },
  { symbol: "∞", x: 85, y: 30, size: 44, duration: 23, delay: 3 },
  { symbol: "θ", x: 15, y: 88, size: 32, duration: 19, delay: 8 },
  { symbol: "Δ", x: 65, y: 80, size: 40, duration: 21, delay: 5 },
  { symbol: "≠", x: 30, y: 35, size: 34, duration: 24, delay: 7 },
  { symbol: "λ", x: 90, y: 75, size: 36, duration: 16, delay: 2 },
  { symbol: "±", x: 48, y: 88, size: 38, duration: 20, delay: 9 },
  { symbol: "∂", x: 72, y: 12, size: 32, duration: 26, delay: 4 },
  { symbol: "α", x: 5, y: 50, size: 30, duration: 18, delay: 11 },
  { symbol: "β", x: 35, y: 65, size: 34, duration: 22, delay: 6 },
  { symbol: "∇", x: 60, y: 45, size: 40, duration: 19, delay: 13 },
  { symbol: "∈", x: 25, y: 10, size: 28, duration: 23, delay: 3 },
  { symbol: "∏", x: 80, y: 50, size: 36, duration: 21, delay: 10 },
  { symbol: "≈", x: 50, y: 5, size: 32, duration: 17, delay: 8 },
  { symbol: "φ", x: 12, y: 35, size: 38, duration: 25, delay: 1 },
  { symbol: "ω", x: 42, y: 75, size: 30, duration: 20, delay: 14 },
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel — animated math background */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 overflow-hidden bg-[oklch(0.175_0_0)]">

        {/* Animated symbols */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <style>{`
            @keyframes floatDrift {
              0%   { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
              10%  { opacity: 1; }
              45%  { transform: translateY(-28px) translateX(12px) rotate(4deg); opacity: 0.18; }
              55%  { transform: translateY(-32px) translateX(8px) rotate(-2deg); opacity: 0.18; }
              90%  { opacity: 1; }
              100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
            }
          `}</style>
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
                fontWeight: 300,
                lineHeight: 1,
                opacity: 0,
                userSelect: "none",
              }}
            >
              {item.symbol}
            </span>
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-white">Math Matters</span>
        </div>

        {/* Center text */}
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Tutoring Management Platform
          </p>
          <h2 className="text-5xl font-bold text-white leading-tight">
            Where math<br />clicks.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Connecting students with tutors, tracking progress, and building confidence — one session at a time.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { label: "Active Tutors", value: "50+" },
            { label: "Sessions Run", value: "200+" },
            { label: "Students Helped", value: "150+" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">Math Matters</span>
        </div>

        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
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
        </div>
      </div>
    </div>
  )
}