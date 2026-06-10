"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ParentPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTutor, setSelectedTutor] = useState("")
  const [tutors, setTutors] = useState<any[]>([])

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    filterReports()
  }, [startDate, endDate, selectedTutor, reports])

  async function loadReports() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()
    setCurrentProfile(profile)

    // Get all pairings for this student
    const { data: pairings } = await supabase
      .from("pairings")
      .select(`
        id,
        session:session_id(session_date),
        tutor:tutor_profile_id(id, full_name, avatar_url)
      `)
      .eq("student_profile_id", profile.id)

    if (!pairings || pairings.length === 0) {
      setLoading(false)
      return
    }

    // Get all progress reports for those pairings
    const pairingIds = pairings.map((p: any) => p.id)
    const { data: reportData } = await supabase
      .from("progress_reports")
      .select("*")
      .in("pairing_id", pairingIds)
      .order("submitted_at", { ascending: false })

    // Merge pairing info into reports
    const merged = (reportData || []).map((report: any) => {
      const pairing = pairings.find((p: any) => p.id === report.pairing_id)
      return { ...report, pairing }
    })

    setReports(merged)
    setFiltered(merged)

    // Get unique tutors for filter
    const uniqueTutors = Array.from(
      new Map(
        pairings
          .filter((p: any) => p.tutor)
          .map((p: any) => [p.tutor.id, p.tutor])
      ).values()
    )
    setTutors(uniqueTutors)

    setLoading(false)
  }

  function filterReports() {
    let result = reports

    if (startDate) {
      result = result.filter((r) => {
        const date = new Date(r.pairing?.session?.session_date)
        return date >= new Date(startDate)
      })
    }

    if (endDate) {
      result = result.filter((r) => {
        const date = new Date(r.pairing?.session?.session_date)
        return date <= new Date(endDate)
      })
    }

    if (selectedTutor) {
      result = result.filter((r) => r.pairing?.tutor?.id === selectedTutor)
    }

    setFiltered(result)
  }

  function clearFilters() {
    setStartDate("")
    setEndDate("")
    setSelectedTutor("")
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Progress Feed
        </h2>
        <p className="text-gray-500 mt-1">
          All progress reports for {currentProfile?.full_name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Tutors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{tutors.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {tutors.length > 1 && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by tutor
              </label>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All tutors</option>
                {tutors.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(startDate || endDate || selectedTutor) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Clear all filters
            </button>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {reports.length === 0
                ? "No progress reports yet."
                : "No reports match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const engagement = engagementLabel(report.engagement_rating)
            return (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300">
                          {report.pairing?.tutor?.full_name?.charAt(0)}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.pairing?.tutor?.full_name}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-9">
                        {report.pairing?.session?.session_date
                          ? new Date(report.pairing.session.session_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Unknown date"}
                      </p>
                    </div>
                    <Badge className={engagement.color}>
                      {engagement.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Topics Covered
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {report.topics_covered}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        What Went Well
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {report.went_well}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Needs Work
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {report.needs_work}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Next Session Goals
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {report.next_session_goals}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}