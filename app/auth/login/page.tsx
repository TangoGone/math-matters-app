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

      <style>{`
        @keyframes floatDrift {
          0%   { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          45%  { transform: translateY(-30px) translateX(14px) rotate(3deg); opacity: 0.06; }
          55%  { transform: translateY(-34px) translateX(10px) rotate(-2deg); opacity: 0.06; }
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

      <div className="relative z-10 w-full max-w-sm px-4 space-y-6">
        {/* Logo only — no text */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Math Matters"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {}}
              type="button"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Apple */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {}}
              type="button"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
              </svg>
              Continue with Apple
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

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