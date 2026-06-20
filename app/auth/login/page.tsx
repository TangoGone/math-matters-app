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
  { symbol: "∫", x: 12, y: 18, size: 28, duration: 18, delay: 0 },
  { symbol: "π", x: 78, y: 22, size: 24, duration: 22, delay: 2 },
  { symbol: "∑", x: 55, y: 12, size: 26, duration: 20, delay: 4 },
  { symbol: "√", x: 82, y: 55, size: 22, duration: 25, delay: 1 },
  { symbol: "x²", x: 8, y: 58, size: 20, duration: 17, delay: 6 },
  { symbol: "∞", x: 88, y: 38, size: 26, duration: 23, delay: 3 },
  { symbol: "θ", x: 18, y: 78, size: 20, duration: 19, delay: 8 },
  { symbol: "Δ", x: 70, y: 75, size: 24, duration: 21, delay: 5 },
  { symbol: "≠", x: 35, y: 8, size: 20, duration: 24, delay: 7 },
  { symbol: "λ", x: 92, y: 68, size: 22, duration: 16, delay: 2 },
  { symbol: "±", x: 5, y: 38, size: 22, duration: 20, delay: 9 },
  { symbol: "∂", x: 62, y: 82, size: 20, duration: 26, delay: 4 },
  { symbol: "α", x: 45, y: 88, size: 18, duration: 18, delay: 11 },
  { symbol: "β", x: 25, y: 45, size: 20, duration: 22, delay: 6 },
  { symbol: "y=mx+b", x: 58, y: 5, size: 14, duration: 19, delay: 13 },
  { symbol: "∈", x: 15, y: 92, size: 18, duration: 23, delay: 3 },
  { symbol: "∏", x: 85, y: 85, size: 22, duration: 21, delay: 10 },
  { symbol: "≈", x: 42, y: 78, size: 18, duration: 17, delay: 8 },
  { symbol: "φ", x: 5, y: 15, size: 22, duration: 25, delay: 1 },
  { symbol: "π≈3.14", x: 72, y: 92, size: 13, duration: 20, delay: 14 },
]

