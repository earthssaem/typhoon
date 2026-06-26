import type { StepProps } from '../App';
import type { DestinationId } from '../types';
import { CASES, DESTINATIONS } from '../data/cases';
import { KoreaMap } from './svg/KoreaMap';

// STEP 3. 수학여행 목적지 선택
export function DestinationSelect({ go, patch, state }: StepProps) {
  const select = (id: DestinationId) => {
    // 목적지가 바뀌면 이후 단계 입력을 초기화
    patch({
      destination: id,
      analysisViewed: { map: false, satellite: false, radar: false },
      trackJudgment: { impact: null, position: null },
      forecast: { temp: null, rain: null, wind: null, schedule: null },
      evidence: [],
      packed: [],
    });
    go('analysis');
  };

  return (
    <section className="card fade-in">
      <h2>STEP 3 · 수학여행 목적지 선택</h2>
      <p className="q">어디로 수학여행을 떠날까요? 선택한 목적지에 영향을 준 실제(예시) 태풍 사례를 분석하게 됩니다.</p>

      <div className="dest-layout">
        <div className="dest-map">
          <KoreaMap highlight={state.destination} />
        </div>
        <div className="dest-cards">
          {DESTINATIONS.map((id) => {
            const c = CASES[id];
            return (
              <button key={id} className="dest-card" onClick={() => select(id)}>
                <div className="dest-name">{c.cityName}</div>
                <div className="dest-case">
                  태풍 「{c.typhoonName}」 · {c.year}
                </div>
                <p className="dest-note">{c.note}</p>
                <span className="dest-go">이 목적지로 분석하기 →</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="hint-small">
        서울·부산·제주는 각각 별도의 앱이 아니라, 같은 게임 화면에서 선택한 목적지의 태풍 사례
        데이터와 배경만 바뀝니다.
      </p>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('sim')}>← 시뮬레이터로</button>
      </div>
    </section>
  );
}
