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

// 구조별 대표 관측 거리(중심 기준 px). 위험반원(오른쪽, dx>0)에서 표본을 본다.
const REP_DIST: Record<Region, number> = {
  eye: 0,
  eyewall: (R_EYE + R_EYEWALL) / 2,
  spiral: (R_EYEWALL + R_STRONGWIND) / 2,
  outer: R_STRONGWIND + 8,
};

// 구조별 "왜 그런 날씨인가" 설명
const WHY: Record<Region, { title: string; body: string }> = {
  eye: {
    title: '왜 눈은 고요할까?',
    body: '태풍 중심에서는 공기가 서서히 아래로 내려옵니다(하강·침강 기류). 그래서 구름이 흩어지고 비와 바람이 일시적으로 약해집니다. 대신 공기를 가장 세게 빨아들이는 중심이라 기압은 가장 낮습니다. 잠깐 고요해 보여도 태풍이 지나간 것이 아니라, 곧 반대편 눈벽이 다시 닥칩니다.',
  },
  eyewall: {
    title: '왜 눈벽이 가장 강할까?',
    body: '눈을 둘러싼 벽에서는 공기가 가장 빠르게 솟구칩니다(강한 상승기류). 그래서 두꺼운 적란운이 만들어지고 폭우가 쏟아집니다. 중심과의 기압 차이(기압경도력)도 여기서 가장 커서, 바람과 비가 태풍 전체에서 가장 강하게 나타납니다.',
  },
  spiral: {
    title: '왜 비가 강해졌다 약해졌다 할까?',
    body: '나선 모양의 구름 띠를 따라 비구름이 들어왔다 빠져나갑니다. 구름 띠가 지나갈 때는 강한 비와 돌풍이, 띠와 띠 사이에서는 잠시 비가 약해집니다. 그래서 강수가 강약을 반복합니다.',
  },
  outer: {
    title: '왜 바깥은 약할까?',
    body: '중심에서 멀어질수록 기압 차이가 작아져 바람과 비가 약합니다. 다만 태풍 중심이 다가올수록 점점 강해지므로, 지금 약하다고 안심하기는 이릅니다.',
  },
};

const REGIONS: { id: Region; label: string; emoji: string }[] = [
  { id: 'outer', label: '태풍 바깥', emoji: '🌥️' },
  { id: 'spiral', label: '나선형 비구름대', emoji: '🌧️' },
  { id: 'eyewall', label: '눈벽', emoji: '⛈️' },
  { id: 'eye', label: '태풍의 눈', emoji: '🌀' },
];

