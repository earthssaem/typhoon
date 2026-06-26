import type { StepProps } from '../App';
import type { ImpactChoice, PositionChoice } from '../types';
import { CASES } from '../data/cases';
import { ForecastTrackMap } from './svg/ForecastTrackMap';

const IMPACTS: { id: ImpactChoice; label: string }[] = [
  { id: 'none', label: '영향이 거의 없음' },
  { id: 'partial', label: '일부 영향 예상' },
  { id: 'direct', label: '직접적인 영향 가능성이 높음' },
];

const POSITIONS: { id: PositionChoice; label: string }[] = [
  { id: 'outside', label: '태풍 영향권 밖' },
  { id: 'navigable', label: '가항반원에 위치할 가능성' },
  { id: 'dangerous', label: '위험반원에 위치할 가능성' },
  { id: 'eyewall', label: '태풍 중심·눈벽 부근 통과 가능성' },
];

// STEP 5. 태풍 예상경로 분석
export function TrackAnalysis({ go, patch, state }: StepProps) {
  const c = CASES[state.destination!];
  const j = state.trackJudgment;
  const set = (p: Partial<typeof j>) => patch({ trackJudgment: { ...j, ...p } });
  const ready = j.impact && j.position;

  return (
    <section className="card fade-in">
      <h2>STEP 5 · 태풍 예상경로 분석 — {c.cityName}</h2>
      <p className="q">
        당시 기상청이 발표한 예상경로입니다. 목적지가 진행 방향의 어느 쪽에, 어떤 반경 안에 있는지
        판단해 보세요.
      </p>

      <div className="track-layout">
        <div className="track-map">
          <ForecastTrackMap c={c} />
          <div className="legend">
            <span><i className="dot purple" /> 예상경로 중심선</span>
            <span><i className="dot purple-fill" /> 70% 확률반경</span>
            <span><i className="dash yellow" /> 강풍반경</span>
            <span><i className="dot red-fill" /> 폭풍반경</span>
            <span><i className="dot red" /> 목적지 ({c.cityName})</span>
          </div>
        </div>

        <div className="track-info">
          <div className="info-grid">
            <div><span>진행 방향</span><b>{c.trackSummary.direction}</b></div>
            <div><span>이동속도</span><b>{c.trackSummary.speed}</b></div>
            <div><span>중심기압</span><b>{c.trackSummary.pressure} hPa</b></div>
            <div><span>최대풍속</span><b>{c.trackSummary.maxWind} m/s</b></div>
          </div>

          <h4>① 태풍 영향 판단</h4>
          <div className="choice-row">
            {IMPACTS.map((o) => (
              <button
                key={o.id}
                className={`choice${j.impact === o.id ? ' on' : ''}`}
                onClick={() => set({ impact: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <h4>② 경로상 위치</h4>
          <div className="choice-row col">
            {POSITIONS.map((o) => (
              <button
                key={o.id}
                className={`choice${j.position === o.id ? ' on' : ''}`}
                onClick={() => set({ position: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <p className="hint-small">
            중심선과의 거리뿐 아니라 <b>진행 방향의 어느 쪽</b>인지, <b>강풍·폭풍반경</b>에 드는지를
            함께 고려하세요.
          </p>
        </div>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('analysis')}>← 자료 분석</button>
        <button className="primary-btn" disabled={!ready} onClick={() => go('forecast')}>
          {ready ? '최종 예보 카드 작성 →' : '두 항목을 모두 판단하세요'}
        </button>
      </div>
    </section>
  );
}
