import { useEffect, useState } from 'react';
import type { GameState, StepId } from './types';
import { Intro } from './components/Intro';
import { Simulator } from './components/Simulator';
import { DestinationSelect } from './components/DestinationSelect';
import { DataAnalysis } from './components/DataAnalysis';
import { TrackAnalysis } from './components/TrackAnalysis';
import { ForecastCard } from './components/ForecastCard';
import { Carrier } from './components/Carrier';
import { Ending } from './components/Ending';
import { Stepper } from './components/Stepper';

const STORAGE_KEY = 'typhoon-trip-state-v1';

const initialState: GameState = {
  step: 'intro',
  visitedSim: false,
  destination: null,
  analysisViewed: { map: false, satellite: false, radar: false },
  trackJudgment: { impact: null, position: null },
  forecast: { temp: null, rain: null, wind: null, schedule: null },
  evidence: [],
  packed: [],
};

function load(): GameState {
  try {
    // sessionStorage: 탭을 닫으면 자동 초기화 (같은 탭의 새로고침에서는 유지)
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return initialState;
}

export default function App() {
  const [state, setState] = useState<GameState>(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const go = (step: StepId) => setState((s) => ({ ...s, step }));
  const patch = (p: Partial<GameState>) => setState((s) => ({ ...s, ...p }));
  const reset = () => setState({ ...initialState });

  const props = { state, go, patch, reset };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-emoji">🌀</span>
          <div>
            <div className="brand-title">수학여행 D-1: 태풍이 올라온대!!</div>
            <div className="brand-sub">기상자료로 여행지 날씨를 판단하는 체험형 웹앱 · 프로토타입</div>
          </div>
        </div>
        <button className="ghost-btn" onClick={reset} title="처음부터 다시 시작">
          처음부터
        </button>
      </header>

      <Stepper current={state.step} state={state} onJump={go} />

      <main className="stage">
        {state.step === 'intro' && <Intro {...props} />}
        {state.step === 'sim' && <Simulator {...props} />}
        {state.step === 'destination' && <DestinationSelect {...props} />}
        {state.step === 'analysis' && <DataAnalysis {...props} />}
        {state.step === 'track' && <TrackAnalysis {...props} />}
        {state.step === 'forecast' && <ForecastCard {...props} />}
        {state.step === 'carrier' && <Carrier {...props} />}
        {state.step === 'ending' && <Ending {...props} />}
      </main>

      <footer className="footer">
        ⚠️ 현재 버전은 기능 확인을 위한 프로토타입이며, 화면에 표시된 기상자료는 <b>예시 자료</b>입니다.
      </footer>
    </div>
  );
}

// 공통 step props
export interface StepProps {
  state: GameState;
  go: (step: StepId) => void;
  patch: (p: Partial<GameState>) => void;
  reset: () => void;
}
