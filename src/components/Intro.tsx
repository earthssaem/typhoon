import { useEffect, useRef, useState } from 'react';
import type { StepProps } from '../App';

// STEP 1. 문제 상황 — 시네마틱 인트로
// 방에서 TV를 보던 중 태풍 뉴스 속보가 뜨는 연출 (4장면)
// 장면 0 방+TV(평온) → 1 뉴스 속보 → 2 핵심 문구 → 3 활동 목표 + 버튼

const SEEN_KEY = 'typhoon-intro-seen-v1';

const SUPPLIES = ['🧳', '👕', '👟', '📷', '🍪', '🧢'];

function durations(fast: boolean, reduced: boolean) {
  const base = reduced ? 0.6 : 1;
  const k = (fast ? 0.45 : 1) * base;
  return {
    s1: Math.round(2400 * k),
    s2: Math.round(2800 * k),
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

  // 뉴스 속보(장면1) 진입 시 소리 켜져 있으면 알림음
  useEffect(() => {
    if (scene === 1 && soundOn) playAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  function playAlert() {
    try {
      audioCtx.current ??= new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audioCtx.current;
      const now = ctx.currentTime;
      [0, 0.2].forEach((off) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, now + off);
        g.gain.setValueAtTime(0.0001, now + off);
        g.gain.exponentialRampToValueAtTime(0.18, now + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.16);
        o.connect(g).connect(ctx.destination);
        o.start(now + off);
        o.stop(now + off + 0.18);
      });
    } catch {
      /* 오디오 미지원 무시 */
    }
  }

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) playAlert();
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

  const breaking = scene >= 1; // 속보부터

  return (
    <section className={`card intro intro-cinema fade-in${reduced ? ' reduced' : ''}`}>
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

      {/* 방 안 장면 */}
      <div className={`cinema-stage room ${breaking ? 'room-dim' : 'room-bright'}`}>
        {/* 벽 / 창문 / 바닥 */}
        <div className="room-wall" aria-hidden>
          <div className="room-window">
            <div className={`win-sky ${breaking ? 'win-storm' : 'win-clear'}`}>
              {!breaking ? <span className="win-sun">☀️</span> : <span className="win-swirl">🌀</span>}
            </div>
          </div>
          <div className="room-poster">🗺️</div>
        </div>
        <div className="room-floor" aria-hidden />

        {/* 흩어진 준비물 */}
        <div className="room-supplies" aria-hidden>
          {SUPPLIES.map((s, i) => (
            <span key={i} className={`r-supply${breaking ? ' sway' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
              {s}
            </span>
          ))}
        </div>

        {/* TV */}
        <div className="tv-set">
          <div className={`tv-screen${breaking ? ' breaking' : ''}`}>
            {!breaking ? (
              <div className="tv-weather">
                <div className="tvw-row"><span>📍 전국</span><span>내일 날씨</span></div>
                <div className="tvw-icons"><span>☀️</span><span>⛅</span><span>☀️</span></div>
                <div className="tvw-caption">나들이 좋은 날씨</div>
              </div>
            ) : (
              <div className="tv-news">
                <div className="news-top">
                  <span className="news-live">● LIVE</span>
                  <span className="news-badge">속보</span>
                </div>
                <div className="news-anchor">🧑‍💼📡</div>
                <div className="news-head">태풍이 한반도를 향해 북상 중입니다.</div>
                <div className="news-ticker"><span>기상청 태풍경보 · 전국 대부분 지역 영향 가능성 · 외출 시 주의 · </span></div>
              </div>
            )}
          </div>
          <div className="tv-stand" />
        </div>

        {/* TV 보는 학생 (뒷모습) */}
        <div className={`viewer${breaking ? ' shock' : ''}`} aria-hidden>
          <svg viewBox="0 0 80 90" width="80" height="90">
            <ellipse cx="40" cy="86" rx="26" ry="5" fill="#00000022" />
            <rect x="20" y="44" width="40" height="40" rx="14" fill="#5b6b86" />
            <circle cx="40" cy="30" r="16" fill="#3a2b22" />
            <circle cx="40" cy="33" r="13" fill="#2a1f19" />
          </svg>
          {breaking && <span className="shock-mark">❗</span>}
        </div>

        {/* 장면 0 자막 */}
        {scene === 0 && <div className="room-caption">드디어 내일은 기다리던 수학여행!</div>}

        {/* 장면 2 핵심 문구 */}
        {scene >= 2 && (
          <div className="punch room-punch">
            <div className="punch-1">잠깐……</div>
            <div className="punch-2">내일 수학여행인데</div>
            <div className="punch-3">태풍이 올라온대!!</div>
          </div>
        )}
      </div>

      {/* 장면 3 활동 목표 + 버튼 */}
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
