'use client'

export type Direction = 'up' | 'down' | 'left' | 'right'

type DPadProps = {
  onDirectionStart: (dir: Direction) => void
  onDirectionEnd:   (dir: Direction) => void
}

const BUTTONS: { dir: Direction; label: string; col: number; row: number }[] = [
  { dir: 'up',    label: '▲', col: 2, row: 1 },
  { dir: 'left',  label: '◀', col: 1, row: 2 },
  { dir: 'right', label: '▶', col: 3, row: 2 },
  { dir: 'down',  label: '▼', col: 2, row: 3 },
]

export default function DPad({ onDirectionStart, onDirectionEnd }: DPadProps) {
  return (
    <div
      className="absolute bottom-5 right-5 z-10 grid gap-1"
      style={{ gridTemplateColumns: 'repeat(3, 44px)', gridTemplateRows: 'repeat(3, 44px)' }}
    >
      {BUTTONS.map(({ dir, label, col, row }) => (
        <button
          key={dir}
          onPointerDown={(e) => { e.preventDefault(); onDirectionStart(dir) }}
          onPointerUp={() => onDirectionEnd(dir)}
          onPointerLeave={() => onDirectionEnd(dir)}
          onPointerCancel={() => onDirectionEnd(dir)}
          className="flex items-center justify-center text-sm select-none active:opacity-60"
          style={{
            gridColumn: col,
            gridRow: row,
            backgroundColor: 'rgba(46,58,92,0.75)',
            border: '2px solid var(--border-pixel)',
            color: 'var(--text-primary)',
            touchAction: 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
