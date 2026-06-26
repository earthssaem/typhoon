import type { ReactNode } from 'react';
import { CASES } from '../../data/cases';
import type { DestinationId } from '../../types';

// 더 정확한 한반도(남한) 지도 경로
// 동해안, 남해안, 서해안의 대략적 형태를 따르고,
// 서울(북서)·부산(남동)·제주(남쪽 섬)의 위치를 포함한다.
const KOREA_PATH =
  'M45,8 Q48,6 52,8 L55,12 Q58,15 60,20 L62,28 Q63,35 63,42 L62,50 Q60,56 58,60 ' +
  'L55,65 Q50,68 45,70 L40,71 Q35,70 32,68 L28,65 Q26,62 25,58 L24,50 Q24,42 25,35 ' +
  'L26,28 Q28,22 30,16 L32,10 Q38,6 45,8 Z';

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
