import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.approval_status !== 'approved') {
    redirect('/auth/pending')
  }

  switch (profile.role) {
    case 'operator': redirect('/dashboard/operator')
    case 'codirector': redirect('/dashboard/codirector')
    case 'tutor': redirect('/dashboard/tutor')
    case 'student': redirect('/dashboard/parent')
    default: redirect('/auth/login')
  }
}