"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

const TUTOR_STRENGTHS = [
  "Algebra", "Geometry", "Trigonometry", "Precalculus", "Calculus",
  "Statistics", "AMC/Competition Math", "SAT/ACT Prep", "Number Theory", "Test Anxiety Support"
]

const STUDENT_INTERESTS = [
  "Algebra", "Geometry", "Trigonometry", "Precalculus", "Calculus",
  "Statistics", "AMC/Competition Math", "SAT/ACT Prep", "Word Problems", "Visual Learning"
]

const GRADE_LEVELS = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"]

interface SurveyProps {
  profileId: string
  role: "tutor" | "student"
  isParent: boolean | null
  onComplete: () => void
}

export function ProfileSurvey({ profileId, role, isParent, onComplete }: SurveyProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [gradeLevel, setGradeLevel] = useState("")
  const [cityState, setCityState] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [neurodivergent, setNeurodivergent] = useState<string>("")
  const [comfortableAutism, setComfortableAutism] = useState<string>("")
  const [notes, setNotes] = useState("")

  const topicOptions = role === "tutor" ? TUTOR_STRENGTHS : STUDENT_INTERESTS

  // Pronoun helpers for student/parent phrasing
  const subject = role === "student" && isParent ? "your child" : "you"
  const possessive = role === "student" && isParent ? "your child's" : "your"
  const verbIs = role === "student" && isParent ? "is" : "are"

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  async function handleSubmit() {
    setSaving(true)

    const survey: any = {
      topics,
      notes,
    }

    if (role === "tutor") {
      survey.comfortable_autism = comfortableAutism
    } else {
      survey.neurodivergent = neurodivergent
    }

    await supabase
      .from("profiles")
      .update({
        grade_level: gradeLevel,
        city_state: cityState,
        survey,
      })
      .eq("id", profileId)

    setSaving(false)
    onComplete()
  }

  return (
    <div className="space-y-6">
      {/* Grade level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          {role === "tutor"
            ? "What grade levels are you comfortable teaching?"
            : `What grade is ${subject} in?`}
        </label>
        <div className="flex flex-wrap gap-2">
          {GRADE_LEVELS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeLevel(g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                gradeLevel === g
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* City, State */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          City and State
        </label>
        <input
          type="text"
          placeholder="e.g. Irvine, CA"
          value={cityState}
          onChange={(e) => setCityState(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-gray-700 rounded-lg text-sm bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Topics */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          {role === "tutor"
            ? "What are your strengths for teaching?"
            : `What math topics is ${possessive} ${role === "student" ? "" : ""}${isParent ? "child" : ""} interested in or working on?`}
        </label>
        <p className="text-xs text-gray-500">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {topicOptions.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                topics.includes(topic)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Role-specific question */}
      {role === "tutor" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">
            Are you comfortable teaching students on the autism spectrum?
          </label>
          <div className="flex gap-2">
            {["Yes", "No", "Not sure"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setComfortableAutism(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  comfortableAutism === opt
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-200">
            {isParent
              ? "Is your child neurodivergent or do they have any learning differences we should know about?"
              : "Are you neurodivergent or do you have any learning differences we should know about?"}
          </label>
          <div className="flex gap-2">
            {["Yes", "No", "Prefer not to say"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setNeurodivergent(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  neurodivergent === opt
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">
          Anything else we should know?
        </label>
        <textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 border border-gray-700 rounded-lg text-sm bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-all"
      >
        {saving ? "Saving..." : "Finish setup"}
      </button>
    </div>
  )
}