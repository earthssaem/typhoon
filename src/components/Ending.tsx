import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepProps } from '../App';
import { CASES } from '../data/cases';
import { ForecastTrackMap } from './svg/ForecastTrackMap';
import { TripScene } from './svg/TripScene';
import { evaluateEnding } from '../game/ending';

// STEP 8. 실제 수학여행 엔딩 — 5장면 시퀀스
// 1 다음날 전환 → 2 실제결과 공개 → 3 캐리어 열기 → 4 여행 애니메이션 → 5 기념사진+요약
export function Ending({ go, state, reset }: StepProps) {
  const c = CASES[state.destination!];
  const r = useMemo(() => evaluateEnding(state, c), [state, c]);
  const a = r.actualWeather;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // 인트로 전환(장면1) 재생 여부
  const [daybreak, setDaybreak] = useState(true);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) {
      setDaybreak(false);
      return;
    }
    const t = window.setTimeout(() => setDaybreak(false), 3200);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, [reduced]);

  const comfortLabel =
    r.dress.comfort >= 80 ? '아주 쾌적' : r.dress.comfort >= 60 ? '대체로 무난' : r.dress.comfort >= 40 ? '다소 불편' : '많이 불편';

  // 장면1: 다음날 전환 오버레이
  if (daybreak) {
    return (
      <section className="card ending daybreak-card fade-in">
        <button className="chip-btn skip-float" onClick={() => setDaybreak(false)}>건너뛰기 ⏭</button>
        <div className="daybreak">
          <div className="db-suitcase">🧳<span className="db-close">…찰칵</span></div>
          <div className="db-night" aria-hidden>
            <span className="db-moon">🌙</span>
            <span className="db-star s1">✨</span>
            <span className="db-star s2">⭐</span>
          </div>
          <div className="db-date">
            <span className="db-from">D-1</span>
            <span className="db-arrow">→</span>
            <span className="db-to">D-DAY</span>
          </div>
          <div className="db-sun" aria-hidden>🌅</div>
          <h2 className="db-line">수학여행 당일 아침이 밝았습니다.</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="card fade-in ending">
      <h2>STEP 8 · 실제 수학여행 — {c.cityName}</h2>

      {/* ① 실제 결과 공개 */}
      <div className="reveal">
        <h3>① 실제 결과 공개</h3>
        <div className="reveal-grid">
          <div className="reveal-map">
            <ForecastTrackMap c={c} showActual />
            <div className="img-caption">예상경로(보라) vs 실제 이동경로(빨강)</div>
          </div>
          <div className="reveal-stats">
            <div className="stat"><span>최근접 시각</span><b>{a.closestTime}</b></div>
            <div className="stat"><span>위치한 반원</span><b className={a.semicircle === '위험반원' ? 'danger' : ''}>{a.semicircle}</b></div>
            <div className="stat"><span>실제 기온</span><b>{a.temp}℃</b></div>
            <div className="stat"><span>실제 강수량</span><b>{a.rainfall} mm</b></div>
            <div className="stat"><span>실제 풍속</span><b>{a.wind} m/s</b></div>
            <div className="stat"><span>최대순간풍속</span><b>{a.maxGust} m/s</b></div>
            <div className="stat wide"><span>기상특보</span><b className="danger">{a.advisory}</b></div>
          </div>
        </div>
      </div>

      {/* ② 실제 날씨 속 수학여행 (애니메이션) */}
      <div className="reveal">
        <h3>② 실제 날씨 속 수학여행 — {r.cityName}</h3>
        <TripScene result={r} big />
        <p className="photo-cap">
          {r.cityName} 수학여행 도착! · 실제 기온 {a.temp}℃ · {a.rainy ? '비' : '대체로 흐림'} · {a.windy ? '강한 바람' : '약한 바람'}
        </p>
        <div className="comfort">
          쾌적도 <b>{r.dress.comfort}</b> / 100 <span className="comfort-label">({comfortLabel})</span>
          <div className="comfort-bar"><div style={{ width: `${r.dress.comfort}%` }} /></div>
        </div>
        <ul className="scene-notes dark-notes">
          {r.dress.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>

      {/* ③ 결과 요약 (날씨/일정/준비물) */}
      <div className="score-box">
        <div className="grade-badge">{r.overallResult.grade}</div>
        <div className="score-total">{r.overallResult.total} / {r.overallResult.max}점</div>

        <div className="result-sections">
          <div className="rs-block">
            <h4>🌦️ 날씨 판단</h4>
            <ul>
              {r.weatherResult.map((w) => (
                <li key={w.label} className={w.ok ? 'ok' : 'miss'}>{w.ok ? '✅' : '⚠️'} {w.sentence}</li>
              ))}
            </ul>
          </div>
          <div className="rs-block">
            <h4>📅 일정 판단</h4>
            <ul><li className={r.scheduleResult.ok ? 'ok' : 'miss'}>{r.scheduleResult.ok ? '✅' : '⚠️'} {r.scheduleResult.sentence}</li></ul>
          </div>
          <div className="rs-block">
            <h4>🧳 준비물 선택</h4>
            <ul>
              {r.itemMatches.slice(0, 3).map((m) => <li key={m.id} className="ok">✅ {m.name} — {m.reason}</li>)}
              {r.missingItems.slice(0, 3).map((m) => <li key={m.id} className="miss">⚠️ {m.name} 부족 — {m.reason}</li>)}
              {r.unnecessaryItems.length > 0 && (
                <li className="muted">· 이번 날씨엔 불필요: {r.unnecessaryItems.map((u) => u.name).join(', ')}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('destination')}>다른 목적지 체험하기</button>
        <button className="primary-btn" onClick={reset}>처음부터 다시 하기 ↻</button>
      </div>
    </section>
  );
}
