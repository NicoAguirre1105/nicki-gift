'use client'

const U = 8

const HEART_PIXELS: [number, number][] = [
  [1,0],[2,0],[4,0],[5,0],
  [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
  [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
  [1,3],[2,3],[3,3],[4,3],[5,3],
  [2,4],[3,4],[4,4],
  [3,5],
]

const SHADOW = HEART_PIXELS
  .map(([cx, cy]) => `${cx * U}px ${cy * U}px 0 0 #e05c6a`)
  .join(', ')

type Props = { visible: boolean }

export default function PixelHeartLoader({ visible }: Props) {
  return (
    <>
      <style>{`
        @keyframes hb {
          0%,100% { transform: translateY(0px) scale(1); }
          40%     { transform: translateY(-16px) scale(1.1); }
          70%     { transform: translateY(-4px) scale(1.02); }
        }
        .heart-wrap {
          width: ${U * 7}px;
          height: ${U * 6}px;
          position: relative;
          overflow: visible;
        }
        .heart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: ${U}px;
          height: ${U}px;
          background: transparent;
          box-shadow: ${SHADOW};
        }
        .hb0 { animation: hb 1s ease-in-out 0s   infinite; }
        .hb1 { animation: hb 1s ease-in-out 0.2s infinite; }
        .hb2 { animation: hb 1s ease-in-out 0.4s infinite; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          background: '#ffffff',
          zIndex: 100,
          transition: 'opacity 0.6s ease',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'all' : 'none',
        }}
      >
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-end', paddingTop: '24px', overflow: 'visible' }}>
          <div className="heart-wrap hb0" />
          <div className="heart-wrap hb1" />
          <div className="heart-wrap hb2" />
        </div>

        <p style={{
          fontFamily: "'Bitcount Grid Single', monospace",
          fontSize: '0.85rem',
          letterSpacing: '0.15em',
          color: '#f5c0c6',
          animation: 'blink 1.2s step-end infinite',
        }}>
          cargando...
        </p>
      </div>
    </>
  )
}
