"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<"account" | "claim">("account")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAccountStep() {
    setError("")
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
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

  async function handleClaim() {
    if (!selectedProfile) {
      setError("Please select your profile from the list.")
      return
    }
    setError("")
    setLoading(true)

    // Create the auth account
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
      return
    }

    // Link the auth user to the claimed profile
    const { error: claimError } = await supabase
      .from("profiles")
      .update({
        user_id: data.user.id,
        email: email,
        approval_status: "pending",
        claimed_at: new Date().toISOString(),
      })
      .eq("id", selectedProfile.id)

    if (claimError) {
      setError("Failed to claim profile. Please try again.")
      setLoading(false)
      return
    }

    router.push("/auth/pending")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Math Matters</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Create your account</p>
        </div>

        <Card>
          {step === "account" ? (
            <>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Enter your email and choose a password</CardDescription>
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
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" onClick={handleAccountStep}>
                  Continue
                </Button>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <a href="/auth/login" className="text-blue-600 hover:underline font-medium">
                    Sign in
                  </a>
                </p>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Claim your profile</CardTitle>
                <CardDescription>
                  Search for your name in our roster and select your profile
                </CardDescription>
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
                  <div className="border rounded-md divide-y dark:border-gray-800 dark:divide-gray-800">
                    {results.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                          selectedProfile?.id === profile.id
                            ? "bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {profile.full_name}
                        </div>
                        <div className="text-gray-500 capitalize">{profile.role || "Unassigned"}</div>
                      </button>
                    ))}
                  </div>
                )}

                {results.length === 0 && search && !loading && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No unclaimed profiles found. Contact an administrator.
                  </p>
                )}

                {selectedProfile && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md px-4 py-3 text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      Selected: {selectedProfile.full_name}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={handleClaim}
                  disabled={loading || !selectedProfile}
                >
                  {loading ? "Creating account..." : "Claim profile & sign up"}
                </Button>
                <button
                  onClick={() => setStep("account")}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Back
                </button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}