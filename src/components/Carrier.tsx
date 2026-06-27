import { useState } from 'react';
import type { StepProps } from '../App';
import type { CarrierItem } from '../types';
import { CASES } from '../data/cases';
import { ITEMS, CARRIER_CAPACITY, itemById } from '../data/items';
import { packedSlots, tempKo, rainKo, windKo } from '../game/scoring';
import { Character } from './svg/Character';

// 옷장 분류
const GROUPS: { cat: CarrierItem['category']; label: string; icon: string }[] = [
  { cat: 'top', label: '상의', icon: '👕' },
  { cat: 'outer', label: '겉옷', icon: '🧥' },
  { cat: 'bottom', label: '하의', icon: '👖' },
  { cat: 'shoes', label: '신발', icon: '👟' },
  { cat: 'rain', label: '비 대비', icon: '🌂' },
  { cat: 'accessory', label: '소품', icon: '🧢' },
  { cat: 'extra', label: '기타', icon: '🎒' },
];

// STEP 7. 캐리어 꾸리기 — 실제 여행가방에 칸칸이 담고, 마네킹에 옷 입히기
export function Carrier({ go, patch, state }: StepProps) {
  const c = CASES[state.destination!];
  const used = packedSlots(state.packed);
  const [overflow, setOverflow] = useState<string | null>(null);

  const add = (id: string) => {
    if (state.packed.includes(id)) return;
    const item = itemById(id)!;
    if (used + item.slots > CARRIER_CAPACITY) {
      setOverflow(id);
      setTimeout(() => setOverflow(null), 900);
      return;
    }
    patch({ packed: [...state.packed, id] });
  };
  const remove = (id: string) => patch({ packed: state.packed.filter((p) => p !== id) });
  const toggle = (id: string) => (state.packed.includes(id) ? remove(id) : add(id));

  // 마네킹 미리보기 (담은 물품을 모두 착용한 모습)
  const outfit: CarrierItem[] = state.packed.map((id) => itemById(id)!).filter(Boolean);

  const isFull = used >= CARRIER_CAPACITY;
  const nearFull = used >= CARRIER_CAPACITY - 2 && !isFull;

  return (
    <section className="card fade-in step7">
      <h2>STEP 7 · 준비물 선택 — {c.cityName}</h2>
      <p className="q step7-q">
        예상한 날씨에 맞게 필요한 옷과 준비물을 선택하세요. 캐리어는 <b>{CARRIER_CAPACITY}칸</b>이며 모든 물품을 담을 수 없습니다.
      </p>
      <div className="weather-badges">
        <span className="w-badge">📍 {c.cityName}</span>
        <span className="w-badge">☔ {rainKo(state.forecast.rain)}</span>
        <span className="w-badge">💨 {windKo(state.forecast.wind)}</span>
        <span className="w-badge">🌡️ {tempKo(state.forecast.temp)}</span>
      </div>

      <div className="pack-layout">
        {/* 왼쪽: 옷차림 미리보기 + 캐리어 + 사용량 */}
        <div className="pack-top">
          <div className="mannequin-box">
            <div className="mannequin-head">👗 옷차림 미리보기</div>
            <div className="mannequin">
              <Character outfit={outfit} showItems={false} />
            </div>
          </div>

          <div className="suitcase-box">
            <div className={`suitcase${isFull ? ' full' : ''}`}>
              <div className="sc-sticker">🌀 TRIP</div>
              <div className="sc-handle" />
              <div className="suitcase-grid">
                {state.packed.map((id) => {
                  const it = itemById(id)!;
                  return (
                    <button
                      key={id}
                      className={`sc-cell occupied${it.slots > 1 ? ' span' : ''}`}
                      style={{ gridColumn: `span ${it.slots}`, aspectRatio: `${it.slots} / 1` }}
                      onClick={() => remove(id)}
                      title={`${it.name} 빼기 (${it.slots}칸)`}
                    >
                      <span className="sc-emoji">{it.emoji}</span>
                      <small>{it.name}</small>
                    </button>
                  );
                })}
                {Array.from({ length: CARRIER_CAPACITY - used }).map((_, i) => (
                  <div key={`empty-${i}`} className="sc-cell empty" />
                ))}
              </div>
            </div>
            <div className="capacity-bar">
              <div className={`capacity-fill${isFull ? ' full' : nearFull ? ' near' : ''}`} style={{ width: `${(used / CARRIER_CAPACITY) * 100}%` }} />
            </div>
            <div className="sc-count">🧳 {used} / {CARRIER_CAPACITY}칸 사용</div>
            {overflow && <div className="sc-warning">⚠️ 캐리어 공간이 부족합니다.</div>}
          </div>
        </div>

        {/* 오른쪽: 준비물 선택 패널 (목록만 내부 스크롤) */}
        <div className="wardrobe">
          <div className="wardrobe-head">
            <h4>🎒 준비물 선택</h4>
            <div className="sc-hint">💡 담은 물품을 다시 클릭하면 캐리어에서 빠집니다.</div>
          </div>
          <div className="wardrobe-scroll">
            {GROUPS.map((g) => {
              const items = ITEMS.filter((i) => i.category === g.cat);
              if (items.length === 0) return null;
              return (
                <div key={g.cat} className="wardrobe-group">
                  <div className="group-label">{g.icon} {g.label}</div>
                  <div className="hanger-row">
                    {items.map((it) => {
                      const on = state.packed.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          className={`hanger${on ? ' on' : ''}${overflow === it.id ? ' shake' : ''}`}
                          onClick={() => toggle(it.id)}
                          title={`${it.name} · ${it.slots}칸`}
                        >
                          <span className="hanger-emoji">{it.emoji}</span>
                          <span className="hanger-name">{it.name}</span>
                          <span className="hanger-slot">{it.slots}칸</span>
                          {on && <span className="hanger-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="actions pack-actions">
        <button className="ghost-btn" onClick={() => go('forecast')}>← 예보 카드</button>
        <div className="pack-summary">{state.packed.length}개 선택 · {used}/{CARRIER_CAPACITY}칸 사용</div>
        <button className="primary-btn" disabled={state.packed.length === 0} onClick={() => go('ending')}>
          {state.packed.length === 0 ? '물품을 담으세요' : '다음 단계 — 실제 결과 확인 →'}
        </button>
      </div>
    </section>
  );
}
