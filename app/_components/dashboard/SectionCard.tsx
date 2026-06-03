'use client'

type Props = {
  title: string
  icon: string
  description: string
  available: boolean
  onClick?: () => void
}

export default function SectionCard({ title, icon, description, available, onClick }: Props) {
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      style={{
        position: 'relative',
        width: '100%',
        background: available ? '#1a1830' : '#131220',
        border: `1px solid ${available ? '#2e3a5c' : '#1e2340'}`,
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        textAlign: 'left',
        cursor: available ? 'pointer' : 'default',
        opacity: available ? 1 : 0.6,
        transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
        outline: 'none',
      }}
      onMouseEnter={e => {
        if (!available) return
        const el = e.currentTarget
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 8px 32px rgba(108,142,212,0.18)'
        el.style.borderColor = '#6c8ed4'
      }}
      onMouseLeave={e => {
        if (!available) return
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.borderColor = '#2e3a5c'
      }}
    >
      {/* Badge próximamente */}
      {!available && (
        <span style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          fontSize: '0.65rem',
          letterSpacing: '0.12em',
          color: '#4a6fa5',
          background: '#1c2235',
          padding: '3px 8px',
          borderRadius: '4px',
          border: '1px solid #2e3a5c',
          textTransform: 'uppercase',
        }}>
          ✦ Próximamente
        </span>
      )}

      {/* Ícono */}
      <div style={{ fontSize: '2.2rem', marginBottom: '1rem', lineHeight: 1 }}>
        {icon}
      </div>

      {/* Título */}
      <h2 style={{
        margin: '0 0 0.4rem',
        fontSize: '1.15rem',
        fontWeight: 600,
        color: available ? '#e8eaf6' : '#7b8ab8',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        letterSpacing: '0.01em',
      }}>
        {title}
      </h2>

      {/* Descripción */}
      <p style={{
        margin: 0,
        fontSize: '0.82rem',
        color: '#7b8ab8',
        lineHeight: 1.5,
      }}>
        {description}
      </p>

      {/* Flecha si disponible */}
      {available && (
        <div style={{
          marginTop: '1.2rem',
          fontSize: '0.8rem',
          color: '#6c8ed4',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          Abrir →
        </div>
      )}
    </button>
  )
}
