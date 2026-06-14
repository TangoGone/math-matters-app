"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileModal } from "@/components/profile-modal"
import { SessionCalendar } from "@/components/session-calendar"
import { format } from "date-fns"

export default function TutorSessionsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [sessionsData, setSessionsData] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)

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

    // All pairings for this tutor with session date, student, and report
    const { data: pairings } = await supabase
      .from("pairings")
      .select(`
        id,
        session_id,
        session:session_id(id, session_date),
        student:student_profile_id(id, full_name, avatar_url),
        progress_reports(*)
      `)
      .eq("tutor_profile_id", profile.id)

    // All hours entries for this tutor (to find awarding co-director per session)
    const { data: hours } = await supabase
      .from("hours")
      .select(`
        session_id,
        awarded_by:awarded_by_profile_id(id, full_name, avatar_url, role)
      `)
      .eq("tutor_profile_id", profile.id)

    const hoursBySession = new Map(
      (hours || []).map((h: any) => [h.session_id, h.awarded_by])
    )

    const merged = (pairings || [])
      .filter((p: any) => p.session?.session_date)
      .map((p: any) => ({
        date: p.session.session_date,
        student: p.student,
        report: p.progress_reports?.[0] || null,
        codirector: hoursBySession.get(p.session_id) || null,
      }))
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))

    setSessionsData(merged)

    if (merged.length > 0) {
      setSelectedDate(merged[0].date)
    }

    setLoading(false)
  }

  function engagementLabel(rating: number) {
    switch (rating) {
      case 1: return { label: "Struggling", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" }
      case 2: return { label: "Below average", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" }
      case 3: return { label: "Average", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" }
      case 4: return { label: "Good", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" }
      case 5: return { label: "Excellent", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" }
      default: return { label: "Unknown", color: "bg-gray-100 text-gray-700" }
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  const highlightedDates = sessionsData.map((s) => s.date)
  const sessionsForDate = sessionsData.filter((s) => s.date === selectedDate)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Sessions</h2>
        <p className="text-gray-500 mt-1">A history of every session you've taught</p>
      </div>

      {sessionsData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No sessions yet. Once you're paired with a student, sessions will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <SessionCalendar
                highlightedDates={highlightedDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                accent="blue"
              />
              <p className="text-xs text-gray-400 mt-3 text-center">
                Highlighted days you taught a student
              </p>
            </CardContent>
          </Card>

          {selectedDate && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}
              </p>

              {sessionsForDate.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500 text-sm">No session found for this date.</p>
                  </CardContent>
                </Card>
              ) : (
                sessionsForDate.map((s, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-base">Session Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Student */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                          Student
                        </p>
                        <button
                          onClick={() => setViewingProfileId(s.student?.id)}
                          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-medium text-green-700 dark:text-green-300">
                            {s.student?.avatar_url ? (
                              <img src={s.student.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              s.student?.full_name?.charAt(0)
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {s.student?.full_name || "Unknown student"}
                          </span>
                        </button>
                      </div>

                      {/* Co-director */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                          Hours Awarded By
                        </p>
                        {s.codirector ? (
                          <button
                            onClick={() => setViewingProfileId(s.codirector?.id)}
                            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300">
                              {s.codirector?.avatar_url ? (
                                <img src={s.codirector.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                s.codirector?.full_name?.charAt(0)
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {s.codirector?.full_name}
                            </span>
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400">Not yet recorded</p>
                        )}
                      </div>

                      {/* Progress report */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                          Progress Report
                        </p>
                        {s.report ? (
                          <div className="space-y-3 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Engagement
                              </p>
                              <Badge className={engagementLabel(s.report.engagement_rating).color}>
                                {engagementLabel(s.report.engagement_rating).label}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Topics Covered
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {s.report.topics_covered}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  What Went Well
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {s.report.went_well}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Needs Work
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {s.report.needs_work}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Next Session Goals
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {s.report.next_session_goals}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No report submitted for this session.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      <ProfileModal profileId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
    </div>
  )
}