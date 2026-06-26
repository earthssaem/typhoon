import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { StepProps } from '../App';
import {
  SIM,
  weather3D,
  compareSemicircle3D,
  precipLevel,
  windLevel,
  PRECIP_LABELS,
  WIND_LABELS,
  OUTDOOR_LABELS,
  type Region3D,
} from '../game/sim3dConfig';

// three.js 번들 지연 로딩 (다른 화면 초기 로딩을 가볍게)
const Sim3DCanvas = lazy(() => import('./sim3d/Sim3DCanvas'));

// WebGL 지원 여부 (없으면 2D 안내로 폴백)
function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

const LEVEL_COLORS = ['#5bb07d', '#e6b800', '#e8743d', '#e74c3c'];

function LevelBar({ level }: { level: number }) {
  return (
    <span className="level-track" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="level-seg" style={{ background: i <= level ? LEVEL_COLORS[level] : '#e3e9f2' }} />
      ))}
    </span>
  );
}

// 현재 위치한 구조 설명
function structDesc(region: Region3D): string {
  switch (region) {
    case 'eye':
      return '비와 바람은 일시적으로 약해지지만 중심기압은 가장 낮습니다. 이후 반대편 눈벽이 접근하면 다시 강한 비바람이 나타날 수 있습니다.';
    case 'eyewall':
      return '태풍에서 비와 바람이 가장 강한 영역입니다. 높고 두꺼운 적란운이 태풍의 눈을 둘러싸고 있습니다.';
    case 'band':
      return '구름 띠와 띠 사이를 통과하면서 비가 강해졌다 약해질 수 있으며, 돌풍이 나타날 수 있습니다.';
    case 'strongwind':
      return '강풍반경 안이지만 구름 띠 사이라 비는 약합니다. 위치를 옮기면 다시 강해질 수 있습니다.';
    default:
      return '태풍 중심에서 멀어 직접적인 영향은 비교적 약하지만, 강풍반경과 비구름의 범위는 태풍마다 다를 수 있습니다.';
  }
}

