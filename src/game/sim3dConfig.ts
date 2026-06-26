// ────────────────────────────────────────────────────────────────────────
// 3D 태풍 시뮬레이터 설정 + 위치 판정 + 날씨 계산 (규칙 기반·교육용)
// 모든 반경/속도/날씨 범위를 이 파일에서 관리해 나중에 쉽게 수정한다.
//
// 좌표: 지표면 평면 (x, z). 태풍 중심은 원점. y는 높이(구름).
// 태풍 진행 방향(heading) = -Z (화면 위/북). 진행 방향 오른쪽(+X, 동) = 위험반원.
// 북반구 → 반시계 방향 회전.
// ────────────────────────────────────────────────────────────────────────

export const SIM = {
  // 반경(월드 단위)
  EYE_R: 1.3, // 태풍의 눈
  EYEWALL_R: 2.8, // 눈벽 바깥 경계
  OUTER_R: 9.0, // 강풍반경
  // 나선 비구름대
  BAND_ARMS: 2, // 나선 팔 개수
  BAND_WINDING: 0.55, // 감김 정도(클수록 촘촘)
  BAND_WIDTH: 0.34, // 띠 두께(0~1, 클수록 넓음)
  // 동역학
  ROTATION_SPEED: 0.16, // rad/s (반시계)
  MOVE_EFFECT: 0.22, // 위험/가항 비대칭 강도(이동속도 효과)
  // 변환
  KM_PER_UNIT: 30, // 거리 표시용
  // 날씨 범위
  PRESSURE_CENTER: 950, // hPa (눈 중심 최저)
  PRESSURE_OUTER: 1008,
  MAX_WIND: 48, // m/s (눈벽 부근 최대)
} as const;

export type Region3D = 'eye' | 'eyewall' | 'band' | 'strongwind' | 'outside';

export interface Weather3D {
  distanceKm: number;
  region: Region3D;
  regionName: string;
  semicircle: '위험반원' | '가항반원' | '중심';
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirDeg: number; // 바람이 불어오는 방향(0=북에서, 시계방향 deg) — 화살표 회전용
  precip: number; // 0~3 상대 강수
  precipLabel: string;
  outdoorRisk: string;
  desc: string;
}

const NAME: Record<Region3D, string> = {
  eye: '태풍의 눈',
  eyewall: '눈벽',
  band: '나선형 비구름대',
  strongwind: '강풍반경(비구름대 사이)',
  outside: '태풍 영향권 밖',
};

// 부드러운 보간
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// 나선 띠 위에 있는지 (각도+거리). 0~1, 1=띠 한가운데
export function bandIntensity(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r < 1e-4) return 0;
  const theta = Math.atan2(z, x);
  // 로그 나선: 위상 = 팔수*각도 - 감김*거리
  const phase = SIM.BAND_ARMS * theta - SIM.BAND_WINDING * r;
  const m = (Math.cos(phase) + 1) / 2; // 0~1
  // 띠 폭 안쪽만 살림
  return clamp01((m - (1 - SIM.BAND_WIDTH)) / SIM.BAND_WIDTH);
}

// 구름 높이(입체감): 눈벽이 가장 높고 바깥으로 갈수록 낮아짐
export function cloudHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r <= SIM.EYE_R) return 0.1; // 눈: 매우 낮음(지표 보임)
  if (r <= SIM.EYEWALL_R) return 1.0; // 눈벽: 최고
  const band = bandIntensity(x, z);
  const falloff = clamp01((SIM.OUTER_R - r) / (SIM.OUTER_R - SIM.EYEWALL_R));
  return 0.18 + band * 0.55 * falloff;
}

// ── 구름 퍼프 빌더 (모식도 구름 덩어리) ───────────────────────────────────
// 눈벽: 눈을 둘러싼 가장 높고 두꺼운 구름 벽 / 비구름대: 낮은 나선 띠
export interface Puff {
  x: number;
  y: number;
  z: number;
  s: number;
}

