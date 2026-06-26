import { useRef, useState } from 'react';
import type { StepProps } from '../App';
import {
  R_EYE,
  R_EYEWALL,
  R_STRONGWIND,
  weatherAt,
  compareSemicircles,
  type Region,
} from '../game/typhoon';

const VB = 400;
const C = VB / 2; // center 200

// STEP 2. 태풍 주변의 날씨 탐색 시뮬레이터
export function Simulator({ go, patch }: StepProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pt, setPt] = useState({ x: C, y: C - 130 }); // 북쪽 바깥에서 시작
  const [visited, setVisited] = useState<Set<Region>>(new Set());
  const dragging = useRef(false);

  const dx = pt.x - C;
  const dy = pt.y - C;
  const w = weatherAt(dx, dy);
  const cmp = compareSemicircles(Math.max(40, Math.round(w.distanceKm / 1.5)));

  const exploredEnough = visited.has('eyewall') && visited.has('eye');

  function toSvg(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VB;
    const y = ((clientY - rect.top) / rect.height) * VB;
    // 중심에서 최대 반경 안쪽으로 제한
    const ddx = x - C;
    const ddy = y - C;
    const d = Math.hypot(ddx, ddy);
    const maxR = R_STRONGWIND + 20;
    if (d > maxR) {
      return { x: C + (ddx / d) * maxR, y: C + (ddy / d) * maxR };
    }
    return { x, y };
  }

  function move(clientX: number, clientY: number) {
    const next = toSvg(clientX, clientY);
    setPt(next);
    const reg = weatherAt(next.x - C, next.y - C).region;
    setVisited((v) => (v.has(reg) ? v : new Set(v).add(reg)));
  }

  return (
    <section className="card sim fade-in">
      <h2>STEP 2 · 태풍 주변의 날씨 탐색</h2>
      <p className="q">
        태풍 중심으로부터 어느 위치에 있느냐에 따라 날씨는 어떻게 달라질까? 관측 지점(🔵)을 드래그해
        보세요.
      </p>

      <div className="sim-grid">
        <div className="sim-canvas">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="typhoon-diagram"
            onPointerDown={(e) => {
              dragging.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
              move(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => dragging.current && move(e.clientX, e.clientY)}
            onPointerUp={() => (dragging.current = false)}
            onPointerLeave={() => (dragging.current = false)}
          >
            <defs>
              <radialGradient id="tyfill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3a4a63" />
                <stop offset="12%" stopColor="#2b3a52" />
                <stop offset="30%" stopColor="#5b6b86" />
                <stop offset="100%" stopColor="#aeb9cc" />
              </radialGradient>
            </defs>

            {/* 위험/가항 반원 배경 */}
            <path d={`M${C},${C} m-${R_STRONGWIND},0 a${R_STRONGWIND},${R_STRONGWIND} 0 0 1 ${2 * R_STRONGWIND},0 Z`} fill="#ffe1e1" opacity={0.5} transform={`rotate(-90 ${C} ${C})`} />
            <path d={`M${C},${C} m-${R_STRONGWIND},0 a${R_STRONGWIND},${R_STRONGWIND} 0 0 0 ${2 * R_STRONGWIND},0 Z`} fill="#e1ecff" opacity={0.5} transform={`rotate(-90 ${C} ${C})`} />

            {/* 강풍반경 */}
            <circle cx={C} cy={C} r={R_STRONGWIND} fill="url(#tyfill)" opacity={0.35} stroke="#f1c40f" strokeWidth={2} strokeDasharray="8 5" />
            {/* 나선형 비구름대 */}
            <g opacity={0.5} stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round">
              {[0, 1, 2].map((k) => (
                <path
                  key={k}
                  d={spiralPath(C, C, R_EYEWALL, R_STRONGWIND - 10, k * 120)}
                />
              ))}
            </g>
            {/* 눈벽 */}
            <circle cx={C} cy={C} r={R_EYEWALL} fill="#2b3a52" opacity={0.85} />
            {/* 눈 */}
            <circle cx={C} cy={C} r={R_EYE} fill="#dfe7f2" />

            {/* 이동 방향 화살표 (북) */}
            <g stroke="#1f2a3a" strokeWidth={3} fill="#1f2a3a">
              <line x1={C} y1={40} x2={C} y2={12} />
              <polygon points={`${C - 6},22 ${C + 6},22 ${C},6`} />
              <text x={C + 10} y={18} fontSize={16} stroke="none">이동 방향</text>
            </g>

            {/* 반원 라벨 */}
            <text x={C + R_STRONGWIND - 80} y={C - 6} fontSize={15} fill="#b03030" fontWeight={700}>위험반원 ▶</text>
            <text x={20} y={C - 6} fontSize={15} fill="#2a5ab0" fontWeight={700}>◀ 가항반원</text>

            {/* 관측 지점 */}
            <g transform={`translate(${pt.x},${pt.y})`} className="obs-point">
              <circle r={11} fill="#1d7fe0" stroke="#fff" strokeWidth={3} />
              <circle r={20} fill="none" stroke="#1d7fe0" strokeWidth={2} opacity={0.5}>
                <animate attributeName="r" values="14;22;14" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        </div>

        <div className="sim-readout">
          <div className={`readout-head region-${w.region}`}>
            현재 위치: <b>{w.regionName}</b>
            <span className="semicircle-tag">{w.semicircle}</span>
          </div>
          <ul className="readout-list">
            <li>중심과의 거리 <b>{w.distanceKm} km</b></li>
            <li>강수의 세기 <b>{w.rain}</b></li>
            <li>바람의 세기 <b>{w.wind} ({w.windSpeed} m/s)</b></li>
            <li>기압 <b>{w.pressure}</b></li>
            <li>야외활동 <b className="danger">{w.outdoor}</b></li>
          </ul>
          <p className="readout-desc">{w.desc}</p>

          <div className="compare-box">
            <h4>같은 거리 비교 (약 {Math.max(60, w.distanceKm)} km)</h4>
            <div className="compare-row">
              <div className="compare-cell danger-cell">
                위험반원<br />
                <b>{cmp.right} m/s</b>
              </div>
              <div className="compare-cell safe-cell">
                가항반원<br />
                <b>{cmp.left} m/s</b>
              </div>
            </div>
            <p className="hint-small">
              가항반원은 위험반원보다 바람이 <b>상대적으로</b> 약한 영역일 뿐, 실제로 안전한 지역을
              의미하지는 않습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="explore-guide">
        <h4>🔎 탐색 안내</h4>
        <ul>
          <li className={visited.has('outer') ? 'ok' : ''}>관측 지점을 태풍 바깥에서 중심 방향으로 이동해 보세요.</li>
          <li className={visited.has('eyewall') ? 'ok' : ''}>비와 바람이 가장 강한 위치(눈벽)를 찾아보세요.</li>
          <li className={visited.has('eye') ? 'ok' : ''}>비·바람은 약하지만 기압이 가장 낮은 위치(눈)를 찾아보세요.</li>
          <li>중심에서 같은 거리의 위험반원·가항반원 풍속을 비교해 보세요.</li>
        </ul>
      </div>

      <div className="summary-note">
        태풍의 영향은 중심과의 거리만으로 결정되지 않습니다. 태풍 내부의 어느 구조에 위치하는지,
        진행 방향의 어느 쪽에 위치하는지에 따라 비와 바람의 세기가 달라집니다.
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('intro')}>← 상황으로</button>
        <button
          className="primary-btn"
          disabled={!exploredEnough}
          onClick={() => {
            patch({ visitedSim: true });
            go('destination');
          }}
        >
          {exploredEnough ? '목적지 선택하러 가기 →' : '눈벽과 눈을 모두 찾아보세요'}
        </button>
      </div>
    </section>
  );
}

// 로그 나선 경로 생성
function spiralPath(cx: number, cy: number, r0: number, r1: number, startDeg: number): string {
  const turns = 1.4;
  const steps = 40;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = ((startDeg + t * 360 * turns) * Math.PI) / 180;
    const r = r0 + (r1 - r0) * t;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  }
  return d;
}