// 위험/가항 바람 벡터 설명 (회전 + 이동 효과 합성)
function WindVectors({ moveEffect }: { moveEffect: number }) {
  const U = 58;
  const rot = U;
  const move = U * moveEffect;
  const cells: { title: string; dir: 1 | -1; color: string; note: string }[] = [
    { title: '위험반원', dir: 1, color: '#e74c3c', note: '회전 + 이동 효과가 같은 방향 → 합쳐짐' },
    { title: '가항반원', dir: -1, color: '#3a7bd5', note: '회전 ↔ 이동 효과가 반대 → 상쇄됨' },
  ];
  const Arrow = ({ y, len, color, label }: { y: number; len: number; color: string; label: string }) => {
    const x0 = 14;
    const x1 = x0 + Math.abs(len);
    const sign = len >= 0 ? 1 : -1;
    const tip = len >= 0 ? x1 : x0 - Math.abs(len);
    const tail = len >= 0 ? x0 : x0;
    const tx = len >= 0 ? x1 : x0 - Math.abs(len);
    return (
      <g>
        <line x1={tail} y1={y} x2={tx} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" />
        <polygon
          points={`${tip},${y} ${tip - sign * 8},${y - 5} ${tip - sign * 8},${y + 5}`}
          fill={color}
        />
        <text x={x0} y={y - 8} className="vec-tag">{label}</text>
      </g>
    );
  };
  return (
    <div className="vector-grid">
      {cells.map((c) => (
        <div key={c.title} className="vector-cell">
          <div className="vector-title" style={{ color: c.color }}>{c.title}</div>
          <svg viewBox="0 0 150 110" className="vec-svg">
            <Arrow y={24} len={rot} color="#8a97a8" label="회전 바람" />
            <Arrow y={58} len={c.dir * move} color="#e8943d" label="이동 효과" />
            <Arrow y={92} len={rot + c.dir * move} color={c.color} label="실제 바람" />
          </svg>
          <p className="vec-note">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

// STEP 2. 태풍 구조 입체 시뮬레이터 (Three.js)
export function Simulator({ go, patch }: StepProps) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lowPerf =
    typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4;
  const hasWebGL = useMemo(webglOK, []);

  const [point, setPoint] = useState({ x: 0, z: -(SIM.OUTER_R - 1) });
  const [paused, setPaused] = useState(false);
  const [showHeading, setShowHeading] = useState(true);
  const [showSemicircle, setShowSemicircle] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [view, setView] = useState<'top' | 'tilt'>('tilt');
  const [vectorOpen, setVectorOpen] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [hints, setHints] = useState({ 1: false, 2: false, 3: false });

  // 탐색 과제 추적
  const visitedEye = useRef(false);
  const visitedEyewall = useRef(false);
  const visitedDanger = useRef(false); // 위험반원(오른쪽 절반) 방문
  const visitedNavigable = useRef(false); // 가항반원(왼쪽 절반) 방문
  const vectorRef = useRef(false);
  const [tasks, setTasks] = useState({ t1: false, t2: false, t3: false });

  const w = weather3D(point.x, point.z);
  const r = Math.hypot(point.x, point.z);
  const moveEffect = 0.12 + moveSpeed * 0.3;
  const cmp = compareSemicircle3D(Math.max(2, r || 4), moveEffect);

  const evalTasks = () => {
    setTasks({
      t1: visitedEyewall.current,
      t2: visitedEye.current,
      t3: visitedDanger.current && visitedNavigable.current && vectorRef.current,
    });
  };

  const updatePoint = (p: { x: number; z: number }) => {
    setPoint(p);
    const ww = weather3D(p.x, p.z);
    if (ww.region === 'eyewall') visitedEyewall.current = true;
    if (ww.region === 'eye') visitedEye.current = true;
    // 위험/가항반원은 태풍을 좌우로 나눈 '넓은 절반' — 눈 밖이면 어느 절반인지 기록
    if (ww.region !== 'eye' && ww.region !== 'outside') {
      if (ww.semicircle === '위험반원') visitedDanger.current = true;
      if (ww.semicircle === '가항반원') visitedNavigable.current = true;
    }
    evalTasks();
  };

  const openVectors = () => {
    setVectorOpen((v) => {
      const nv = !v;
      vectorRef.current = vectorRef.current || nv;
      return nv;
    });
  };
  useEffect(() => {
    if (vectorOpen) {
      vectorRef.current = true;
      evalTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vectorOpen]);

  const allDone = tasks.t1 && tasks.t2 && tasks.t3;

  const reset = () => {
    setPoint({ x: 0, z: -(SIM.OUTER_R - 1) });
    setTasks({ t1: false, t2: false, t3: false });
    visitedEye.current = false;
    visitedEyewall.current = false;
    visitedDanger.current = false;
    visitedNavigable.current = false;
  };

  // 레벨 계산
  const pLevel = precipLevel(w.precip);
  const wLevel = windLevel(w.windSpeed);

  // 과제 카드 상태
  const status = (done: boolean, doing: boolean) => (done ? 'done' : doing ? 'doing' : 'todo');
  const card1 = status(tasks.t1, ['eye', 'eyewall', 'band', 'strongwind'].includes(w.region));
  const card2 = status(tasks.t2, w.region === 'eyewall' || w.region === 'eye');
  const card3 = status(tasks.t3, visitedDanger.current || visitedNavigable.current || vectorOpen);
  const STAT_LABEL: Record<string, string> = { todo: '시작 전', doing: '탐색 중', done: '완료' };

  return (
    <section className="card sim fade-in">
      <h2>STEP 2 · 태풍 구조 입체 시뮬레이터</h2>
      <p className="q">
        태풍 중심으로부터 <b>어느 위치에 있느냐</b>에 따라 날씨는 어떻게 달라질까요? 화면을 끌어 태풍을
        돌려 보고, <b>지표면을 클릭</b>하면 관측 지점(🔵)이 그 자리로 이동해 위치별 날씨를 보여줍니다.
      </p>

      <div className="sim3d-grid">
        {/* 왼쪽: 3D 캔버스 */}
        <div className="sim3d-canvas">
          <div className="sim3d-view">
            {hasWebGL ? (
              <Suspense fallback={<div className="webgl-fallback"><p>3D 태풍을 불러오는 중…</p></div>}>
                <Sim3DCanvas
                  point={point}
                  setPoint={updatePoint}
                  showHeading={showHeading}
                  showSemicircle={showSemicircle}
                  showNames={showNames}
                  paused={paused}
                  reduced={!!reduced}
                  lowPerf={lowPerf}
                  view={view}
                />
              </Suspense>
            ) : (
              <div className="webgl-fallback">
                <p>이 기기에서는 3D 보기를 사용할 수 없습니다(WebGL 미지원).</p>
                <p className="hint-small">아래 정보 패널의 값과 탐색 과제는 그대로 이용할 수 있습니다.</p>
              </div>
            )}
          </div>
          <div className="sim3d-hint">
            🖐️ 화면 드래그: 태풍 회전 · 🖱️ 휠: 확대/축소 · 👆 지표면 클릭: 관측 지점 이동
          </div>
        </div>

        {/* 오른쪽: 정보 패널 */}
        <div className="sim-readout">
          <div className={`readout-head region-${w.region}`}>
            <b>{w.regionName}</b>
            {w.region !== 'eye' && <span className="semicircle-tag">{w.semicircle}</span>}
            <div className="readout-dist">중심과의 거리 약 {w.distanceKm} km</div>
          </div>

          <ul className="readout-list">
            <li><span>기압</span><b>{w.pressure} hPa</b></li>
            <li className="level-li">
              <span>강수</span>
              <span className="level-wrap"><LevelBar level={pLevel} /><b>{PRECIP_LABELS[pLevel]}</b></span>
            </li>
            <li className="level-li">
              <span>바람</span>
              <span className="level-wrap"><LevelBar level={wLevel} /><b>{WIND_LABELS[wLevel]}</b></span>
            </li>
            <li>
              <span>바람 방향</span>
              <b><span className="wind-arrow" style={{ transform: `rotate(${w.windDirDeg}deg)` }}>↑</span> {w.windDirDeg}°</b>
            </li>
            <li className="level-li">
              <span>야외활동</span>
              <span className="level-wrap"><LevelBar level={wLevel} /><b>{OUTDOOR_LABELS[wLevel]}</b></span>
            </li>
          </ul>

          <p className="readout-desc">{structDesc(w.region)}</p>

          <div className="compare-box">
            <h4>왜 위험반원의 바람이 더 강할까?</h4>
            <div className="compare-row">
              <div className="compare-cell danger-cell">위험반원<br /><b>{cmp.right} m/s</b></div>
              <div className="compare-cell safe-cell">가항반원<br /><b>{cmp.left} m/s</b></div>
            </div>
            <button className="chip-btn vector-toggle" onClick={openVectors}>
              {vectorOpen ? '▲ 벡터 설명 접기' : '▼ 바람이 다른 이유 보기'}
            </button>
            {vectorOpen && (
              <div className="vector-panel">
                <WindVectors moveEffect={moveEffect} />
                <div className="move-slider">
                  <label>태풍 이동속도: <b>{moveSpeed < 0.34 ? '느림' : moveSpeed < 0.67 ? '보통' : '빠름'}</b></label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={moveSpeed}
                    onChange={(e) => setMoveSpeed(Number(e.target.value))}
                  />
                  <p className="hint-small">이동속도를 높이면 위험·가항반원의 풍속 차이가 커집니다.</p>
                </div>
              </div>
            )}
            <p className="hint-small">
              가항반원은 위험반원보다 바람이 <b>상대적으로</b> 약한 영역이며, 안전한 지역을 의미하지는 않습니다.
            </p>
          </div>
          <p className="edu-note">※ 실제 기상값이 아니라 태풍 구조에 따른 <b>상대적 차이</b>를 보여주는 교육용 모형입니다.</p>
        </div>
      </div>

      {/* 조작 버튼 (기능별 그룹) */}
      <div className="sim3d-controls">
        <div className="ctrl-group">
          <span className="ctrl-group-label">시점</span>
          <button className={`chip-btn${view === 'top' ? ' on' : ''}`} onClick={() => setView('top')}>위에서 보기</button>
          <button className={`chip-btn${view === 'tilt' ? ' on' : ''}`} onClick={() => setView('tilt')}>입체로 보기</button>
        </div>
        <div className="ctrl-group">
          <span className="ctrl-group-label">관찰</span>
          <button className="chip-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ 회전 재생' : '⏸ 회전 정지'}</button>
          <button className="chip-btn" onClick={reset}>초기화</button>
        </div>
        <div className="ctrl-group">
          <span className="ctrl-group-label">표시</span>
          <button className={`chip-btn${showHeading ? ' on' : ''}`} onClick={() => setShowHeading((v) => !v)}>진행 방향</button>
          <button className={`chip-btn${showSemicircle ? ' on' : ''}`} onClick={() => setShowSemicircle((v) => !v)}>위험·가항반원</button>
          <button className={`chip-btn${showNames ? ' on' : ''}`} onClick={() => setShowNames((v) => !v)}>구조 이름</button>
        </div>
      </div>

      {/* 탐색 과제 카드 */}
      <div className="explore-head">🔎 탐색 과제 — 관측 지점을 옮겨 직접 발견해 보세요</div>
      <div className="task-cards">
        {[
          {
            n: 1 as const,
            st: card1,
            done: tasks.t1,
            title: '① 비와 바람이 가장 강한 곳을 찾아라',
            guide: '관측 지점을 이동해 강수와 바람이 모두 ‘매우 강함’으로 표시되는 위치를 찾아보세요.',
            find: '눈벽은 태풍의 눈을 둘러싼 높고 두꺼운 구름 벽으로, 태풍에서 비와 바람이 가장 강한 영역입니다.',
            hint: '태풍의 눈 바로 바깥쪽을 탐색해 보세요.',
          },
          {
            n: 2 as const,
            st: card2,
            done: tasks.t2,
            title: '② 기압은 가장 낮지만 비·바람이 약한 곳을 찾아라',
            guide: '비와 바람이 약해지면서 기압이 가장 낮게 나타나는 위치를 찾아보세요.',
            find: '태풍의 눈에서는 비와 바람이 일시적으로 약해질 수 있지만 태풍이 완전히 지나간 것은 아닙니다.',
            hint: '태풍 중심의 비어 있는 부분을 선택해 보세요.',
          },
          {
            n: 3 as const,
            st: card3,
            done: tasks.t3,
            title: '③ 같은 거리인데 왜 바람이 다를까?',
            guide: '태풍을 좌우로 나눈 두 절반 — 위험반원(오른쪽)과 가항반원(왼쪽)을 각각 한 번씩 찍어 보고, ‘바람이 다른 이유 보기’를 열어 보세요.',
            find: '같은 거리에서도 위험반원은 태풍의 회전 바람과 이동 효과가 더해져 가항반원보다 바람이 강합니다.',
            hint: '진행 방향 화살표(북쪽) 기준으로 오른쪽 절반과 왼쪽 절반을 각각 클릭해 보세요.',
          },
        ].map((c) => (
          <div key={c.n} className={`task-card ${c.st}`}>
            <div className="task-card-head">
              <span className="task-title">{c.title}</span>
              <span className={`task-status s-${c.st}`}>{c.done ? '✓ ' : ''}{STAT_LABEL[c.st]}</span>
            </div>
            {c.done ? (
              <p className="task-find">💡 {c.find}</p>
            ) : (
              <>
                <p className="task-guide">{c.guide}</p>
                <button className="hint-btn" onClick={() => setHints((h) => ({ ...h, [c.n]: !h[c.n] }))}>
                  {hints[c.n] ? '힌트 숨기기' : '힌트 보기'}
                </button>
                {hints[c.n] && <p className="task-hint">🧭 {c.hint}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <div className="summary-note">
          태풍의 영향은 중심과의 거리만으로 결정되지 않습니다. 태풍 내부의 어느 구조에 위치하는지, 태풍
          진행 방향의 어느 쪽에 위치하는지에 따라 비와 바람의 세기가 달라집니다.
        </div>
      )}

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('intro')}>← 상황으로</button>
        <button
          className="primary-btn"
          disabled={!allDone}
          onClick={() => {
            patch({ visitedSim: true });
            go('destination');
          }}
        >
          {allDone ? '다음 단계로 이동 →' : '세 과제를 모두 완료하세요'}
        </button>
      </div>
    </section>
  );
}
