import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tu espacio · NxN',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0d0f1a',
        color: '#e8eaf6',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  )
}
