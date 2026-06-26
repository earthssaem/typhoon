import type { DestinationId } from '../../types';
import type { EndingResult } from '../../game/ending';
import { Character } from './Character';

// 목적지별 배경 + 실제 날씨 효과 + 캐릭터 여행 장면
// 실제 사진 대신 단순 SVG/CSS 도형으로 구성한다.

function Backdrop({ d }: { d: DestinationId }) {
  if (d === 'busan') {
    // 바다 · 해안 · 다리(광안대교 연상)
    return (
      <svg viewBox="0 0 300 160" className="trip-backdrop" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="300" height="160" fill="url(#busanSky)" />
        <defs>
          <linearGradient id="busanSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fb8cf" />
            <stop offset="100%" stopColor="#cfe0ee" />
          </linearGradient>
        </defs>
        <rect y="110" width="300" height="50" fill="#3f6f93" />
        <path d="M0,118 Q150,108 300,118" stroke="#5b87aa" strokeWidth="3" fill="none" />
        {/* 다리 */}
        <line x1="20" y1="100" x2="280" y2="100" stroke="#dfe8f0" strokeWidth="3" />
        {[40, 100, 160, 220].map((x) => (
          <line key={x} x1={x} y1="100" x2={x} y2="118" stroke="#cdd9e4" strokeWidth="2" />
        ))}
        {[70, 130, 190, 250].map((x) => (
          <path key={x} d={`M${x - 28},100 Q${x},80 ${x + 28},100`} stroke="#dfe8f0" strokeWidth="1.6" fill="none" />
        ))}
      </svg>
    );
  }
  if (d === 'jeju') {
    // 돌담 · 오름 · 야자수
    return (
      <svg viewBox="0 0 300 160" className="trip-backdrop" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="300" height="160" fill="url(#jejuSky)" />
        <defs>
          <linearGradient id="jejuSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a7c1d4" />
            <stop offset="100%" stopColor="#dcebe2" />
          </linearGradient>
        </defs>
        {/* 오름 */}
        <path d="M-10,120 Q80,70 180,120 Z" fill="#7fa07a" />
        <path d="M120,120 Q210,80 320,120 Z" fill="#6f936b" />
        <rect y="118" width="300" height="42" fill="#cdbb98" />
        {/* 돌담 */}
        {[18, 34, 50, 66, 82].map((x, i) => (
          <rect key={i} x={x} y="120" width="14" height="10" rx="3" fill="#9a948c" />
        ))}
        {/* 야자수 */}
        <g transform="translate(255,92)">
          <rect x="-2" y="0" width="4" height="30" fill="#8a6b4a" />
          {[-30, -10, 10, 30].map((r) => (
            <path key={r} d="M0,0 Q14,-8 26,-2" stroke="#3f8f5a" strokeWidth="3" fill="none" transform={`rotate(${r})`} />
          ))}
        </g>
      </svg>
    );
  }
  // 서울 — 도심 · 고궁
  return (
    <svg viewBox="0 0 300 160" className="trip-backdrop" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="300" height="160" fill="url(#seoulSky)" />
      <defs>
        <linearGradient id="seoulSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aab9cb" />
          <stop offset="100%" stopColor="#dde5ee" />
        </linearGradient>
      </defs>
      {/* 빌딩 */}
      {[
        [10, 70, 28, '#8d9bb0'],
        [44, 55, 26, '#7e8 da3'],
        [210, 60, 30, '#8995ab'],
        [248, 78, 34, '#7c89a0'],
      ].map((b, i) => (
        <rect key={i} x={b[0] as number} y={b[1] as number} width={b[2] as number} height={160 - (b[1] as number)} fill={String(b[3]).replace(' ', '')} />
      ))}
      {/* 고궁 지붕 */}
      <g transform="translate(150,96)">
        <path d="M-40,8 Q0,-14 40,8 Z" fill="#7d5a44" />
        <rect x="-30" y="8" width="60" height="22" fill="#caa37a" />
        <rect x="-30" y="30" width="60" height="6" fill="#8a6b4a" />
      </g>
      <rect y="118" width="300" height="42" fill="#b9c0cb" />
    </svg>
  );
}

export function TripScene({ result }: { result: EndingResult }) {
  const a = result.actualWeather;
  const hasUmbrella = result.selectedItems.includes('umbrella');
  const hasRaincoat = result.selectedItems.includes('raincoat') || result.selectedItems.includes('rainJacket');
  const umbrellaFlips = hasUmbrella && !hasRaincoat && a.windy; // 우산만 + 강풍 → 뒤집힘
  const happy = result.dress.comfort >= 70 && !umbrellaFlips;

  const mood = a.rainy || a.windy ? 'storm' : a.hot ? 'sunny' : 'cloudy';

  return (
    <div className={`trip-scene mood-${mood}${result.actualWeather.windy ? ' windy' : ''}`}>
      <Backdrop d={result.destination} />

      {/* 비 */}
      {a.rainy && (
        <div className="trip-rain" aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => (
            <span key={i} className="rain-drop" style={{ left: `${(i * 3.9) % 100}%`, animationDelay: `${(i % 9) * 0.11}s` }} />
          ))}
          <span className="puddle p1" />
          <span className="puddle p2" />
        </div>
      )}

      {/* 캐릭터 */}
      <div className={`trip-char${a.cold && result.dress.comfort < 60 ? ' shiver' : ''}${happy ? ' happy' : ''}${a.windy ? ' lean' : ''}`}>
        <Character outfit={result.dress.outfit} />
        {umbrellaFlips && <div className="flip-umbrella">🌂💨</div>}
        {a.hot && result.dress.comfort < 60 && <div className="sweat">💦</div>}
        {happy && <div className="happy-mark">📸✨</div>}
      </div>

      {/* 바람에 흔들리는 표지판 */}
      <div className="trip-sign" aria-hidden>🚩</div>
    </div>
  );
}
