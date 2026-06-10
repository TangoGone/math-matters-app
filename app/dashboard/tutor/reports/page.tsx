"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function TutorReportsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [pairing, setPairing] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    topics_covered: "",
    engagement_rating: "3",
    went_well: "",
    needs_work: "",
    next_session_goals: "",
  })

  useEffect(() => {
    loadPairing()
  }, [])

  async function loadPairing() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()
    setCurrentProfile(profile)

    const today = new Date().toISOString().split("T")[0]

    const { data: todaySession } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_date", today)
      .single()

    if (!todaySession) { setLoading(false); return }

    const { data: existingPairing } = await supabase
      .from("pairings")
      .select(`
        *,
        student:student_profile_id(id, full_name),
        progress_reports(id)
      `)
      .eq("session_id", todaySession.id)
      .eq("tutor_profile_id", profile.id)
      .single()

    setPairing(existingPairing || null)
    setLoading(false)
  }

  async function handleSubmit() {
    if (!pairing) return
    setSubmitting(true)
    setError("")

    if (!form.topics_covered || !form.went_well || !form.needs_work || !form.next_session_goals) {
      setError("Please fill in all fields.")
      setSubmitting(false)
      return
    }

    const { error: submitError } = await supabase
      .from("progress_reports")
      .insert({
        pairing_id: pairing.id,
        topics_covered: form.topics_covered,
        engagement_rating: parseInt(form.engagement_rating),
        went_well: form.went_well,
        needs_work: form.needs_work,
        next_session_goals: form.next_session_goals,
      })

    if (submitError) {
      setError("Failed to submit report. Please try again.")
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  if (submitted) {
    return (
      <div className="space-y-6 max-w-xl">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-4xl">✅</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Report submitted!
            </p>
            <p className="text-sm text-gray-500">
              Your progress report for {pairing?.student?.full_name} has been saved.
            </p>
            <Button onClick={() => router.push("/dashboard/tutor")} variant="outline">
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!pairing) {
    return (
      <div className="space-y-6 max-w-xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              You don't have a pairing for today. You can only submit a report after being paired with a student.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pairing.progress_reports?.length > 0) {
    return (
      <div className="space-y-6 max-w-xl">
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Already submitted
            </p>
            <p className="text-sm text-gray-500">
              You've already submitted a progress report for today's session with {pairing.student?.full_name}.
            </p>
            <Button onClick={() => router.push("/dashboard/tutor")} variant="outline">
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Progress Report
        </h2>
        <p className="text-gray-500 mt-1">
          For {pairing.student?.full_name} ·{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label>Topics covered</Label>
            <Input
              placeholder="e.g. Fractions, long division"
              value={form.topics_covered}
              onChange={(e) => setForm({ ...form, topics_covered: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Engagement rating (1–5)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm({ ...form, engagement_rating: String(n) })}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    form.engagement_rating === String(n)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>What went well</Label>
            <textarea
              placeholder="Describe what the student did well..."
              value={form.went_well}
              onChange={(e) => setForm({ ...form, went_well: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>What needs work</Label>
            <textarea
              placeholder="Areas the student struggled with..."
              value={form.needs_work}
              onChange={(e) => setForm({ ...form, needs_work: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Goals for next session</Label>
            <textarea
              placeholder="What to focus on next time..."
              value={form.next_session_goals}
              onChange={(e) => setForm({ ...form, next_session_goals: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}