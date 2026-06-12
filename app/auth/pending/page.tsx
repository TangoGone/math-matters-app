"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function PendingPage() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 border-r border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold text-lg">Math Matters</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Almost there.
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-sm">
            Your account is being reviewed. You'll get access as soon as an administrator approves your profile.
          </p>
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Math Matters. All rights reserved.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-orange-950 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Pending approval</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your account has been submitted and is waiting for administrator approval. Check back soon.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}