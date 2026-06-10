"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

const roles = ["student", "tutor", "codirector", "operator"]

export default function ApprovePage() {
  const supabase = createClient()
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadPending()
  }, [])

  async function loadPending() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("approval_status", "pending")
      .order("claimed_at", { ascending: true })
    setPending(data || [])
    setLoading(false)
  }

  async function handleApprove(profileId: string, role: string) {
    setActionLoading(profileId)
    await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        role: role,
        approved_at: new Date().toISOString(),
      })
      .eq("id", profileId)
    await loadPending()
    setActionLoading(null)
  }

  async function handleReject(profileId: string) {
    setActionLoading(profileId)
    await supabase
      .from("profiles")
      .update({
        approval_status: "rejected",
        user_id: null,
        claimed_at: null,
      })
      .eq("id", profileId)
    await loadPending()
    setActionLoading(null)
  }

  async function handleRoleChange(profileId: string, role: string) {
    setPending(prev =>
      prev.map(p => p.id === profileId ? { ...p, role } : p)
    )
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Approve Accounts</h2>
        <p className="text-gray-500 mt-1">
          {pending.length} account{pending.length !== 1 ? "s" : ""} waiting for approval
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No pending accounts — you're all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300 shrink-0">
                      {profile.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {profile.full_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Claimed {profile.claimed_at
                          ? new Date(profile.claimed_at).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="w-full sm:w-40">
                    <Select
                      value={profile.role || ""}
                      onValueChange={(val) => handleRoleChange(profile.id, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role} className="capitalize">
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(profile.id, profile.role)}
                      disabled={!profile.role || actionLoading === profile.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === profile.id ? "..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(profile.id)}
                      disabled={actionLoading === profile.id}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}