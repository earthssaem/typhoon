import type { ReactNode } from 'react';
import { CASES } from '../../data/cases';
import type { DestinationId } from '../../types';

// 0~100 정규화 좌표계의 단순화된 한반도(남한) 지도.
// 정확한 지리가 아닌 학습용 모식도이지만, 동해안·서해안·남해안과
// 서울(북서)·부산(남동 해안)·제주(남쪽 섬)의 대략적 위치를 따른다.
const KOREA_PATH =
  'M40,5 L48,6 L52,12 L55,20 L57,28 L59,37 L61,45 L63,52 L65,58 ' + // 동해안(오른쪽)
  'L64,62 L58,65 L52,67 L46,69 L40,70 L34,71 L29,69 L26,65 ' + // 남해안(아래·들쭉날쭉)
  'L27,60 L30,56 L27,51 L29,45 L26,39 L29,33 L27,27 L31,20 L33,13 L36,8 Z'; // 서해안(왼쪽)

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
