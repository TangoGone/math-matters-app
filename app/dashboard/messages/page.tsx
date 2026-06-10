"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MessagesPage() {
  const supabase = createClient()
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const currentProfileRef = useRef<any>(null)
  const selectedContactRef = useRef<any>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      selectedContactRef.current = selectedContact
      loadMessages(selectedContact)
    }
  }, [selectedContact])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!currentProfile) return

    currentProfileRef.current = currentProfile

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as any
          const me = currentProfileRef.current
          const contact = selectedContactRef.current
          if (!me || !contact) return

          const isRelevant =
            (msg.sender_profile_id === me.id && msg.recipient_profile_id === contact.id) ||
            (msg.sender_profile_id === contact.id && msg.recipient_profile_id === me.id)

          if (isRelevant) {
            setMessages((prev) => {
              // Avoid duplicates from optimistic update
              const exists = prev.some(
                (m) =>
                  m.id === msg.id ||
                  (m.body === msg.body &&
                    m.sender_profile_id === msg.sender_profile_id &&
                    Math.abs(new Date(m.sent_at).getTime() - new Date(msg.sent_at).getTime()) < 2000)
              )
              if (exists) return prev
              return [...prev, msg]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentProfile])

  async function loadContacts() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single()

    setCurrentProfile(profile)
    currentProfileRef.current = profile

    let contactProfiles: any[] = []

    if (profile.role === "tutor") {
      const { data: codirectors } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("role", "codirector")
        .eq("approval_status", "approved")

      const { data: pairings } = await supabase
        .from("pairings")
        .select("student:student_profile_id(id, full_name, role, avatar_url)")
        .eq("tutor_profile_id", profile.id)

      const students = (pairings || []).map((p: any) => p.student).filter(Boolean)
      contactProfiles = [...(codirectors || []), ...students]

    } else if (profile.role === "student") {
      const { data: codirectors } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("role", "codirector")
        .eq("approval_status", "approved")

      const { data: pairings } = await supabase
        .from("pairings")
        .select("tutor:tutor_profile_id(id, full_name, role, avatar_url)")
        .eq("student_profile_id", profile.id)

      const tutors = (pairings || []).map((p: any) => p.tutor).filter(Boolean)
      contactProfiles = [...(codirectors || []), ...tutors]

    } else if (profile.role === "codirector" || profile.role === "operator") {
      const { data: everyone } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("approval_status", "approved")
        .neq("id", profile.id)

      contactProfiles = everyone || []
    }

    const seen = new Set()
    const unique = contactProfiles.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })

    setContacts(unique)
    setLoading(false)
  }

  async function loadMessages(contact: any) {
    const me = currentProfileRef.current
    if (!me) return

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_profile_id.eq.${me.id},recipient_profile_id.eq.${contact.id}),and(sender_profile_id.eq.${contact.id},recipient_profile_id.eq.${me.id})`
      )
      .order("sent_at", { ascending: true })

    setMessages(data || [])

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_profile_id", me.id)
      .eq("sender_profile_id", contact.id)
      .is("read_at", null)
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedContact || !currentProfile) return
    setSending(true)

    const tempId = crypto.randomUUID()
    const msg = {
      id: tempId,
      sender_profile_id: currentProfile.id,
      recipient_profile_id: selectedContact.id,
      body: newMessage.trim(),
      sent_at: new Date().toISOString(),
      read_at: null,
    }

    setMessages((prev) => [...prev, msg])
    setNewMessage("")

    await supabase.from("messages").insert({
      sender_profile_id: msg.sender_profile_id,
      recipient_profile_id: msg.recipient_profile_id,
      body: msg.body,
      sent_at: msg.sent_at,
    })

    setSending(false)
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

  function Avatar({ profile, size = "sm" }: { profile: any, size?: "sm" | "md" }) {
    const dim = size === "sm" ? "w-9 h-9 text-sm" : "w-10 h-10 text-base"
    return (
      <div className={`${dim} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-medium text-gray-700 dark:text-gray-300 shrink-0`}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
        ) : (
          profile?.full_name?.charAt(0)
        )}
      </div>
    )
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Contacts sidebar */}
      <div className="w-64 shrink-0 flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6 px-4">
              No contacts available yet.
            </p>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                  selectedContact?.id === contact.id
                    ? "bg-blue-50 dark:bg-blue-950"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Avatar profile={contact} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {contact.full_name}
                  </p>
                  <p className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5 capitalize ${roleColor(contact.role)}`}>
                    {contact.role}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Select a contact to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Avatar profile={selectedContact} />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedContact.full_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{selectedContact.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_profile_id === currentProfile?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
                        }`}
                      >
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.sent_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}