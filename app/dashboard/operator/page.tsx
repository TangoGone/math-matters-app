"use client"

import { useEffect, useState } from "react"
import { usePresence } from "@/hooks/use-presence"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileModal } from "@/components/profile-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Trash2, Users, Clock, UserCheck, UserX } from "lucide-react"

export default function OperatorPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null)
  const [deletingProfile, setDeletingProfile] = useState<any | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [search, roleFilter, statusFilter, sortBy, profiles])

  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const { isOnline } = usePresence(currentProfileId)

  async function loadData() {
    setLoading(true)

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true })

    const { data: seasonData } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false })

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: me } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (me) setCurrentProfileId(me.id)
    }

    setProfiles(profileData || [])
    setSeasons(seasonData || [])
    setLoading(false)
  }

  function applyFilters() {
    let result = [...profiles]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      )
    }

    if (roleFilter !== "all") {
      result = result.filter(p => p.role === roleFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter(p => p.approval_status === statusFilter)
    }

    result.sort((a, b) => {
      if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "")
      if (sortBy === "role") return (a.role || "").localeCompare(b.role || "")
      if (sortBy === "status") return (a.approval_status || "").localeCompare(b.approval_status || "")
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return 0
    })

    setFiltered(result)
  }

  async function handleDelete(profile: any) {
    await supabase.from("profiles").delete().eq("id", profile.id)
    setDeletingProfile(null)
    await loadData()
  }

  function statusBadge(status: string) {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">Approved</Badge>
      case "pending": return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</Badge>
      case "unclaimed": return <Badge className="bg-muted text-muted-foreground border border-border">Unclaimed</Badge>
      case "rejected": return <Badge className="bg-destructive/10 text-destructive border border-destructive/20">Rejected</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  function roleBadge(role: string) {
    switch (role) {
      case "tutor": return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Tutor</Badge>
      case "codirector": return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">Co-Director</Badge>
      case "operator": return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">Operator</Badge>
      case "student": return <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">Student</Badge>
      default: return <Badge variant="secondary">Unassigned</Badge>
    }
  }

  const stats = {
    total: profiles.length,
    approved: profiles.filter(p => p.approval_status === "approved").length,
    pending: profiles.filter(p => p.approval_status === "pending").length,
    unclaimed: profiles.filter(p => p.approval_status === "unclaimed").length,
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Operator Overview</h2>
        <p className="text-muted-foreground mt-1">Manage the Math Matters program</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profiles</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{stats.approved}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unclaimed</p>
                <p className="text-3xl font-bold text-muted-foreground mt-1">{stats.unclaimed}</p>
              </div>
              <UserX className="w-8 h-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <a href="/dashboard/operator/approve">
          <Button variant="outline" size="sm">
            Review Pending ({stats.pending})
          </Button>
        </a>
        <a href="/dashboard/operator/import">
          <Button variant="outline" size="sm">
            Import Roster
          </Button>
        </a>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">
              All Users
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length} of {profiles.length})
              </span>
            </CardTitle>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="codirector">Co-Director</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unclaimed">Unclaimed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No profiles match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => profile.approval_status === "approved" && setViewingProfileId(profile.id)}
                          className="flex items-center gap-3 text-left group"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              profile.full_name?.charAt(0)
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isOnline(profile.id)
                                ? "bg-green-400"
                                : "bg-muted-foreground/30"
                            }`} />
                            <span className={`font-medium text-foreground ${profile.approval_status === "approved" ? "group-hover:text-primary transition-colors" : ""}`}>
                              {profile.full_name}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
                        {profile.email || "—"}
                      </td>
                      <td className="py-3 px-3">
                        {profile.role ? roleBadge(profile.role) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3 px-3">
                        {statusBadge(profile.approval_status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setDeletingProfile(profile)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current season */}
      {seasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {seasons.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingProfile} onOpenChange={() => setDeletingProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingProfile?.full_name}</strong>'s profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deletingProfile)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProfileModal profileId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
    </div>
  )
}