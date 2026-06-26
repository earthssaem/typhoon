import type { ReactNode } from 'react';
import { CASES } from '../../data/cases';
import type { DestinationId } from '../../types';

// 0~100 정규화 좌표계의 단순화된 한반도 지도.
// 정확한 지리가 아닌 학습용 모식도입니다.
const KOREA_PATH =
  'M40,8 L48,10 L52,18 L58,22 L60,30 L66,40 L64,50 L60,58 L62,64 L58,70 L52,74 ' +
  'L50,68 L44,66 L40,58 L36,50 L34,40 L32,30 L34,20 L36,12 Z';

export function KoreaMap({
  highlight,
  showCities = true,
  children,
}: {
  highlight?: DestinationId | null;
  showCities?: boolean;
  children?: ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 100" className="korea-map" role="img" aria-label="한반도 모식 지도">
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe3f2" />
          <stop offset="100%" stopColor="#8ec6e3" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#sea)" />
      {/* 위도/경도 격자 */}
      {[20, 40, 60, 80].map((g) => (
        <g key={g} stroke="#ffffff55" strokeWidth="0.3">
          <line x1={g} y1="0" x2={g} y2="100" />
          <line x1="0" y1={g} x2="100" y2={g} />
        </g>
      ))}
      <path d={KOREA_PATH} fill="#cdebc0" stroke="#7bbf6a" strokeWidth="0.6" />
      {/* 제주도 */}
      <ellipse cx="38" cy="82" rx="6" ry="3.6" fill="#cdebc0" stroke="#7bbf6a" strokeWidth="0.6" />

      {/* 태풍 경로 등 오버레이 */}
      {children}

      {/* 목적지 마커 */}
      {showCities &&
        (Object.values(CASES)).map((c) => {
          const on = highlight === c.destination;
          return (
            <g key={c.destination}>
              <circle
                cx={c.cityX}
                cy={c.cityY}
                r={on ? 2.6 : 1.8}
                fill={on ? '#e23b3b' : '#34506b'}
                stroke="#fff"
                strokeWidth="0.5"
              />
              <text
                x={c.cityX + 3}
                y={c.cityY + 1}
                fontSize="3.4"
                fill="#22384d"
                fontWeight={on ? 700 : 500}
              >
                {c.cityName}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
