import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase-server'
import GameCanvas from '@/app/_components/game/GameCanvas'

export const metadata: Metadata = {
  title: 'Regalo de Nicki',
  robots: { index: false, follow: false },
}

export default async function GamePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('maze_completed')
    .eq('id', user.id)
    .single()

  if (profile?.maze_completed) redirect('/dashboard')

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <GameCanvas />
    </main>
  )
}
