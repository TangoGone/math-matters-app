"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { ProfileSurvey } from "@/components/profile-survey"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check } from "lucide-react"

export const dynamic = 'force-dynamic'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Math Matters</h1>
        </div>

        {step === "account" && (
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
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
              <Button className="w-full" onClick={handleAccountStep}>
                Continue
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <a href="/auth/login" className="text-primary hover:underline font-medium">Sign in</a>
              </p>
            </CardFooter>
          </Card>
        )}

        {step === "claim" && (
          <Card>
            <CardHeader>
              <CardTitle>Claim your profile</CardTitle>
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
                  Search
                </Button>
              </div>

              {results.length > 0 && (
                <div className="border rounded-md overflow-hidden divide-y">
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
                        <p className="text-muted-foreground text-xs capitalize mt-0.5">{profile.role || "Unassigned"}</p>
                      </div>
                      {selectedProfile?.id === profile.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.length === 0 && search && !loading && (
                <p className="text-sm text-muted-foreground text-center py-3">
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Working...
                  </>
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
            <CardHeader>
              <CardTitle>One more thing</CardTitle>
              <CardDescription>Who's setting up this account?</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <button
                onClick={() => setIsParent(true)}
                className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                  isParent === true ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <p className="font-medium text-foreground">I'm a parent or guardian</p>
                <p className="text-muted-foreground text-xs mt-0.5">Setting this up on behalf of {selectedProfile?.full_name}</p>
              </button>

              <button
                onClick={() => setIsParent(false)}
                className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                  isParent === false ? "border-primary bg-primary/5" : "hover:bg-accent"
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
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
            <CardHeader>
              <CardTitle>Just a few questions</CardTitle>
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
              <Button variant="ghost" className="w-full" onClick={() => router.push("/auth/pending")}>
                Skip for now
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}