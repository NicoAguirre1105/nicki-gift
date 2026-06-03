'use server'

import { createSupabaseServerClient } from '@/app/lib/supabase-server'

export type LoginState =
  | { error: string }
  | { success: true; destination: '/game' | '/dashboard' }
  | undefined

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Completa todos los campos.' }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('maze_completed')
    .eq('id', user!.id)
    .single()

  // Devolver éxito — el redirect lo hace el cliente después del narrador + portal
  return { success: true, destination: profile?.maze_completed ? '/dashboard' : '/game' }
}
