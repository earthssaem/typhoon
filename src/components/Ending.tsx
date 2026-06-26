import { useMemo } from 'react';
import type { StepProps } from '../App';
import { CASES } from '../data/cases';
import { ForecastTrackMap } from './svg/ForecastTrackMap';
import { Character } from './svg/Character';
import { scoreGame, dressCharacter } from '../game/scoring';

// STEP 8. 실제 수학여행 엔딩
export function Ending({ go, state }: StepProps) {
  const c = CASES[state.destination!];
  const a = c.actual;
  const score = useMemo(() => scoreGame(state, c), [state, c]);
  const dress = useMemo(() => dressCharacter(state, c), [state, c]);

  const comfortLabel =
    dress.comfort >= 80 ? '아주 쾌적' : dress.comfort >= 60 ? '대체로 무난' : dress.comfort >= 40 ? '다소 불편' : '많이 불편';

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

      {/* ②③ 캐리어 열기 + 실제 날씨 속 여행 */}
      <div className="reveal">
        <h3>② 캐리어 열기 — 내가 챙긴 것만 사용</h3>
        <div className={`scene ${c.ending.bgClass}`}>
          <Character outfit={dress.outfit} />
          <div className="scene-info">
            <div className="comfort">
              쾌적도 <b>{dress.comfort}</b> / 100 <span className="comfort-label">({comfortLabel})</span>
              <div className="comfort-bar"><div style={{ width: `${dress.comfort}%` }} /></div>
            </div>
            <ul className="scene-notes">
              {dress.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ④ 기념사진 */}
      <div className="photo-card">
        <div className="photo-emoji">📸</div>
        <div>
          <b>{c.ending.headline}</b>
          <p>
            실제 기온 {a.temp}℃, {a.rainfall >= 30 ? '비' : '대체로 흐림'}, {a.maxGust >= 25 ? '강한 바람' : '약한 바람'}.
            <br />
            {dress.comfort >= 70
              ? '날씨에 잘 대비해 쾌적하게 여행했습니다!'
              : '다음엔 날씨 분석을 더 반영해 준비물을 챙겨봐요!'}
          </p>
        </div>
      </div>

      {/* 채점 + 피드백 */}
      <div className="score-box">
        <div className="grade-badge">{score.grade}</div>
        <div className="score-total">
          {score.total} / {score.max}점
        </div>
        <div className="score-lines">
          {score.lines.map((l) => (
            <div key={l.label} className={`score-line${l.points === l.max ? ' full' : l.points === 0 ? ' zero' : ''}`}>
              <span className="sl-label">{l.label}</span>
              <span className="sl-pts">{l.points}/{l.max}</span>
              <span className="sl-detail">{l.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ai-feedback">
        <h4>🤖 종합 피드백</h4>
        {score.feedback.map((f, i) => (
          <p key={i}>{f}</p>
        ))}
        <p className="hint-small">
          ※ 이 피드백은 규칙 기반으로 생성되었습니다. (생성형 AI API 연결 시 더 풍부한 코멘트로 확장
          가능)
        </p>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('carrier')}>← 캐리어 다시 꾸리기</button>
        <button className="primary-btn" onClick={() => go('destination')}>다른 목적지로 도전 →</button>
      </div>
    </section>
  );
}
