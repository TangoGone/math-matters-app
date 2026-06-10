"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CodirectorHoursPage() {
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [tutors, setTutors] = useState<any[]>([])
  const [hours, setHours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

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

    setSession(todaySession)

    const { data: allTutors } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "tutor")
      .eq("approval_status", "approved")

    setTutors(allTutors || [])

    if (todaySession) {
      const { data: hoursData } = await supabase
        .from("hours")
        .select(`*, awarded_by:awarded_by_profile_id(full_name)`)
        .eq("session_id", todaySession.id)

      setHours(hoursData || [])
    }

    setLoading(false)
  }

  async function handleAwardHours(tutorId: string) {
    if (!session || !currentProfile) return
    setAwarding(tutorId)

    await supabase.from("hours").upsert({
      tutor_profile_id: tutorId,
      session_id: session.id,
      awarded_by_profile_id: currentProfile.id,
      prep_hours: 1,
      tutoring_hours: 1,
      awarded_at: new Date().toISOString(),
    }, {
      onConflict: "tutor_profile_id,session_id"
    })

    await loadData()
    setAwarding(null)
  }

  async function handleRevokeHours(tutorId: string) {
    if (!session) return
    await supabase
      .from("hours")
      .delete()
      .eq("tutor_profile_id", tutorId)
      .eq("session_id", session.id)
    await loadData()
  }

  function getHoursForTutor(tutorId: string) {
    return hours.find(h => h.tutor_profile_id === tutorId)
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Award Hours</h2>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {!session ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No session exists for today yet. Create one from the Session Manager first.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tutors</CardTitle>
          </CardHeader>
          <CardContent>
            {tutors.length === 0 ? (
              <p className="text-gray-500 text-sm">No approved tutors found.</p>
            ) : (
              <div className="space-y-3">
                {tutors.map((tutor) => {
                  const awarded = getHoursForTutor(tutor.id)
                  return (
                    <div
                      key={tutor.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                          {tutor.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {tutor.full_name}
                          </p>
                          {awarded && (
                            <p className="text-xs text-gray-500">
                              Awarded by {awarded.awarded_by?.full_name} · {awarded.prep_hours + awarded.tutoring_hours} hrs
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {awarded ? (
                          <>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              ✓ 2 hrs awarded
                            </Badge>
                            <button
                              onClick={() => handleRevokeHours(tutor.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Revoke
                            </button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAwardHours(tutor.id)}
                            disabled={awarding === tutor.id}
                          >
                            {awarding === tutor.id ? "..." : "Award 2 hrs"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}