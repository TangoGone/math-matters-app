"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2 } from "lucide-react"

const TUTOR_STRENGTHS = [
  "Algebra", "Geometry", "Trigonometry", "Precalculus", "Calculus",
  "Statistics", "AMC/Competition Math", "SAT/ACT Prep", "Number Theory", "Test Anxiety Support"
]

const STUDENT_INTERESTS = [
  "Algebra", "Geometry", "Trigonometry", "Precalculus", "Calculus",
  "Statistics", "AMC/Competition Math", "SAT/ACT Prep", "Word Problems", "Visual Learning"
]

const GRADE_LEVELS = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"]

const chip = "rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"

interface SurveyProps {
  profileId: string
  role: "tutor" | "student"
  isParent: boolean | null
  onComplete: () => void
}

export function ProfileSurvey({ profileId, role, isParent, onComplete }: SurveyProps) {
  const supabase = createClient()
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const [gradeLevel, setGradeLevel] = useState("")
  const [cityState, setCityState] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [neurodivergent, setNeurodivergent] = useState("")
  const [comfortableAutism, setComfortableAutism] = useState("")
  const [notes, setNotes] = useState("")

  const topicOptions = role === "tutor" ? TUTOR_STRENGTHS : STUDENT_INTERESTS
  const possessive = role === "student" && isParent ? "your child's" : "your"
  const subject = role === "student" && isParent ? "your child" : "you"

  const steps = [
    // Step 1 — Grade level
    <div key="grade" className="space-y-3">
      <Label className="text-base font-medium">
        {role === "tutor"
          ? "What grade level are you most comfortable teaching?"
          : `What grade is ${subject} in?`}
      </Label>
      <ToggleGroup
        type="single"
        variant="outline"
        value={gradeLevel}
        onValueChange={(val) => val && setGradeLevel(val)}
        className="flex flex-wrap justify-start gap-2"
      >
        {GRADE_LEVELS.map((g) => (
          <ToggleGroupItem key={g} value={g} className={chip}>
            {g}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>,

    // Step 2 — Location
    <div key="location" className="space-y-3">
      <Label htmlFor="city-state" className="text-base font-medium">
        City and State
      </Label>
      <Input
        id="city-state"
        placeholder="e.g. Irvine, CA"
        value={cityState}
        onChange={(e) => setCityState(e.target.value)}
      />
    </div>,

    // Step 3 — Topics
    <div key="topics" className="space-y-3">
      <div className="space-y-1">
        <Label className="text-base font-medium">
          {role === "tutor"
            ? "What are your strengths for teaching?"
            : `What math topics is ${possessive}${isParent ? " child" : ""} interested in or working on?`}
        </Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
      </div>
      <ToggleGroup
        type="multiple"
        variant="outline"
        value={topics}
        onValueChange={setTopics}
        className="flex flex-wrap justify-start gap-2"
      >
        {topicOptions.map((topic) => (
          <ToggleGroupItem key={topic} value={topic} className={chip}>
            {topic}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>,

    // Step 4 — Role-specific question
    <div key="role-specific" className="space-y-3">
      <Label className="text-base font-medium">
        {role === "tutor"
          ? "Are you comfortable teaching students on the autism spectrum?"
          : isParent
            ? "Is your child neurodivergent or do they have any learning differences we should know about?"
            : "Are you neurodivergent or do you have any learning differences we should know about?"}
      </Label>
      <ToggleGroup
        type="single"
        variant="outline"
        value={role === "tutor" ? comfortableAutism : neurodivergent}
        onValueChange={(val) => {
          if (!val) return
          if (role === "tutor") setComfortableAutism(val)
          else setNeurodivergent(val)
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {(role === "tutor" ? ["Yes", "No", "Not sure"] : ["Yes", "No", "Prefer not to say"]).map((opt) => (
          <ToggleGroupItem key={opt} value={opt} className={chip}>
            {opt}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>,

    // Step 5 — Notes
    <div key="notes" className="space-y-3">
      <Label htmlFor="notes" className="text-base font-medium">
        Anything else we should know?
      </Label>
      <Textarea
        id="notes"
        placeholder="Optional notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
      />
    </div>,
  ]

  const totalSteps = steps.length
  const progress = ((stepIndex + 1) / totalSteps) * 100

  async function handleFinish() {
    setSaving(true)

    const survey: any = { topics, notes }
    if (role === "tutor") {
      survey.comfortable_autism = comfortableAutism
    } else {
      survey.neurodivergent = neurodivergent
    }

    await supabase
      .from("profiles")
      .update({ grade_level: gradeLevel, city_state: cityState, survey })
      .eq("id", profileId)

    setSaving(false)
    onComplete()
  }

  function handleNext() {
    if (stepIndex === totalSteps - 1) {
      handleFinish()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="min-h-[120px]">
        {steps[stepIndex]}
      </div>

      <div className="flex gap-2">
        {stepIndex > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={handleNext} disabled={saving} className="flex-1">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : stepIndex === totalSteps - 1 ? "Finish setup" : "Next"}
        </Button>
      </div>
    </div>
  )
}