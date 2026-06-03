import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase-server'
import LogoutButton from '@/app/_components/dashboard/LogoutButton'
import SectionCard from '@/app/_components/dashboard/SectionCard'
import CartasDashboard from '@/app/_components/dashboard/CartasDashboard'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const username = profile?.username ?? user.email?.split('@')[0] ?? 'Nicki'

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0d0f1a',
      color: '#e8eaf6',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #1e2340',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.4rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#e8eaf6',
            fontWeight: 400,
          }}>
            Hola, <span style={{ color: '#6c8ed4', fontWeight: 700 }}>{username}</span> 💙
          </h1>
          <p style={{
            margin: '2px 0 0',
            fontSize: '0.78rem',
            color: '#7b8ab8',
            letterSpacing: '0.04em',
          }}>
            Este es tu espacio
          </p>
        </div>
        <LogoutButton />
      </header>

      {/* ── Contenido ───────────────────────────────────────────────── */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2.5rem 2rem',
      }}>

        {/* Grid de secciones */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}>
          {/* Cartas — única sección activa, ocupa más espacio visualmente */}
          <CartasDashboard />

          <SectionCard
            title="Recuerdos"
            icon="📸"
            description="Fotos y momentos guardados juntos."
            available={false}
          />
          <SectionCard
            title="Notas"
            icon="🗒️"
            description="Pensamientos y palabras para ti."
            available={false}
          />
          <SectionCard
            title="Canciones"
            icon="🎵"
            description="Nuestra playlist de momentos."
            available={false}
          />
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#2e3a5c',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          ✦ hecho con mucho amor ✦
        </p>
      </div>
    </main>
  )
}
