'use server'

import { createSupabaseServerClient } from '@/app/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
