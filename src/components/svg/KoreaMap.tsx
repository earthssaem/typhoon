import type { ReactNode } from 'react';
import { CASES } from '../../data/cases';
import type { DestinationId } from '../../types';

// 북한과 남한을 모두 포함한 통일 한반도 실루엣 경로.
// 북서(서해안)·북동(함경/두만강)·동해안·남해안·남서(전라)의 대략적 형태를 따른다.
const KOREA_PATH =
  'M30,8 ' +
  'C36,4 42,3 48,5 ' + // 북부 상단(서→동)
  'C54,4 60,5 64,8 ' +
  'C68,6 69,10 67,15 ' + // 북동 끝(두만강 방향)
  'C66,20 67,26 67,32 ' + // 동해안 상부
  'C67,40 66,48 63,55 ' + // 동해안
  'C62,60 60,64 54,67 ' + // 남동(부산 방향)
  'C50,70 44,72 39,71 ' + // 남해안
  'C34,71 29,69 27,63 ' + // 남서(전라)
  'C24,57 24,51 27,46 ' + // 서해안 하부
  'C30,42 30,38 28,34 ' + // 경기만 들어감
  'C31,30 34,28 33,24 ' + // 허리(잘록한 부분)
  'C30,21 26,19 24,15 ' + // 북서 만(서한만)
  'C23,11 26,8 30,8 Z'; // 북서 상단으로 복귀

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
