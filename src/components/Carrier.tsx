import { useState } from 'react';
import type { StepProps } from '../App';
import { CASES } from '../data/cases';
import { ITEMS, CARRIER_CAPACITY, itemById } from '../data/items';
import { packedSlots } from '../game/scoring';

// STEP 7. 캐리어 꾸리기 (드래그앤드롭 + 클릭 토글)
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

  const available = ITEMS.filter((i) => !state.packed.includes(i.id));

  // 캐리어 칸 시각화
  const cells: (string | null)[] = [];
  state.packed.forEach((id) => {
    const it = itemById(id)!;
    for (let k = 0; k < it.slots; k++) cells.push(k === 0 ? id : `${id}__`);
  });
  while (cells.length < CARRIER_CAPACITY) cells.push(null);

  return (
    <section className="card fade-in">
      <h2>STEP 7 · 캐리어 꾸리기 — {c.cityName}</h2>
      <p className="q">
        캐리어는 <b>{CARRIER_CAPACITY}칸</b>뿐입니다. 모든 물품을 담을 수 없으니, 내가 판단한 날씨에
        맞게 우선순위를 정해 담으세요. (물품 클릭 또는 드래그)
      </p>

      <div className="carrier-layout">
        <div className="store">
          <h4>준비물 ({available.length})</h4>
          <div className="item-grid">
            {available.map((it) => (
              <button
                key={it.id}
                className={`item${overflow === it.id ? ' shake' : ''}`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                onClick={() => add(it.id)}
                title={`${it.name} · ${it.slots}칸`}
              >
                <span className="item-emoji">{it.emoji}</span>
                <span className="item-name">{it.name}</span>
                <span className="item-slot">{it.slots}칸</span>
              </button>
            ))}
          </div>
        </div>

        <div className="carrier-side">
          <div
            className={`carrier${used >= CARRIER_CAPACITY ? ' full' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) add(id);
            }}
          >
            <div className="carrier-head">
              🧳 캐리어 <span>{used} / {CARRIER_CAPACITY}칸</span>
            </div>
            <div className="capacity-bar">
              <div className="capacity-fill" style={{ width: `${(used / CARRIER_CAPACITY) * 100}%` }} />
            </div>
            <div className="carrier-cells">
              {cells.map((cell, i) => {
                if (cell === null) return <div key={i} className="cell empty" />;
                if (cell.endsWith('__')) return <div key={i} className="cell occupied span" />;
                const it = itemById(cell)!;
                return (
                  <button key={i} className="cell occupied" onClick={() => remove(cell)} title="빼기">
                    <span>{it.emoji}</span>
                    <small>{it.name}</small>
                  </button>
                );
              })}
            </div>
            <p className="hint-small">담은 물품을 클릭하면 다시 뺄 수 있어요.</p>
          </div>

          <div className="connect-hint">
            <h4>날씨 ↔ 물품 연결</h4>
            <ul>
              <li>높은 기온 → 반팔 / 낮은 기온 → 얇은 긴팔·바람막이</li>
              <li>지속적인 비 → 방수 재킷·방수 신발·여벌 양말</li>
              <li>강한 바람 → 우산보다 우비 · 많은 비 → 방수팩</li>
              <li>맑고 더운 날 → 모자·선크림</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('forecast')}>← 예보 카드</button>
        <button className="primary-btn" disabled={state.packed.length === 0} onClick={() => go('ending')}>
          {state.packed.length === 0 ? '물품을 담으세요' : '다음 날로 — 실제 결과 확인 →'}
        </button>
      </div>
    </section>
  );
}
