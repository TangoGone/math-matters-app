"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function PendingPage() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Math Matters</h1>
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>Pending approval</CardTitle>
            <CardDescription>
              Your account has been submitted and is waiting for administrator approval. Check back soon.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}