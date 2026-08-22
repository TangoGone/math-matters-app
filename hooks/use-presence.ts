"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function usePresence(profileId: string | null) {
  const supabase = createClient()
  const [onlineIds, setOnlineIds] = useState<string[]>([])

  useEffect(() => {
    if (!profileId) return

    const channel = supabase.channel("online-users", {
      config: { presence: { key: profileId } }
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const ids = Object.keys(state)
        setOnlineIds(ids)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ profile_id: profileId, online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId])

  return { onlineIds, isOnline: (id: string) => onlineIds.includes(id) }
}