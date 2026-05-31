'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase-server'

export type LoginState =
  | { error: string }
  | undefined

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Completa todos los campos.' }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Leer perfil para saber si ya completó el laberinto
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('maze_completed')
    .eq('id', user!.id)
    .single()

  if (profile?.maze_completed) {
    redirect('/dashboard')
  } else {
    redirect('/game')
  }
}
