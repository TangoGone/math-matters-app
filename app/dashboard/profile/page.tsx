"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [bio, setBio] = useState("")
  const [totalHours, setTotalHours] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()

    setProfile(p)
    setBio(p?.bio || "")

    if (p?.role === "tutor") {
      const { data: hours } = await supabase
        .from("hours")
        .select("prep_hours, tutoring_hours")
        .eq("tutor_profile_id", p.id)

      const total = (hours || []).reduce(
        (sum, h) => sum + (h.prep_hours || 0) + (h.tutoring_hours || 0), 0
      )
      setTotalHours(total)
      setTotalSessions((hours || []).length)
    }

    setLoading(false)
  }

  async function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    setError("")

    const fileExt = file.name.split(".").pop()
    const filePath = `${profile.user_id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError("Failed to upload image. Please try again.")
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id)

    setProfile({ ...profile, avatar_url: publicUrl })
    setUploading(false)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError("")

    const { error: saveError } = await supabase
      .from("profiles")
      .update({ bio })
      .eq("id", profile.id)

    if (saveError) {
      setError("Failed to save. Please try again.")
      setSaving(false)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  function roleColor(role: string) {
    switch (role) {
      case "tutor": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "codirector": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      case "operator": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
      case "student": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
        <p className="text-gray-500 mt-1">Manage your account details</p>
      </div>

      {/* Avatar + basic info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-80 transition-opacity relative group"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                    {profile?.full_name?.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-white text-xs font-medium">
                    {uploading ? "..." : "Edit"}
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {profile?.full_name}
              </h3>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <Badge className={`capitalize ${roleColor(profile?.role)}`}>
                {profile?.role}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Click your photo to upload a new one. Supported formats: JPG, PNG, GIF.
          </p>
        </CardContent>
      </Card>

      {/* Tutor stats */}
      {profile?.role === "tutor" && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{totalHours}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{totalSessions}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              placeholder="Write a short bio..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Approved
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="text-gray-900 dark:text-white capitalize">{profile?.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 dark:text-white">{profile?.email}</span>
          </div>
          {profile?.approved_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(profile.approved_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}