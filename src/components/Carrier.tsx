import { useState } from 'react';
import type { StepProps } from '../App';
import type { CarrierItem } from '../types';
import { CASES } from '../data/cases';
import { ITEMS, CARRIER_CAPACITY, itemById } from '../data/items';
import { packedSlots } from '../game/scoring';
import { Character } from './svg/Character';

// 옷장 분류 (의상실 느낌으로 그룹화)
const GROUPS: { cat: CarrierItem['category']; label: string; icon: string }[] = [
  { cat: 'top', label: '상의', icon: '👕' },
  { cat: 'outer', label: '겉옷', icon: '🧥' },
  { cat: 'bottom', label: '하의', icon: '👖' },
  { cat: 'shoes', label: '신발', icon: '👟' },
  { cat: 'rain', label: '비 대비', icon: '🌂' },
  { cat: 'accessory', label: '소품', icon: '🧢' },
  { cat: 'extra', label: '기타', icon: '🎒' },
];

// STEP 7. 캐리어 꾸리기 — 캐릭터에게 옷 입히듯 담기
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

  // 현재 담은 물품으로 캐릭터 미리보기
  const outfit: CarrierItem[] = state.packed.map((id) => itemById(id)!).filter(Boolean);

  return (
    <section className="card fade-in boutique">
      <h2>STEP 7 · 캐리어 꾸미기 — {c.cityName}</h2>
      <p className="q">
        옷장에서 골라 캐리어에 담으면 친구가 바로 입어 봐요! 캐리어는 <b>{CARRIER_CAPACITY}칸</b>뿐이니,
        내가 판단한 날씨에 맞게 우선순위를 정해 담으세요. (물품을 누르면 담기 / 다시 누르면 빼기)
      </p>

      <div className="boutique-layout">
        {/* 좌: 캐릭터 미리보기 + 캐리어 용량 */}
        <div className="boutique-stage">
          <div className="mannequin">
            <Character outfit={outfit} />
          </div>
          <div className={`carrier-meter${used >= CARRIER_CAPACITY ? ' full' : ''}`}>
            <div className="carrier-head">
              🧳 캐리어 <span>{used} / {CARRIER_CAPACITY}칸</span>
            </div>
            <div className="capacity-bar">
              <div className="capacity-fill" style={{ width: `${(used / CARRIER_CAPACITY) * 100}%` }} />
            </div>
            <div className="packed-chips">
              {state.packed.length === 0 && <span className="hint-small">아직 담은 물품이 없어요.</span>}
              {state.packed.map((id) => {
                const it = itemById(id)!;
                return (
                  <button key={id} className="packed-chip" onClick={() => remove(id)} title="빼기">
                    {it.emoji} {it.name} <span className="chip-x">×</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우: 옷장 (분류별) */}
        <div className="wardrobe">
          <h4>🚪 옷장</h4>
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

      <div className="actions">
        <button className="ghost-btn" onClick={() => go('forecast')}>← 예보 카드</button>
        <button className="primary-btn" disabled={state.packed.length === 0} onClick={() => go('ending')}>
          {state.packed.length === 0 ? '물품을 담으세요' : '다음 날로 — 실제 결과 확인 →'}
        </button>
      </div>
    </section>
  );
}
