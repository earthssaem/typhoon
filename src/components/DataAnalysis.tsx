import { useEffect, useState } from 'react';
import type { StepProps } from '../App';
import { CASES } from '../data/cases';
import { WeatherMapImage, SatelliteImage, RadarImage } from './svg/SyntheticImagery';

type Tab = 'map' | 'satellite' | 'radar';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: '① 일기도', icon: '🗺️' },
  { id: 'satellite', label: '② 위성영상', icon: '🛰️' },
  { id: 'radar', label: '③ 레이더영상', icon: '📡' },
];

const ROLE: Record<Tab, string> = {
  map: '주변의 전체적인 기압 배치와 바람이 강해질 가능성을 읽습니다.',
  satellite: '시뮬레이터에서 배운 태풍 구조(눈·눈벽·비구름대)를 실제 영상에서 찾습니다.',
  radar: '목적지 주변의 현재 강수와 가까운 시간의 변화를 읽습니다.',
};

// 자료를 "읽는 방법"만 안내한다. (정답은 알려주지 않는다)
const HOWTO: Record<Tab, string[]> = {
  map: [
    '등압선(같은 기압을 이은 선)의 간격을 보세요. 간격이 좁을수록(빽빽할수록) 기압이 급하게 변해 바람이 강합니다.',
    '태풍 중심(저기압)이 목적지에서 어느 쪽에, 얼마나 가까이 있는지 확인하세요.',
    '목적지 부근의 등압선이 촘촘한지 넓은지 직접 비교해 보세요.',
  ],
  satellite: [
    '태풍의 눈이 뚜렷하고 둥글수록 세력이 강합니다.',
    '두꺼운 눈벽 구름과 나선형 비구름대가 어느 방향으로 뻗어 있는지 보세요.',
    '목적지가 구름 구조의 안쪽 / 끝자락 / 바깥 중 어디에 있는지 직접 판단하세요.',
  ],
  radar: [
    '색이 붉을수록 비가 강합니다(강한 에코).',
    '강한 강수대가 목적지로 다가오는지, 스쳐 지나가는지 흐름을 상상하며 보세요.',
    '목적지에 지금 걸쳐 있는 강수의 세기를 직접 가늠해 보세요.',
  ],
};

// 학생이 직접 해석하도록 던지는 질문 (채점하지 않음 — 스스로 읽기 연습)
const PROMPTS: Record<Tab, { id: string; q: string; opts: string[] }[]> = {
  map: [
    { id: 'm1', q: '목적지 부근의 등압선 간격은?', opts: ['촘촘함(바람 강할 듯)', '넓음(바람 약할 듯)', '잘 모르겠음'] },
    { id: 'm2', q: '태풍 중심은 목적지에서?', opts: ['가까움', '다소 멂', '잘 모르겠음'] },
  ],
  satellite: [
    { id: 's1', q: '태풍의 눈은?', opts: ['뚜렷함(강함)', '흐릿함(약화)', '잘 모르겠음'] },
    { id: 's2', q: '구름대는 목적지를?', opts: ['완전히 덮음', '끝자락만 걸침', '비껴감', '잘 모르겠음'] },
  ],
  radar: [
    { id: 'r1', q: '강한 강수대가 목적지로?', opts: ['직접 접근', '스쳐 지나감', '비껴감', '잘 모르겠음'] },
    { id: 'r2', q: '목적지의 현재 강수 강도는?', opts: ['강함', '보통', '약함', '잘 모르겠음'] },
  ],
};

// STEP 4. 기상자료 분석 — 해석법 안내 + 학생이 직접 해석
export function DataAnalysis({ go, patch, state }: StepProps) {
  const c = CASES[state.destination!];
  const [tab, setTab] = useState<Tab>('map');
  // 학생이 스스로 기록한 해석(채점 대상 아님)
  const [reads, setReads] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!state.analysisViewed.map) {
      patch({ analysisViewed: { ...state.analysisViewed, map: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markViewed = (t: Tab) => {
    setTab(t);
    if (!state.analysisViewed[t]) {
      patch({ analysisViewed: { ...state.analysisViewed, [t]: true } });
    }
  };

  const allViewed =
    state.analysisViewed.map && state.analysisViewed.satellite && state.analysisViewed.radar;

  return (
    <section className="card fade-in">
      <h2>STEP 4 · 기상자료 분석 — {c.cityName}</h2>
      <p className="q">
        태풍 「{c.typhoonName}」 · {c.analysisTime}. 자료를 <b>읽는 방법</b>을 익힌 뒤, 영상을 보고
        <b> 직접 해석</b>해 보세요. (여기서의 해석은 채점하지 않아요 — 스스로 읽는 연습입니다.)
      </p>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' active' : ''}${state.analysisViewed[t.id] ? ' viewed' : ''}`}
            onClick={() => markViewed(t.id)}
          >
            {t.icon} {t.label}
            {state.analysisViewed[t.id] && <span className="check">✓</span>}
          </button>
        ))}
      </div>

      <div className="analysis-grid">
        <div className="analysis-img">
          {tab === 'map' && <WeatherMapImage c={c} />}
          {tab === 'satellite' && <SatelliteImage c={c} />}
          {tab === 'radar' && <RadarImage c={c} />}
          <div className="img-caption">교육용 합성 {TABS.find((t) => t.id === tab)!.label.slice(2)} (예시)</div>
        </div>

        <div className="analysis-points">
          <div className="role-box">📌 {ROLE[tab]}</div>

          <h4>📖 이 자료 읽는 법</h4>
          <ul className="howto-list">
            {HOWTO[tab].map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>

          <h4>✍️ 내가 읽은 내용</h4>
          <div className="read-prompts">
            {PROMPTS[tab].map((p) => (
              <div key={p.id} className="read-prompt">
                <div className="read-q">{p.q}</div>
                <div className="read-opts">
                  {p.opts.map((o) => (
                    <button
                      key={o}
                      className={`read-opt${reads[p.id] === o ? ' on' : ''}`}
                      onClick={() => setReads((r) => ({ ...r, [p.id]: o }))}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="hint-small">
            정답은 알려주지 않아요. 여기서 읽은 내용을 바탕으로 다음 단계(예상경로·예보 카드)에서 직접
            판단하게 됩니다.
          </p>
        </div>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('destination')}>← 목적지</button>
        <button className="primary-btn" disabled={!allViewed} onClick={() => go('track')}>
          {allViewed ? '태풍 예상경로 분석 →' : '세 자료를 모두 확인하세요'}
        </button>
      </div>
    </section>
  );
}
