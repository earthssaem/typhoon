import { KoreaMap } from './KoreaMap';
import type { TyphoonCase } from '../../types';

// STEP 5 태풍 예상경로 지도 + (엔딩) 실제 경로 비교
export function ForecastTrackMap({
  c,
  showActual = false,
}: {
  c: TyphoonCase;
  showActual?: boolean;
}) {
  const pts = c.track;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  // 진행 방향 화살표 각도
  const ang = (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI;

  const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const actualPts = c.actual.trackPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <KoreaMap highlight={c.destination}>
      {/* 확률반경 / 강풍반경 / 폭풍반경 */}
      {pts.map((p, i) =>
        p.probRadius ? (
          <g key={`r${i}`}>
            <circle cx={p.x} cy={p.y} r={p.probRadius} fill="#9b59b6" opacity={0.12} stroke="#9b59b6" strokeWidth={0.4} strokeDasharray="1.5 1" />
            {p.strongWindRadius && (
              <circle cx={p.x} cy={p.y} r={p.strongWindRadius} fill="none" stroke="#f1c40f" strokeWidth={0.6} strokeDasharray="2 1.2" />
            )}
            {p.stormRadius && (
              <circle cx={p.x} cy={p.y} r={p.stormRadius} fill="#e74c3c" opacity={0.18} stroke="#e74c3c" strokeWidth={0.5} />
            )}
          </g>
        ) : null,
      )}

      {/* 예상경로 중심선 */}
      <polyline points={linePts} fill="none" stroke="#7a1fa2" strokeWidth={0.9} strokeDasharray="2 1.2" />
      {pts.map((p, i) => (
        <g key={`p${i}`}>
          <circle cx={p.x} cy={p.y} r={1.4} fill="#7a1fa2" stroke="#fff" strokeWidth={0.4} />
          <text x={p.x + 2} y={p.y - 1.5} fontSize="2.8" fill="#4a235a" fontWeight={600}>
            {p.label}
          </text>
        </g>
      ))}

      {/* 진행 방향 화살표 */}
      <g transform={`translate(${last.x},${last.y}) rotate(${ang})`}>
        <polygon points="0,-1.6 4,0 0,1.6" fill="#7a1fa2" />
      </g>

      {/* 실제 경로 (엔딩에서만) */}
      {showActual && (
        <>
          <polyline points={actualPts} fill="none" stroke="#e23b3b" strokeWidth={1} />
          {c.actual.trackPoints.map((p, i) => (
            <circle key={`a${i}`} cx={p.x} cy={p.y} r={1.1} fill="#e23b3b" />
          ))}
        </>
      )}
    </KoreaMap>
  );
}
