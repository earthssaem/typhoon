import type { StepProps } from '../App';
import type { TempChoice, RainChoice, WindChoice, ScheduleChoice } from '../types';
import { CASES } from '../data/cases';

const TEMP: { id: TempChoice; label: string }[] = [
  { id: 'under18', label: '18℃ 미만' },
  { id: '18to22', label: '18~22℃' },
  { id: '22to26', label: '22~26℃' },
  { id: 'over26', label: '26℃ 이상' },
];
const RAIN: { id: RainChoice; label: string }[] = [
  { id: 'none', label: '비가 거의 오지 않음' },
  { id: 'weak', label: '약한 비' },
  { id: 'continuous', label: '비가 지속됨' },
  { id: 'heavy', label: '한때 강한 비' },
];
const WIND: { id: WindChoice; label: string }[] = [
  { id: 'weak', label: '약함' },
  { id: 'somewhat', label: '다소 강함' },
  { id: 'umbrella', label: '우산 사용이 어려울 정도' },
  { id: 'outdoor', label: '야외활동이 어려울 정도' },
];
const SCHEDULE: { id: ScheduleChoice; label: string }[] = [
  { id: 'asPlanned', label: '예정대로 진행' },
  { id: 'shiftTime', label: '일부 야외활동 시간 변경' },
  { id: 'moveIndoor', label: '야외활동을 실내활동으로 변경' },
  { id: 'excludeArea', label: '해안·산지 등 특정 일정 제외' },
];

// STEP 6. 최종 예보 카드 작성
export function ForecastCard({ go, patch, state }: StepProps) {
  const c = CASES[state.destination!];
  const f = state.forecast;
  const setF = (p: Partial<typeof f>) => patch({ forecast: { ...f, ...p } });

  const toggleEv = (id: string) =>
    patch({
      evidence: state.evidence.includes(id)
        ? state.evidence.filter((e) => e !== id)
        : [...state.evidence, id],
    });

  const ready = f.temp && f.rain && f.wind && f.schedule && state.evidence.length > 0;

  const block = <T extends string>(
    title: string,
    opts: { id: T; label: string }[],
    val: T | null,
    on: (v: T) => void,
  ) => (
    <div className="fc-block">
      <h4>{title}</h4>
      <div className="choice-row wrap">
        {opts.map((o) => (
          <button key={o.id} className={`choice${val === o.id ? ' on' : ''}`} onClick={() => on(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="card fade-in">
      <h2>STEP 6 · 최종 예보 카드 — {c.cityName}</h2>
      <p className="q">모든 자료를 종합해 목적지의 날씨를 최종 판단하고, 판단의 근거를 고르세요.</p>

      <div className="forecast-card">
        {block('예상 기온', TEMP, f.temp, (v) => setF({ temp: v }))}
        {block('예상 강수', RAIN, f.rain, (v) => setF({ rain: v }))}
        {block('예상 바람', WIND, f.wind, (v) => setF({ wind: v }))}
        {block('야외 일정', SCHEDULE, f.schedule, (v) => setF({ schedule: v }))}
      </div>

      <div className="evidence">
        <h4>판단 근거 카드 (해당하는 것을 모두 선택)</h4>
        <div className="evidence-grid">
          {c.evidenceCards.map((e) => (
            <button
              key={e.id}
              className={`ev-card${state.evidence.includes(e.id) ? ' on' : ''}`}
              onClick={() => toggleEv(e.id)}
            >
              {e.text}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('track')}>← 예상경로</button>
        <button className="primary-btn" disabled={!ready} onClick={() => go('carrier')}>
          {ready ? '캐리어 꾸리러 가기 →' : '모든 항목과 근거를 선택하세요'}
        </button>
      </div>
    </section>
  );
}
