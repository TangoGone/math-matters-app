"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export const dynamic = 'force-dynamic'

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

  async function handleClaim() {
    if (!selectedProfile) { setError("Please select your profile from the list."); return }
    setError("")
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) { setError(signupError.message); setLoading(false); return }
    if (!data.user) { setError("Something went wrong. Please try again."); setLoading(false); return }

    const { error: claimError } = await supabase
      .from("profiles")
      .update({
        user_id: data.user.id,
        email,
        approval_status: "pending",
        claimed_at: new Date().toISOString(),
      })
      .eq("id", selectedProfile.id)

    if (claimError) { setError("Failed to claim profile. Please try again."); setLoading(false); return }
    router.push("/auth/pending")
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 dark:bg-black flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold text-lg">Math Matters</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="text-white/70 text-xs font-medium">Getting started</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Join the Math<br />Matters community.
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Create your account, claim your profile, and get started in minutes.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { step: "1", title: "Create your account", desc: "Enter your email and password" },
              { step: "2", title: "Claim your profile", desc: "Find your name in the roster" },
              { step: "3", title: "Wait for approval", desc: "An admin will verify your account" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  (item.step === "1" && step === "account") || (item.step === "2" && step === "claim")
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/40"
                }`}>
                  {item.step}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Math Matters. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex lg:hidden items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Math Matters</span>
          </div>

          {step === "account" ? (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your details to get started</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAccountStep()}
                    className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-3">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleAccountStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-all"
                >
                  Continue
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Claim your profile</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Search for your name in our roster</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    placeholder="Search your name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Search
                  </button>
                </div>

                {results.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {results.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                          selectedProfile?.id === profile.id
                            ? "bg-blue-50 dark:bg-blue-950"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{profile.full_name}</p>
                          <p className="text-gray-400 text-xs capitalize mt-0.5">{profile.role || "Unassigned"}</p>
                        </div>
                        {selectedProfile?.id === profile.id && (
                          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {results.length === 0 && search && !loading && (
                  <p className="text-sm text-gray-400 text-center py-3">
                    No unclaimed profiles found. Contact an administrator.
                  </p>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3.5 py-3">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleClaim}
                  disabled={loading || !selectedProfile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating account...
                    </>
                  ) : "Claim profile & sign up"}
                </button>

                <button
                  onClick={() => setStep("account")}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}