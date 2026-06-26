import { useEffect, useRef, useState } from 'react';
import type { StepProps } from '../App';

// STEP 1. 문제 상황 — 시네마틱 인트로 (4장면)
// 장면 1 준비물 등장 → 2 태풍 알림 → 3 핵심 문구 → 4 활동 목표 + 버튼
// framer-motion 미설치 환경이므로 CSS 애니메이션 + 타이머로 구성한다.

const SEEN_KEY = 'typhoon-intro-seen-v1';

// 준비물 (단순 아이콘)
const SUPPLIES = [
  { e: '🧳', n: '캐리어' },
  { e: '👕', n: '옷' },
  { e: '👟', n: '운동화' },
  { e: '📷', n: '카메라' },
  { e: '🍪', n: '간식' },
  { e: '🧢', n: '모자' },
];

// 장면별 길이(ms). 재방문 시 빠르게 진행.
function durations(fast: boolean, reduced: boolean) {
  const base = reduced ? 0.6 : 1;
  const k = (fast ? 0.45 : 1) * base;
  return {
    s1: Math.round(2200 * k),
    s2: Math.round(2600 * k),
    s3: Math.round(3000 * k),
  };
}

export function Intro({ go }: StepProps) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const seen = typeof window !== 'undefined' && localStorage.getItem(SEEN_KEY) === '1';

  const [scene, setScene] = useState(0); // 0~3
  const [soundOn, setSoundOn] = useState(false);
  const timers = useRef<number[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);

  // 타이머로 장면 자동 진행
  useEffect(() => {
    const d = durations(seen, !!reduced);
    const t: number[] = [];
    t.push(window.setTimeout(() => setScene(1), d.s1));
    t.push(window.setTimeout(() => setScene(2), d.s1 + d.s2));
    t.push(window.setTimeout(() => setScene(3), d.s1 + d.s2 + d.s3));
    t.push(
      window.setTimeout(() => {
        try {
          localStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* ignore */
        }
      }, d.s1 + d.s2 + d.s3),
    );
    timers.current = t;
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 장면 2 진입 시 (소리 켜진 경우만) 알림음 재생
  useEffect(() => {
    if (scene === 2 && soundOn) playAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  function playAlert() {
    try {
      audioCtx.current ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioCtx.current;
      const now = ctx.currentTime;
      [0, 0.18].forEach((off) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, now + off);
        g.gain.setValueAtTime(0.0001, now + off);
        g.gain.exponentialRampToValueAtTime(0.18, now + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.14);
        o.connect(g).connect(ctx.destination);
        o.start(now + off);
        o.stop(now + off + 0.16);
      });
    } catch {
      /* 오디오 미지원 무시 */
    }
  }

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) playAlert(); // 사용자가 켤 때 1회 확인음 (자동재생 아님)
  };

  const skip = () => {
    timers.current.forEach(clearTimeout);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setScene(3);
  };

  const stormy = scene >= 1; // 장면2부터 흐려짐

  return (
    <section className={`card intro intro-cinema fade-in${reduced ? ' reduced' : ''}`}>
      {/* 상단 컨트롤 */}
      <div className="intro-controls">
        <button className="chip-btn" onClick={toggleSound} aria-pressed={soundOn}>
          {soundOn ? '🔊 소리 켜짐' : '🔈 소리 켜기'}
        </button>
        {scene < 3 && (
          <button className="chip-btn" onClick={skip}>
            건너뛰기 ⏭
          </button>
        )}
      </div>

      {/* 무대 */}
      <div className={`cinema-stage sky-${stormy ? 'dim' : 'bright'}`}>
        {/* 바람에 흔들리는 구름/소용돌이 (장면2~) */}
        {scene >= 1 && (
          <div className="cinema-clouds" aria-hidden>
            <span className="cloud c1">☁️</span>
            <span className="cloud c2">☁️</span>
            <span className="swirl">🌀</span>
          </div>
        )}

        {/* 장면 1: 준비물 등장 */}
        <div className={`scene scene-supplies${scene === 0 ? ' on' : ' past'}`}>
          <div className="supplies-row">
            {SUPPLIES.map((s, i) => (
              <span
                key={s.n}
                className={`supply${stormy ? ' sway' : ''}`}
                style={{ animationDelay: `${i * 0.28}s` }}
                title={s.n}
              >
                {s.e}
              </span>
            ))}
          </div>
          <h2 className="cinema-line">드디어 내일은 기다리던 수학여행!</h2>
        </div>

        {/* 장면 2: 태풍 알림 카드 */}
        {scene >= 1 && (
          <div className={`alert-card${scene === 1 ? ' drop' : scene > 1 ? ' settled' : ''}`}>
            <div className="alert-head">📢 기상 속보</div>
            <div className="alert-body">태풍이 한반도를 향해 북상 중입니다.</div>
          </div>
        )}

        {/* 장면 3: 핵심 문구 */}
        {scene >= 2 && (
          <div className={`punch${scene === 2 ? ' on' : ' past'}`}>
            <div className="punch-1">잠깐……</div>
            <div className="punch-2">내일 수학여행인데</div>
            <div className="punch-3">태풍이 올라온대!!</div>
          </div>
        )}
      </div>

      {/* 장면 4: 활동 목표 + 버튼 */}
      {scene >= 3 && (
        <div className="cinema-goal fade-in">
          <h1>내일이 수학여행인데…… 태풍이 올라온대!!</h1>
          <ul className="goal-questions">
            <li style={{ animationDelay: '0.05s' }}>태풍이 우리 여행지에 영향을 줄까?</li>
            <li style={{ animationDelay: '0.35s' }}>비는 얼마나 내리고 바람은 얼마나 강할까?</li>
            <li style={{ animationDelay: '0.65s' }}>어떤 옷과 준비물을 챙겨야 할까?</li>
          </ul>
          <div className="flow-preview">
            {['상황', '태풍 구조', '목적지', '자료 분석', '예상경로', '날씨 판단', '준비물', '실제 여행'].map(
              (t, i, arr) => (
                <span key={t} className="flow-pill">
                  {t}
                  {i < arr.length - 1 && <span className="flow-arrow">→</span>}
                </span>
              ),
            )}
          </div>
          <div className="actions">
            <button className="primary-btn big-cta" onClick={() => go('sim')}>
              태풍 분석 시작하기 →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
