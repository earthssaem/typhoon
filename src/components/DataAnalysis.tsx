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
  map: '주변의 전체적인 기압 배치와 바람이 강하게 나타날 가능성을 확인합니다.',
  satellite: '시뮬레이터에서 배운 태풍 구조(눈·눈벽·비구름대)를 실제 영상에서 확인합니다.',
  radar: '목적지 주변의 현재 강수 상황과 가까운 시간의 변화를 확인합니다.',
};

// STEP 4. 기상자료 분석
export function DataAnalysis({ go, patch, state }: StepProps) {
  const c = CASES[state.destination!];
  const [tab, setTab] = useState<Tab>('map');

  // 처음 화면에 보이는 ① 일기도는 진입 시 본 것으로 처리한다.
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

  const points = tab === 'map' ? c.weatherMap : tab === 'satellite' ? c.satellite : c.radar;
  const allViewed =
    state.analysisViewed.map && state.analysisViewed.satellite && state.analysisViewed.radar;

  return (
    <section className="card fade-in">
      <h2>STEP 4 · 기상자료 분석 — {c.cityName}</h2>
      <p className="q">
        태풍 「{c.typhoonName}」 · {c.analysisTime}. 세 가지 자료를 차례로 확인하세요.
      </p>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' active' : ''}${
              state.analysisViewed[t.id] ? ' viewed' : ''
            }`}
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
          <h4>확인할 내용</h4>
          <ul className="check-list">
            {points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
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
