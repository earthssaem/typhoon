import type { GameState, TyphoonCase, CarrierItem } from '../types';
import { itemById } from '../data/items';

// ────────────────────────────────────────────────────────────────────────
// 규칙 기반 채점 + 피드백 (명세 10. 규칙 기반 채점 요소)
// AI 없이도 채점과 엔딩이 작동하도록 구현. (명세 11. AI 연결 불안정 대비)
// ────────────────────────────────────────────────────────────────────────

export interface ScoreLine {
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface ScoreResult {
  lines: ScoreLine[];
  total: number;
  max: number;
  grade: string;
  feedback: string[];
}

// 캐리어 물품이 실제 날씨에 비춰 "적절"한지 판단하는 규칙
function recommendedItems(c: TyphoonCase): { id: string; reason: string }[] {
  const a = c.actual;
  const rec: { id: string; reason: string }[] = [];
  // 비
  if (a.rainfall >= 80) {
    rec.push({ id: 'rainJacket', reason: '많은 비 → 방수 재킷' });
    rec.push({ id: 'waterShoes', reason: '많은 비 → 방수 신발' });
    rec.push({ id: 'socks', reason: '비에 젖을 때 → 여벌 양말' });
    rec.push({ id: 'drybag', reason: '많은 비 → 방수팩' });
  } else if (a.rainfall >= 10) {
    rec.push({ id: 'umbrella', reason: '약한 비 → 우산' });
    rec.push({ id: 'socks', reason: '비 대비 → 여벌 양말' });
  }
  // 강한 바람이면 우산보다 우비
  if (a.maxGust >= 25) {
    rec.push({ id: 'raincoat', reason: '강한 바람 → 우산보다 우비' });
    rec.push({ id: 'windbreaker', reason: '강풍·기온 하락 → 바람막이' });
  }
  // 기온
  if (a.temp >= 26) {
    rec.push({ id: 'tshirt', reason: '높은 기온 → 반팔' });
    rec.push({ id: 'cap', reason: '맑고 더울 때 → 모자' });
    rec.push({ id: 'sunscreen', reason: '맑고 더울 때 → 선크림' });
  } else if (a.temp >= 22) {
    rec.push({ id: 'tshirt', reason: '다소 높은 기온 → 반팔' });
    rec.push({ id: 'thinLong', reason: '기온 변화 대비 → 얇은 긴팔' });
  } else {
    rec.push({ id: 'thinLong', reason: '낮은 기온 → 얇은 긴팔' });
    rec.push({ id: 'pants', reason: '쌀쌀함 → 긴바지' });
  }
  // 중복 제거
  const seen = new Set<string>();
  return rec.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

export function packedSlots(packed: string[]): number {
  return packed.reduce((sum, id) => sum + (itemById(id)?.slots ?? 0), 0);
}

export function scoreGame(state: GameState, c: TyphoonCase): ScoreResult {
  const lines: ScoreLine[] = [];
  const correct = c.actual.correct;

  const judge = (label: string, ok: boolean, detail: string, pts = 10) =>
    lines.push({ label, points: ok ? pts : 0, max: pts, detail });

  // 태풍 영향 판단 / 위험·가항반원 판단 (STEP 5)
  judge(
    '태풍 영향 판단',
    state.trackJudgment.impact === correct.impact,
    `정답: ${impactKo(correct.impact)} / 선택: ${impactKo(state.trackJudgment.impact)}`,
  );
  judge(
    '위험반원·가항반원 판단',
    state.trackJudgment.position === correct.position,
    `정답: ${positionKo(correct.position)} / 선택: ${positionKo(state.trackJudgment.position)}`,
  );

  // 예보 카드 (STEP 6)
  judge('기온 범위 판단', state.forecast.temp === correct.temp, `정답: ${tempKo(correct.temp)}`);
  judge('강수 수준 판단', state.forecast.rain === correct.rain, `정답: ${rainKo(correct.rain)}`);
  judge('바람 위험 판단', state.forecast.wind === correct.wind, `정답: ${windKo(correct.wind)}`);
  judge(
    '야외 일정 결정',
    state.forecast.schedule === correct.schedule,
    `정답: ${scheduleKo(correct.schedule)}`,
  );

  // 근거자료 선택 (좋은 근거를 고를수록, 틀린 근거를 피할수록 가점)
  const goodIds = new Set(c.evidenceCards.filter((e) => e.good).map((e) => e.id));
  const chosenGood = state.evidence.filter((id) => goodIds.has(id)).length;
  const chosenBad = state.evidence.filter((id) => !goodIds.has(id)).length;
  const evPts = Math.max(0, Math.min(10, chosenGood * 4 - chosenBad * 4));
  lines.push({
    label: '근거자료 선택',
    points: evPts,
    max: 10,
    detail: `타당한 근거 ${chosenGood}개 선택, 부적절한 근거 ${chosenBad}개 선택`,
  });

  // 강풍반경 고려 여부 (근거 중 강풍/폭풍반경 관련을 골랐는지)
  const consideredRadius = state.evidence.some((id) => /강풍반경|폭풍반경/.test(
    c.evidenceCards.find((e) => e.id === id)?.text ?? '',
  ));
  judge('강풍반경 고려 여부', consideredRadius, consideredRadius ? '강풍/폭풍반경 근거를 고려함' : '반경 근거를 고려하지 않음', 5);

  // 캐리어 물품 적절성 (STEP 7)
  const rec = recommendedItems(c);
  const recIds = new Set(rec.map((r) => r.id));
  const packedRec = state.packed.filter((id) => recIds.has(id)).length;
  const itemPts = Math.round((packedRec / Math.max(1, rec.length)) * 15);
  lines.push({
    label: '캐리어 물품의 적절성',
    points: itemPts,
    max: 15,
    detail: `권장 물품 ${rec.length}개 중 ${packedRec}개 챙김`,
  });

  // 캐리어 공간 활용도
  const slots = packedSlots(state.packed);
  const util = slots >= 7 && slots <= 10;
  judge('캐리어 공간 활용도', util, `${slots}/10칸 사용`, 5);

  const total = lines.reduce((s, l) => s + l.points, 0);
  const max = lines.reduce((s, l) => s + l.max, 0);
  const ratio = total / max;
  const grade =
    ratio >= 0.85 ? 'S' : ratio >= 0.7 ? 'A' : ratio >= 0.5 ? 'B' : ratio >= 0.3 ? 'C' : 'D';

  return { lines, total, max, grade, feedback: buildFeedback(state, c, rec) };
}

// 규칙 기반 "AI 스타일" 종합 피드백 (명세 5. STEP 8 / 7. AI 종합 피드백 1회)
function buildFeedback(
  state: GameState,
  c: TyphoonCase,
  rec: { id: string; reason: string }[],
): string[] {
  const a = c.actual;
  const fb: string[] = [];

  fb.push(
    `${c.cityName}은(는) 실제로 태풍 진행 방향의 ${
      a.semicircle === '위험반원' ? '오른쪽(위험반원)' : a.semicircle === '가항반원' ? '왼쪽(가항반원)' : '영향권 밖'
    }에 위치했고, 최근접은 ${a.closestTime}였습니다. (${a.advisory})`,
  );

  // 판단이 맞았는지 짚기
  if (state.trackJudgment.position === c.actual.correct.position) {
    fb.push('경로상 위치 판단이 실제 결과와 일치했습니다. 자료를 종합적으로 잘 읽었어요.');
  } else {
    fb.push(
      `경로상 위치를 ${positionKo(state.trackJudgment.position)}(으)로 보았지만 실제로는 ${positionKo(
        c.actual.correct.position,
      )}였습니다. 중심선과의 거리뿐 아니라 진행 방향의 어느 쪽인지도 함께 보세요.`,
    );
  }

  // 빠뜨린 권장 물품
  const missing = rec.filter((r) => !state.packed.includes(r.id));
  if (missing.length === 0) {
    fb.push('날씨에 맞는 핵심 준비물을 빠짐없이 챙겼습니다. 훌륭해요!');
  } else {
    fb.push(
      `다음 준비물을 더 챙겼다면 좋았을 거예요: ${missing.map((m) => `${itemById(m.id)?.name}(${m.reason})`).join(', ')}.`,
    );
  }

  // 불필요했던 물품
  const recIds = new Set(rec.map((r) => r.id));
  const wasted = state.packed.filter((id) => !recIds.has(id));
  if (wasted.length > 0) {
    fb.push(
      `이번 날씨에는 ${wasted.map((id) => itemById(id)?.name).join(', ')}의 필요성이 낮았습니다. 제한된 칸을 더 효율적으로 쓸 수 있어요.`,
    );
  }

  return fb;
}

// ── 엔딩 캐릭터 옷차림 결과 (캐리어에 담은 것만 사용 가능) ───────────────────
export interface DressResult {
  outfit: CarrierItem[];
  comfort: number; // 0~100
  notes: string[];
}

export function dressCharacter(state: GameState, c: TyphoonCase): DressResult {
  const a = c.actual;
  const has = (id: string) => state.packed.includes(id);
  const get = (id: string) => itemById(id)!;
  const outfit: CarrierItem[] = [];
  const notes: string[] = [];
  let comfort = 70;

  // 상의
  if (a.temp < 22 && has('thinLong')) {
    outfit.push(get('thinLong'));
  } else if (has('tshirt')) {
    outfit.push(get('tshirt'));
    if (a.temp < 22) {
      comfort -= 15;
      notes.push('얇은 옷만 입어 조금 추웠습니다.');
    }
  } else if (has('thinLong')) {
    outfit.push(get('thinLong'));
  } else if (has('hoodie')) {
    outfit.push(get('hoodie'));
    if (a.temp >= 24) {
      comfort -= 10;
      notes.push('두꺼운 옷만 챙겨 조금 더웠습니다.');
    }
  } else {
    comfort -= 10;
    notes.push('마땅한 상의가 없어 불편했습니다.');
  }

  // 겉옷 / 비 대비
  const rainy = a.rainfall >= 30;
  const windy = a.maxGust >= 25;
  if (rainy) {
    if (has('raincoat')) {
      outfit.push(get('raincoat'));
      comfort += 10;
      notes.push('우비로 비바람을 잘 막았습니다.');
    } else if (has('rainJacket')) {
      outfit.push(get('rainJacket'));
      comfort += 8;
      notes.push('방수 재킷으로 비를 막았습니다.');
    } else if (has('umbrella')) {
      outfit.push(get('umbrella'));
      if (windy) {
        comfort -= 15;
        notes.push('우산이 강풍에 뒤집혀 옷이 젖었습니다.');
      } else {
        comfort -= 5;
        notes.push('우산으로 버텼지만 옷이 조금 젖었습니다.');
      }
    } else {
      comfort -= 20;
      notes.push('비를 막을 것이 없어 흠뻑 젖었습니다.');
    }
  } else if (has('windbreaker')) {
    outfit.push(get('windbreaker'));
  }

  // 신발
  if (rainy) {
    if (has('waterShoes')) {
      outfit.push(get('waterShoes'));
      comfort += 8;
    } else if (has('sneakers')) {
      outfit.push(get('sneakers'));
      comfort -= 10;
      notes.push('운동화와 양말이 젖었습니다.');
      if (has('socks')) {
        comfort += 8;
        notes.push('여벌 양말로 갈아 신어 쾌적했습니다.');
      }
    } else {
      comfort -= 8;
    }
  } else if (has('sneakers')) {
    outfit.push(get('sneakers'));
  } else if (has('waterShoes')) {
    outfit.push(get('waterShoes'));
  }

  // 하의
  if (a.temp >= 26 && has('shorts')) outfit.push(get('shorts'));
  else if (has('pants')) outfit.push(get('pants'));
  else if (has('shorts')) outfit.push(get('shorts'));

  // 맑고 더운 날 액세서리
  if (!rainy && a.temp >= 24) {
    if (has('cap')) outfit.push(get('cap'));
    if (has('sunscreen')) {
      outfit.push(get('sunscreen'));
      comfort += 5;
    }
  }

  comfort = Math.max(0, Math.min(100, comfort));
  if (notes.length === 0) notes.push('날씨에 잘 맞는 옷차림으로 쾌적하게 여행했습니다.');
  return { outfit, comfort, notes };
}

// ── 한글 라벨 변환 ─────────────────────────────────────────────────────────
export const tempKo = (v: string | null) =>
  ({ under18: '18℃ 미만', '18to22': '18~22℃', '22to26': '22~26℃', over26: '26℃ 이상' } as const)[
    v as 'under18'
  ] ?? '미선택';
export const rainKo = (v: string | null) =>
  ({ none: '비 거의 없음', weak: '약한 비', continuous: '비가 지속됨', heavy: '한때 강한 비' } as const)[
    v as 'none'
  ] ?? '미선택';
export const windKo = (v: string | null) =>
  ({ weak: '약함', somewhat: '다소 강함', umbrella: '우산 사용이 어려움', outdoor: '야외활동이 어려움' } as const)[
    v as 'weak'
  ] ?? '미선택';
export const scheduleKo = (v: string | null) =>
  ({
    asPlanned: '예정대로 진행',
    shiftTime: '일부 시간 변경',
    moveIndoor: '실내활동으로 변경',
    excludeArea: '해안·산지 등 제외',
  } as const)[v as 'asPlanned'] ?? '미선택';
export const impactKo = (v: string | null) =>
  ({ none: '영향 거의 없음', partial: '일부 영향 예상', direct: '직접 영향 가능성 높음' } as const)[
    v as 'none'
  ] ?? '미선택';
export const positionKo = (v: string | null) =>
  ({
    outside: '태풍 영향권 밖',
    navigable: '가항반원에 위치 가능성',
    dangerous: '위험반원에 위치 가능성',
    eyewall: '중심·눈벽 부근 통과 가능성',
  } as const)[v as 'outside'] ?? '미선택';
