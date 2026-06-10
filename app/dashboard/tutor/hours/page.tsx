"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TutorHoursPage() {
  const supabase = createClient()
  const [hours, setHours] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    loadHours()
  }, [])

  useEffect(() => {
    filterHours()
  }, [startDate, endDate, hours])

  async function loadHours() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()
    setCurrentProfile(profile)

    const { data: hoursData } = await supabase
      .from("hours")
      .select(`
        *,
        session:session_id(session_date),
        awarded_by:awarded_by_profile_id(full_name)
      `)
      .eq("tutor_profile_id", profile.id)
      .order("awarded_at", { ascending: false })

    setHours(hoursData || [])
    setFiltered(hoursData || [])
    setLoading(false)
  }

  function filterHours() {
    if (!startDate && !endDate) {
      setFiltered(hours)
      return
    }

    const result = hours.filter((h) => {
      const date = new Date(h.session?.session_date)
      if (startDate && date < new Date(startDate)) return false
      if (endDate && date > new Date(endDate)) return false
      return true
    })

    setFiltered(result)
  }

  function clearFilter() {
    setStartDate("")
    setEndDate("")
  }

  const totalHours = filtered.reduce(
    (sum, h) => sum + (h.prep_hours || 0) + (h.tutoring_hours || 0),
    0
  )

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Hours</h2>
        <p className="text-gray-500 mt-1">Track your volunteering hours</p>
      </div>

      {/* Total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalHours}</p>
            {(startDate || endDate) && (
              <p className="text-xs text-gray-400 mt-1">filtered range</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{filtered.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              All Time Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
              {hours.reduce((sum, h) => sum + (h.prep_hours || 0) + (h.tutoring_hours || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
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
            {(startDate || endDate) && (
              <button
                onClick={clearFilter}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No hours found for this date range.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {h.session?.session_date
                        ? new Date(h.session.session_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Unknown date"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Awarded by {h.awarded_by?.full_name || "Unknown"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {(h.prep_hours || 0) + (h.tutoring_hours || 0)} hrs
                      </p>
                      <p className="text-xs text-gray-400">
                        {h.prep_hours}h prep + {h.tutoring_hours}h tutoring
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      ✓
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}