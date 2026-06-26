import type { CarrierItem } from '../../types';

// 엔딩 캐릭터 옷 입히기 — 캐리어에 담은(=착용 가능한) 물품만 반영
// showItems: SVG 아래 물품 배지 목록 표시 여부 (캐리어 화면에서는 별도 배지를 쓰므로 false)
export function Character({ outfit, showItems = true }: { outfit: CarrierItem[]; showItems?: boolean }) {
  const has = (id: string) => outfit.some((o) => o.id === id);
  const cat = (cgory: CarrierItem['category']) => outfit.find((o) => o.category === cgory);

  // 상의/겉옷 색
  const outer = cat('outer') || cat('rain');
  const top = cat('top');
  const bodyColor = outer
    ? outer.id === 'raincoat'
      ? '#f5d020'
      : outer.id === 'rainJacket'
      ? '#2f6f4f'
      : '#3b7dd8' // 바람막이
    : top
    ? top.id === 'tshirt'
      ? '#e8744d'
      : top.id === 'hoodie'
      ? '#6b5b95'
      : '#9bb7d4' // 얇은 긴팔
    : '#cccccc';

  const bottom = cat('bottom');
  const legColor = bottom ? (bottom.id === 'shorts' ? '#caa37a' : '#3a4a63') : '#cccccc';
  const shoes = cat('shoes');
  const shoeColor = shoes ? (shoes.id === 'waterShoes' ? '#22543d' : '#444') : '#bbb';
  const sleeves = top?.id === 'tshirt' || bottom?.id === 'shorts'; // 반팔/반바지 느낌

  return (
    <div className="character">
      <svg viewBox="0 0 120 200" className="char-svg" role="img" aria-label="옷차림 캐릭터">
        {/* 머리 */}
        <circle cx={60} cy={32} r={18} fill="#ffe0bd" stroke="#e0b48c" strokeWidth={1} />
        {has('cap') && <path d="M40,28 Q60,6 80,28 L82,30 L38,30 Z" fill="#2b6cb0" />}
        <circle cx={53} cy={32} r={2} fill="#333" />
        <circle cx={67} cy={32} r={2} fill="#333" />
        <path d="M54,40 Q60,44 66,40" fill="none" stroke="#b5774e" strokeWidth={1.5} />

        {/* 몸통/겉옷 */}
        <rect x={38} y={50} width={44} height={62} rx={12} fill={bodyColor} />
        {/* 팔 */}
        <rect x={26} y={54} width={12} height={sleeves ? 26 : 50} rx={6} fill={bodyColor} />
        <rect x={82} y={54} width={12} height={sleeves ? 26 : 50} rx={6} fill={bodyColor} />
        {sleeves && (
          <>
            <rect x={26} y={80} width={12} height={24} rx={6} fill="#ffe0bd" />
            <rect x={82} y={80} width={12} height={24} rx={6} fill="#ffe0bd" />
          </>
        )}

        {/* 다리 */}
        <rect x={42} y={110} width={14} height={bottom?.id === 'shorts' ? 24 : 56} rx={5} fill={legColor} />
        <rect x={64} y={110} width={14} height={bottom?.id === 'shorts' ? 24 : 56} rx={5} fill={legColor} />
        {bottom?.id === 'shorts' && (
          <>
            <rect x={42} y={134} width={14} height={32} rx={5} fill="#ffe0bd" />
            <rect x={64} y={134} width={14} height={32} rx={5} fill="#ffe0bd" />
          </>
        )}

        {/* 신발 */}
        <rect x={40} y={164} width={18} height={10} rx={4} fill={shoeColor} />
        <rect x={62} y={164} width={18} height={10} rx={4} fill={shoeColor} />

        {/* 우산 */}
        {has('umbrella') && (
          <g>
            <path d="M86,40 Q104,40 104,58 L68,58 Q68,40 86,40Z" fill="#d6455d" opacity={0.9} />
            <line x1={86} y1={58} x2={86} y2={96} stroke="#555" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* 착용/소지 물품 배지 */}
      {showItems && (
        <div className="char-items">
          {outfit.length === 0 && <span className="no-item">챙긴 옷이 없어요…</span>}
          {outfit.map((o) => (
            <span key={o.id} className="char-badge" title={o.name}>
              {o.emoji} {o.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
