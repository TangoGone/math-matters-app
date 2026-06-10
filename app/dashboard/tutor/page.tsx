"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function TutorPage() {
  const supabase = createClient()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [pairing, setPairing] = useState<any>(null)
  const [unpairedStudents, setUnpairedStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

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

    if (todaySession) {
      // Check if this tutor already has a pairing today
      const { data: existingPairing } = await supabase
        .from("pairings")
        .select(`
          *,
          student:student_profile_id(id, full_name, avatar_url),
          progress_reports(id)
        `)
        .eq("session_id", todaySession.id)
        .eq("tutor_profile_id", profile.id)
        .single()

      setPairing(existingPairing || null)

      if (!existingPairing) {
        // Get unpaired students
        const { data: allPairings } = await supabase
          .from("pairings")
          .select("student_profile_id")
          .eq("session_id", todaySession.id)

        const pairedStudentIds = (allPairings || []).map((p: any) => p.student_profile_id)

        const { data: students } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "student")
          .eq("approval_status", "approved")

        setUnpairedStudents(
          (students || []).filter(s => !pairedStudentIds.includes(s.id))
        )
      }
    }

    setLoading(false)
  }

  async function handleClaimStudent() {
    if (!selectedStudent || !session || !currentProfile) return
    setClaiming(true)

    await supabase.from("pairings").insert({
      session_id: session.id,
      tutor_profile_id: currentProfile.id,
      student_profile_id: selectedStudent,
      created_by: currentProfile.id,
    })

    await loadData()
    setClaiming(false)
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Today's Session
        </h2>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {!session ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No session scheduled for today.</p>
          </CardContent>
        </Card>
      ) : pairing ? (
        <>
          {/* Active pairing */}
          <Card>
            <CardHeader>
              <CardTitle>Your Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xl font-bold text-green-700 dark:text-green-300">
                  {pairing.student?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {pairing.student?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">Paired for today's session</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress report status */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Report</CardTitle>
            </CardHeader>
            <CardContent>
              {pairing.progress_reports?.length > 0 ? (
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    ✓ Submitted
                  </Badge>
                  <p className="text-sm text-gray-500">
                    You've already submitted a report for today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      ⏳ Not submitted
                    </Badge>
                    <p className="text-sm text-gray-500">
                      Please submit a progress report after your session.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/tutor/reports")}
                    className="w-full sm:w-auto"
                  >
                    Submit Progress Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* No pairing yet — claim a student */
        <Card>
          <CardHeader>
            <CardTitle>Claim Your Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              You haven't been paired yet. Select your student for today's session.
            </p>

            {unpairedStudents.length === 0 ? (
              <p className="text-sm text-gray-400">
                No unpaired students available. Contact your co-director.
              </p>
            ) : (
              <div className="space-y-1">
                {unpairedStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedStudent === student.id
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {student.full_name}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleClaimStudent}
              disabled={!selectedStudent || claiming}
              className="w-full"
            >
              {claiming ? "Claiming..." : "Claim Student"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}