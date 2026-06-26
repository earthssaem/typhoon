import type { DestinationId, TyphoonCase } from '../types';

// ────────────────────────────────────────────────────────────────────────
// 목적지별 태풍 사례 데이터팩 (서울·부산·제주 각 1건)
//
// ⚠️ 프로토타입용 "예시 데이터"입니다.
//   실제 기상청 일기도·위성·레이더·예상경로/관측값으로 교체할 자리이며,
//   교육적 대비(위험반원/가항반원, 강풍반경 포함 여부)를 분명히 보여주도록
//   값을 구성했습니다.
//
// 지도 좌표계: x,y 모두 0~100 정규화 (y가 작을수록 북쪽). 태풍은 남→북 진행.
//   서울 (42,22) · 부산 (62,60) · 제주 (38,82)
// ────────────────────────────────────────────────────────────────────────

const SEOUL: TyphoonCase = {
  destination: 'seoul',
  cityName: '서울',
  cityX: 42,
  cityY: 22,
  typhoonName: '하늬 (예시)',
  year: 2021,
  analysisTime: '9월 14일 09시 (분석 시점)',
  note: '한반도 동쪽 해상으로 북상하며 재곡선 진로를 보인 사례. 서울은 진행 방향 왼쪽(가항반원)에 위치.',
  weatherMap: [
    '태풍 중심이 남해 동쪽 해상에 위치',
    '북태평양 고기압이 동쪽으로 물러나는 중',
    '한반도 부근 등압선 간격이 동해안에서 더 조밀',
    '서울 부근은 등압선 간격이 비교적 넓음 → 바람이 매우 강하진 않을 가능성',
  ],
  satellite: [
    '태풍의 눈이 다소 흐릿하게 보임 (세력 약화 단계)',
    '중심 부근 구름은 동쪽으로 치우쳐 발달',
    '나선형 비구름대 일부가 중부지방으로 뻗침',
    '서울 방향으로는 구름대 끝자락이 걸치는 정도',
  ],
  radar: [
    '강한 강수대는 영남·동해안에 집중',
    '중부지방에는 약~보통 강수대가 산발적으로 분포',
    '강수대가 북동진하며 서울을 스쳐 지나갈 것으로 보임',
    '서울 방향으로 강한 강수대의 직접 접근은 뚜렷하지 않음',
  ],
  track: [
    { label: '현재', time: '14일 09시', x: 55, y: 88, pressure: 970, maxWind: 35 },
    { label: '+12h', time: '14일 21시', x: 60, y: 66, pressure: 975, maxWind: 32 },
    {
      label: '+24h',
      time: '15일 09시',
      x: 60,
      y: 40,
      pressure: 982,
      maxWind: 27,
      probRadius: 12,
      strongWindRadius: 16,
      stormRadius: 7,
    },
    { label: '+36h', time: '15일 21시', x: 74, y: 26, pressure: 990, maxWind: 22 },
  ],
  trackSummary: { direction: '북북동', speed: '30 km/h', pressure: 970, maxWind: 35 },
  actual: {
    trackPoints: [
      { x: 55, y: 88 },
      { x: 61, y: 64 },
      { x: 63, y: 40 },
      { x: 78, y: 24 },
    ],
    closestTime: '15일 08시경',
    semicircle: '가항반원',
    temp: 20,
    rainfall: 28,
    wind: 9,
    maxGust: 19,
    advisory: '강풍주의보',
    correct: {
      temp: '18to22',
      rain: 'continuous',
      wind: 'somewhat',
      schedule: 'shiftTime',
      impact: 'partial',
      position: 'navigable',
    },
  },
  evidenceCards: [
    { id: 's1', text: '서울은 태풍 예상경로의 왼쪽(가항반원)에 위치함', good: true },
    { id: 's2', text: '서울은 강풍반경에 들지 않거나 가장자리에 걸침', good: true },
    { id: 's3', text: '레이더에서 강한 강수대는 동해안에 집중, 서울은 약한 비', good: true },
    { id: 's4', text: '위성에서 구름대 끝자락만 중부에 걸침', good: true },
    { id: 's5', text: '서울이 태풍 눈벽을 직접 통과할 것이다', good: false },
    { id: 's6', text: '서울이 폭풍반경 한가운데에 들어간다', good: false },
  ],
  ending: { bgClass: 'sky-cloudy', headline: '서울 수학여행 도착!' },
};