function MathTree() {
  return (
    <svg
      viewBox="0 0 400 520"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        maxWidth: 340,
        filter: "drop-shadow(0 0 40px rgba(255,255,255,0.04))",
      }}
    >
      <style>{`
        @keyframes sway {
          0%   { transform: rotate(0deg); transform-origin: 50% 100%; }
          25%  { transform: rotate(1.2deg); transform-origin: 50% 100%; }
          75%  { transform: rotate(-1.2deg); transform-origin: 50% 100%; }
          100% { transform: rotate(0deg); transform-origin: 50% 100%; }
        }
        @keyframes swayBranch {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(1.8deg); }
          75%  { transform: rotate(-1.8deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes swayLeaf {
          0%   { transform: rotate(0deg); }
          33%  { transform: rotate(2.5deg); }
          66%  { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        .tree-root { animation: sway 6s ease-in-out infinite; }
        .branch-l { animation: swayBranch 5s ease-in-out 0.3s infinite; transform-origin: 50% 80%; }
        .branch-r { animation: swayBranch 5.5s ease-in-out 0.1s infinite; transform-origin: 50% 80%; }
        .canopy { animation: swayLeaf 4.5s ease-in-out 0.5s infinite; transform-origin: 50% 70%; }
      `}</style>

      <g className="tree-root">
        {/* Trunk */}
        <path
          d="M185 490 C183 460 180 430 182 400 C184 370 188 350 190 320 C192 290 190 270 192 250"
          stroke="oklch(0.85 0 0)"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M215 490 C217 460 220 430 218 400 C216 370 212 350 210 320 C208 290 210 270 208 250"
          stroke="oklch(0.85 0 0)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Root flares */}
        <path d="M185 490 C175 488 160 492 150 495" stroke="oklch(0.75 0 0)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M215 490 C225 488 240 492 250 495" stroke="oklch(0.75 0 0)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M192 485 C185 490 172 498 162 502" stroke="oklch(0.75 0 0)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M208 485 C215 490 228 498 238 502" stroke="oklch(0.75 0 0)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.5" />

        <g className="branch-l">
          {/* Left main branches */}
          <path d="M190 310 C170 290 145 265 120 245" stroke="oklch(0.82 0 0)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M188 280 C162 255 138 235 108 218" stroke="oklch(0.80 0 0)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M186 255 C165 232 148 210 130 188" stroke="oklch(0.78 0 0)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* Left sub-branches */}
          <path d="M120 245 C100 228 85 210 72 192" stroke="oklch(0.78 0 0)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M120 245 C108 225 100 205 98 185" stroke="oklch(0.76 0 0)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M108 218 C90 200 75 182 62 165" stroke="oklch(0.76 0 0)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M130 188 C115 170 102 152 95 132" stroke="oklch(0.74 0 0)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* Left twigs */}
          <path d="M72 192 C60 178 52 162 48 145" stroke="oklch(0.72 0 0)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M72 192 C65 175 62 158 65 140" stroke="oklch(0.72 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M62 165 C50 150 42 133 38 115" stroke="oklch(0.70 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M62 165 C55 148 52 130 55 112" stroke="oklch(0.70 0 0)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d="M95 132 C85 115 78 98 78 80" stroke="oklch(0.70 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M95 132 C88 114 88 95 92 78" stroke="oklch(0.70 0 0)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
        </g>

        <g className="branch-r">
          {/* Right main branches */}
          <path d="M210 310 C230 290 255 265 280 245" stroke="oklch(0.82 0 0)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M212 280 C238 255 262 235 292 218" stroke="oklch(0.80 0 0)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M214 255 C235 232 252 210 270 188" stroke="oklch(0.78 0 0)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.7" />

          {/* Right sub-branches */}
          <path d="M280 245 C300 228 315 210 328 192" stroke="oklch(0.78 0 0)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M280 245 C292 225 300 205 302 185" stroke="oklch(0.76 0 0)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M292 218 C310 200 325 182 338 165" stroke="oklch(0.76 0 0)" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.65" />
          <path d="M270 188 C285 170 298 152 305 132" stroke="oklch(0.74 0 0)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* Right twigs */}
          <path d="M328 192 C340 178 348 162 352 145" stroke="oklch(0.72 0 0)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M328 192 C335 175 338 158 335 140" stroke="oklch(0.72 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M338 165 C350 150 358 133 362 115" stroke="oklch(0.70 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M338 165 C345 148 348 130 345 112" stroke="oklch(0.70 0 0)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
          <path d="M305 132 C315 115 322 98 322 80" stroke="oklch(0.70 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M305 132 C312 114 312 95 308 78" stroke="oklch(0.70 0 0)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
        </g>

        <g className="canopy">
          {/* Center top branches */}
          <path d="M200 250 C200 225 198 200 196 175" stroke="oklch(0.80 0 0)" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M196 175 C192 150 188 128 185 105" stroke="oklch(0.78 0 0)" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M185 105 C180 85 175 65 172 45" stroke="oklch(0.74 0 0)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
          <path d="M185 105 C188 85 190 65 188 45" stroke="oklch(0.72 0 0)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M196 175 C202 150 208 128 212 105" stroke="oklch(0.78 0 0)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M212 105 C215 85 218 65 215 45" stroke="oklch(0.72 0 0)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M212 105 C218 85 222 65 225 45" stroke="oklch(0.70 0 0)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
        </g>
      </g>

      {/* Math Matters text at the bottom */}
      <text
        x="200"
        y="516"
        textAnchor="middle"
        fill="oklch(0.85 0 0)"
        fontSize="18"
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="6"
        opacity="0.7"
        fontWeight="300"
      >
        MATH MATTERS
      </text>
    </svg>
  )
}

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
      {/* Left panel */}
      <div className="hidden lg:flex relative flex-col items-center justify-center overflow-hidden bg-[oklch(0.12_0.02_260)]">

        <style>{`
          @keyframes floatDrift {
            0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
            10%  { opacity: 1; }
            45%  { transform: translateY(-22px) translateX(8px); opacity: 0.22; }
            55%  { transform: translateY(-26px) translateX(5px); opacity: 0.22; }
            90%  { opacity: 1; }
            100% { transform: translateY(0px) translateX(0px); opacity: 0; }
          }
        `}</style>

        {/* Floating math symbols */}
        <div className="absolute inset-0 pointer-events-none select-none">
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

        {/* Tree */}
        <div className="relative z-10 flex items-center justify-center w-full h-full px-8">
          <MathTree />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
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