// STEP 2. 태풍 구조 탐색 (유사 3D — 드래그로 회전해 구조 관찰)
export function Simulator({ go, patch }: StepProps) {
  const [selected, setSelected] = useState<Region>('outer');
  const [observed, setObserved] = useState<Set<Region>>(new Set(['outer']));
  const [rot, setRot] = useState({ z: 0, x: 58 }); // z: 회전, x: 기울기
  const drag = useRef<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });

  const repDist = REP_DIST[selected];
  const w = weatherAt(repDist, 0); // 오른쪽(위험반원) 대표 표본
  const cmp = compareSemicircles(Math.max(60, Math.round(repDist) || 80));

  const exploredEnough = observed.has('eyewall') && observed.has('eye');

  const observe = (r: Region) => {
    setSelected(r);
    setObserved((s) => (s.has(r) ? s : new Set(s).add(r)));
  };

  function onDown(e: React.PointerEvent) {
    drag.current = { on: true, x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    setRot((r) => ({
      z: r.z + dx * 0.5,
      x: Math.max(18, Math.min(74, r.x - dy * 0.4)),
    }));
  }
  const onUp = () => (drag.current.on = false);

  return (
    <section className="card sim fade-in">
      <h2>STEP 2 · 태풍 구조 입체 탐색</h2>
      <p className="q">
        태풍을 <b>드래그해서 돌려 보며</b> 구조를 입체로 관찰해 보세요. 좌우로 끌면 <b>회전</b>, 위아래로
        끌면 <b>기울기</b>가 바뀝니다. 아래에서 구조를 골라 그 위치의 날씨와 <b>이유</b>를 확인하세요.
      </p>

      <div className="sim-grid">
        <div className="sim3d-wrap">
          <div
            className="sim3d-stage"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <div
              className={`sim3d-disc${selected === 'eye' ? ' calm' : ''}`}
              style={{ transform: `rotateX(${rot.x}deg) rotateZ(${rot.z}deg)` }}
            >
              <svg viewBox={`0 0 ${VB} ${VB}`} className="sim3d-svg">
                <defs>
                  <radialGradient id="ty3d" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#36465f" />
                    <stop offset="12%" stopColor="#2b3a52" />
                    <stop offset="32%" stopColor="#5b6b86" />
                    <stop offset="100%" stopColor="#b6c1d4" />
                  </radialGradient>
                </defs>

                {/* 위험/가항 반원 배경 */}
                <path d={`M${C},${C} m-${R_STRONGWIND},0 a${R_STRONGWIND},${R_STRONGWIND} 0 0 1 ${2 * R_STRONGWIND},0 Z`} fill="#ffd9d9" opacity={0.45} transform={`rotate(-90 ${C} ${C})`} />
                <path d={`M${C},${C} m-${R_STRONGWIND},0 a${R_STRONGWIND},${R_STRONGWIND} 0 0 0 ${2 * R_STRONGWIND},0 Z`} fill="#d9e6ff" opacity={0.45} transform={`rotate(-90 ${C} ${C})`} />

                {/* 강풍반경(바깥) */}
                <circle cx={C} cy={C} r={R_STRONGWIND} fill="url(#ty3d)" opacity={0.4}
                  stroke={selected === 'outer' ? '#1d7fe0' : '#f1c40f'} strokeWidth={selected === 'outer' ? 6 : 2} strokeDasharray="8 5" />

                {/* 나선형 비구름대 (회전 애니메이션) */}
                <g className={`sim3d-spiral${selected === 'eye' ? ' paused' : ''}`}
                   opacity={selected === 'spiral' ? 0.95 : 0.55}
                   stroke="#ffffff" strokeWidth={selected === 'spiral' ? 9 : 6} fill="none" strokeLinecap="round">
                  {[0, 1, 2].map((k) => (
                    <path key={k} d={spiralPath(C, C, R_EYEWALL, R_STRONGWIND - 10, k * 120)} />
                  ))}
                </g>

                {/* 눈벽 (입체감용 이중 링) */}
                <circle cx={C} cy={C} r={R_EYEWALL + 6} fill="#1c2738" opacity={0.5} />
                <circle cx={C} cy={C} r={R_EYEWALL} fill="#2b3a52"
                  stroke={selected === 'eyewall' ? '#ff5a5a' : 'none'} strokeWidth={6} opacity={0.9} />

                {/* 눈 */}
                <circle cx={C} cy={C} r={R_EYE} fill="#e9f0fa"
                  stroke={selected === 'eye' ? '#1d7fe0' : '#cdd8e6'} strokeWidth={selected === 'eye' ? 5 : 2} />

                {/* 이동 방향 */}
                <g stroke="#16202e" strokeWidth={3} fill="#16202e">
                  <line x1={C} y1={42} x2={C} y2={14} />
                  <polygon points={`${C - 6},24 ${C + 6},24 ${C},8`} />
                </g>
                <text x={C + 10} y={20} fontSize={15} fill="#16202e">이동 방향</text>
                <text x={C + R_STRONGWIND - 86} y={C - 6} fontSize={14} fill="#b03030" fontWeight={700}>위험반원 ▶</text>
                <text x={22} y={C - 6} fontSize={14} fill="#2a5ab0" fontWeight={700}>◀ 가항반원</text>
              </svg>
            </div>
          </div>
          <div className="sim3d-hint">🖐️ 끌어서 회전·기울이기 · 구조를 선택하면 강조됩니다</div>

          <div className="region-picker">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                className={`region-btn${selected === r.id ? ' on' : ''}${observed.has(r.id) ? ' seen' : ''}`}
                onClick={() => observe(r.id)}
              >
                <span className="region-emoji">{r.emoji}</span>
                {r.label}
                {observed.has(r.id) && <span className="seen-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-readout">
          <div className={`readout-head region-${w.region}`}>
            관찰 중: <b>{w.regionName}</b>
            {selected === 'eye' && <span className="semicircle-tag calm-tag">지금은 고요…</span>}
          </div>
          <ul className="readout-list">
            <li>강수의 세기 <b>{w.rain}</b></li>
            <li>바람의 세기 <b>{w.wind} ({w.windSpeed} m/s)</b></li>
            <li>기압 <b>{w.pressure}</b></li>
            <li>야외활동 <b className="danger">{w.outdoor}</b></li>
          </ul>

          <div className="why-box">
            <h4>💡 {WHY[selected].title}</h4>
            <p>{WHY[selected].body}</p>
          </div>

          <div className="compare-box">
            <h4>위험반원 vs 가항반원 (같은 거리)</h4>
            <div className="compare-row">
              <div className="compare-cell danger-cell">위험반원<br /><b>{cmp.right} m/s</b></div>
              <div className="compare-cell safe-cell">가항반원<br /><b>{cmp.left} m/s</b></div>
            </div>
            <p className="hint-small">
              <b>왜 오른쪽이 더 셀까?</b> 태풍은 스스로 회전하면서 동시에 앞으로 이동합니다. 진행 방향
              <b> 오른쪽(위험반원)</b>은 회전하는 바람과 태풍이 나아가는 속도가 같은 방향이라 더해져
              바람이 강해지고, <b>왼쪽(가항반원)</b>은 서로 반대라 일부 상쇄돼 상대적으로 약합니다.
              (가항반원도 안전하다는 뜻은 아닙니다.)
            </p>
          </div>
        </div>
      </div>

      <div className="explore-guide">
        <h4>🔎 탐색 안내</h4>
        <ul>
          <li className={observed.has('eyewall') ? 'ok' : ''}>비와 바람이 가장 강한 <b>눈벽</b>을 골라 그 이유를 확인하세요.</li>
          <li className={observed.has('eye') ? 'ok' : ''}>비·바람은 약하지만 기압이 가장 낮은 <b>태풍의 눈</b>을 골라 보세요.</li>
          <li>태풍을 돌려가며 눈·눈벽·비구름대가 입체로 쌓인 구조를 관찰해 보세요.</li>
        </ul>
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
          {exploredEnough ? '목적지 선택하러 가기 →' : '눈벽과 눈을 모두 관찰하세요'}
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
