import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notas — Ejemplo Next.js + Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>📝 Mis Notas</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
            Entorno: <strong>{process.env.NEXT_PUBLIC_ENV_NAME ?? 'local'}</strong>
          </p>
        </header>
        {children}
      </body>
    </html>
  )
}
