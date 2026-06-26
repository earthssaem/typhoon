import { KoreaMap } from './KoreaMap';
import type { TyphoonCase } from '../../types';

// ────────────────────────────────────────────────────────────────────────
// 합성 일기도 / 위성영상 / 레이더영상 (학습용 모식 이미지)
// ⚠️ 실제 기상청 영상이 아닙니다. 실제 WebP 자료로 교체할 자리입니다.
// 태풍 현재 위치는 사례의 track[0] 좌표를 사용합니다.
// ────────────────────────────────────────────────────────────────────────

// ── ① 일기도: 등압선 + 저/고기압 ──────────────────────────────────────────
export function WeatherMapImage({ c }: { c: TyphoonCase }) {
  const cx = c.track[0].x;
  const cy = c.track[0].y;
  return (
    <KoreaMap highlight={c.destination}>
      {/* 등압선 (중심으로 갈수록 조밀) */}
      {[6, 10, 15, 21, 28].map((r, i) => (
        <ellipse
          key={r}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.85}
          fill="none"
          stroke="#1f3b5c"
          strokeWidth={0.4}
          opacity={0.7 - i * 0.08}
        />
      ))}
      <text x={cx - 1.6} y={cy + 1.4} fontSize="5" fontWeight={800} fill="#c01818">
        저
      </text>
      {/* 북태평양 고기압 */}
      <text x={82} y={70} fontSize="5" fontWeight={800} fill="#1d4ed8">
        고
      </text>
      {[5, 9].map((r) => (
        <ellipse key={r} cx={84} cy={68} rx={r} ry={r * 0.9} fill="none" stroke="#1d4ed8" strokeWidth={0.4} opacity={0.5} />
      ))}
      {/* 태풍 기호 */}
      <TyphoonSymbol cx={cx} cy={cy} />
    </KoreaMap>
  );
}

// ── ② 위성영상: 나선형 구름 + 눈 ──────────────────────────────────────────
export function SatelliteImage({ c }: { c: TyphoonCase }) {
  const cx = c.track[0].x;
  const cy = c.track[0].y;
  // 사례별로 눈이 뚜렷한 정도
  const sharpEye = c.destination !== 'seoul';
  return (
    <KoreaMap highlight={c.destination} showCities>
      <defs>
        <filter id="cloudblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <g filter="url(#cloudblur)" opacity={0.92}>
        {/* 나선 비구름대 (회전 배치한 타원들) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const ang = (i / 14) * Math.PI * 3.2;
          const rad = 4 + i * 1.7;
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad * 0.9;
          return <circle key={i} cx={x} cy={y} r={4 + i * 0.25} fill="#f4f7fb" opacity={0.55} />;
        })}
        {/* 중심부 두꺼운 구름 */}
        <circle cx={cx} cy={cy} r={11} fill="#ffffff" opacity={0.9} />
      </g>
      {/* 태풍의 눈 */}
      {sharpEye && <circle cx={cx} cy={cy} r={2.4} fill="#3a4a63" opacity={0.8} />}
      <TyphoonSymbol cx={cx} cy={cy} small />
    </KoreaMap>
  );
}

// ── ③ 레이더영상: 강수 에코 ────────────────────────────────────────────────
export function RadarImage({ c }: { c: TyphoonCase }) {
  const cx = c.track[0].x;
  const cy = c.track[0].y;
  // 강수대가 목적지 방향으로 뻗는 정도
  const dirX = (c.cityX - cx) * 0.18;
  const dirY = (c.cityY - cy) * 0.18;
  return (
    <KoreaMap highlight={c.destination}>
      <defs>
        <filter id="echoblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
      <g filter="url(#echoblur)" opacity={0.85}>
        {/* 약한 비 (초록) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2.4;
          const rad = 8 + i * 1.2;
          return (
            <circle
              key={`g${i}`}
              cx={cx + Math.cos(ang) * rad + dirX}
              cy={cy + Math.sin(ang) * rad * 0.9 + dirY}
              r={5}
              fill="#3fb24f"
              opacity={0.5}
            />
          );
        })}
        {/* 강한 비 (노랑) */}
        {Array.from({ length: 7 }).map((_, i) => {
          const ang = (i / 7) * Math.PI * 2 + 0.5;
          const rad = 4 + i * 1.1;
          return (
            <circle
              key={`y${i}`}
              cx={cx + Math.cos(ang) * rad + dirX * 0.6}
              cy={cy + Math.sin(ang) * rad + dirY * 0.6}
              r={3.4}
              fill="#f2c200"
              opacity={0.7}
            />
          );
        })}
        {/* 매우 강한 비 (빨강) — 눈벽 부근 */}
        {Array.from({ length: 6 }).map((_, i) => {
          const ang = (i / 6) * Math.PI * 2;
          const rad = 3.2;
          return (
            <circle
              key={`r${i}`}
              cx={cx + Math.cos(ang) * rad}
              cy={cy + Math.sin(ang) * rad}
              r={2.4}
              fill="#e02424"
              opacity={0.85}
            />
          );
        })}
      </g>
      <TyphoonSymbol cx={cx} cy={cy} small />
    </KoreaMap>
  );
}

function TyphoonSymbol({ cx, cy, small }: { cx: number; cy: number; small?: boolean }) {
  const s = small ? 2.2 : 3;
  return (
    <g transform={`translate(${cx},${cy})`} opacity={0.95}>
      <path
        d={`M0,0 C ${s},${-s} ${2 * s},0 ${s},${s} M0,0 C ${-s},${s} ${-2 * s},0 ${-s},${-s}`}
        fill="none"
        stroke="#7a1fa2"
        strokeWidth={small ? 0.9 : 1.2}
        strokeLinecap="round"
      />
      <circle r={0.9} fill="#7a1fa2" />
    </g>
  );
}
