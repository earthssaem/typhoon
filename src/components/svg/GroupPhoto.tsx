// 인트로/엔딩 공용 — 애니메이션 단체사진
// 외부 라이브러리 없이 SVG + CSS 애니메이션으로 구현한다.

type Mood = 'sunny' | 'cloudy' | 'storm';

interface Props {
  mode: 'intro' | 'ending';
  mood?: Mood;
  // 엔딩에서 표정 결정용(0~100). 높을수록 활짝 웃음.
  comfort?: number;
  headline?: string;
}

const SKIN = ['#ffe0bd', '#f6c89a', '#e8b98a', '#ffd9b3'];
const TOPS = ['#e8744d', '#3b7dd8', '#6b5b95', '#2f9e6f', '#d6455d'];
const HAIR = ['#3a2b22', '#23303f', '#4a3526', '#1f1f1f'];

// 학생 한 명
function Student({
  x,
  i,
  smiling,
  wave,
}: {
  x: number;
  i: number;
  smiling: boolean;
  wave: boolean;
}) {
  const skin = SKIN[i % SKIN.length];
  const top = TOPS[i % TOPS.length];
  const hair = HAIR[i % HAIR.length];
  return (
    <g transform={`translate(${x},0)`} className={`gp-student${wave ? ' gp-wave' : ''}`} style={{ animationDelay: `${i * 0.18}s` }}>
      {/* 다리 */}
      <rect x={-9} y={120} width={7} height={40} rx={3} fill="#2f3b4d" />
      <rect x={2} y={120} width={7} height={40} rx={3} fill="#2f3b4d" />
      {/* 몸통 */}
      <rect x={-15} y={78} width={30} height={48} rx={11} fill={top} />
      {/* 팔 */}
      <rect className="gp-arm-l" x={-24} y={82} width={9} height={34} rx={4} fill={top} />
      <rect className="gp-arm-r" x={15} y={82} width={9} height={34} rx={4} fill={top} />
      {/* 머리 */}
      <circle cx={0} cy={56} r={18} fill={skin} />
      {/* 머리카락 */}
      <path d={`M-18,52 Q-18,33 0,33 Q18,33 18,52 Q10,42 0,42 Q-10,42 -18,52 Z`} fill={hair} />
      {/* 눈 */}
      <circle cx={-6} cy={56} r={2} fill="#2b2b2b" />
      <circle cx={6} cy={56} r={2} fill="#2b2b2b" />
      {/* 입 */}
      {smiling ? (
        <path d="M-7,62 Q0,70 7,62" fill="none" stroke="#b5774e" strokeWidth={2} strokeLinecap="round" />
      ) : (
        <path d="M-6,64 Q0,61 6,64" fill="none" stroke="#b5774e" strokeWidth={2} strokeLinecap="round" />
      )}
    </g>
  );
}

export function GroupPhoto({ mode, mood = 'cloudy', comfort = 75, headline }: Props) {
  const smiling = mode === 'intro' ? true : comfort >= 55;
  const wave = mode === 'intro';
  const students = [0, 1, 2, 3];
  const xs = [60, 120, 180, 240];

  return (
    <div className={`group-photo mood-${mood} ${mode === 'ending' ? 'gp-flash' : ''}`}>
      <svg viewBox="0 0 300 200" className="gp-svg" role="img" aria-label="수학여행 단체사진">
        {/* 하늘/배경은 CSS 클래스로 */}
        <rect x={0} y={0} width={300} height={200} fill="transparent" />

        {/* 태풍 소용돌이 (회전) */}
        <g className="gp-typhoon" transform="translate(248,42)">
          <g className="gp-spin">
            {[0, 120, 240].map((d) => (
              <path
                key={d}
                d="M0,0 C8,-10 20,-8 24,4 C16,2 8,6 0,0 Z"
                fill="#cdd7e6"
                opacity={0.85}
                transform={`rotate(${d})`}
              />
            ))}
            <circle r={4} fill="#7e8ba0" />
          </g>
        </g>

        {/* 비 (storm/cloudy에서만 표시) */}
        {mood !== 'sunny' && (
          <g className="gp-rain" stroke="#9fc3ee" strokeWidth={2} strokeLinecap="round">
            {Array.from({ length: 14 }).map((_, k) => (
              <line
                key={k}
                x1={20 + k * 20}
                y1={-10}
                x2={14 + k * 20}
                y2={6}
                style={{ animationDelay: `${(k % 7) * 0.13}s` }}
                className="gp-drop"
              />
            ))}
          </g>
        )}
        {mood === 'sunny' && (
          <g className="gp-sun" transform="translate(40,38)">
            <circle r={16} fill="#ffd34e" />
            {Array.from({ length: 8 }).map((_, k) => (
              <line key={k} x1={0} y1={-22} x2={0} y2={-28} stroke="#ffd34e" strokeWidth={3} strokeLinecap="round" transform={`rotate(${k * 45})`} />
            ))}
          </g>
        )}

        {/* 바닥 */}
        <rect x={0} y={172} width={300} height={28} fill="#00000018" />

        {/* 학생들 */}
        {students.map((i) => (
          <Student key={i} x={xs[i]} i={i} smiling={smiling} wave={wave} />
        ))}

        {/* 엔딩 색종이 */}
        {mode === 'ending' && comfort >= 55 && (
          <g className="gp-confetti">
            {Array.from({ length: 18 }).map((_, k) => (
              <rect
                key={k}
                x={(k * 37) % 290}
                y={-12}
                width={6}
                height={9}
                rx={1}
                fill={TOPS[k % TOPS.length]}
                style={{ animationDelay: `${(k % 9) * 0.22}s` }}
                className="gp-confetti-piece"
              />
            ))}
          </g>
        )}
      </svg>

      {/* 카메라 프레임 / 플래시 */}
      <div className="gp-frame">
        <span className="gp-shutter">📸</span>
        {headline && <span className="gp-headline">{headline}</span>}
      </div>
    </div>
  );
}
