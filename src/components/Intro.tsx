import type { StepProps } from '../App';

// STEP 1. 문제 상황 제시
export function Intro({ go }: StepProps) {
  return (
    <section className="card intro fade-in">
      <div className="intro-hero">
        <div className="intro-emoji">🌀☔️🧳</div>
        <h1>내일이 수학여행인데…… 태풍이 올라온대!!</h1>
        <p className="lead">
          태풍이 어느 방향으로 이동할지, 우리 수학여행지에는 어떤 날씨가 나타날지 분석해 보세요.
          예상되는 날씨에 맞게 일정과 필요한 준비물도 선택해야 합니다.
        </p>
      </div>

      <div className="goal-box">
        <h3>🎯 최종 목표</h3>
        <p>
          기상청 자료를 분석해 수학여행지의 날씨를 판단하고, 실제 날씨에 적합한 옷과 준비물을
          선택하세요.
        </p>
      </div>

      <div className="notice-box">
        <p>
          하지만 태풍의 영향을 판단하려면 먼저 <b>태풍의 구조와 위치별 날씨</b>를 이해해야 합니다.
          <br />
          태풍 중심에서 어느 위치에 있느냐에 따라 날씨는 어떻게 달라질까요? 먼저 시뮬레이터에서
          태풍 주변의 날씨를 탐색해 봅시다.
        </p>
      </div>

      <div className="flow-preview">
        {['상황', '태풍 구조 체험', '목적지 선택', '자료 분석', '예상경로', '날씨 판단', '준비물', '실제 여행'].map(
          (t, i, arr) => (
            <span key={t} className="flow-pill">
              {t}
              {i < arr.length - 1 && <span className="flow-arrow">→</span>}
            </span>
          ),
        )}
      </div>

      <div className="actions">
        <button className="primary-btn" onClick={() => go('sim')}>
          태풍 구조 시뮬레이터 시작 →
        </button>
      </div>
    </section>
  );
}