// 결정적 의사난수(0~1) — 빌드마다 동일한 구름 모양 보장
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// 눈벽: 원형으로 구름 덩어리를 여러 층 쌓아 '벽'을 만든다(가장 높음).
export function buildEyewallPuffs(lowPerf: boolean): Puff[] {
  const puffs: Puff[] = [];
  const ring = lowPerf ? 30 : 46;
  const layers = lowPerf ? 3 : 4;
  const rMid = (SIM.EYE_R + SIM.EYEWALL_R) / 2;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2;
    const baseR = rMid + (hash(i) - 0.5) * 0.5;
    for (let k = 0; k < layers; k++) {
      const t = k / (layers - 1);
      const rr = baseR + t * 0.32; // 위로 갈수록 바깥쪽 → 안쪽 경사 급
      const y = 0.25 + t * 1.55; // 전체 구조 중 가장 높음
      const s = 0.62 - t * 0.16 + (hash(i * 7 + k) - 0.5) * 0.12;
      puffs.push({ x: Math.cos(a) * rr, y, z: Math.sin(a) * rr, s });
    }
  }
  return puffs;
}

// 나선형 비구름대: 띠 위에만 낮은 구름, 바깥으로 갈수록 옅고 낮아진다(띠 사이 빈 공간).
export function buildBandPuffs(lowPerf: boolean): Puff[] {
  const puffs: Puff[] = [];
  const radial = lowPerf ? 22 : 40;
  const ang = lowPerf ? 70 : 130;
  for (let i = 0; i < radial; i++) {
    const r = SIM.EYEWALL_R + 0.5 + (SIM.OUTER_R - SIM.EYEWALL_R) * (i / radial);
    for (let j = 0; j < ang; j++) {
      const a = (j / ang) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const b = bandIntensity(x, z);
      if (b > 0.6) {
        const falloff = clamp01((SIM.OUTER_R - r) / (SIM.OUTER_R - SIM.EYEWALL_R));
        const y = 0.18 + b * 0.45 * falloff; // 눈벽보다 훨씬 낮음
        const s = (0.32 + b * 0.4) * (0.7 + falloff * 0.5);
        puffs.push({ x, y, z, s });
      }
    }
  }
  return puffs;
}

// 위치 판정
export function regionOf(x: number, z: number): Region3D {
  const r = Math.hypot(x, z);
  if (r <= SIM.EYE_R) return 'eye';
  if (r <= SIM.EYEWALL_R) return 'eyewall';
  if (r > SIM.OUTER_R) return 'outside';
  return bandIntensity(x, z) > 0.45 ? 'band' : 'strongwind';
}

