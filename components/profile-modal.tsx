"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface ProfileModalProps {
  profileId: string | null
  onClose: () => void
}

export function ProfileModal({ profileId, onClose }: ProfileModalProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return
    loadProfile()
  }, [profileId])

  async function loadProfile() {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  if (!profileId) return null

  function roleColor(role: string) {
    switch (role) {
      case "tutor": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "codirector": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "operator": return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "student": return "bg-green-500/10 text-green-400 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
        ) : !profile ? (
          <div className="p-8 text-center text-gray-500 text-sm">Profile not found</div>
        ) : (
          <>
            {/* Banner */}
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" />

            {/* Avatar */}
            <div className="px-5 -mt-10">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-4 border-gray-900 flex items-center justify-center text-2xl font-bold text-gray-300">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0)
                )}
              </div>
            </div>

            <div className="px-5 pt-3 pb-5 space-y-4">
              {/* Name + role */}
              <div>
                <h3 className="text-lg font-bold text-white">{profile.full_name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${roleColor(profile.role)}`}>
                  {profile.role}
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-300">{profile.bio}</p>
                </div>
              )}

              {/* Grade level / location */}
              {(profile.grade_level || profile.city_state) && (
                <div className="grid grid-cols-2 gap-3">
                  {profile.grade_level && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {profile.role === "tutor" ? "Teaches Grades" : "Grade Level"}
                      </p>
                      <p className="text-sm text-gray-300">{profile.grade_level}</p>
                    </div>
                  )}
                  {profile.city_state && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                      <p className="text-sm text-gray-300">{profile.city_state}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Topics */}
              {profile.survey?.topics?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {profile.role === "tutor" ? "Strengths" : "Topics of Interest"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.survey.topics.map((topic: string) => (
                      <span
                        key={topic}
                        className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tutor: autism comfort */}
              {profile.role === "tutor" && profile.survey?.comfortable_autism && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Comfortable teaching neurodivergent students
                  </p>
                  <p className="text-sm text-gray-300">{profile.survey.comfortable_autism}</p>
                </div>
              )}

              {/* Student: neurodivergent */}
              {profile.role === "student" && profile.survey?.neurodivergent && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Learning differences noted
                  </p>
                  <p className="text-sm text-gray-300">{profile.survey.neurodivergent}</p>
                </div>
              )}

              {/* Notes */}
              {profile.survey?.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-300">{profile.survey.notes}</p>
                </div>
              )}

              {/* Email */}
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}