const BUSAN: TyphoonCase = {
  destination: 'busan',
  cityName: '부산',
  cityX: 62,
  cityY: 60,
  typhoonName: '미르 (예시)',
  year: 2020,
  analysisTime: '9월 3일 09시 (분석 시점)',
  note: '남해안을 지나 북상하며 부산 서쪽을 통과. 부산은 진행 방향 오른쪽(위험반원)에 위치.',
  weatherMap: [
    '태풍 중심이 남해상으로 빠르게 북상 중',
    '중심기압이 낮고 등압선 간격이 매우 조밀',
    '남부지방, 특히 영남 해안의 기압경도가 큼 → 강풍 가능성 높음',
    '부산 부근은 등압선이 빽빽하게 밀집',
  ],
  satellite: [
    '태풍의 눈과 눈벽이 비교적 뚜렷',
    '중심 부근에 두꺼운 적란운 발달',
    '나선형 비구름대가 남해안 전체로 확장',
    '구름대가 부산 방향으로 강하게 뻗어 있음',
  ],
  radar: [
    '매우 강한 강수대가 남해안에 폭넓게 분포',
    '강수대가 부산 방향으로 빠르게 북상 중',
    '시간당 강수 강도가 매우 강함 (붉은색 에코)',
    '부산 방향으로 강한 강수대가 직접 접근',
  ],
  track: [
    { label: '현재', time: '3일 09시', x: 50, y: 88, pressure: 950, maxWind: 43 },
    { label: '+12h', time: '3일 21시', x: 50, y: 70, pressure: 955, maxWind: 40 },
    {
      label: '+24h',
      time: '4일 09시',
      x: 52,
      y: 52,
      pressure: 960,
      maxWind: 38,
      probRadius: 13,
      strongWindRadius: 15,
      stormRadius: 8,
    },
    { label: '+36h', time: '4일 21시', x: 56, y: 34, pressure: 972, maxWind: 30 },
  ],
  trackSummary: { direction: '북', speed: '34 km/h', pressure: 950, maxWind: 43 },
  actual: {
    trackPoints: [
      { x: 50, y: 88 },
      { x: 51, y: 68 },
      { x: 53, y: 50 },
      { x: 58, y: 33 },
    ],
    closestTime: '4일 10시경',
    semicircle: '위험반원',
    temp: 24,
    rainfall: 180,
    wind: 18,
    maxGust: 37,
    advisory: '태풍경보',
    correct: {
      temp: '22to26',
      rain: 'heavy',
      wind: 'outdoor',
      schedule: 'excludeArea',
      impact: 'direct',
      position: 'dangerous',
    },
  },
  evidenceCards: [
    { id: 'b1', text: '부산은 태풍 예상경로의 오른쪽(위험반원)에 위치함', good: true },
    { id: 'b2', text: '부산이 강풍반경에 포함될 가능성이 높음', good: true },
    { id: 'b3', text: '레이더에서 강한 강수대가 부산 방향으로 이동 중', good: true },
    { id: 'b4', text: '위성에서 넓은 비구름대가 부산 방향으로 확장', good: true },
    { id: 'b5', text: '일기도에서 부산 부근 등압선 간격이 매우 조밀', good: true },
    { id: 'b6', text: '부산은 태풍 영향권 밖이라 영향이 거의 없다', good: false },
  ],
  ending: { bgClass: 'sky-storm', headline: '부산 수학여행 도착!' },
};

const JEJU: TyphoonCase = {
  destination: 'jeju',
  cityName: '제주',
  cityX: 38,
  cityY: 82,
  typhoonName: '해담 (예시)',
  year: 2019,
  analysisTime: '9월 22일 09시 (분석 시점)',
  note: '제주 부근을 거의 직접 통과. 제주는 중심·눈벽 부근을 지나며 위험반원의 영향을 받음.',
  weatherMap: [
    '태풍 중심이 제주 남쪽 해상에서 북상 중',
    '중심기압이 매우 낮음',
    '제주 부근 등압선이 극도로 조밀',
    '제주를 향해 강한 기압경도가 형성됨',
  ],
  satellite: [
    '태풍의 눈이 매우 뚜렷하고 둥글게 보임',
    '두꺼운 눈벽 구름이 제주를 향함',
    '나선형 비구름대가 제주를 완전히 덮고 있음',
    '제주가 중심부 구름 구조 안에 들어와 있음',
  ],
  radar: [
    '제주 전역에 매우 강한 강수대가 위치',
    '눈벽에 해당하는 강한 에코가 제주를 직접 통과',
    '강수대가 제주를 중심으로 회전하며 이동',
    '단시간에 많은 비가 집중될 것으로 보임',
  ],
  track: [
    { label: '현재', time: '22일 09시', x: 36, y: 95, pressure: 945, maxWind: 45 },
    { label: '+12h', time: '22일 21시', x: 37, y: 86, pressure: 950, maxWind: 43 },
    {
      label: '+24h',
      time: '23일 09시',
      x: 38,
      y: 78,
      pressure: 955,
      maxWind: 40,
      probRadius: 11,
      strongWindRadius: 16,
      stormRadius: 9,
    },
    { label: '+36h', time: '23일 21시', x: 42, y: 60, pressure: 965, maxWind: 33 },
  ],
  trackSummary: { direction: '북북동', speed: '28 km/h', pressure: 945, maxWind: 45 },
  actual: {
    trackPoints: [
      { x: 36, y: 95 },
      { x: 37, y: 85 },
      { x: 39, y: 77 },
      { x: 43, y: 59 },
    ],
    closestTime: '23일 07시경',
    semicircle: '위험반원',
    temp: 23,
    rainfall: 250,
    wind: 22,
    maxGust: 42,
    advisory: '태풍경보',
    correct: {
      temp: '22to26',
      rain: 'heavy',
      wind: 'outdoor',
      schedule: 'moveIndoor',
      impact: 'direct',
      position: 'eyewall',
    },
  },
  evidenceCards: [
    { id: 'j1', text: '제주가 태풍 중심·눈벽 부근을 통과할 가능성이 높음', good: true },
    { id: 'j2', text: '제주가 강풍반경은 물론 폭풍반경에도 포함될 수 있음', good: true },
    { id: 'j3', text: '위성에서 뚜렷한 눈벽 구름이 제주를 향함', good: true },
    { id: 'j4', text: '레이더에서 매우 강한 에코가 제주를 직접 통과', good: true },
    { id: 'j5', text: '제주는 가항반원이라 바람이 약해 안전하다', good: false },
    { id: 'j6', text: '제주는 태풍 중심에서 멀어 영향이 적다', good: false },
  ],
  ending: { bgClass: 'sky-storm', headline: '제주 수학여행 도착!' },
};

export const CASES: Record<DestinationId, TyphoonCase> = {
  seoul: SEOUL,
  busan: BUSAN,
  jeju: JEJU,
};

export const DESTINATIONS: DestinationId[] = ['seoul', 'busan', 'jeju'];
