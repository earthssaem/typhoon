import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import type { StepProps } from '../App';
import { SIM, weather3D, compareSemicircle3D, type Region3D } from '../game/sim3dConfig';

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

// STEP 2. 태풍 구조 입체 시뮬레이터 (Three.js)
export function Simulator({ go, patch }: StepProps) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lowPerf =
    typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4;
  const hasWebGL = useMemo(webglOK, []);

  const [point, setPoint] = useState({ x: 0, z: -(SIM.OUTER_R - 1) }); // 북쪽 바깥에서 시작
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showHeading, setShowHeading] = useState(true);
  const [showSemicircle, setShowSemicircle] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [view, setView] = useState<'top' | 'tilt'>('tilt');

  // 탐색 과제 추적
  const visited = useRef<Set<Region3D>>(new Set());
  const dangerSeen = useRef<{ r: number } | null>(null);
  const [tasks, setTasks] = useState({ strongest: false, lowest: false, compared: false });

  const w = weather3D(point.x, point.z);
  const r = Math.hypot(point.x, point.z);
  const cmp = compareSemicircle3D(Math.max(2, r || 4));

  // 위치 변경 시 과제 판정
  const updatePoint = (p: { x: number; z: number }) => {
    setPoint(p);
    const ww = weather3D(p.x, p.z);
    visited.current.add(ww.region);
    const next = { ...tasks };
    if (ww.region === 'eyewall') next.strongest = true;
    if (ww.region === 'eye') next.lowest = true;
    // 같은 거리(±20%)에서 위험/가항 양쪽 방문 시 비교 완료
    const dist = Math.hypot(p.x, p.z);
    if (ww.semicircle === '위험반원') dangerSeen.current = { r: dist };
    if (
      ww.semicircle === '가항반원' &&
      dangerSeen.current &&
      Math.abs(dangerSeen.current.r - dist) / Math.max(1, dist) < 0.25
    ) {
      next.compared = true;
    }
    if (next.strongest !== tasks.strongest || next.lowest !== tasks.lowest || next.compared !== tasks.compared)
      setTasks(next);
  };

  const allDone = tasks.strongest && tasks.lowest && tasks.compared;

  const reset = () => {
    setPoint({ x: 0, z: -(SIM.OUTER_R - 1) });
    setTasks({ strongest: false, lowest: false, compared: false });
    visited.current = new Set();
    dangerSeen.current = null;
  };

  return (
    <section className="card sim fade-in">
      <h2>STEP 2 · 태풍 구조 입체 시뮬레이터</h2>
      <p className="q">
        태풍 중심으로부터 <b>어느 위치에 있느냐</b>에 따라 날씨는 어떻게 달라질까요? 관측 지점(🔵)을
        드래그해 옮기고, 화면을 끌어 시점을 돌려 보세요.
      </p>

      <div className="sim3d-grid">
        {/* 중앙: 3D 캔버스 */}
        <div className="sim3d-canvas">
          {hasWebGL ? (
            <Suspense fallback={<div className="webgl-fallback"><p>3D 태풍을 불러오는 중…</p></div>}>
              <Sim3DCanvas
                point={point}
                setPoint={updatePoint}
                dragging={dragging}
                setDragging={setDragging}
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
          <div className="cam-buttons">
            <button className={`chip-btn${view === 'tilt' ? ' on' : ''}`} onClick={() => setView('tilt')}>비스듬히 보기</button>
            <button className={`chip-btn${view === 'top' ? ' on' : ''}`} onClick={() => setView('top')}>위에서 보기</button>
          </div>
          <div className="sim3d-hint">🖐️ 관측점 드래그 = 위치 이동 · 빈 곳 드래그 = 시점 회전</div>
        </div>

        {/* 우측: 정보 패널 */}
        <div className="sim-readout">
          <div className={`readout-head region-${w.region}`}>
            <b>{w.regionName}</b>
            <span className="semicircle-tag">{w.semicircle}</span>
          </div>
          <ul className="readout-list">
            <li>중심과의 거리 <b>{w.distanceKm} km</b></li>
            <li>기압 <b>{w.pressure} hPa</b></li>
            <li>강수의 세기 <b>{w.precipLabel}</b></li>
            <li>바람의 세기 <b>{w.windSpeed} m/s</b></li>
            <li>바람의 방향 <b><span className="wind-arrow" style={{ transform: `rotate(${w.windDirDeg}deg)` }}>↑</span> {w.windDirDeg}°</b></li>
            <li>야외활동 <b className="danger">{w.outdoorRisk}</b></li>
          </ul>
          <p className="readout-desc">{w.desc}</p>

          <div className="compare-box">
            <h4>같은 거리 비교 (약 {Math.round(Math.max(2, r) * SIM.KM_PER_UNIT)} km)</h4>
            <div className="compare-row">
              <div className="compare-cell danger-cell">위험반원<br /><b>{cmp.right} m/s</b></div>
              <div className="compare-cell safe-cell">가항반원<br /><b>{cmp.left} m/s</b></div>
            </div>
            <p className="hint-small">
              가항반원은 위험반원보다 바람이 <b>상대적으로</b> 약한 영역이며, 안전한 지역을 의미하지는
              않습니다.
            </p>
          </div>
          <p className="edu-note">※ 실제 기상값이 아니라 태풍 구조에 따른 <b>상대적 차이</b>를 보여주는 교육용 값입니다.</p>
        </div>
      </div>

      {/* 하단: 조작 + 탐색 과제 */}
      <div className="sim3d-controls">
        <button className="chip-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ 회전 재생' : '⏸ 회전 정지'}</button>
        <button className={`chip-btn${showHeading ? ' on' : ''}`} onClick={() => setShowHeading((v) => !v)}>진행 방향</button>
        <button className={`chip-btn${showSemicircle ? ' on' : ''}`} onClick={() => setShowSemicircle((v) => !v)}>위험·가항반원</button>
        <button className={`chip-btn${showNames ? ' on' : ''}`} onClick={() => setShowNames((v) => !v)}>구조 이름</button>
        <button className="chip-btn" onClick={reset}>초기화</button>
      </div>

      <div className="explore-guide">
        <h4>🔎 탐색 과제</h4>
        <ul>
          <li className={tasks.strongest ? 'ok' : ''}>① 비와 바람이 가장 강한 위치(눈벽)를 찾아보세요.</li>
          <li className={tasks.lowest ? 'ok' : ''}>② 비·바람은 약하지만 기압이 가장 낮은 위치(눈)를 찾아보세요.</li>
          <li className={tasks.compared ? 'ok' : ''}>③ 같은 거리의 위험반원·가항반원 풍속을 비교해 보세요.</li>
        </ul>
        {allDone && (
          <div className="summary-note">
            태풍의 영향은 중심과의 거리만으로 결정되지 않습니다. 태풍 내부의 어느 구조에 위치하는지,
            태풍 진행 방향의 어느 쪽에 위치하는지에 따라 비와 바람의 세기가 달라집니다.
          </div>
        )}
      </div>

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
