"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileModal } from "@/components/profile-modal"
import { Search, X, ArrowRight } from "lucide-react"

export default function CodirectorPage() {
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [pairings, setPairings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)

  // Search state
  const [tutorSearch, setTutorSearch] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [tutorResults, setTutorResults] = useState<any[]>([])
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [selectedTutor, setSelectedTutor] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [pairing, setPairing] = useState(false)

  useEffect(() => { loadSession() }, [])

  useEffect(() => {
    if (!tutorSearch.trim()) { setTutorResults([]); return }
    const t = setTimeout(() => searchTutors(tutorSearch), 250)
    return () => clearTimeout(t)
  }, [tutorSearch])

  useEffect(() => {
    if (!studentSearch.trim()) { setStudentResults([]); return }
    const t = setTimeout(() => searchStudents(studentSearch), 250)
    return () => clearTimeout(t)
  }, [studentSearch])

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
      .maybeSingle()

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
    setLoading(false)
  }

  async function searchTutors(query: string) {
    const pairedTutorIds = pairings.map((p: any) => p.tutor_profile_id)

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "tutor")
      .eq("approval_status", "approved")
      .ilike("full_name", `%${query}%`)
      .limit(8)

    setTutorResults((data || []).filter(t => !pairedTutorIds.includes(t.id)))
  }

  async function searchStudents(query: string) {
    const pairedStudentIds = pairings.map((p: any) => p.student_profile_id)

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "student")
      .eq("approval_status", "approved")
      .ilike("full_name", `%${query}%`)
      .limit(8)

    setStudentResults((data || []).filter(s => !pairedStudentIds.includes(s.id)))
  }

  async function handlePair() {
    if (!selectedTutor || !selectedStudent || !session) return
    setPairing(true)

    await supabase.from("pairings").insert({
      session_id: session.id,
      tutor_profile_id: selectedTutor.id,
      student_profile_id: selectedStudent.id,
      created_by: currentProfile?.id,
    })

    setSelectedTutor(null)
    setSelectedStudent(null)
    setTutorSearch("")
    setStudentSearch("")
    setTutorResults([])
    setStudentResults([])
    await loadSession()
    setPairing(false)
  }

  async function handleUnpair(pairingId: string) {
    await supabase.from("pairings").delete().eq("id", pairingId)
    await loadSession()
  }

  function Avatar({ profile, color = "blue" }: { profile: any, color?: string }) {
    const colors: any = {
      blue: "bg-blue-500/20 text-blue-400",
      green: "bg-green-500/20 text-green-400",
    }
    return (
      <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold shrink-0 ${colors[color]}`}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          profile?.full_name?.charAt(0)
        )}
      </div>
    )
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading session...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Session Manager</h2>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Today's Pairings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Today's Pairings
            {pairings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pairings.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pairings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pairings yet for today.</p>
          ) : (
            <div className="space-y-2">
              {pairings.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setViewingProfileId(p.tutor?.id)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0"
                    >
                      <Avatar profile={p.tutor} color="blue" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {p.tutor?.full_name}
                      </span>
                    </button>

                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

                    <button
                      onClick={() => setViewingProfileId(p.student?.id)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0"
                    >
                      <Avatar profile={p.student} color="green" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {p.student?.full_name}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {p.progress_reports?.length > 0 ? (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 border">
                        ✓ Report in
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 border">
                        ⏳ Pending
                      </Badge>
                    )}
                    <button
                      onClick={() => handleUnpair(p.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Pairing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Pairing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tutor search */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Tutor</p>
              {selectedTutor ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Avatar profile={selectedTutor} color="blue" />
                    <span className="text-sm font-medium text-foreground">{selectedTutor.full_name}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedTutor(null); setTutorSearch("") }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors..."
                    value={tutorSearch}
                    onChange={(e) => setTutorSearch(e.target.value)}
                    className="pl-9"
                  />
                  {tutorResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full z-10 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                      {tutorResults.map((tutor) => (
                        <button
                          key={tutor.id}
                          onClick={() => { setSelectedTutor(tutor); setTutorSearch(""); setTutorResults([]) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                        >
                          <Avatar profile={tutor} color="blue" />
                          <span className="text-foreground">{tutor.full_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {tutorSearch && tutorResults.length === 0 && (
                    <div className="absolute top-full mt-1 w-full z-10 bg-popover border border-border rounded-lg shadow-lg px-3 py-2.5">
                      <p className="text-sm text-muted-foreground">No available tutors found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Student search */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Student</p>
              {selectedStudent ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Avatar profile={selectedStudent} color="green" />
                    <span className="text-sm font-medium text-foreground">{selectedStudent.full_name}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedStudent(null); setStudentSearch("") }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full z-10 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => { setSelectedStudent(student); setStudentSearch(""); setStudentResults([]) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                        >
                          <Avatar profile={student} color="green" />
                          <span className="text-foreground">{student.full_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {studentSearch && studentResults.length === 0 && (
                    <div className="absolute top-full mt-1 w-full z-10 bg-popover border border-border rounded-lg shadow-lg px-3 py-2.5">
                      <p className="text-sm text-muted-foreground">No available students found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedTutor && selectedStudent && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <Avatar profile={selectedTutor} color="blue" />
              <span className="text-sm font-medium text-foreground">{selectedTutor.full_name}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Avatar profile={selectedStudent} color="green" />
              <span className="text-sm font-medium text-foreground">{selectedStudent.full_name}</span>
            </div>
          )}

          <Button
            onClick={handlePair}
            disabled={!selectedTutor || !selectedStudent || pairing}
            className="w-full"
          >
            {pairing ? "Creating pairing..." : "Pair Together"}
          </Button>
        </CardContent>
      </Card>

      <ProfileModal profileId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
    </div>
  )
}