// 핵심: 위치별 날씨 계산
// moveEffect: 태풍 이동속도에 의한 위험/가항 비대칭 강도(기본 = SIM.MOVE_EFFECT).
// 교육용 슬라이더에서 비교값을 조절할 수 있도록 선택 인자로 노출(기존 호출부 영향 없음).
export function weather3D(x: number, z: number, moveEffect: number = SIM.MOVE_EFFECT): Weather3D {
  const r = Math.hypot(x, z);
  const region = regionOf(x, z);
  const isRight = x > 0; // 진행 방향 오른쪽 = 위험반원
  const semicircle: Weather3D['semicircle'] =
    region === 'eye' ? '중심' : isRight ? '위험반원' : '가항반원';

  // 기압: 중심에서 최저, 바깥으로 부드럽게 상승 (지수 감쇠)
  const pressure = Math.round(
    SIM.PRESSURE_OUTER -
      (SIM.PRESSURE_OUTER - SIM.PRESSURE_CENTER) * Math.exp(-r / (SIM.EYEWALL_R * 1.6)),
  );

  // 풍속 기본 프로파일
  let wind: number;
  if (r <= SIM.EYE_R) {
    // 눈: 중심으로 갈수록 급감
    const t = smooth(r / SIM.EYE_R);
    wind = 4 + t * (SIM.MAX_WIND * 0.45);
  } else if (r <= SIM.EYEWALL_R) {
    // 눈벽: 최대
    wind = SIM.MAX_WIND;
  } else {
    // 바깥: 거리에 따라 감쇠
    wind = SIM.MAX_WIND * Math.pow(SIM.EYEWALL_R / r, 0.55);
  }
  // 위험/가항 비대칭 (이동속도 효과) — 눈 제외
  if (region !== 'eye') wind *= 1 + (isRight ? moveEffect : -moveEffect);
  const windSpeed = Math.round(wind);

  // 강수
  let precip: number;
  if (r <= SIM.EYE_R) precip = 0.1;
  else if (r <= SIM.EYEWALL_R) precip = 3;
  else if (r > SIM.OUTER_R) precip = 0;
  else precip = 0.3 + bandIntensity(x, z) * 2.5; // 띠 위치에 따라 반복
  const precipLabel =
    precip >= 2.5 ? '매우 강함' : precip >= 1.4 ? '강함' : precip >= 0.6 ? '약함~보통' : '거의 없음';

  // 바람 방향: 북반구 반시계 회전 + 약한 안쪽 유입
  // 접선(반시계) 방향 = (-z, x). 화살표가 "불어오는 쪽"을 가리키도록 +180.
  const theta = Math.atan2(-z, x); // 수학각
  const flowAng = theta + Math.PI / 2 - 0.35; // 반시계 접선 + 유입 기울임
  // 0=북, 시계방향 deg로 변환 (화면 좌표)
  let deg = (90 - (flowAng * 180) / Math.PI) % 360;
  if (deg < 0) deg += 360;

  const outdoorRisk =
    windSpeed >= 40 ? '매우 위험' : windSpeed >= 25 ? '위험' : windSpeed >= 14 ? '주의' : '비교적 양호';

  const desc = describe(region);

  return {
    distanceKm: Math.round(r * SIM.KM_PER_UNIT),
    region,
    regionName: NAME[region],
    semicircle,
    pressure,
    windSpeed,
    windDirDeg: Math.round(deg),
    precip,
    precipLabel,
    outdoorRisk,
    desc,
  };
}

function describe(region: Region3D): string {
  switch (region) {
    case 'eye':
      return '중심에서 공기가 하강해 구름이 걷히고 비·바람이 일시적으로 약합니다. 기압은 가장 낮습니다. 곧 반대편 눈벽이 닥칩니다.';
    case 'eyewall':
      return '강한 상승기류로 두꺼운 구름과 폭우가 발생하고, 기압경도력이 가장 커 바람이 가장 강합니다.';
    case 'band':
      return '나선형 구름 띠 위로 강한 비와 돌풍이 나타납니다. 띠 사이로 가면 잠시 약해집니다.';
    case 'strongwind':
      return '강풍반경 안이지만 구름 띠 사이라 비는 약합니다. 위치를 옮기면 다시 강해질 수 있습니다.';
    default:
      return '태풍의 직접 영향이 약한 영역입니다. 중심이 다가올수록 점점 강해집니다.';
  }
}

// 같은 거리에서 위험/가항 풍속 비교 (moveEffect로 비대칭 강도 조절 가능)
export function compareSemicircle3D(
  distUnits: number,
  moveEffect: number = SIM.MOVE_EFFECT,
): { right: number; left: number } {
  return {
    right: weather3D(distUnits, 0, moveEffect).windSpeed,
    left: weather3D(-distUnits, 0, moveEffect).windSpeed,
  };
}

// 풍속 4단계 레벨(0~3) — 정보 패널 막대/라벨용
export function windLevel(windSpeed: number): number {
  if (windSpeed >= 40) return 3;
  if (windSpeed >= 25) return 2;
  if (windSpeed >= 14) return 1;
  return 0;
}
export const WIND_LABELS = ['약함', '다소 강함', '강함', '매우 강함'];
export const OUTDOOR_LABELS = ['가능', '주의', '어려움', '매우 위험'];

// 강수 4단계 레벨(0~3)
export function precipLevel(precip: number): number {
  if (precip >= 2.5) return 3;
  if (precip >= 1.4) return 2;
  if (precip >= 0.6) return 1;
  return 0;
}
export const PRECIP_LABELS = ['거의 없음', '약함', '강함', '매우 강함'];
