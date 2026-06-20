"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { ProfileSurvey } from "@/components/profile-survey"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, GraduationCap, Check } from "lucide-react"

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

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<"account" | "claim" | "parent" | "survey">("account")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [isParent, setIsParent] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAccountStep() {
    setError("")
    if (!email || !password || !confirmPassword) { setError("Please fill in all fields."); return }
    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setStep("claim")
  }

  async function handleSearch() {
    if (!search.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, approval_status")
      .ilike("full_name", `%${search}%`)
      .is("user_id", null)
      .limit(10)
    setResults(data || [])
    setLoading(false)
  }

  function handleContinueFromClaim() {
    if (!selectedProfile) { setError("Please select your profile from the list."); return }
    setError("")
    if (selectedProfile.role === "student") {
      setStep("parent")
    } else {
      handleClaim()
    }
  }

  async function handleClaim() {
    setError("")
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) { setError(signupError.message); setLoading(false); return }
    if (!data.user) { setError("Something went wrong. Please try again."); setLoading(false); return }

    const updatePayload: any = {
      user_id: data.user.id,
      email,
      approval_status: "pending",
      claimed_at: new Date().toISOString(),
    }

    if (selectedProfile.role === "student") {
      updatePayload.is_parent = isParent
    }

    const { error: claimError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", selectedProfile.id)

    if (claimError) { setError("Failed to claim profile. Please try again."); setLoading(false); return }

    setLoading(false)

    if (selectedProfile.role === "tutor" || selectedProfile.role === "student") {
      setStep("survey")
    } else {
      router.push("/auth/pending")
    }
  }

  const currentStepIndex = step === "parent" ? 1 : ["account", "claim", "survey"].indexOf(step)

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

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Getting started
            </p>
            <h2 className="text-5xl font-bold text-white leading-tight">
              Join the Math<br />Matters community.
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Create your account, claim your profile, and get started in minutes.
            </p>
          </div>

          {/* Step indicators */}
          <div className="space-y-4">
            {[
              { label: "Create your account", desc: "Enter your email and password" },
              { label: "Claim your profile", desc: "Find your name in the roster" },
              { label: "Quick survey", desc: "Tell us a bit about yourself" },
            ].map((item, i) => {
              const done = i < currentStepIndex
              const active = i === currentStepIndex
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border transition-colors ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                        ? "border-primary text-primary bg-primary/10"
                        : "border-white/20 text-white/30"
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${active ? "text-white" : "text-white/50"}`}>
                      {item.label}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">
          © {new Date().getFullYear()} Math Matters. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">Math Matters</span>
        </div>

        <div className="w-full max-w-sm">
          {step === "account" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Create account</CardTitle>
                <CardDescription>Enter your details to get started</CardDescription>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAccountStep()}
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" onClick={handleAccountStep}>Continue</Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/auth/login" className="text-primary hover:underline font-medium">Sign in</a>
                </p>
              </CardFooter>
            </Card>
          )}

          {step === "claim" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Claim your profile</CardTitle>
                <CardDescription>Search for your name in our roster</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search your name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button variant="outline" onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {results.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden divide-y divide-border">
                    {results.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => { setSelectedProfile(profile); setError("") }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                          selectedProfile?.id === profile.id
                            ? "bg-primary/10"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-foreground">{profile.full_name}</p>
                          <p className="text-muted-foreground text-xs capitalize mt-0.5">
                            {profile.role || "Unassigned"}
                          </p>
                        </div>
                        {selectedProfile?.id === profile.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {results.length === 0 && search && !loading && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No unclaimed profiles found. Contact an administrator.
                  </p>
                )}

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleContinueFromClaim}
                  disabled={loading || !selectedProfile}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Working...</>
                  ) : "Continue"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("account")}>
                  Back
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === "parent" && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">One more thing</CardTitle>
                <CardDescription>Who's setting up this account?</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <button
                  onClick={() => setIsParent(true)}
                  className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                    isParent === true
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <p className="font-medium text-foreground">I'm a parent or guardian</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Setting this up on behalf of {selectedProfile?.full_name}
                  </p>
                </button>

                <button
                  onClick={() => setIsParent(false)}
                  className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                    isParent === false
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <p className="font-medium text-foreground">I'm the student</p>
                  <p className="text-muted-foreground text-xs mt-0.5">This is my own account</p>
                </button>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={isParent === null || loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</>
                  ) : "Continue"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep("claim")}>
                  Back
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === "survey" && selectedProfile && (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Just a few questions</CardTitle>
                <CardDescription>
                  This helps us pair {isParent ? "your child" : "you"} with the right{" "}
                  {selectedProfile.role === "tutor" ? "students" : "tutor"}.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ProfileSurvey
                  profileId={selectedProfile.id}
                  role={selectedProfile.role}
                  isParent={isParent}
                  onComplete={() => router.push("/auth/pending")}
                />
              </CardContent>

              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/auth/pending")}
                >
                  Skip for now
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}