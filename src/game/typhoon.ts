// ────────────────────────────────────────────────────────────────────────
// STEP 2 시뮬레이터 물리 모델 (단순화)
// 위에서 내려다본 태풍. 중심(0,0), 진행 방향은 화면 위(북)쪽.
// 진행 방향 오른쪽(동, x>0) = 위험반원, 왼쪽(서, x<0) = 가항반원
// ────────────────────────────────────────────────────────────────────────

// 반경 정의 (SVG px 기준, 중심으로부터)
export const R_EYE = 26;
export const R_EYEWALL = 54;
export const R_STRONGWIND = 165; // 강풍반경
const PX_TO_KM = 1.5;

export type Region = 'eye' | 'eyewall' | 'spiral' | 'outer';

export interface PointWeather {
  distanceKm: number;
  region: Region;
  regionName: string;
  semicircle: '위험반원' | '가항반원' | '중심';
  rain: string;
  wind: string;
  windSpeed: number; // m/s
  pressure: string;
  outdoor: string;
  desc: string;
}

export function regionOf(dist: number): Region {
  if (dist <= R_EYE) return 'eye';
  if (dist <= R_EYEWALL) return 'eyewall';
  if (dist <= R_STRONGWIND) return 'spiral';
  return 'outer';
}

const REGION_NAME: Record<Region, string> = {
  eye: '태풍의 눈',
  eyewall: '눈벽',
  spiral: '나선형 비구름대',
  outer: '태풍 바깥',
};

// dx,dy 는 중심 기준 (px). dy<0 이 북(진행 방향).
export function weatherAt(dx: number, dy: number): PointWeather {
  const dist = Math.hypot(dx, dy);
  const region = regionOf(dist);
  const isRight = dx > 0; // 진행 방향 오른쪽 = 위험반원
  const semicircle: PointWeather['semicircle'] =
    dist <= R_EYE ? '중심' : isRight ? '위험반원' : '가항반원';

  // 기본 풍속 (m/s) — 영역별
  let baseWind: number;
  let rain: string;
  let pressure: string;
  let outdoor: string;
  let desc: string;

  switch (region) {
    case 'eye':
      baseWind = 6;
      rain = '약함 (일시적으로 그침)';
      pressure = '매우 낮음 (가장 낮음)';
      outdoor = '주의 (곧 다시 강해짐)';
      desc = '비와 바람이 일시적으로 약해질 수 있지만 태풍이 지나간 것은 아닙니다. 이후 반대편 눈벽이 접근하면 다시 강한 비바람이 나타납니다.';
      break;
    case 'eyewall':
      baseWind = 45;
      rain = '매우 강함';
      pressure = '매우 낮음';
      outdoor = '매우 위험';
      desc = '태풍에서 비와 바람이 가장 강한 영역입니다. 매우 위험한 날씨가 나타납니다.';
      break;
    case 'spiral':
      baseWind = 22;
      rain = '강했다 약했다 반복 (구간에 따라 강함)';
      pressure = '낮음 (중심에 가까울수록 더 낮음)';
      outdoor = '위험';
      desc = '비가 내렸다 그치기를 반복할 수 있고, 일부 구간에서는 강한 비와 돌풍이 나타납니다.';
      break;
    default:
      baseWind = 9;
      rain = '약함';
      pressure = '보통 (중심에 가까워질수록 낮아짐)';
      outdoor = '비교적 양호';
      desc = '태풍의 직접적인 영향이 비교적 약한 영역입니다. 중심에 가까워질수록 기압이 낮아집니다.';
  }

  // 같은 영역·같은 거리라도 위험반원이 더 강하게 (중심/눈 제외)
  let windSpeed = baseWind;
  if (region !== 'eye') {
    windSpeed = baseWind * (isRight ? 1.18 : 0.82);
    // 거리에 따른 미세 조정 (나선대/바깥에서 중심에 가까울수록 약간 강하게)
    if (region === 'spiral' || region === 'outer') {
      const t = Math.max(0, (R_STRONGWIND - dist) / R_STRONGWIND);
      windSpeed += t * 6 * (isRight ? 1.1 : 0.9);
    }
  }
  windSpeed = Math.round(windSpeed);

  return {
    distanceKm: Math.round(dist * PX_TO_KM),
    region,
    regionName: REGION_NAME[region],
    semicircle,
    rain,
    wind: windLabel(windSpeed),
    windSpeed,
    pressure,
    outdoor,
    desc,
  };
}

function windLabel(ws: number): string {
  if (ws >= 40) return '매우 강함';
  if (ws >= 25) return '강함';
  if (ws >= 14) return '다소 강함';
  return '약함';
}

// 위험반원 vs 가항반원 비교용: 같은 거리에서 좌/우 풍속
export function compareSemicircles(dist: number): { right: number; left: number } {
  // y 위쪽으로 dist 만큼 떨어진 위치를 좌/우로 본다 (대표값)
  const right = weatherAt(dist, 0).windSpeed;
  const left = weatherAt(-dist, 0).windSpeed;
  return { right, left };
}
