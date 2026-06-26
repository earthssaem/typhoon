import type { ReactNode } from 'react';
import { CASES } from '../../data/cases';
import type { DestinationId } from '../../types';

// 북한과 남한을 모두 포함한 한반도 지도 경로
// 동해안·서해안·남해안과 한반도 전체 형태를 표현한다.
const KOREA_PATH =
  'M40,2 Q45,1 50,3 Q56,5 62,10 L67,18 Q70,28 70,38 L68,50 Q65,60 60,68 ' +
  'L55,73 Q48,76 40,77 L35,76 Q28,74 24,70 L20,62 Q18,52 18,42 ' +
  'L19,30 Q21,18 28,10 Q32,5 40,2 Z';

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
      {/* 북한-남한 경계선 (38도선) */}
      <line x1="20" y1="42" x2="70" y2="40" stroke="#d97f6e" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.6" />
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
