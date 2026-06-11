"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const roles = ["student", "tutor", "codirector", "operator"]

export default function ApprovePage() {
  const supabase = createClient()
  const [pending, setPending] = useState<any[]>([])
  const [approved, setApproved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("claimed_at", { ascending: true })

    setPending((data || []).filter(p => p.approval_status === "pending"))
    setApproved((data || []).filter(p => p.approval_status === "approved"))
    setLoading(false)
  }

  async function handleApprove(profileId: string, role: string) {
    setActionLoading(profileId)
    await supabase
      .from("profiles")
      .update({
        approval_status: "approved",
        role,
        approved_at: new Date().toISOString(),
      })
      .eq("id", profileId)
    await loadAll()
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
    await loadAll()
    setActionLoading(null)
  }

  async function handleRoleChange(profileId: string, role: string) {
    setActionLoading(profileId)
    await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profileId)
    await loadAll()
    setActionLoading(null)
  }

  async function handleRevoke(profileId: string) {
    setActionLoading(profileId)
    await supabase
      .from("profiles")
      .update({
        approval_status: "unclaimed",
        user_id: null,
        claimed_at: null,
        approved_at: null,
      })
      .eq("id", profileId)
    await loadAll()
    setActionLoading(null)
  }

  function ProfileCard({ profile, mode }: { profile: any, mode: "pending" | "approved" }) {
    const [localRole, setLocalRole] = useState(profile.role || "")

    return (
      <Card key={profile.id}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300 shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {profile.full_name}
                </p>
                <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                {mode === "pending" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Claimed {profile.claimed_at
                      ? new Date(profile.claimed_at).toLocaleDateString()
                      : "recently"}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full sm:w-40">
              <Select
                value={localRole}
                onValueChange={(val) => {
                  setLocalRole(val)
                  if (mode === "approved") handleRoleChange(profile.id, val)
                  else setPending(prev => prev.map(p => p.id === profile.id ? { ...p, role: val } : p))
                }}
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

            <div className="flex gap-2">
              {mode === "pending" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(profile.id, localRole)}
                    disabled={!localRole || actionLoading === profile.id}
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
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(profile.id)}
                  disabled={actionLoading === profile.id}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {actionLoading === profile.id ? "..." : "Revoke"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Accounts</h2>
        <p className="text-gray-500 mt-1">Approve, reject, and manage user roles</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No pending accounts — you're all caught up.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map(profile => (
              <ProfileCard key={profile.id} profile={profile} mode="pending" />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 mt-4">
          {approved.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No approved accounts yet.</p>
              </CardContent>
            </Card>
          ) : (
            approved.map(profile => (
              <ProfileCard key={profile.id} profile={profile} mode="approved" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}