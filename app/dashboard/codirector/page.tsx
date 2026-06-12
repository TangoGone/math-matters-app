"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileModal } from "@/components/profile-modal" // ✅ ADDED

export default function CodirectorPage() {
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [pairings, setPairings] = useState<any[]>([])
  const [unpairedTutors, setUnpairedTutors] = useState<any[]>([])
  const [unpairedStudents, setUnpairedStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [pairing, setPairing] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null) // ✅ ADDED

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()
    setCurrentProfile(profile)

    const today = new Date().toISOString().split("T")[0]

    let { data: existingSession } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_date", today)
      .single()

    if (!existingSession) {
      const { data: newSession } = await supabase
        .from("sessions")
        .insert({ session_date: today })
        .select()
        .single()
      existingSession = newSession
    }

    setSession(existingSession)

    const { data: pairingData } = await supabase
      .from("pairings")
      .select(`
        *,
        tutor:tutor_profile_id(id, full_name, avatar_url),
        student:student_profile_id(id, full_name, avatar_url),
        progress_reports(id)
      `)
      .eq("session_id", existingSession.id)

    setPairings(pairingData || [])

    const { data: allTutors } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "tutor")
      .eq("approval_status", "approved")

    const { data: allStudents } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "student")
      .eq("approval_status", "approved")

    const pairedTutorIds = (pairingData || []).map((p: any) => p.tutor_profile_id)
    const pairedStudentIds = (pairingData || []).map((p: any) => p.student_profile_id)

    setUnpairedTutors((allTutors || []).filter(t => !pairedTutorIds.includes(t.id)))
    setUnpairedStudents((allStudents || []).filter(s => !pairedStudentIds.includes(s.id)))

    setLoading(false)
  }

  async function handlePair() {
    if (!selectedTutor || !selectedStudent || !session) return
    setPairing(true)

    await supabase.from("pairings").insert({
      session_id: session.id,
      tutor_profile_id: selectedTutor,
      student_profile_id: selectedStudent,
      created_by: currentProfile?.id,
    })

    setSelectedTutor(null)
    setSelectedStudent(null)
    await loadSession()
    setPairing(false)
  }

  async function handleUnpair(pairingId: string) {
    await supabase.from("pairings").delete().eq("id", pairingId)
    await loadSession()
  }

  if (loading) return <p className="text-gray-500">Loading session...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Manager</h2>
      </div>

      {/* Create Pairing */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Pairing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ✅ UPDATED TUTORS LIST */}
            <div>
              <p className="text-sm font-medium mb-2">
                Unpaired Tutors ({unpairedTutors.length})
              </p>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {unpairedTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedTutor === tutor.id
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedTutor(tutor.id)}
                      className="flex-1 text-left"
                    >
                      {tutor.full_name}
                    </button>

                    <button
                      onClick={() => setViewingProfileId(tutor.id)}
                      className="text-xs text-gray-400 hover:text-blue-500 ml-2"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ UPDATED STUDENTS LIST */}
            <div>
              <p className="text-sm font-medium mb-2">
                Unpaired Students ({unpairedStudents.length})
              </p>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {unpairedStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedStudent === student.id
                        ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedStudent(student.id)}
                      className="flex-1 text-left"
                    >
                      {student.full_name}
                    </button>

                    <button
                      onClick={() => setViewingProfileId(student.id)}
                      className="text-xs text-gray-400 hover:text-blue-500 ml-2"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <Button
            onClick={handlePair}
            disabled={!selectedTutor || !selectedStudent || pairing}
            className="w-full"
          >
            {pairing ? "Creating pairing..." : "Pair Together"}
          </Button>

        </CardContent>
      </Card>

      {/* ✅ MODAL ADDED */}
      <ProfileModal
        profileId={viewingProfileId}
        onClose={() => setViewingProfileId(null)}
      />

    </div>
  )
}