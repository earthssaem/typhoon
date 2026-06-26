import type { GameState, StepId } from '../types';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'intro', label: '상황' },
  { id: 'sim', label: '구조 탐색' },
  { id: 'destination', label: '목적지' },
  { id: 'analysis', label: '자료 분석' },
  { id: 'track', label: '예상경로' },
  { id: 'forecast', label: '예보 카드' },
  { id: 'carrier', label: '캐리어' },
  { id: 'ending', label: '엔딩' },
];

// 각 단계 진입 가능 여부 (앞 단계 완료 조건)
function reachable(id: StepId, s: GameState): boolean {
  switch (id) {
    case 'intro':
      return true;
    case 'sim':
      return true;
    case 'destination':
      return s.visitedSim;
    case 'analysis':
    case 'track':
    case 'forecast':
    case 'carrier':
      return !!s.destination;
    case 'ending':
      return s.packed.length > 0;
  }
}

export function Stepper({
  current,
  state,
  onJump,
}: {
  current: StepId;
  state: GameState;
  onJump: (s: StepId) => void;
}) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav className="stepper" aria-label="진행 단계">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = s.id === current;
        const can = reachable(s.id, state) || done;
        return (
          <button
            key={s.id}
            className={`step-chip${active ? ' active' : ''}${done ? ' done' : ''}`}
            disabled={!can}
            onClick={() => can && onJump(s.id)}
          >
            <span className="step-num">{done ? '✓' : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
